
import { Buffer } from 'buffer';
// Define Buffer globally before any other imports
window.Buffer = Buffer;

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
