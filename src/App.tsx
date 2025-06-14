
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TelegramProvider } from "@/components/TelegramProvider";
import { HomePage } from "@/pages/HomePage";
import { DruidPage } from "@/pages/DruidPage";
import { AdminPage } from "@/pages/AdminPage";
import NotFound from "./pages/NotFound";
import VKMiniAppPage from "@/pages/VKMiniAppPage";
import Index from "@/pages/Index"; // Импорт новой Index страницы

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TelegramProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              {/* Добавляем рут "/" как мини-аппу для работы с VK */}
              <Route path="/" element={<VKMiniAppPage />} />
              {/* Под Telegram оставляем путь /telegram */}
              <Route path="/telegram" element={<Index />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/druid" element={<DruidPage />} />
              <Route path="/Druid" element={<DruidPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/vk-mini-app" element={<VKMiniAppPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TelegramProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
