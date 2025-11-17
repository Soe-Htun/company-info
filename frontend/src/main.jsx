import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick
        newestOnTop
        pauseOnHover
        containerStyle={{ right: '16px', top: '16px' }}
        toastClassName={() =>
          'bg-white text-slate-800 rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center min-w-[380px] pr-14'
        }
        bodyClassName={() => 'text-sm font-semibold whitespace-nowrap'}
      />
    </BrowserRouter>
  </StrictMode>,
);
