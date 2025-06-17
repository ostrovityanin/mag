
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TelegramProvider } from "@/components/TelegramProvider";
import { HomePage } from "@/pages/HomePage";
import { DruidPage } from "@/pages/DruidPage";
import { DruidEntryPage } from "@/pages/DruidEntryPage";
import { DruidAppPage } from "@/pages/DruidAppPage";
import { CookiePage } from "@/pages/CookiePage";
import { CookieEntryPage } from "@/pages/CookieEntryPage";
import { CookieAppPage } from "@/pages/CookieAppPage";
import { AdminPage } from "@/pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TelegramProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/druid" element={<DruidEntryPage />} />
            <Route path="/druid/app" element={<DruidAppPage />} />
            <Route path="/Druid" element={<DruidPage />} />
            <Route path="/cookie" element={<CookieEntryPage />} />
            <Route path="/cookie/app" element={<CookieAppPage />} />
            <Route path="/Cookie" element={<CookiePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TelegramProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
