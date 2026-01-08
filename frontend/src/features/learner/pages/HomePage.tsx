import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, BookOpen, Mic, PenTool, ChevronRight, Play, UserPlus, Clock, XCircle, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useLearnerStore } from '@/stores/learner-store';
import { supabase } from '@/lib/supabase';

// Sample lessons for demo
const sampleLessons = [
  {
    id: '1',
    title: 'Greetings - Ịkele',
    description: 'Learn how to greet people in Ohafia',
    level: 'A1',
    duration: '5 min',
    icon: '👋',
    progress: 0,
  },
  {
    id: '2',
    title: 'Family - Ụlọ',
    description: 'Words for family members',
    level: 'A1',
    duration: '8 min',
    icon: '👨‍👩‍👧‍👦',
    progress: 30,
  },
  {
    id: '3',
    title: 'Numbers - Ọnụọgụ',
    description: 'Count from 1 to 20',
    level: 'A1',
    duration: '6 min',
    icon: '🔢',
    progress: 100,
  },
];

const practiceCards = [
  { id: 'speak', title: 'Speak', icon: Mic, bgColor: 'bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30', iconColor: 'text-ohafia-primary-600 dark:text-ohafia-primary-400', description: 'Practice pronunciation' },
  { id: 'listen', title: 'Listen', icon: BookOpen, bgColor: 'bg-ohafia-secondary-100 dark:bg-ohafia-secondary-900/30', iconColor: 'text-ohafia-secondary-600 dark:text-ohafia-secondary-400', description: 'Hear native audio' },
  { id: 'flashcard', title: 'Flashcards', icon: PenTool, bgColor: 'bg-ohafia-accent-100 dark:bg-ohafia-accent-900/30', iconColor: 'text-ohafia-accent-600 dark:text-ohafia-accent-400', description: 'Learn vocabulary' },
];

