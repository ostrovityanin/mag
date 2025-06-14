
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { TelegramProvider } from "@/components/TelegramProvider";
import { HomePage } from "@/pages/HomePage";
import { DruidPage } from "@/pages/DruidPage";
import { AdminPage } from "@/pages/AdminPage";
import NotFound from "./pages/NotFound";
import VKMiniAppPage from "@/pages/VKMiniAppPage";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

// Компонент-обертка для роутов, которым нужен TelegramProvider
const TelegramLayout = () => (
  <TelegramProvider>
    <Outlet />
  </TelegramProvider>
);

function App() {
  // Логирование для отладки
  console.log("App component rendered");
  console.log("Current URL:", window.location.href);
  console.log("Current pathname:", window.location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            {/* VK Mini App роуты - максимальное покрытие путей */}
            <Route path="/" element={<VKMiniAppPage />} />
            <Route path="/index.html" element={<VKMiniAppPage />} />
            <Route path="/vk-mini-app" element={<VKMiniAppPage />} />
            <Route path="/druid" element={<VKMiniAppPage />} />
            <Route path="/Druid" element={<VKMiniAppPage />} />
            <Route path="/app" element={<VKMiniAppPage />} />
            <Route path="/main" element={<VKMiniAppPage />} />
            
            {/* Админка без Telegram Provider */}
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Роуты, требующие TelegramProvider */}
            <Route element={<TelegramLayout />}>
              <Route path="/telegram" element={<Index />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/telegram/druid" element={<DruidPage />} />
            </Route>
            
            {/* Fallback для всех остальных путей - тоже VK Mini App */}
            <Route path="*" element={<VKMiniAppPage />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
