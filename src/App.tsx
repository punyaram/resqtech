import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Layout } from "@/components/Layout";
import { AuthPage } from "@/components/AuthPage";
import { MapPage } from "@/pages/MapPage";
import { ReportPage } from "@/pages/ReportPage";
import { QueuePage } from "@/pages/QueuePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { initialize, user, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={
              <Layout>
                {user ? <MapPage /> : <AuthPage />}
              </Layout>
            } />
            <Route path="/report" element={
              <Layout>
                {user ? <ReportPage /> : <AuthPage />}
              </Layout>
            } />
            <Route path="/queue" element={
              <Layout>
                {user ? <QueuePage /> : <AuthPage />}
              </Layout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