export function HomePage() {
  const { user, profile } = useAuthStore();
  const { streak, updateStreak, syncOfflineAttempts } = useLearnerStore();
  
  // Role request state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'declined'>('none');
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      updateStreak(profile.id);
      syncOfflineAttempts(profile.id);
      checkExistingRequest();
    }
  }, [profile?.id, updateStreak, syncOfflineAttempts]);

  // Check if user already has a pending request
  async function checkExistingRequest() {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('role_requests')
      .select('status')
      .eq('user_id', profile.id)
      .eq('requested_role', 'contributor')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data && !error) {
      setRequestStatus(data.status as 'pending' | 'approved' | 'declined');
    }
  }

  // Submit contributor request
  async function submitRequest() {
    if (!profile?.id || !requestReason.trim()) return;
    
    setIsSubmitting(true);
    setRequestError(null);
    
    try {
      const { error } = await supabase
        .from('role_requests')
        .insert({
          user_id: profile.id,
          requested_role: 'contributor',
          reason: requestReason.trim(),
        });
      
      if (error) throw error;
      
      setRequestStatus('pending');
      setShowRequestModal(false);
      setRequestReason('');
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setRequestError(err?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check if user is already a contributor or higher
  const isAlreadyContributor = profile?.role && ['contributor', 'reviewer', 'admin'].includes(profile.role);

  // Get display name from profile, or user metadata, or fallback to email/default
  const displayName = profile?.display_name 
    || user?.user_metadata?.display_name 
    || user?.email?.split('@')[0] 
    || 'Learner';
  const firstName = displayName.split(' ')[0];
  
  // Format role for display
  const formatRole = (role: string | undefined) => {
    if (!role || role === 'learner') return null;
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  const userRole = formatRole(profile?.role);

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-950 transition-colors duration-300">
      {/* Header */}
      <header className="bg-gradient-to-br from-ohafia-primary-500 to-ohafia-primary-700 text-white px-6 pt-8 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-ohafia-primary-100 text-sm">Kaa! 👋</p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {firstName}
              {userRole && (
                <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  {userRole}
                </span>
              )}
            </h1>
          </div>
          
          {/* Streak badge */}
          <div className="streak-badge">
            <Flame className="w-5 h-5" />
            <span>{streak || 0}</span>
          </div>
        </div>

        {/* Daily goal card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Today's Goal</span>
            <span className="text-sm text-ohafia-primary-100">2/5 lessons</span>
          </div>
          <div className="progress-bar bg-white/20">
            <div className="progress-bar-fill bg-white" style={{ width: '40%' }}></div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 -mt-8 pb-8">
        {/* Continue learning card */}
        <div className="card p-5 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-100">Continue Learning</h2>
            <span className="badge-primary">In Progress</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-ohafia-primary-100 dark:bg-ohafia-primary-900/50 flex items-center justify-center text-2xl">
              👨‍👩‍👧‍👦
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100">Family - Ụlọ</h3>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Words for family members</p>
              <div className="progress-bar mt-2 h-1.5">
                <div className="progress-bar-fill" style={{ width: '30%' }}></div>
              </div>
            </div>
            <Link
              to="/learn"
              className="w-12 h-12 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center shadow-ohafia hover:bg-ohafia-primary-600 transition-colors"
            >
              <Play className="w-5 h-5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Quick practice section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-100">Quick Practice</h2>
            <Link to="/practice" className="text-sm text-ohafia-primary-600 dark:text-ohafia-primary-400 font-medium">
              See all
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {practiceCards.map((card) => (
              <Link
                key={card.id}
                to={`/practice?mode=${card.id}`}
                className="card-interactive p-4 text-center hover:scale-105 transition-transform"
              >
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <span className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 text-sm block">{card.title}</span>
                <span className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500 line-clamp-1">{card.description}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Today's lessons */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-100">Today's Plan</h2>
            <Link to="/learn" className="text-sm text-ohafia-primary-600 dark:text-ohafia-primary-400 font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {sampleLessons.map((lesson) => (
              <Link key={lesson.id} to={`/learn?lesson=${lesson.id}`} className="lesson-card">
                <div className="w-12 h-12 rounded-xl bg-ohafia-sand-100 dark:bg-ohafia-earth-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {lesson.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 truncate">{lesson.title}</h3>
                    <span className="badge-secondary text-xs">{lesson.level}</span>
                  </div>
                  <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 truncate">{lesson.description}</p>
                  {lesson.progress > 0 && lesson.progress < 100 && (
                    <div className="progress-bar mt-2 h-1">
                      <div className="progress-bar-fill" style={{ width: `${lesson.progress}%` }}></div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {lesson.progress === 100 ? (
                    <span className="text-ohafia-secondary-500 dark:text-ohafia-secondary-400 text-sm font-medium">✓ Done</span>
                  ) : (
                    <span className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500">{lesson.duration}</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-ohafia-earth-300 dark:text-ohafia-earth-600" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Become a Contributor section - only show for learners */}
        {!isAlreadyContributor && (
          <section className="mt-6">
            <div className="card p-5 bg-gradient-to-br from-ohafia-secondary-50 to-ohafia-secondary-100 dark:from-ohafia-secondary-900/30 dark:to-ohafia-secondary-800/20 border-ohafia-secondary-200 dark:border-ohafia-secondary-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-ohafia-secondary-500 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-1">Help Preserve Ohafia Igbo</h3>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-3">
                    Become a contributor and help add vocabulary, phrases, and audio recordings to our language database.
                  </p>
                  
                  {requestStatus === 'none' && (
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="btn-secondary text-sm py-2"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Request to Become a Contributor
                    </button>
                  )}
                  
                  {requestStatus === 'pending' && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Your request is pending review</span>
                    </div>
                  )}
                  
                  {requestStatus === 'declined' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Your previous request was declined</span>
                      </div>
                      <button
                        onClick={() => {
                          setRequestStatus('none');
                          setShowRequestModal(true);
                        }}
                        className="btn-secondary text-sm py-2"
                      >
                        Submit New Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Become a Contributor</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-ohafia-earth-500 dark:text-ohafia-sand-400" />
              </button>
            </div>
            
            <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-4">
              As a contributor, you'll be able to add new vocabulary, phrases, and record audio pronunciations 
              to help preserve the Ohafia dialect of Igbo.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">
                Why do you want to become a contributor?
              </label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Tell us about your connection to Ohafia or Igbo language, and how you'd like to help..."
                className="input-field min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500 mt-1">
                {requestReason.length}/500 characters
              </p>
            </div>
            
            {requestError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {requestError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                disabled={isSubmitting || !requestReason.trim()}
                className="flex-1 btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
