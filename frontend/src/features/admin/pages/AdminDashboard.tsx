import { useEffect } from 'react';
import { 
  Users, 
  FileText, 
  ClipboardCheck, 
  BookOpen,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '@/stores/admin-store';

export function AdminDashboard() {
  const { stats, reviewQueue, fetchStats, fetchReviewQueue } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchReviewQueue();
  }, [fetchStats, fetchReviewQueue]);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Total Assets', value: stats?.totalAssets || 0, icon: FileText, color: 'green' },
    { label: 'Pending Reviews', value: stats?.pendingReviews || 0, icon: ClipboardCheck, color: 'yellow' },
    { label: 'Total Lessons', value: stats?.totalLessons || 0, icon: BookOpen, color: 'purple' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-ohafia-sand-300">
          Manage content, users, and review submissions
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50">{value}</p>
                <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-ohafia-earth-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-ohafia-sand-50 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pending Reviews
            </h2>
            <Link 
              to="/admin/review"
              className="text-sm text-ohafia-primary hover:underline"
            >
              View all
            </Link>
          </div>
          
          {reviewQueue.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 dark:text-ohafia-sand-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-ohafia-sand-400">No pending reviews</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-ohafia-earth-700">
              {reviewQueue.slice(0, 5).map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">
                      {item.type === 'asset' 
                        ? (item.item as { igbo_text?: string }).igbo_text 
                        : 'Audio Recording'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">
                      {item.type} • {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-ohafia-primary" />
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <Link
              to="/admin/review"
              className="block p-4 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 hover:border-ohafia-primary hover:bg-ohafia-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-ohafia-primary" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">Review Queue</p>
                  <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">
                    {stats?.pendingReviews || 0} items waiting
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/lessons"
              className="block p-4 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 hover:border-ohafia-primary hover:bg-ohafia-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-ohafia-primary" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">Manage Lessons</p>
                  <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">Create and organize curriculum</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="block p-4 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 hover:border-ohafia-primary hover:bg-ohafia-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-ohafia-primary" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">User Management</p>
                  <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">Manage roles and permissions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
