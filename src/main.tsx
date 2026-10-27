import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/base.css';
import './styles/scenes.css';
import './styles/orbits.css';
import './styles/dialogs.css';

const element = document.getElementById('root');
if (element) createRoot(element).render(<App />);
