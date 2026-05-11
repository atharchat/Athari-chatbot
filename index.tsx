
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AdminLayout } from './components/AdminLayout';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const isAdmin = window.location.pathname.startsWith('/admin');

root.render(
  <React.StrictMode>
    {isAdmin ? <AdminLayout /> : <App />}
  </React.StrictMode>
);
