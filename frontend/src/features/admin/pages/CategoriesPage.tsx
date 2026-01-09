import { useEffect, useState } from 'react';
import { 
  Tag,
  Check,
  X,
  Trash2,
  Clock,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { useCategoryStore } from '@/stores/category-store';
import { useAuthStore } from '@/stores/auth-store';

export function CategoriesPage() {
  const { user } = useAuthStore();
  const { 
    categories, 
    pendingCategories, 
    fetchCategories, 
    fetchPendingCategories,
    approveCategory,
    rejectCategory,
    deleteCategory,
    createCategory,
    isLoading 
  } = useCategoryStore();

  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPendingCategories();
  }, [fetchCategories, fetchPendingCategories]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    await approveCategory(id, user.id);
  };

  const handleReject = async (id: string) => {
    if (confirm('Are you sure you want to reject this category?')) {
      await rejectCategory(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? This cannot be undone.')) {
      await deleteCategory(id);
    }
  };

  const handleCreateCategory = async () => {
    if (!user || !newCategoryName.trim()) return;
    
    setIsCreating(true);
    try {
      await createCategory({
        name: newCategoryName.trim().toLowerCase().replace(/\s+/g, '_'),
        description: newCategoryDescription.trim() || null,
        icon: newCategoryIcon.trim() || null,
        status: 'approved',
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      });
      
      setShowCreateModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryIcon('');
    } finally {
      setIsCreating(false);
    }
  };

  const formatCategoryName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50 mb-2">
              Asset Categories
            </h1>
            <p className="text-gray-600 dark:text-ohafia-sand-300">
              Manage categories for organizing learning content
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2
            ${activeTab === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 dark:bg-ohafia-earth-700 text-gray-600 dark:text-ohafia-sand-300 hover:bg-gray-200 dark:hover:bg-ohafia-earth-600'}`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingCategories.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs">
              {pendingCategories.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2
            ${activeTab === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 dark:bg-ohafia-earth-700 text-gray-600 dark:text-ohafia-sand-300 hover:bg-gray-200 dark:hover:bg-ohafia-earth-600'}`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved
          <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs">
            {categories.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-8 text-center">
          <div className="w-8 h-8 border-4 border-ohafia-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-ohafia-sand-400 mt-4">Loading categories...</p>
        </div>
      ) : activeTab === 'pending' ? (
        pendingCategories.length === 0 ? (
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 dark:text-ohafia-sand-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-2">
              No pending categories
            </h2>
            <p className="text-gray-500 dark:text-ohafia-sand-400">
              Category suggestions from contributors will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCategories.map(category => (
              <div 
                key={category.id} 
                className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xl">
                      {category.icon || <Tag className="w-5 h-5 text-yellow-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-ohafia-sand-50">
                        {formatCategoryName(category.name)}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">
                          {category.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-ohafia-sand-500 mt-1">
                        Submitted {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(category.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Approve category"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Reject category"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        categories.length === 0 ? (
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-12 text-center">
            <Tag className="w-16 h-16 text-gray-300 dark:text-ohafia-sand-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-2">
              No categories yet
            </h2>
            <p className="text-gray-500 dark:text-ohafia-sand-400">
              Create your first category to organize assets
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">
                    {category.icon || <Tag className="w-5 h-5 text-green-600" />}
                  </div>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-ohafia-sand-50">
                  {formatCategoryName(category.name)}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 mt-1">
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-ohafia-earth-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-ohafia-sand-50">
                Create New Category
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-ohafia-sand-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Clothing, Weather, Sports"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="What types of words/phrases belong in this category?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Emoji Icon (optional)
                </label>
                <input
                  type="text"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  placeholder="e.g., 👕 ☀️ ⚽"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                  maxLength={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-ohafia-earth-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-ohafia-sand-300 hover:bg-gray-100 dark:hover:bg-ohafia-earth-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={isCreating || !newCategoryName.trim()}
                className="px-4 py-2 bg-ohafia-primary text-white rounded-xl hover:bg-ohafia-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Category
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
