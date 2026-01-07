import { useState } from 'react';
import { 
  Globe,
  Bell,
  Shield,
  Database,
  Save
} from 'lucide-react';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Asụsụ Ohafia',
    siteDescription: 'Learn Igbo (Ohafia Dialect)',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    autoApproveContributors: false,
    minReviewsRequired: 1,
    enableAudioRecording: true,
    enableAIAssist: false,
  });

  const handleSave = () => {
    // In production, this would save to Supabase
    alert('Settings saved successfully!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure application settings and preferences
        </p>
      </header>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Globe className="w-5 h-5 text-ohafia-primary" />
            <h2 className="font-semibold text-gray-900">General</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <input
                type="text"
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Disable access for non-admin users</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                  ${settings.maintenanceMode ? 'bg-ohafia-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${settings.maintenanceMode ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* User Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Shield className="w-5 h-5 text-ohafia-primary" />
            <h2 className="font-semibold text-gray-900">User Management</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Allow Registration</p>
                <p className="text-sm text-gray-500">Allow new users to sign up</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, allowRegistration: !prev.allowRegistration }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                  ${settings.allowRegistration ? 'bg-ohafia-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${settings.allowRegistration ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Email Verification</p>
                <p className="text-sm text-gray-500">Users must verify email to access</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, requireEmailVerification: !prev.requireEmailVerification }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                  ${settings.requireEmailVerification ? 'bg-ohafia-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${settings.requireEmailVerification ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Database className="w-5 h-5 text-ohafia-primary" />
            <h2 className="font-semibold text-gray-900">Content Management</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-approve Contributors</p>
                <p className="text-sm text-gray-500">Skip review for trusted contributors</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, autoApproveContributors: !prev.autoApproveContributors }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                  ${settings.autoApproveContributors ? 'bg-ohafia-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${settings.autoApproveContributors ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Reviews Required
              </label>
              <select
                value={settings.minReviewsRequired}
                onChange={(e) => setSettings(prev => ({ ...prev, minReviewsRequired: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
              >
                <option value={1}>1 review</option>
                <option value={2}>2 reviews</option>
                <option value={3}>3 reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Bell className="w-5 h-5 text-ohafia-primary" />
            <h2 className="font-semibold text-gray-900">Features</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Audio Recording</p>
                <p className="text-sm text-gray-500">Allow users to record pronunciations</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, enableAudioRecording: !prev.enableAudioRecording }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                  ${settings.enableAudioRecording ? 'bg-ohafia-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${settings.enableAudioRecording ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">AI Assistance</p>
                <p className="text-sm text-gray-500">Enable AI-powered suggestions (Beta)</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, enableAIAssist: !prev.enableAIAssist }))}
                className={`relative w-12 h-6 rounded-full transition-colors
                  ${settings.enableAIAssist ? 'bg-ohafia-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${settings.enableAIAssist ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
