import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, Mic, TrendingUp, User, FileText, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/learn', icon: BookOpen, label: 'Learn' },
  { to: '/practice', icon: Mic, label: 'Practice' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function AppLayout() {
  const location = useLocation();
  const { profile } = useAuthStore();
  
  const isContributor = profile?.role && ['contributor', 'reviewer', 'admin'].includes(profile.role);
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-950 transition-colors duration-300">
      {/* Role-based header links */}
      {(isContributor || isAdmin) && (
        <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-ohafia-earth-900/95 backdrop-blur-sm border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 z-30 px-4 py-2 transition-colors duration-300">
          <div className="flex items-center justify-end gap-2 max-w-lg mx-auto">
            {isContributor && (
              <Link
                to="/contributor"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ohafia-secondary-600 dark:text-ohafia-secondary-400 bg-ohafia-secondary-50 dark:bg-ohafia-secondary-900/30 hover:bg-ohafia-secondary-100 dark:hover:bg-ohafia-secondary-900/50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Contributor
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`pb-safe ${(isContributor || isAdmin) ? 'pt-12' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={isActive ? 'nav-item-active' : 'nav-item'}
              >
                <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
