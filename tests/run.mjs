/**
 * Targeted tests for the bug-fix pass on the dev branch.
 *
 * The repo has no test runner, so this harness uses the already-installed
 * `esbuild` to bundle `server/api.ts` with `server/db.ts` and `server/s3.ts`
 * replaced by generated stubs (every export of those modules, driven by a
 * `state.handlers` table). That lets us drive the real request handler with
 * fake req/res objects and assert the behaviour that was fixed:
 *
 *   1. encrypted files download through the decrypting stream endpoint
 *      (never a presigned ciphertext URL / server-side blob: URL)
 *   2. the download counter is incremented exactly once per download
 *   3. the stream endpoint really decrypts the payload
 *   4. backgrounds are written where `/bg/*` is actually served and are
 *      removed again on DELETE
 *   5. uploads route to the active bucket with the most free space
 *   6. ENCRYPTION_KEY derives a usable 32-byte key (round-trip in a child
 *      process, because the key is read at module load)
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(here, '.build');
process.chdir(root);

// server/api.ts reads these while the module loads / on each auth check.
process.env.ADMIN_PASSWORD = 'test-admin-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.WEBAUTHN_RP_ID = 'localhost';
process.env.WEBAUTHN_ORIGIN = 'http://localhost:5173';
delete process.env.ENCRYPTION_KEY; // exercise the default-key path

/* ── 1. Generate stub modules for server/db.ts and server/s3.ts ─────────── */

const apiSrc = readFileSync(resolve(root, 'server/api.ts'), 'utf8');
const dbSrc = readFileSync(resolve(root, 'server/db.ts'), 'utf8');

function importedNames(spec) {
  const m = apiSrc.match(new RegExp(`import \\{([^}]+)\\} from '${spec}';`, 's'));
  if (!m) throw new Error(`server/api.ts no longer imports ${spec}`);
  return [...new Set(m[1].split(',').map((s) => s.trim()).filter(Boolean))];
}
const dbNames = importedNames('./db');
const s3Names = importedNames('./s3');

// Numeric constants (coin amounts, default quota) stay real values.
const dbConstants = new Map();
for (const m of dbSrc.matchAll(/export const (\w+) = (\d+);/g)) dbConstants.set(m[1], m[2]);

rmSync(outDir, { force: true, recursive: true });
mkdirSync(outDir, { recursive: true });

writeFileSync(
  resolve(outDir, 'state.mjs'),
  `import { randomUUID } from 'node:crypto';
export const state = {
  handlers: {},
  // Survive reset() — every request boots the schema first, and id generation
  // is a pure helper the upload path needs before it touches storage.
  defaults: {
    'db.initDatabase': () => {},
    'db.generateId': () => randomUUID(),
  },
  calls: [],
  reset() {
    this.handlers = {};
    this.calls = [];
  },
  call(mod, name, args) {
    this.calls.push(mod + '.' + name);
    const fn = this.handlers[name] || this.defaults[mod + '.' + name];
    if (!fn) throw new Error('stub ' + mod + '.' + name + ' has no handler — add one to the test');
    return fn(...args);
  },
};
`
);

writeFileSync(
  resolve(outDir, 'db-stub.mjs'),
  [
    `import { state } from './state.mjs';`,
    ...dbNames.map((n) =>
      dbConstants.has(n)
        ? `export const ${n} = ${dbConstants.get(n)};`
        : `export const ${n} = (...a) => state.call('db', '${n}', a);`
    ),
  ].join('\n')
);

writeFileSync(
  resolve(outDir, 's3-stub.mjs'),
  [
    `import { state } from './state.mjs';`,
    ...s3Names.map((n) => `export const ${n} = (...a) => state.call('s3', '${n}', a);`),
  ].join('\n')
);

const stubPlugin = {
  name: 'test-stubs',
  setup(b) {
    b.onResolve({ filter: /^\.\/(db|s3)(\.js)?$/ }, (args) => ({
      path: resolve(outDir, args.path.startsWith('./db') ? 'db-stub.mjs' : 's3-stub.mjs'),
    }));
    // Keep the state module *outside* the bundle (the bundle lives next to it,
    // so the relative specifier still resolves) — otherwise the test and the
    // bundled stubs would each get their own copy of `state`.
    b.onResolve({ filter: /^\.\/state\.mjs$/ }, () => ({ path: './state.mjs', external: true }));
  },
};

