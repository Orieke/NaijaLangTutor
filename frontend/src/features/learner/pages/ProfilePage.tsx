import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Bell, Download, Shield, HelpCircle, LogOut, 
  ChevronRight, Moon, Globe, Volume2, MessageSquarePlus, X, Check, ExternalLink, Sun
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

type ModalType = 'dialect' | 'audio' | 'darkMode' | 'notifications' | 'downloads' | 'privacy' | 'help' | 'settings' | null;

interface UserPreferences {
  dialect: string;
  audioQuality: 'low' | 'medium' | 'high';
  notifications: boolean;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, signOut, isLoading } = useAuthStore();
  const { isDarkMode, setDarkMode } = useThemeStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  // Load preferences from localStorage (excluding darkMode which is in theme store)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Remove darkMode from old preferences if it exists
      const { darkMode, ...rest } = parsed;
      return {
        dialect: rest.dialect || 'Ohafia',
        audioQuality: rest.audioQuality || 'high',
        notifications: rest.notifications ?? true,
      };
    }
    return {
      dialect: 'Ohafia',
      audioQuality: 'high',
      notifications: true,
    };
  });

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const menuSections = [
    {
      title: 'Preferences',
      items: [
        { 
          icon: Globe, 
          label: 'Dialect', 
          value: preferences.dialect, 
          action: () => setActiveModal('dialect') 
        },
        { 
          icon: Volume2, 
          label: 'Audio quality', 
          value: preferences.audioQuality.charAt(0).toUpperCase() + preferences.audioQuality.slice(1), 
          action: () => setActiveModal('audio') 
        },
        { 
          icon: isDarkMode ? Sun : Moon, 
          label: 'Dark mode', 
          value: isDarkMode ? 'On' : 'Off', 
          action: () => setActiveModal('darkMode') 
        },
        { 
          icon: Bell, 
          label: 'Notifications', 
          value: preferences.notifications ? 'On' : 'Off', 
          action: () => setActiveModal('notifications') 
        },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: Download, label: 'Downloaded lessons', value: '0 packs', action: () => setActiveModal('downloads') },
        { icon: Shield, label: 'Privacy settings', action: () => setActiveModal('privacy') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: MessageSquarePlus, label: 'Send Feedback', action: () => navigate('/feedback') },
        { icon: HelpCircle, label: 'Help center', action: () => setActiveModal('help') },
        { icon: Settings, label: 'App settings', action: () => setActiveModal('settings') },
      ],
    },
  ];

  // Format role for display badge
  const formatRole = (role: string | undefined) => {
    if (!role) return 'Learner';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-950 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-ohafia-earth-900 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 px-6 py-6 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ohafia-primary-400 to-ohafia-primary-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.display_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-100">
                {profile?.display_name || 'Learner'}
              </h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                profile?.role === 'admin' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : profile?.role === 'reviewer'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                  : profile?.role === 'contributor'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-ohafia-sand-100 text-ohafia-earth-600 dark:bg-ohafia-earth-800 dark:text-ohafia-sand-300'
              }`}>
                {formatRole(profile?.role)}
              </span>
            </div>
            <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{profile?.id?.slice(0, 8)}...</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-primary">{profile?.proficiency_level || 'beginner'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 pb-safe">
        {/* Learning stats card */}
        <div className="card p-4 mb-6">
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-100 mb-3">Learning Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-ohafia-primary-600 dark:text-ohafia-primary-400">
                {profile?.streak_count || 0}
              </p>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Day streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ohafia-secondary-600 dark:text-ohafia-secondary-400">45</p>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Words</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ohafia-accent-600 dark:text-ohafia-accent-400">12</p>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Lessons</p>
            </div>
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <section key={section.title} className="mb-6">
            <h2 className="text-sm font-medium text-ohafia-earth-500 dark:text-ohafia-sand-400 mb-2 px-1">
              {section.title}
            </h2>
            <div className="card divide-y divide-ohafia-sand-100 dark:divide-ohafia-earth-700">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full p-4 flex items-center gap-4 hover:bg-ohafia-sand-50 dark:hover:bg-ohafia-earth-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-ohafia-sand-100 dark:bg-ohafia-earth-800 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-ohafia-earth-600 dark:text-ohafia-sand-300" />
                  </div>
                  <span className="flex-1 text-left font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">
                    {item.label}
                  </span>
                  {item.value && (
                    <span className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{item.value}</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-ohafia-earth-300 dark:text-ohafia-earth-600" />
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Sign out button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full p-4 card flex items-center gap-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Sign out</span>
        </button>

        {/* App version */}
        <p className="text-center text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500 mt-6">
          Asụsụ Ohafia v1.0.0
        </p>
      </main>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-sm animate-scale-in">
            <h2 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-100 mb-2">Sign out?</h2>
            <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-6">
              Your progress is saved. You can sign back in anytime to continue learning.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-ghost flex-1 py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialect Modal */}
      {activeModal === 'dialect' && (
        <SettingsModal title="Select Dialect" onClose={() => setActiveModal(null)}>
          <div className="space-y-2">
            <button
              onClick={() => {
                updatePreference('dialect', 'Ohafia');
                setActiveModal(null);
              }}
              className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                ${preferences.dialect === 'Ohafia' 
                  ? 'border-ohafia-primary-500 bg-ohafia-primary-50 dark:bg-ohafia-primary-900/30' 
                  : 'border-ohafia-sand-200 dark:border-ohafia-earth-600 hover:border-ohafia-sand-300 dark:hover:border-ohafia-earth-500'}`}
            >
              <div>
                <span className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50">Ohafia Igbo</span>
                <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-1">The dialect spoken in Ohafia, Abia State</p>
              </div>
              {preferences.dialect === 'Ohafia' && (
                <Check className="w-5 h-5 text-ohafia-primary-600 dark:text-ohafia-primary-400" />
              )}
            </button>
          </div>
          <div className="mt-4 p-3 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-lg">
            <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">
              <strong>Asụsụ Ohafia</strong> is focused on teaching the Ohafia dialect of Igbo. 
              This unique dialect is spoken by the Ohafia people of Abia State, Nigeria.
            </p>
          </div>
        </SettingsModal>
      )}

      {/* Audio Quality Modal */}
      {activeModal === 'audio' && (
        <SettingsModal title="Audio Quality" onClose={() => setActiveModal(null)}>
          <div className="space-y-2">
            {[
              { value: 'low', label: 'Low', description: 'Saves data, lower quality' },
              { value: 'medium', label: 'Medium', description: 'Balanced quality and data usage' },
              { value: 'high', label: 'High', description: 'Best quality, uses more data' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  updatePreference('audioQuality', option.value as 'low' | 'medium' | 'high');
                  setActiveModal(null);
                }}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                  ${preferences.audioQuality === option.value 
                    ? 'border-ohafia-primary-500 bg-ohafia-primary-50 dark:bg-ohafia-primary-900/30' 
                    : 'border-ohafia-sand-200 dark:border-ohafia-earth-600 hover:border-ohafia-sand-300 dark:hover:border-ohafia-earth-500'}`}
              >
                <div>
                  <span className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50">{option.label}</span>
                  <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">{option.description}</p>
                </div>
                {preferences.audioQuality === option.value && (
                  <Check className="w-5 h-5 text-ohafia-primary-600 dark:text-ohafia-primary-400" />
                )}
              </button>
            ))}
          </div>
        </SettingsModal>
      )}

      {/* Dark Mode Modal */}
      {activeModal === 'darkMode' && (
        <SettingsModal title="Dark Mode" onClose={() => setActiveModal(null)}>
          <div className="space-y-2">
            {[
              { value: false, label: 'Light Mode', icon: Sun, description: 'Bright and clear interface' },
              { value: true, label: 'Dark Mode', icon: Moon, description: 'Easier on the eyes at night' },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={String(option.value)}
                  onClick={() => {
                    setDarkMode(option.value);
                    setActiveModal(null);
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                    ${isDarkMode === option.value 
                      ? 'border-ohafia-primary-500 bg-ohafia-primary-50 dark:bg-ohafia-primary-900/30' 
                      : 'border-ohafia-sand-200 dark:border-ohafia-earth-600 hover:border-ohafia-sand-300 dark:hover:border-ohafia-earth-500'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      option.value ? 'bg-ohafia-earth-800' : 'bg-ohafia-accent-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${option.value ? 'text-ohafia-accent-400' : 'text-ohafia-accent-600'}`} />
                    </div>
                    <div>
                      <span className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">{option.label}</span>
                      <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">{option.description}</p>
                    </div>
                  </div>
                  {isDarkMode === option.value && (
                    <Check className="w-5 h-5 text-ohafia-primary-600 dark:text-ohafia-primary-400" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-4 text-center">
            Your theme preference is saved automatically.
          </p>
        </SettingsModal>
      )}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
        <SettingsModal title="Notifications" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
              <div>
                <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50">Push Notifications</p>
                <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Daily reminders and updates</p>
              </div>
              <button
                onClick={() => updatePreference('notifications', !preferences.notifications)}
                className={`w-12 h-7 rounded-full transition-colors relative
                  ${preferences.notifications ? 'bg-ohafia-primary-500' : 'bg-ohafia-sand-300 dark:bg-ohafia-earth-600'}`}
              >
                <span 
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform
                    ${preferences.notifications ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">
              Get reminded to practice and stay on track with your learning goals.
            </p>
          </div>
        </SettingsModal>
      )}

      {/* Downloads Modal */}
      {activeModal === 'downloads' && (
        <SettingsModal title="Downloaded Lessons" onClose={() => setActiveModal(null)}>
          <div className="text-center py-8">
            <Download className="w-12 h-12 text-ohafia-sand-300 dark:text-ohafia-earth-600 mx-auto mb-4" />
            <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-50 mb-2">No Downloads Yet</h3>
            <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 mb-4">
              Download lessons to learn offline without internet connection.
            </p>
            <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500">
              Offline mode coming soon!
            </p>
          </div>
        </SettingsModal>
      )}

      {/* Privacy Modal */}
      {activeModal === 'privacy' && (
        <SettingsModal title="Privacy Settings" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
              <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50 mb-2">Data Collection</h4>
              <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">
                We collect minimal data to improve your learning experience. Your audio recordings 
                are used only for pronunciation practice and are not stored permanently.
              </p>
            </div>
            <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
              <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50 mb-2">Your Rights</h4>
              <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">
                You can request to delete your account and all associated data at any time 
                by contacting support.
              </p>
            </div>
            <button className="w-full btn-secondary text-sm flex items-center justify-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Privacy Policy
            </button>
          </div>
        </SettingsModal>
      )}

      {/* Help Center Modal */}
      {activeModal === 'help' && (
        <SettingsModal title="Help Center" onClose={() => setActiveModal(null)}>
          <div className="space-y-3">
            {[
              { q: 'How do I start learning?', a: 'Go to the Learn tab and select a lesson to begin.' },
              { q: 'How does pronunciation practice work?', a: 'Tap the microphone to record yourself, then compare with the native speaker.' },
              { q: 'Can I learn offline?', a: 'Offline mode is coming soon! Stay tuned for updates.' },
              { q: 'How do I become a contributor?', a: 'Go to Home and request contributor access to help add content.' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
                <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50 mb-1">{item.q}</h4>
                <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">{item.a}</p>
              </div>
            ))}
            <button 
              onClick={() => {
                setActiveModal(null);
                navigate('/feedback');
              }}
              className="w-full btn-primary text-sm mt-4 flex items-center justify-center"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Still need help? Send us feedback
            </button>
          </div>
        </SettingsModal>
      )}

      {/* App Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal title="App Settings" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
              <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50 mb-2">App Version</h4>
              <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">1.0.0</p>
            </div>
            <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
              <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-50 mb-2">Clear Cache</h4>
              <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-3">
                Clear temporary data to free up space.
              </p>
              <button 
                onClick={() => {
                  localStorage.removeItem('learnerStore');
                  alert('Cache cleared!');
                }}
                className="btn-secondary text-sm py-2"
              >
                Clear Cache
              </button>
            </div>
            <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
              <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">Reset Preferences</h4>
              <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-3">
                Reset all settings to default values.
              </p>
              <button 
                onClick={() => {
                  setPreferences({
                    dialect: 'Ohafia',
                    audioQuality: 'high',
                    notifications: true,
                  });
                  setDarkMode(false);
                  alert('Preferences reset!');
                }}
                className="btn-secondary text-sm py-2"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </SettingsModal>
      )}
    </div>
  );
}

// Reusable Modal Component
function SettingsModal({ 
  title, 
  children, 
  onClose 
}: { 
  title: string; 
  children: React.ReactNode; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="card w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl animate-slide-up sm:animate-scale-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-800 text-ohafia-earth-500 dark:text-ohafia-sand-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
