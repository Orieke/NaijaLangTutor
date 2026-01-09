import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX,
  Plus,
  X
} from 'lucide-react';
import { useContributorStore } from '@/stores/contributor-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAuthStore } from '@/stores/auth-store';
import { useAudioPlayer } from '@/lib/audio-service';

type AssetType = 'word' | 'phrase' | 'sentence' | 'proverb' | 'greeting';

const assetTypes: { value: AssetType; label: string; description: string }[] = [
  { value: 'word', label: 'Word', description: 'Single vocabulary word' },
  { value: 'phrase', label: 'Phrase', description: 'Common expression or phrase' },
  { value: 'sentence', label: 'Sentence', description: 'Complete sentence' },
  { value: 'proverb', label: 'Proverb', description: 'Traditional Igbo proverb' },
  { value: 'greeting', label: 'Greeting', description: 'Cultural greeting' },
];

export function CreateAssetPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { createAsset, isLoading, error } = useContributorStore();
  const { categories, fetchCategories, createCategory } = useCategoryStore();
  const { speak, stop, isPlaying, isAvailable: ttsAvailable } = useAudioPlayer();

  const [assetType, setAssetType] = useState<AssetType>('word');
  const [igboText, setIgboText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [culturalNote, setCulturalNote] = useState('');
  const [category, setCategory] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // New category modal state
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle text-to-speech for the Igbo text
  const handleSpeak = (text: string) => {
    if (isPlaying) {
      stop();
    } else if (text.trim()) {
      speak(text, { rate: 0.8 }); // Slower rate for language learning
    }
  };
  
  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!user || !newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim().toLowerCase().replace(/\s+/g, '_'),
        description: newCategoryDescription.trim() || null,
        icon: newCategoryIcon.trim() || null,
        status: isAdmin ? 'approved' : 'pending', // Admins auto-approve
        created_by: user.id,
        approved_by: isAdmin ? user.id : null,
        approved_at: isAdmin ? new Date().toISOString() : null,
      });
      
      if (newCategory) {
        // If admin, select the new category immediately
        if (isAdmin) {
          setCategory(newCategory.name);
        }
        setShowNewCategoryModal(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewCategoryIcon('');
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!user || !igboText.trim() || !englishText.trim()) return;

    console.log('Submitting asset with:', {
      type: assetType,
      igbo_text: igboText.trim(),
      english_text: englishText.trim(),
      created_by: user.id,
      status: asDraft ? 'draft' : 'pending',
    });

    const asset = await createAsset({
      type: assetType,
      igbo_text: igboText.trim(),
      english_text: englishText.trim(),
      pronunciation_guide: pronunciation.trim() || null,
      cultural_note: culturalNote.trim() || null,
      category: category.trim() || null,
      created_by: user.id,
      status: asDraft ? 'draft' : 'pending',
    });

    console.log('Asset created result:', asset);

    if (asset) {
      navigate('/contributor/my-assets');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/contributor')}
          className="p-2 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ohafia-earth-600 dark:text-ohafia-sand-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Create New Asset</h1>
          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
            Add learning content for the community
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card p-6">
        {/* Asset Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-3">
            Asset Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {assetTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setAssetType(type.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all
                  ${assetType === type.value
                    ? 'border-ohafia-primary-500 bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30 ring-2 ring-ohafia-primary-500 ring-offset-1'
                    : 'border-ohafia-sand-300 dark:border-ohafia-earth-600 hover:border-ohafia-sand-400 dark:hover:border-ohafia-earth-500 bg-white dark:bg-ohafia-earth-800'}`}
              >
                <p className={`font-medium text-sm ${assetType === type.value ? 'text-ohafia-primary-700 dark:text-ohafia-primary-300' : 'text-ohafia-earth-900 dark:text-ohafia-sand-100'}`}>{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Igbo Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-2">
            Igbo Text (Ohafia Dialect) *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={igboText}
              onChange={(e) => setIgboText(e.target.value)}
              placeholder="Enter the Igbo text..."
              className="input flex-1"
            />
            {ttsAvailable && (
              <button
                type="button"
                onClick={() => handleSpeak(igboText)}
                disabled={!igboText.trim()}
                className={`px-4 rounded-xl border-2 transition-all flex items-center gap-2
                  ${isPlaying 
                    ? 'border-ohafia-primary bg-ohafia-primary text-white' 
                    : 'border-ohafia-sand-200 hover:border-ohafia-primary-300 text-ohafia-earth-600'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Listen to pronunciation"
              >
                {isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-1">
            {ttsAvailable 
              ? 'Click the speaker icon to hear an approximation of the pronunciation' 
              : 'Enter the Igbo word or phrase'}
          </p>
        </div>

        {/* English Translation */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-2">
            English Translation *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
              placeholder="Enter the English translation..."
              className="input flex-1"
            />
            {ttsAvailable && (
              <button
                type="button"
                onClick={() => handleSpeak(englishText)}
                disabled={!englishText.trim()}
                className={`px-4 rounded-xl border-2 transition-all flex items-center gap-2
                  ${isPlaying 
                    ? 'border-ohafia-primary bg-ohafia-primary text-white' 
                    : 'border-ohafia-sand-200 hover:border-ohafia-primary-300 text-ohafia-earth-600'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Listen to English"
              >
                {isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Pronunciation Guide */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-2">
            Pronunciation Guide <span className="text-ohafia-earth-400 dark:text-ohafia-sand-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={pronunciation}
            onChange={(e) => setPronunciation(e.target.value)}
            placeholder="e.g., naw-oh (phonetic spelling)"
            className="input"
          />
          <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-1">
            Help learners pronounce correctly with phonetic spelling
          </p>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-2">
            Category <span className="text-ohafia-earth-400 dark:text-ohafia-sand-500 font-normal">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input flex-1"
            >
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon && `${cat.icon} `}{cat.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategoryModal(true)}
              className="btn-secondary flex items-center gap-1 px-3"
              title="Suggest new category"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
          <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-1">
            Don't see your category? Click "New" to suggest one{!isAdmin && ' (requires admin approval)'}
          </p>
        </div>

        {/* Cultural Note */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-2">
            Cultural Note <span className="text-ohafia-earth-400 dark:text-ohafia-sand-500 font-normal">(Optional)</span>
          </label>
          <textarea
            value={culturalNote}
            onChange={(e) => setCulturalNote(e.target.value)}
            placeholder="Add context about when/how this is used in Ohafia culture..."
            rows={3}
            className="input"
          />
        </div>

        {/* AI Assistance Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-200 text-sm">AI Assistance Available</p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                Coming soon: Get suggestions for pronunciation guides and cultural context
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="mb-6 p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800 rounded-xl">
            <h3 className="text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-3">Preview</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 flex-1">{igboText || 'Igbo text...'}</p>
                {ttsAvailable && igboText && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(igboText)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isPlaying 
                        ? 'bg-ohafia-primary text-white' 
                        : 'bg-ohafia-primary-100 hover:bg-ohafia-primary-200 text-ohafia-primary-600'}`}
                    title="Listen"
                  >
                    {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}
              </div>
              <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">{englishText || 'English translation...'}</p>
              {pronunciation && (
                <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 italic">/{pronunciation}/</p>
              )}
              {culturalNote && (
                <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 bg-white dark:bg-ohafia-earth-700 p-2 rounded-lg mt-2">
                  💡 {culturalNote}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          
          <button
            onClick={() => handleSubmit(true)}
            disabled={isLoading || !igboText.trim() || !englishText.trim()}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save as Draft
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={isLoading || !igboText.trim() || !englishText.trim()}
            className="btn-primary flex items-center justify-center gap-2 flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Submit for Review
          </button>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700">
              <h2 className="text-lg font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                {isAdmin ? 'Create New Category' : 'Suggest New Category'}
              </h2>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="p-2 text-ohafia-earth-400 hover:text-ohafia-earth-600 dark:hover:text-ohafia-sand-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {!isAdmin && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
                  Your category suggestion will be reviewed by an admin before it becomes available.
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Clothing, Weather, Sports"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="What types of words/phrases belong in this category?"
                  rows={2}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200 mb-1">
                  Emoji Icon (optional)
                </label>
                <input
                  type="text"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  placeholder="e.g., 👕 ☀️ ⚽"
                  className="input"
                  maxLength={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-ohafia-sand-200 dark:border-ohafia-earth-700">
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="px-4 py-2 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={isCreatingCategory || !newCategoryName.trim()}
                className="px-4 py-2 bg-ohafia-primary text-white rounded-xl hover:bg-ohafia-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isCreatingCategory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAdmin ? 'Creating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {isAdmin ? 'Create Category' : 'Submit for Approval'}
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
