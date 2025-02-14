
// Import and set up Buffer before anything else
import { Buffer } from 'buffer';

// Ensure Buffer is available in all possible scopes
globalThis.Buffer = Buffer;
window.Buffer = Buffer;
global.Buffer = Buffer;

// Now import the rest of the application
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add type declaration to prevent TypeScript errors
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
  var Buffer: typeof Buffer;
}

createRoot(document.getElementById("root")!).render(<App />);
