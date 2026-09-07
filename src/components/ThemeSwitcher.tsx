import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, ThemeId } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

const themeOptions: { id: ThemeId; label: string; colors: string[] }[] = [
  { id: 'black', label: 'Void Black', colors: ['#06060c', '#34d399', '#22d3ee'] },
  { id: 'dark', label: 'Midnight', colors: ['#0f172a', '#818cf8', '#38bdf8'] },
  { id: 'light', label: 'Light', colors: ['#f8fafc', '#10b981', '#06b6d4'] },
  { id: 'bw', label: 'Monochrome', colors: ['#111111', '#ffffff', '#a3a3a3'] },
  { id: 'purple', label: 'Purple Haze', colors: ['#0c0614', '#a855f7', '#e879f9'] },
  { id: 'neon', label: 'Neon Glow', colors: ['#020208', '#00ff88', '#ff00ff'] },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  function handleSelect(id: ThemeId) {
    sounds.click();
    setTheme(id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); sounds.click(); }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Palette className="w-4 h-4" />
        Theme
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-xl p-2 z-50 animate-scale-in"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider px-2 py-1.5 mb-1" style={{ color: 'var(--text-dim)' }}>
              Select Theme
            </div>
            {themeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-white/5"
                style={{ color: 'var(--text)' }}
              >
                <div className="flex gap-1">
                  {t.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
                <span className="flex-1 text-left">{t.label}</span>
                {theme === t.id && <Check className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
