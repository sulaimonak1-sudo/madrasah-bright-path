import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CampusProvider } from "@/contexts/CampusContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import StaffSignup from "./pages/StaffSignup";
import PinGenerate from "./pages/PinGenerate";
import AdminStaff from "./pages/AdminStaff";
import ProfileSettings from "./pages/ProfileSettings";
import AdminCampuses from "./pages/AdminCampuses";
import AdminBroadsheet from "./pages/AdminBroadsheet";
import About from "./pages/About";
import Academics from "./pages/Academics";
import NewsEvents from "./pages/NewsEvents";
import NewsPost from "./pages/NewsPost";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import AdminWebsite from "./pages/AdminWebsite";
import AdminWebsitePosts from "./pages/AdminWebsitePosts";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CampusProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/result" element={<ResultView />} />
              <Route path="/results" element={<Navigate to="/result" replace />} />
              <Route path="/pin-generate" element={<PinGenerate />} />
              <Route path="/about" element={<About />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/news-events" element={<NewsEvents />} />
              <Route path="/news/:id" element={<NewsPost />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/staff/signup" element={<StaffSignup />} />

              {/* Admin & Teacher */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/website" element={<ProtectedRoute requiredRole="super_admin"><AdminWebsite /></ProtectedRoute>} />
              <Route path="/admin/website/posts" element={<ProtectedRoute requiredRole="super_admin"><AdminWebsitePosts /></ProtectedRoute>} />
              <Route path="/admin/results" element={<ProtectedRoute><AdminResults /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/broadsheet" element={<ProtectedRoute><AdminBroadsheet /></ProtectedRoute>} />
              <Route path="/admin/campuses" element={<ProtectedRoute requiredRole="super_admin"><AdminCampuses /></ProtectedRoute>} />

              {/* Admin only (except students which teachers can access) */}
              <Route path="/admin/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
              <Route path="/admin/class-levels" element={<ProtectedRoute requiredRole="admin"><AdminClassLevels /></ProtectedRoute>} />
              <Route path="/admin/class-arms" element={<ProtectedRoute requiredRole="admin"><AdminClassArms /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute requiredRole="admin"><AdminSubjects /></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute requiredRole="admin"><AdminSessions /></ProtectedRoute>} />
              <Route path="/admin/promotion" element={<ProtectedRoute requiredRole="admin"><AdminPromotion /></ProtectedRoute>} />
              <Route path="/admin/locking" element={<ProtectedRoute requiredRole="admin"><AdminLocking /></ProtectedRoute>} />
              <Route path="/admin/staff" element={<ProtectedRoute><AdminStaff /></ProtectedRoute>} />
              <Route path="/admin/settings/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </CampusProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
