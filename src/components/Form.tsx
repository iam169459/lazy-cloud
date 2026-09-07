import { useTheme } from '@/lib/theme';

/* ── FormSection: glass card with header ── */
export function FormSection({ title, icon, description, children }: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <fieldset className="glass-card p-5 sm:p-6" style={{ border: 'none' }}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-4">
          {icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              {icon}
            </div>
          )}
          <div>
            <legend className="text-sm font-semibold" style={{ fontFamily: "'Fira Code', monospace" }}>{title}</legend>
            {description && <p className="text-[11px] font-mono mt-0.5" style={{ color: colors.textDim }}>{description}</p>}
          </div>
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

/* ── FormField: label + input + help/error ── */
let fieldCounter = 0;

export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}-${++fieldCounter}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-mono uppercase tracking-wider mb-1.5"
        style={{ color: colors.textDim }}
      >
        {label} {required && <span style={{ color: '#22c55e' }} aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {children && (
          <div id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined}>
            {children}
          </div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-[11px] font-mono mt-1.5" style={{ color: colors.textDim }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-mono mt-1.5 flex items-center gap-1" style={{ color: '#ef4444' }} role="alert">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── FormRow: horizontal label + control ── */
export function FormRow({ label, desc, children }: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-[11px] font-mono" style={{ color: colors.textDim }}>{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ── Toggle: accessible switch ── */
export function Toggle({ checked, onChange, label }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 cursor-pointer"
      style={{ background: checked ? 'linear-gradient(135deg, #22c55e, #3b82f6)' : 'rgba(255,255,255,0.1)' }}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200"
        style={{ background: '#0f172a', transform: checked ? 'translateX(24px)' : 'translateX(0)' }}
      />
    </button>
  );
}

/* ── FormActions: distinct save/cancel CTAs ── */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {children}
    </div>
  );
}

export function SaveButton({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} className="btn btn-primary text-xs">
      {loading && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
      {children}
    </button>
  );
}

export function CancelButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-secondary text-xs">
      {children}
    </button>
  );
}

export function DangerButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn btn-secondary text-xs" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
      {children}
    </button>
  );
}
