import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThemeToggle from "@/components/upi/ThemeToggle";
import FeatureRequestModal from "@/components/upi/FeatureRequestModal";

const queryClient = new QueryClient();

const NOTIF_KEY = "notif_announcement_v1";

function useAnnouncementNotification() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (localStorage.getItem(NOTIF_KEY)) return;

    localStorage.setItem(NOTIF_KEY, "1");

    new Notification("🎉 New Features Rolled Out!", {
      body: "We've rolled out many exciting features — check them out! We hope you love them. Give us your feedback!",
      icon: "/favicon.ico",
    });
  }, []);
}

const App = () => {
  useAnnouncementNotification();

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeToggle />
        <FeatureRequestModal />
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