async function bundle(entry, outfile, withStubs) {
  await build({
    entryPoints: [resolve(root, entry)],
    outfile: resolve(outDir, outfile),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    // Dynamic imports only reached by the 2FA/passkey routes under test here;
    // busboy stays external so Node loads the CJS build with its own loader.
    external: ['otplib', 'qrcode', 'busboy'],
    // Lets any bundled CJS dependency call `require()` from the ESM bundle.
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
    plugins: withStubs ? [stubPlugin] : [],
    logLevel: 'warning',
  });
}

await bundle('server/api.ts', 'api.bundle.mjs', true);
await bundle('server/encryption.ts', 'encryption.bundle.mjs', false);

const { state } = await import(pathToFileURL(resolve(outDir, 'state.mjs')).href);
const { handleApiRequest } = await import(pathToFileURL(resolve(outDir, 'api.bundle.mjs')).href);
const { encryptFile, getEncryptionStatus } = await import(
  pathToFileURL(resolve(outDir, 'encryption.bundle.mjs')).href
);

/* ── 2. Fake req/res so the real handler can be driven in-process ───────── */

function makeReq({ url, method = 'GET', headers = {}, body = null }) {
  const chunks = body ? [Buffer.isBuffer(body) ? body : Buffer.from(body)] : [];
  const req = Readable.from(chunks, { objectMode: false });
  req.url = url;
  req.method = method;
  req.headers = { ...headers };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

function makeRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    headersSent: false,
    ended: false,
    setHeader(k, v) {
      this.headers[String(k).toLowerCase()] = v;
    },
    getHeader(k) {
      return this.headers[String(k).toLowerCase()];
    },
    writeHead(code, hdrs) {
      this.statusCode = code;
      for (const [k, v] of Object.entries(hdrs || {})) this.headers[k.toLowerCase()] = v;
      this.headersSent = true;
      return this;
    },
    write(chunk) {
      this.body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    },
    end(chunk) {
      if (chunk) this.body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      // Node defaults to 200 when a response ends without writeHead().
      if (!this.headersSent) {
        this.statusCode = 200;
        this.headersSent = true;
      }
      this.ended = true;
    },
  };
}

async function waitFor(cond, ms = 3000) {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > ms) throw new Error('timed out waiting for response');
    await new Promise((r) => setTimeout(r, 10));
  }
}

async function call(path, { method = 'GET', headers = {}, body = null } = {}) {
  const req = makeReq({ url: path, method, headers, body });
  const res = makeRes();
  let failure = null;
  const pending = handleApiRequest(req, res, path.split('?')[0]).catch((e) => {
    failure = e;
  });
  // Resolve as soon as the response is on the wire — a handler that keeps a
  // promise open afterwards must not wedge the whole suite.
  await waitFor(() => res.ended || failure !== null);
  if (failure) throw failure;
  // Give a well-behaved handler a moment to settle; don't wedge on a promise
  // that outlives its response.
  await Promise.race([pending, new Promise((r) => setTimeout(r, 1000))]);
  return { res, json: () => JSON.parse(res.body) };
}

function multipart(filename, contentType, content) {
  const boundary = '----lazydroptest' + Math.random().toString(16).slice(2);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
    Buffer.from(`Content-Type: ${contentType}\r\n\r\n`),
    Buffer.isBuffer(content) ? content : Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return {
    body,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(body.length),
      authorization: 'Bearer test-admin-secret',
    },
  };
}

const FILE_ID = '11111111-1111-4111-8111-111111111111';
const SHARE_ID = '22222222-2222-4222-8222-222222222222';
const PROVIDER = {
  id: 'provider-1',
  provider_type: 's3',
  provider_name: 'Primary',
  endpoint_url: 'https://s3.example.com',
  bucket_name: 'bucket',
  access_key_id: 'key',
  secret_access_key: 'secret',
  region: 'auto',
  max_bytes: 10_000_000_000,
  current_bytes: 0,
  is_active: true,
  created_at: new Date().toISOString(),
};

