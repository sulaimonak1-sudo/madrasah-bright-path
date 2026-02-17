import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminClassLevels from "./pages/AdminClassLevels";
import AdminClassArms from "./pages/AdminClassArms";
import AdminSubjects from "./pages/AdminSubjects";
import AdminSessions from "./pages/AdminSessions";
import AdminResults from "./pages/AdminResults";
import AdminPromotion from "./pages/AdminPromotion";
import AdminReports from "./pages/AdminReports";
import AdminLocking from "./pages/AdminLocking";
import ResultView from "./pages/ResultView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/result" element={<ResultView />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/class-levels" element={<AdminClassLevels />} />
            <Route path="/admin/class-arms" element={<AdminClassArms />} />
            <Route path="/admin/subjects" element={<AdminSubjects />} />
            <Route path="/admin/sessions" element={<AdminSessions />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/promotion" element={<AdminPromotion />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/locking" element={<AdminLocking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
