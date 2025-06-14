
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Базовое логирование для отладки
console.log("=== VK MINI APP STARTING ===");
console.log("Location:", window.location.href);
console.log("User Agent:", navigator.userAgent);
console.log("Document ready state:", document.readyState);

// Проверка на VK окружение
if (typeof window !== "undefined") {
  console.log("Window object available");
  console.log("VK Bridge check:", {
    vkBridge: !!window.vkBridge,
    VKWebAppInit: !!window.VKWebAppInit,
    userAgent: navigator.userAgent
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  console.log("Root element found, creating React app...");
  
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("React app created and rendered");
}

// Дополнительное логирование через секунду
setTimeout(() => {
  console.log("=== APP STATUS AFTER 1 SECOND ===");
  console.log("Document ready state:", document.readyState);
  console.log("Root content:", rootElement?.innerHTML?.substring(0, 200));
}, 1000);
