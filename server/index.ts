import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Serve React app for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

function startServer() {
  // Initialize database (non-fatal if DB is unavailable)
  initDatabase().then(() => {
    console.log('Database initialized successfully');
  }).catch((dbError) => {
    console.warn('Warning: Database initialization failed (server will run without DB):', dbError.message);
  });

  const server = createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
