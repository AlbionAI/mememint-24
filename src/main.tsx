
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// This fixes the "Buffer is not defined" error
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />)
