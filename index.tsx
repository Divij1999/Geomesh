
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("GeoMesh: index.tsx booting...");

const mount = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    (window as any).__GEOMESH_MOUNTED__ = true;
    console.log("GeoMesh: App mounted successfully.");
  } catch (err) {
    console.error("GeoMesh: Mounting failed", err);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