function fileRecord(patch = {}) {
  return {
    id: FILE_ID,
    original_name: 'report.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    r2_key: `${FILE_ID}/report.pdf`,
    provider_id: PROVIDER.id,
    user_id: null,
    download_count: 0,
    created_at: new Date().toISOString(),
    encrypted: false,
    enc_iv: null,
    enc_auth_tag: null,
    price_coins: 0,
    ...patch,
  };
}

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok   ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  FAIL ${name}\n       ${err && err.message}`);
  }
}

/* ── 3. The tests ───────────────────────────────────────────────────────── */

console.log('\nserver/api.ts — downloads');

await test('encrypted file download returns the decrypting stream URL (not presigned ciphertext)', async () => {
  state.reset();
  const increments = [];
  state.handlers.getFileRecord = async () => fileRecord({ encrypted: true, enc_iv: 'aa', enc_auth_tag: 'bb' });
  state.handlers.listProviders = async () => [PROVIDER];
  state.handlers.getAppSettings = async () => ({ enableDownloadCounter: true });
  state.handlers.incrementDownloadCount = async (id) => increments.push(id);
  state.handlers.getPresignedDownloadUrl = async () => 'https://s3.example.com/ciphertext';

  const { res, json } = await call(`/api/download?id=${FILE_ID}`);
  const out = json();
  assert.equal(res.statusCode, 200);
  assert.match(out.url, /^\/api\/download\/encrypted\/stream\?token=/, `unexpected url: ${out.url}`);
  const token = new URL(out.url, 'http://x').searchParams.get('token');
  assert.equal(token.split('.').length, 3, 'token should be a 3-segment JWT');
  assert.equal(increments.length, 1, 'download counted once');
});

await test('plain file download still returns the presigned URL', async () => {
  state.reset();
  const increments = [];
  state.handlers.getFileRecord = async () => fileRecord();
  state.handlers.listProviders = async () => [PROVIDER];
  state.handlers.getAppSettings = async () => ({ enableDownloadCounter: true });
  state.handlers.incrementDownloadCount = async (id) => increments.push(id);
  state.handlers.getPresignedDownloadUrl = async () => 'https://s3.example.com/presigned';

  const { res, json } = await call(`/api/download?id=${FILE_ID}`);
  assert.equal(res.statusCode, 200);
  assert.equal(json().url, 'https://s3.example.com/presigned');
  assert.equal(increments.length, 1);
});

await test('share download of an encrypted file returns a stream URL, never a server-side blob: URL', async () => {
  state.reset();
  const fileIncrements = [];
  const shareIncrements = [];
  state.handlers.validateShare = async () => ({
    id: SHARE_ID,
    file_id: FILE_ID,
    password_hash: null,
    expires_at: null,
    download_limit: null,
    download_count: 0,
    created_at: new Date().toISOString(),
  });
  state.handlers.getFileRecord = async () => fileRecord({ encrypted: true, enc_iv: 'aa', enc_auth_tag: 'bb' });
  state.handlers.listProviders = async () => [PROVIDER];
  state.handlers.incrementDownloadCount = async (id) => fileIncrements.push(id);
  state.handlers.incrementShareDownloadCount = async (id) => shareIncrements.push(id);

  const { res, json } = await call(`/api/share/download?id=${SHARE_ID}`);
  const out = json();
  assert.equal(res.statusCode, 200);
  assert.match(out.url, /^\/api\/download\/encrypted\/stream\?token=/, `unexpected url: ${out.url}`);
  assert.ok(!out.url.startsWith('blob:'), 'blob: URLs minted on the server are unusable by the browser');
  assert.equal(fileIncrements.length, 1, 'file counted once');
  assert.equal(shareIncrements.length, 1, 'share counted once');
});

await test('the stream endpoint decrypts the file and does not double-count the download', async () => {
  state.reset();
  const increments = [];
  const plaintext = 'the cake is a lie — encrypted payload';
  const { encrypted, iv, authTag } = encryptFile(Buffer.from(plaintext));

  state.handlers.getFileRecord = async () => fileRecord({ encrypted: true, enc_iv: iv, enc_auth_tag: authTag });
  state.handlers.listProviders = async () => [PROVIDER];
  state.handlers.getAppSettings = async () => ({ enableDownloadCounter: true });
  state.handlers.incrementDownloadCount = async (id) => increments.push(id);
  state.handlers.downloadFromProvider = async () => encrypted;

  // Mint the short-lived token exactly the way the download endpoints do.
  const minted = await call(`/api/download?id=${FILE_ID}`);
  const token = new URL(minted.json().url, 'http://x').searchParams.get('token');
  assert.ok(token, 'no token in minted URL');
  assert.equal(increments.length, 1);

  const { res } = await call(`/api/download/encrypted/stream?token=${encodeURIComponent(token)}`);
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(res.body, plaintext, 'stream endpoint must return the decrypted payload');
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.equal(increments.length, 1, 'streaming must not increment the counter a second time');
});

console.log('\nserver/api.ts — backgrounds');

const bgDirs = [resolve(root, 'public/bg'), resolve(root, 'dist/bg')];
const bgDirExisted = bgDirs.map((d) => existsSync(d));
const distExisted = existsSync(resolve(root, 'dist'));

await test('background upload is written where /bg/* is served and reports its URL', async () => {
  state.reset();
  const patches = [];
  state.handlers.updateAppSettings = async (patch) => {
    patches.push(patch);
    return patch;
  };

  const png = multipart('avatar.png', 'image/png', '\x89PNG\r\n\x1a\nfakepng');
  const { res, json } = await call('/api/admin/background', { method: 'POST', ...png });
  const out = json();
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(out.url, '/bg/background.png');
  assert.equal(out.type, 'image');
  assert.ok(existsSync(bgDirs[0]) && existsSync(bgDirs[1]), 'missing /bg dirs');
  assert.ok(existsSync(resolve(bgDirs[0], 'background.png')), 'not written to public/bg');
  assert.ok(existsSync(resolve(bgDirs[1], 'background.png')), 'not written to dist/bg');
  assert.equal(patches.at(-1).backgroundUrl, '/bg/background.png');
  assert.equal(patches.at(-1).backgroundType, 'image');
});

await test('re-uploading with a different type replaces the old file and matches the MIME-derived name', async () => {
  state.reset();
  state.handlers.updateAppSettings = async (patch) => patch;

  const jpeg = multipart('holiday photo.JPEG', 'image/jpeg', 'jpeg-bytes');
  const { json } = await call('/api/admin/background', { method: 'POST', ...jpeg });
  const out = json();
  // server writes `background.jpg` for image/jpeg — the client used to guess
  // `background.jpeg` from the local filename and 404'd.
  assert.equal(out.url, '/bg/background.jpg');
  assert.ok(existsSync(resolve(bgDirs[0], 'background.jpg')));
  assert.ok(!existsSync(resolve(bgDirs[0], 'background.png')), 'previous background not removed');
});

await test('background DELETE removes every background file and clears the setting', async () => {
  state.reset();
  const patches = [];
  state.handlers.updateAppSettings = async (patch) => {
    patches.push(patch);
    return patch;
  };

  const { res } = await call('/api/admin/background', {
    method: 'DELETE',
    headers: { authorization: 'Bearer test-admin-secret' },
  });
  assert.equal(res.statusCode, 200, res.body);
  for (const d of bgDirs) {
    if (!existsSync(d)) continue;
    const left = (await import('node:fs')).readdirSync(d).filter((f) => f.startsWith('background.'));
    assert.deepEqual(left, [], `leftover files in ${d}: ${left}`);
  }
  assert.equal(patches.at(-1).backgroundUrl, '');
});

// Restore the directory layout the background test may have created.
for (const [i, d] of bgDirs.entries()) {
  if (!bgDirExisted[i] && existsSync(d)) rmSync(d, { force: true, recursive: true });
}
if (!distExisted && existsSync(resolve(root, 'dist'))) rmSync(resolve(root, 'dist'), { force: true, recursive: true });

console.log('\nserver/api.ts — upload routing');

await test('uploads go to the active bucket with the most free space (never a disabled/full one)', async () => {
  state.reset();
  let uploaded = null;
  // Neon returns BIGINT columns as strings — keep them strings on purpose.
  state.handlers.getAppSettings = async () => ({
    enablePublicUpload: true,
    allowedTypes: '*',
    maxFileSize: '10485760',
  });
  state.handlers.listProviders = async () => [
    { ...PROVIDER, id: 'disabled-huge', provider_name: 'Disabled', is_active: false, max_bytes: '999999999999', current_bytes: '0' },
    { ...PROVIDER, id: 'active-small', provider_name: 'Small', max_bytes: '1000000000', current_bytes: '0' },
    { ...PROVIDER, id: 'active-big', provider_name: 'Big', max_bytes: '10000000000', current_bytes: '1000000000' },
  ];
  state.handlers.uploadToProvider = async (provider, _key, stream) => {
    uploaded = provider;
    // Drain the busboy file stream the way the S3 client would — without this
    // the request never finishes and the handler hangs.
    await new Promise((res, rej) => {
      stream.on('error', rej);
      stream.on('end', res);
      stream.resume();
    });
  };
  state.handlers.createFileRecord = async (f) => f;
  state.handlers.updateProviderBytes = async () => {};

  const mp = multipart('notes.txt', 'text/plain', 'hello storage');
  const { res, json } = await call('/api/upload', { method: 'POST', ...mp });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(uploaded.id, 'active-big', `routed to ${uploaded && uploaded.id}`);
  assert.ok(json().id, 'no file id in response');
});

await test('uploads fail clearly when every bucket is disabled', async () => {
  state.reset();
  state.handlers.getAppSettings = async () => ({
    enablePublicUpload: true,
    allowedTypes: '*',
    maxFileSize: '10485760',
  });
  state.handlers.listProviders = async () => [{ ...PROVIDER, is_active: false }];

  const mp = multipart('notes.txt', 'text/plain', 'hello storage');
  const { res, json } = await call('/api/upload', { method: 'POST', ...mp });
  assert.equal(res.statusCode, 400, res.body);
  assert.match(json().error, /disabled/i, `unexpected message: ${json().error}`);
});

console.log('\nserver/encryption.ts — ENCRYPTION_KEY derivation');

const encRunner = `
import { encryptFile, decryptFile, getEncryptionStatus } from ${JSON.stringify(
  pathToFileURL(resolve(outDir, 'encryption.bundle.mjs')).href
)};
const plaintext = Buffer.from('round-trip payload');
const { encrypted, iv, authTag } = encryptFile(plaintext);
const back = decryptFile(encrypted, iv, authTag);
if (!back.equals(plaintext)) {
  console.error('round-trip mismatch');
  process.exit(1);
}
process.stdout.write(JSON.stringify(getEncryptionStatus()));
`;

for (const [label, patch, expectEnabled, expectDefault] of [
  ['default key (no ENCRYPTION_KEY)', {}, false, true],
  // Before the fix this threw "Invalid key length" from createCipheriv.
  ['ENCRYPTION_KEY set to a short passphrase', { ENCRYPTION_KEY: 'short-passphrase' }, false, false],
  ['ENCRYPTION_KEY set to a long passphrase', { ENCRYPTION_KEY: 'correct-horse-battery-staple-2026' }, true, false],
  ['ENCRYPTION_KEY set to 64 hex chars', { ENCRYPTION_KEY: 'ab'.repeat(32) }, true, false],
]) {
  await test(`encrypt/decrypt round-trip with ${label}`, () => {
    const env = { ...process.env, ...patch };
    if (!patch.ENCRYPTION_KEY) delete env.ENCRYPTION_KEY;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', encRunner], {
      env,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, `child failed: ${r.stderr}`);
    const status = JSON.parse(r.stdout);
    assert.equal(status.enabled, expectEnabled, `unexpected status: ${r.stdout}`);
    assert.equal(status.usingDefault, expectDefault, `unexpected status: ${r.stdout}`);
  });
}

/* ── 4. Report ──────────────────────────────────────────────────────────── */

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
