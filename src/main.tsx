
import { Buffer } from 'buffer';
// Make Buffer available globally before any other imports
window.Buffer = Buffer;
globalThis.Buffer = Buffer;

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
