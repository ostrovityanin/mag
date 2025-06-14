
// КРИТИЧЕСКИ ВАЖНОЕ ЛОГИРОВАНИЕ ДЛЯ VK ДИАГНОСТИКИ
console.log("🚀 СТАРТ ПРИЛОЖЕНИЯ - САМОЕ РАННЕЕ ЛОГИРОВАНИЕ");
console.log("Время запуска:", new Date().toISOString());
console.log("Document ready state:", document.readyState);
console.log("Location FULL:", window.location.href);
console.log("User Agent FULL:", navigator.userAgent);

// Проверка VK окружения на самом раннем этапе
console.log("=== РАННЯЯ VK ПРОВЕРКА ===");
console.log("window.vkBridge присутствует:", !!window.vkBridge);
console.log("window.VKWebAppInit присутствует:", !!window.VKWebAppInit);
console.log("В iframe:", window !== window.top);
console.log("Referrer:", document.referrer);

// Проверяем все VK свойства в window
const allVKProps = Object.keys(window).filter(key => key.toLowerCase().includes('vk'));
console.log("Все VK свойства в window:", allVKProps);

// Проверяем URL параметры на VK
const hasVKParams = window.location.href.includes('vk_');
console.log("Есть VK параметры в URL:", hasVKParams);

// Проверяем User Agent на VK подписи
const isVKUserAgent = /VKMA|VKApp|VK\//.test(navigator.userAgent);
console.log("VK подпись в User Agent:", isVKUserAgent);

// Отправляем экстренное сообщение родителю (если есть)
if (window.parent && window.parent !== window) {
  try {
    console.log("Отправляем тестовое сообщение родителю...");
    window.parent.postMessage({
      type: 'vk_app_early_check',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }, '*');
    console.log("✅ Сообщение родителю отправлено");
  } catch (e) {
    console.error("❌ Ошибка отправки сообщения родителю:", e);
  }
}

// Слушаем входящие сообщения
window.addEventListener('message', (event) => {
  console.log("📨 ПОЛУЧЕНО СООБЩЕНИЕ:", {
    origin: event.origin,
    data: event.data,
    timestamp: new Date().toISOString()
  });
});

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
  console.error("❌ Root element not found!");
} else {
  console.log("✅ Root element found, creating React app...");
  
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("✅ React app created and rendered");
}

// Дополнительное логирование через секунду
setTimeout(() => {
  console.log("=== APP STATUS AFTER 1 SECOND ===");
  console.log("Document ready state:", document.readyState);
  console.log("Root content length:", rootElement?.innerHTML?.length || 0);
  console.log("VK Bridge still available:", !!window.vkBridge);
  console.log("App mounted successfully:", !!rootElement?.querySelector('[data-app-mounted]'));
}, 1000);

// Дополнительное логирование через 5 секунд
setTimeout(() => {
  console.log("=== APP STATUS AFTER 5 SECONDS ===");
  console.log("Document ready state:", document.readyState);
  console.log("Current visible content:", document.body.innerText.substring(0, 200));
  console.log("VK проверка через 5 сек:", {
    vkBridge: !!window.vkBridge,
    VKWebAppInit: !!window.VKWebAppInit,
    allVKProps: Object.keys(window).filter(key => key.toLowerCase().includes('vk'))
  });
}, 5000);
