import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, ThemeId } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

const themeOptions: { id: ThemeId; label: string; colors: string[] }[] = [
  { id: 'black', label: 'Void Black', colors: ['#06060c', '#34d399', '#22d3ee'] },
  { id: 'cyber', label: 'Cyberpunk', colors: ['#0a0e1a', '#00d4ff', '#ff6b35'] },
  { id: 'dark', label: 'Midnight', colors: ['#0f172a', '#818cf8', '#38bdf8'] },
  { id: 'light', label: 'Light', colors: ['#f8fafc', '#10b981', '#06b6d4'] },
  { id: 'bw', label: 'Monochrome', colors: ['#111111', '#ffffff', '#a3a3a3'] },
  { id: 'purple', label: 'Purple Haze', colors: ['#0c0614', '#a855f7', '#e879f9'] },
  { id: 'neon', label: 'Neon Glow', colors: ['#020208', '#00ff88', '#ff00ff'] },
];

interface ThemeSwitcherProps {
  compact?: boolean;
  iconOnly?: boolean;
}

export default function ThemeSwitcher({ compact, iconOnly }: ThemeSwitcherProps) {
  const { theme, colors, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  function handleSelect(id: ThemeId) {
    sounds.click();
    setTheme(id);
    setOpen(false);
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => { setOpen(!open); sounds.click(); }}
          className="flex items-center gap-3 rounded-lg text-sm font-medium transition-all text-left"
          style={{
            padding: iconOnly ? '0.625rem' : '0.625rem 0.75rem',
            justifyContent: iconOnly ? 'center' : 'flex-start',
            width: iconOnly ? 'auto' : '100%',
            color: colors.textMuted,
          }}
          aria-label="Select theme"
          title={iconOnly ? 'Theme' : undefined}
        >
          <span style={{ color: colors.textDim }}><Palette className="w-[18px] h-[18px]" /></span>
          {!iconOnly && <span>Theme</span>}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 bottom-full mb-2 w-56 rounded-xl p-2 z-50 animate-scale-in"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider px-2 py-1.5 mb-1" style={{ color: colors.textDim }}>
                Select Theme
              </div>
              {themeOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={{
                    color: theme === t.id ? colors.primary : colors.text,
                    justifyContent: 'flex-start',
                    background: theme === t.id ? colors.primaryGlow : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (theme !== t.id) (e.currentTarget as HTMLElement).style.background = colors.bgHover; }}
                  onMouseLeave={(e) => { if (theme !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="flex gap-1">
                    {t.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ background: c, border: `1px solid ${colors.border}` }}
                      />
                    ))}
                  </div>
                  <span className="flex-1 text-left">{t.label}</span>
                  {theme === t.id && <Check className="w-3.5 h-3.5" style={{ color: colors.primary }} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); sounds.click(); }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all btn-ghost"
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
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider px-2 py-1.5 mb-1" style={{ color: colors.textDim }}>
              Select Theme
            </div>
            {themeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  color: theme === t.id ? colors.primary : colors.text,
                  justifyContent: 'flex-start',
                  background: theme === t.id ? colors.primaryGlow : 'transparent',
                }}
                onMouseEnter={(e) => { if (theme !== t.id) (e.currentTarget as HTMLElement).style.background = colors.bgHover; }}
                onMouseLeave={(e) => { if (theme !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div className="flex gap-1">
                  {t.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ background: c, border: `1px solid ${colors.border}` }}
                    />
                  ))}
                </div>
                <span className="flex-1 text-left">{t.label}</span>
                {theme === t.id && <Check className="w-3.5 h-3.5" style={{ color: colors.primary }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
