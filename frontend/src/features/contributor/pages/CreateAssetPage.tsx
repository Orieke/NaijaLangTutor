import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useContributorStore } from '@/stores/contributor-store';
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
  const { user } = useAuthStore();
  const { createAsset, isLoading, error } = useContributorStore();
  const { speak, stop, isPlaying, isAvailable: ttsAvailable } = useAudioPlayer();

  const [assetType, setAssetType] = useState<AssetType>('word');
  const [igboText, setIgboText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [culturalNote, setCulturalNote] = useState('');
  const [category, setCategory] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Handle text-to-speech for the Igbo text
  const handleSpeak = (text: string) => {
    if (isPlaying) {
      stop();
    } else if (text.trim()) {
      speak(text, { rate: 0.8 }); // Slower rate for language learning
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            <option value="">Select a category...</option>
            <option value="greetings">Greetings</option>
            <option value="family">Family</option>
            <option value="food">Food & Cooking</option>
            <option value="numbers">Numbers</option>
            <option value="colors">Colors</option>
            <option value="animals">Animals</option>
            <option value="nature">Nature</option>
            <option value="body">Body Parts</option>
            <option value="time">Time & Calendar</option>
            <option value="market">Market & Commerce</option>
            <option value="culture">Culture & Traditions</option>
            <option value="proverbs">Proverbs & Wisdom</option>
          </select>
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
    </div>
  );
}
