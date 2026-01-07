import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, Lightbulb, Bug, Star, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

type FeedbackType = 'feedback' | 'feature' | 'bug' | 'other';

interface FeedbackOption {
  type: FeedbackType;
  icon: typeof MessageSquare;
  label: string;
  description: string;
  color: string;
}

const feedbackOptions: FeedbackOption[] = [
  {
    type: 'feedback',
    icon: Star,
    label: 'General Feedback',
    description: 'Share your thoughts about the app',
    color: 'ohafia-primary',
  },
  {
    type: 'feature',
    icon: Lightbulb,
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    color: 'ohafia-secondary',
  },
  {
    type: 'bug',
    icon: Bug,
    label: 'Report a Bug',
    description: 'Let us know about any issues',
    color: 'red',
  },
  {
    type: 'other',
    icon: MessageSquare,
    label: 'Other',
    description: 'Anything else you want to share',
    color: 'ohafia-accent',
  },
];

export function FeedbackPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          email: email.trim() || user?.email || null,
          user_agent: navigator.userAgent,
          app_version: '1.0.0',
        });

      if (submitError) throw submitError;

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-ohafia-secondary-100 dark:bg-ohafia-secondary-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-ohafia-secondary-600" />
          </div>
          <h1 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">Thank You!</h1>
          <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-8">
            Your feedback has been submitted successfully. We appreciate you helping us improve the app!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setSelectedType(null);
                setTitle('');
                setDescription('');
              }}
              className="btn-secondary"
            >
              Submit Another
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="btn-primary"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900">
      {/* Header */}
      <header className="bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Send Feedback</h1>
            <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Help us improve the app</p>
          </div>
        </div>
      </header>

      <main className="p-6 pb-safe">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback type selection */}
          <div>
            <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-3">
              What would you like to share? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {feedbackOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setSelectedType(option.type)}
                  className={`p-4 rounded-xl border-2 text-left transition-all
                    ${selectedType === option.type
                      ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20 ring-2 ring-${option.color}-500 ring-offset-1`
                      : 'border-ohafia-sand-200 dark:border-ohafia-earth-700 hover:border-ohafia-sand-300 dark:hover:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-800'
                    }`}
                >
                  <option.icon className={`w-6 h-6 mb-2 ${
                    selectedType === option.type 
                      ? `text-${option.color}-600` 
                      : 'text-ohafia-earth-400 dark:text-ohafia-sand-500'
                  }`} />
                  <p className={`font-medium text-sm ${
                    selectedType === option.type 
                      ? `text-${option.color}-700 dark:text-${option.color}-400` 
                      : 'text-ohafia-earth-800 dark:text-ohafia-sand-100'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-1">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              className="input"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              rows={5}
              className="input resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500 mt-1 text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Email (optional for non-logged in users) */}
          {!user && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
              />
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-1">
                Provide your email if you'd like us to follow up
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Logged in user info */}
          {user && (
            <div className="p-3 bg-ohafia-sand-100 dark:bg-ohafia-earth-800 rounded-xl">
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">
                Submitting as <span className="font-medium dark:text-ohafia-sand-300">{profile?.display_name || user.email}</span>
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedType || !title.trim() || !description.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
