
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            {/* Роуты БЕЗ TelegramProvider */}
            <Route path="/" element={<VKMiniAppPage />} />
            <Route path="/vk-mini-app" element={<VKMiniAppPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />

            {/* Роуты, требующие TelegramProvider */}
            <Route element={<TelegramLayout />}>
              <Route path="/telegram" element={<Index />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/druid" element={<DruidPage />} />
              <Route path="/Druid" element={<DruidPage />} />
            </Route>
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
