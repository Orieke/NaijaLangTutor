import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  BookOpen,
  FileText,
  Settings,
  ArrowLeft,
  LogOut,
  Shield,
  UserPlus,
  MessageSquarePlus
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/review', icon: ClipboardCheck, label: 'Review Queue' },
  { to: '/admin/role-requests', icon: UserPlus, label: 'Role Requests' },
  { to: '/admin/feedback', icon: MessageSquarePlus, label: 'Feedback' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/lessons', icon: BookOpen, label: 'Lessons' },
  { to: '/admin/assets', icon: FileText, label: 'Assets' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ohafia-earth-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-ohafia-earth-900 text-white z-20 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-ohafia-gold" />
            </div>
            <div>
              <h1 className="font-bold">Admin Panel</h1>
              <p className="text-xs text-ohafia-sand-300">Asụsụ Ohafia</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-ohafia-sand-300 hover:bg-white/5 hover:text-white'}`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="mb-4 px-4 py-2">
            <p className="text-sm text-ohafia-sand-300">Signed in as</p>
            <p className="font-medium truncate">{profile?.display_name || 'Admin'}</p>
          </div>
          <Link
            to="/contributor"
            className="flex items-center gap-3 px-4 py-3 w-full text-ohafia-secondary-400 hover:bg-ohafia-secondary-500/10 hover:text-ohafia-secondary-300 rounded-xl transition-colors mb-2"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Contributor</span>
          </Link>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 px-4 py-3 w-full text-ohafia-sand-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-ohafia-earth-900 text-white z-20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-ohafia-gold" />
            <span className="font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/contributor" className="p-2 text-ohafia-secondary-400">
              <FileText className="w-5 h-5" />
            </Link>
            <button
              onClick={() => navigate('/home')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ohafia-earth-900 z-20 pb-safe">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'text-ohafia-gold' 
                  : 'text-ohafia-sand-400'}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen bg-gray-50 dark:bg-ohafia-earth-950">
        <Outlet />
      </main>
    </div>
  );
}
