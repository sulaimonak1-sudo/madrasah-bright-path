import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutDashboard, Users, BookOpen, Layers, FolderOpen,
  Calendar, Upload, TrendingUp, FileText, Lock, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label_en: 'Dashboard', label_ar: 'لوحة التحكم' },
  { path: '/admin/students', icon: Users, label_en: 'Students', label_ar: 'الطلاب' },
  { path: '/admin/class-levels', icon: Layers, label_en: 'Class Levels', label_ar: 'المراحل الدراسية' },
  { path: '/admin/class-arms', icon: FolderOpen, label_en: 'Class Arms', label_ar: 'الشعب' },
  { path: '/admin/subjects', icon: BookOpen, label_en: 'Subjects', label_ar: 'المواد الدراسية' },
  { path: '/admin/sessions', icon: Calendar, label_en: 'Sessions & Terms', label_ar: 'السنوات والفصول' },
  { path: '/admin/results', icon: Upload, label_en: 'Results', label_ar: 'النتائج' },
  { path: '/admin/promotion', icon: TrendingUp, label_en: 'Promotion', label_ar: 'الترقية' },
  { path: '/admin/reports', icon: FileText, label_en: 'Reports', label_ar: 'التقارير' },
  { path: '/admin/locking', icon: Lock, label_en: 'Result Locking', label_ar: 'قفل النتائج' },
  { path: '/admin/staff', icon: Users, label_en: 'Staff', label_ar: 'الموظفون' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t, isRTL } = useLanguage();
  const { signOut, isAdmin, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter nav items based on role - teachers get limited access
  const filteredNavItems = isAdmin
    ? navItems
    : navItems.filter(item => 
        ['/admin', '/admin/results', '/admin/reports'].includes(item.path)
      );

  return (
    <div className={cn("flex min-h-screen", isRTL && "flex-row-reverse")}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed z-50 inset-y-0 flex w-64 flex-col bg-sidebar transition-transform md:relative md:translate-x-0",
        isRTL ? "right-0" : "left-0",
        sidebarOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
        "md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden">
            <img src="/images/school-logo.png" alt="Al-Bari Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">
              {t('Al-Bari Schools', 'مدارس البارئ')}
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              {t('Result Portal', 'بوابة النتائج')}
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {filteredNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {t(item.label_en, item.label_ar)}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={async () => {
              await signOut();
              navigate('/admin/login');
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            {t('Logout', 'تسجيل الخروج')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <LanguageToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
