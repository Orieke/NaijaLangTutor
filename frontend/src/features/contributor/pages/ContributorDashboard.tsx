import { useEffect } from 'react';
import { 
  FileText, 
  Mic, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContributorStore } from '@/stores/contributor-store';
import { useAuthStore } from '@/stores/auth-store';

export function ContributorDashboard() {
  const { user } = useAuthStore();
  const { stats, myAssets, fetchMyContributions, fetchStats } = useContributorStore();

  useEffect(() => {
    if (user) {
      fetchMyContributions(user.id);
      fetchStats(user.id);
    }
  }, [user, fetchMyContributions, fetchStats]);

  const recentAssets = myAssets.slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">
          Language Asset Studio
        </h1>
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">
          Create and manage learning content for the Ohafia Igbo community
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                {stats?.totalAssets || 0}
              </p>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Total Assets</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                {stats?.pendingReview || 0}
              </p>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                {stats?.approved || 0}
              </p>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Approved</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Mic className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                {stats?.totalRecordings || 0}
              </p>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Recordings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/contributor/create"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-ohafia-primary/10 flex items-center justify-center group-hover:bg-ohafia-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-ohafia-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">Create New Asset</h3>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
                Add words, phrases, or sentences
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/contributor/record"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Mic className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">Recording Studio</h3>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
                Record audio for existing assets
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Contribution Tips */}
      <div className="card p-6 mb-8 bg-gradient-to-r from-ohafia-sand-100 to-ohafia-sand-50 dark:from-ohafia-earth-800 dark:to-ohafia-earth-700">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-ohafia-gold/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-ohafia-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">Contribution Tips</h3>
            <ul className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 space-y-1">
              <li>• Use authentic Ohafia dialect pronunciations</li>
              <li>• Include cultural context where relevant</li>
              <li>• Record in a quiet environment for best audio quality</li>
              <li>• Review your submissions before final upload</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Assets */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 flex items-center justify-between">
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">Recent Contributions</h2>
          <Link 
            to="/contributor/my-assets"
            className="text-sm text-ohafia-primary hover:underline"
          >
            View all
          </Link>
        </div>
        
        {recentAssets.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-ohafia-sand-300 dark:text-ohafia-sand-600 mx-auto mb-3" />
            <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400">No contributions yet</p>
            <Link 
              to="/contributor/create"
              className="text-ohafia-primary hover:underline text-sm"
            >
              Create your first asset
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ohafia-sand-100 dark:divide-ohafia-earth-700">
            {recentAssets.map(asset => (
              <div key={asset.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-ohafia-earth-900 dark:text-ohafia-sand-50">{asset.igbo_text}</p>
                  <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{asset.english_text}</p>
                </div>
                <div className="flex items-center gap-2">
                  {asset.status === 'pending' && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {asset.status === 'approved' && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </span>
                  )}
                  {asset.status === 'rejected' && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
