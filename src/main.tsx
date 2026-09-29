import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Set color-scheme for dark mode support
document.documentElement.style.colorScheme = 'dark';

// Set theme-color meta tag
const metaThemeColor = document.createElement('meta');
metaThemeColor.name = 'theme-color';
metaThemeColor.content = '#0a0e1a';
document.head.appendChild(metaThemeColor);

// Viewport meta for safe areas
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
} else {
  const newViewportMeta = document.createElement('meta');
  newViewportMeta.name = 'viewport';
  newViewportMeta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  document.head.appendChild(newViewportMeta);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
