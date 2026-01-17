
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("GeoMesh: index.tsx executing...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("GeoMesh: Root element #root not found!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log("GeoMesh: React root created, rendering...");
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  // Mark as successfully mounted for the bootloader
  (window as any).__GEOMESH_MOUNTED__ = true;
} catch (err) {
  console.error("GeoMesh: Render failed", err);
}
