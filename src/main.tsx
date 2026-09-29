import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Set theme immediately before React renders
(function() {
  try {
    var theme = localStorage.getItem('lazydrop-theme') || 'matrix';
    var themes = {
      matrix: {
        bg: '#000d00',
        bgCard: 'rgba(0,255,65,0.02)',
        bgHover: 'rgba(0,255,65,0.04)',
        border: 'rgba(0,255,65,0.12)',
        borderActive: 'rgba(0,255,65,0.5)',
        text: '#c8ffc8',
        textMuted: '#00ff41',
        textDim: '#003300',
        primary: '#00ff41',
        primaryGlow: 'rgba(0,255,65,0.25)',
        secondary: '#00cc33',
        accent: '#00ff99',
        accentGlow: 'rgba(0,255,153,0.15)',
        danger: '#ff0033',
        warning: '#ffff00',
        success: '#00ff41',
        gradient: 'linear-gradient(135deg, #00ff41, #00cc33, #00ff99)',
        cardBg: 'rgba(0,255,65,0.02)',
        cardBorder: 'rgba(0,255,65,0.12)',
        cardHover: 'rgba(0,255,65,0.06)',
        inputBg: 'rgba(0,255,65,0.03)',
        inputBorder: 'rgba(0,255,65,0.15)',
        inputFocus: 'rgba(0,255,65,0.5)',
        scanline: 'rgba(0,255,65,0.025)',
        gridLine: 'rgba(0,255,65,0.04)',
        orb1: 'rgba(0,255,65,0.1)',
        orb2: 'rgba(0,204,51,0.06)',
        orb3: 'rgba(0,255,153,0.04)',
        hologram: '#00ff99',
        hologramGlow: 'rgba(0,255,153,0.3)',
        terminal: '#00ff41',
        terminalGlow: 'rgba(0,255,65,0.2)',
        energy: '#00ff99',
        energyGlow: 'rgba(0,255,153,0.15)',
        void: '#000000',
        voidGlow: 'rgba(0,255,65,0.05)',
      }
    };
    var c = themes[theme] || themes.matrix;
    var root = document.documentElement;
    Object.entries(c).forEach(function(kv) {
      root.style.setProperty('--' + kv[0].replace(/([A-Z])/g, '-$1').toLowerCase(), kv[1]);
    });
    root.setAttribute('data-theme', theme);
  } catch(e) {}
})();

// Set color-scheme for dark mode support
document.documentElement.style.colorScheme = 'dark';

// Set theme-color meta tag
var metaThemeColor = document.createElement('meta');
metaThemeColor.name = 'theme-color';
metaThemeColor.content = '#00ff41';
document.head.appendChild(metaThemeColor);

// Viewport meta for safe areas
var viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
} else {
  var newViewportMeta = document.createElement('meta');
  newViewportMeta.name = 'viewport';
  newViewportMeta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  document.head.appendChild(newViewportMeta);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
