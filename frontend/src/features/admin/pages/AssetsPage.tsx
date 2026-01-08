import { useEffect, useState } from 'react';
import { 
  Search,
  Filter,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import type { Asset } from '@/types/database';

type StatusFilter = 'all' | 'draft' | 'pending' | 'approved' | 'rejected';

export function AssetsPage() {
  const { assets, fetchAllAssets, updateAsset, isLoading } = useAdminStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    igbo_text: '',
    english_text: '',
    pronunciation_guide: '',
    cultural_note: '',
    category: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllAssets();
  }, [fetchAllAssets]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.igbo_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.english_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: assets.length,
    draft: assets.filter(a => a.status === 'draft').length,
    pending: assets.filter(a => a.status === 'pending').length,
    approved: assets.filter(a => a.status === 'approved').length,
    rejected: assets.filter(a => a.status === 'rejected').length,
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
        return <FileText className="w-4 h-4 text-gray-400 dark:text-ohafia-sand-500" />;
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

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      igbo_text: asset.igbo_text,
      english_text: asset.english_text,
      pronunciation_guide: asset.pronunciation_guide || '',
      cultural_note: asset.cultural_note || '',
      category: asset.category || '',
    });
  };

  const closeEditModal = () => {
    setEditingAsset(null);
    setEditForm({
      igbo_text: '',
      english_text: '',
      pronunciation_guide: '',
      cultural_note: '',
      category: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    
    setIsSaving(true);
    try {
      await updateAsset(editingAsset.id, {
        igbo_text: editForm.igbo_text.trim(),
        english_text: editForm.english_text.trim(),
        pronunciation_guide: editForm.pronunciation_guide.trim() || null,
        cultural_note: editForm.cultural_note.trim() || null,
        category: editForm.category.trim() || null,
      });
      closeEditModal();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50 mb-2">All Assets</h1>
        <p className="text-gray-600 dark:text-ohafia-sand-300">
          Browse and manage all learning content
        </p>
      </header>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'pending', 'approved', 'draft', 'rejected'] as StatusFilter[]).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
              ${statusFilter === status
                ? 'bg-ohafia-primary text-white'
                : 'bg-gray-100 dark:bg-ohafia-earth-700 text-gray-600 dark:text-ohafia-sand-300 hover:bg-gray-200 dark:hover:bg-ohafia-earth-600'}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-ohafia-sand-500" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-800 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
          />
        </div>

        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-8 text-center">
          <div className="w-8 h-8 border-4 border-ohafia-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-ohafia-sand-400 mt-4">Loading assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-ohafia-sand-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-2">No assets found</h2>
          <p className="text-gray-500 dark:text-ohafia-sand-400">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Assets will appear here as contributors add them'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusBadge(asset.status)}`}>
                  {getStatusIcon(asset.status)}
                  {asset.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-ohafia-sand-500">{asset.type}</span>
                  {(asset.status === 'pending' || asset.status === 'approved') && (
                    <button
                      onClick={() => openEditModal(asset)}
                      className="p-1 text-gray-400 hover:text-ohafia-primary dark:text-ohafia-sand-500 dark:hover:text-ohafia-primary transition-colors"
                      title="Edit asset"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-1">{asset.igbo_text}</p>
              <p className="text-sm text-gray-600 dark:text-ohafia-sand-300 mb-3">{asset.english_text}</p>
              
              {asset.category && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-ohafia-earth-700 text-gray-600 dark:text-ohafia-sand-300 rounded">
                  {asset.category}
                </span>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-ohafia-earth-700 text-xs text-gray-400 dark:text-ohafia-sand-500">
                Created {new Date(asset.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-ohafia-earth-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ohafia-sand-50">
                Edit Asset
              </h2>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-ohafia-sand-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-300 mb-1">
                  Igbo Text *
                </label>
                <input
                  type="text"
                  value={editForm.igbo_text}
                  onChange={(e) => setEditForm(prev => ({ ...prev, igbo_text: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-300 mb-1">
                  English Translation *
                </label>
                <input
                  type="text"
                  value={editForm.english_text}
                  onChange={(e) => setEditForm(prev => ({ ...prev, english_text: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-300 mb-1">
                  Pronunciation Guide
                </label>
                <input
                  type="text"
                  value={editForm.pronunciation_guide}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pronunciation_guide: e.target.value }))}
                  placeholder="e.g., kah-ah"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-300 mb-1">
                  Cultural Note
                </label>
                <textarea
                  value={editForm.cultural_note}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cultural_note: e.target.value }))}
                  placeholder="Any cultural context or usage notes"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., greetings, food, family"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-ohafia-earth-700">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-600 dark:text-ohafia-sand-300 hover:bg-gray-100 dark:hover:bg-ohafia-earth-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.igbo_text.trim() || !editForm.english_text.trim()}
                className="px-4 py-2 bg-ohafia-primary text-white rounded-xl hover:bg-ohafia-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
