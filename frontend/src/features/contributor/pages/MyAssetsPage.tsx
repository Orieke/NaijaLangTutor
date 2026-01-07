import { useEffect, useState } from 'react';
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Send,
  MoreVertical,
  FileText
} from 'lucide-react';
import { useContributorStore } from '@/stores/contributor-store';
import { useAuthStore } from '@/stores/auth-store';

type StatusFilter = 'all' | 'draft' | 'pending' | 'approved' | 'rejected';

export function MyAssetsPage() {
  const { user } = useAuthStore();
  const { myAssets, fetchMyContributions, deleteAsset, submitForReview, isLoading } = useContributorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyContributions(user.id);
    }
  }, [user, fetchMyContributions]);

  const filteredAssets = myAssets.filter(asset => {
    const matchesSearch = 
      asset.igbo_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.english_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset(id);
    }
    setOpenMenu(null);
  };

  const handleSubmit = async (id: string) => {
    await submitForReview(id);
    setOpenMenu(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Edit className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">My Assets</h1>
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">
          Manage your contributed learning content
        </p>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-ohafia-earth-400 dark:text-ohafia-sand-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-ohafia-earth-400 dark:text-ohafia-sand-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="input py-2"
          >
            <option value="all">All Status</option>
            <option value="draft">Drafts</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Assets List */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-ohafia-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-4">Loading assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText className="w-12 h-12 text-ohafia-sand-300 dark:text-ohafia-earth-600 mx-auto mb-3" />
          <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-2">
            {searchQuery || statusFilter !== 'all' 
              ? 'No assets match your filters' 
              : 'No assets yet'}
          </p>
          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
            Create your first asset to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(asset.status)}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(asset.status)}`}>
                      {asset.status}
                    </span>
                    <span className="text-xs text-ohafia-earth-400">
                      {asset.type}
                    </span>
                  </div>
                  <p className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 truncate">
                    {asset.igbo_text}
                  </p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 truncate">
                    {asset.english_text}
                  </p>
                  {asset.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 rounded">
                      {asset.category}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === asset.id ? null : asset.id)}
                    className="p-2 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-ohafia-earth-500 dark:text-ohafia-sand-400" />
                  </button>

                  {openMenu === asset.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-ohafia-earth-800 rounded-xl shadow-lg border border-ohafia-sand-200 dark:border-ohafia-earth-700 py-1 z-10">
                      {asset.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSubmit(asset.id)}
                            className="w-full px-4 py-2 text-left text-sm text-ohafia-earth-700 dark:text-ohafia-sand-200 hover:bg-ohafia-sand-50 dark:hover:bg-ohafia-earth-700 flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Submit for Review
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-ohafia-earth-700 dark:text-ohafia-sand-200 hover:bg-ohafia-sand-50 dark:hover:bg-ohafia-earth-700 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        </>
                      )}
                      {asset.status === 'rejected' && (
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-ohafia-earth-700 dark:text-ohafia-sand-200 hover:bg-ohafia-sand-50 dark:hover:bg-ohafia-earth-700 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Revise & Resubmit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
