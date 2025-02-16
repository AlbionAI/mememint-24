
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Polyfill Buffer globally before any other imports
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
