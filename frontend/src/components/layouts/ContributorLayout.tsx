import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Mic, 
  ArrowLeft,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { to: '/contributor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/contributor/create', icon: Plus, label: 'Create Asset' },
  { to: '/contributor/my-assets', icon: FileText, label: 'My Assets' },
  { to: '/contributor/record', icon: Mic, label: 'Recording Studio' },
];

export function ContributorLayout() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-ohafia-earth-800 border-r border-ohafia-sand-200 dark:border-ohafia-earth-700 z-20 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ohafia-primary to-ohafia-gold flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Asset Studio</h1>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Contributor Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${isActive 
                    ? 'bg-ohafia-primary text-white' 
                    : 'text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700'}`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-ohafia-sand-200 dark:border-ohafia-earth-700">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 w-full text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors mb-2"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 px-4 py-3 w-full text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 rounded-xl transition-colors mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 z-20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ohafia-primary to-ohafia-gold flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Asset Studio</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="p-2 text-purple-600 dark:text-purple-400">
                <Shield className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={() => navigate('/home')}
              className="p-2 text-ohafia-earth-600 dark:text-ohafia-sand-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-ohafia-earth-800 border-t border-ohafia-sand-200 dark:border-ohafia-earth-700 z-20 pb-safe">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'text-ohafia-primary' 
                  : 'text-ohafia-earth-400 dark:text-ohafia-sand-400'}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
