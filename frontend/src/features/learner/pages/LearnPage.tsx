import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Lock, CheckCircle, Volume2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useAudioPlayer } from '@/lib/audio-service';
import type { Lesson, Asset, Progress } from '@/types/database';

export function LearnPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { speak, stop, isAvailable: ttsAvailable } = useAudioPlayer();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [showVocab, setShowVocab] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [speakingAssetId, setSpeakingAssetId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch lessons, assets, and progress from database
  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch published lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (lessonsError) {
          console.error('Lessons fetch error:', lessonsError);
          throw lessonsError;
        }

        // Fetch approved assets (vocabulary) with audio submissions
        const { data: assetsData, error: assetsError } = await supabase
          .from('assets')
          .select(`
            *,
            audio_submissions (
              audio_url,
              status
            )
          `)
          .in('status', ['approved', 'pending'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (assetsError) {
          console.error('Assets fetch error:', assetsError);
          throw assetsError;
        }

        // Process assets to include audio_url from submissions if asset doesn't have one
        const processedAssets = (assetsData || []).map((asset: Asset & { audio_submissions?: { audio_url: string; status: string }[] }) => {
          // If asset has audio_url, use it; otherwise check submissions
          if (!asset.audio_url && asset.audio_submissions?.length) {
            // Prefer approved submissions, fall back to pending
            const approvedAudio = asset.audio_submissions.find(s => s.status === 'approved');
            const pendingAudio = asset.audio_submissions.find(s => s.status === 'pending');
            const audioSubmission = approvedAudio || pendingAudio;
            if (audioSubmission) {
              return { ...asset, audio_url: audioSubmission.audio_url };
            }
          }
          return asset;
        });

        // Fetch user's progress for all lessons
        let progressData: Progress[] = [];
        if (user?.id) {
          const { data: progress, error: progressError } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', user.id);

          if (progressError && progressError.code !== 'PGRST116') {
            console.error('Progress fetch error:', progressError);
          } else {
            progressData = (progress || []) as Progress[];
          }
        }

        // Create a map of lesson_id -> progress for easy lookup
        const progressByLesson: Record<string, Progress> = {};
        progressData.forEach(p => {
          progressByLesson[p.lesson_id] = p;
        });

        setLessons((lessonsData || []) as Lesson[]);
        setAssets(processedAssets as Asset[]);
        setProgressMap(progressByLesson);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [user?.id]);

  // Play audio for an asset
  const playAudio = async (asset: Asset) => {
    if (!asset.audio_url) {
      console.log('No audio URL for asset:', asset.id);
      return;
    }

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPlayingAudioId(asset.id);

      // Get the audio URL - if it's a Supabase storage URL, get the public URL
      let audioUrl = asset.audio_url;
      
      // If it's a relative path, get signed URL from Supabase storage
      if (!audioUrl.startsWith('http')) {
        const { data } = supabase.storage
          .from('audio')
          .getPublicUrl(audioUrl);
        audioUrl = data.publicUrl;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setPlayingAudioId(null);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setPlayingAudioId(null);
    }
  };

  // Speak asset using TTS (fallback when no recorded audio)
  const speakAsset = (asset: Asset) => {
    if (speakingAssetId === asset.id) {
      stop();
      setSpeakingAssetId(null);
    } else {
      setSpeakingAssetId(asset.id);
      speak(asset.igbo_text, {
        rate: 0.8,
        onEnd: () => setSpeakingAssetId(null),
        onError: () => setSpeakingAssetId(null),
      });
    }
  };

  // Group assets by category or type
  const groupedAssets = assets.reduce((acc, asset) => {
    const category = asset.category || asset.type || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  // Calculate progress from actual data
  const completedLessons = Object.values(progressMap).filter(p => p.is_completed).length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Helper to check if a lesson is completed
  const isLessonCompleted = (lessonId: string) => {
    return progressMap[lessonId]?.is_completed || false;
  };

  // Helper to get lesson progress percentage
  const getLessonProgress = (lessonId: string) => {
    const progress = progressMap[lessonId];
    if (!progress) return 0;
    if (progress.is_completed) return 100;
    return Math.round(progress.accuracy_rate || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ohafia-primary-500 mx-auto mb-4" />
          <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900">
      {/* Header */}
      <header className="bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Learn</h1>
        <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Ohafia Igbo Course</p>
      </header>

      <main className="px-6 py-6 pb-24">
        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-100 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm text-red-600 underline mt-1 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </div>
          </div>
        )}

        {/* Course progress */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">Course Progress</span>
            <span className="text-sm text-ohafia-primary-600 dark:text-ohafia-primary-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-400 mt-2">
            {completedLessons} of {totalLessons || 0} lessons completed
          </p>
        </div>

        {/* Vocabulary from assets */}
        {assets.length > 0 && (
          <section className="mb-6">
            <button
              onClick={() => setShowVocab(!showVocab)}
              className="w-full flex items-center justify-between p-4 card-interactive mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ohafia-accent-100 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-ohafia-accent-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100">Vocabulary</h3>
                  <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{assets.length} words & phrases</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-ohafia-earth-400 transition-transform ${showVocab ? 'rotate-90' : ''}`} />
            </button>
            
            {showVocab && (
              <div className="space-y-2 animate-slide-up">
                {Object.entries(groupedAssets).map(([category, categoryAssets]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-xs font-semibold text-ohafia-earth-500 dark:text-ohafia-sand-400 uppercase tracking-wide mb-2 px-1">
                      {category}
                    </h4>
                    {categoryAssets.map((asset) => (
                      <div key={asset.id} className="card p-4 flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 igbo-text truncate">
                            {asset.igbo_text}
                          </p>
                          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-300 truncate">
                            {asset.english_text}
                          </p>
                          {asset.pronunciation_guide && (
                            <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-400 italic mt-1">
                              /{asset.pronunciation_guide}/
                            </p>
                          )}
                        </div>
                        {asset.audio_url ? (
                          <button 
                            onClick={() => playAudio(asset)}
                            disabled={playingAudioId === asset.id}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ml-3 flex-shrink-0
                              ${playingAudioId === asset.id 
                                ? 'bg-ohafia-primary-500 text-white' 
                                : 'bg-ohafia-primary-100 hover:bg-ohafia-primary-200 text-ohafia-primary-600'}`}
                            title="Play recorded audio"
                          >
                            {playingAudioId === asset.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                        ) : ttsAvailable ? (
                          <button 
                            onClick={() => speakAsset(asset)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ml-3 flex-shrink-0
                              ${speakingAssetId === asset.id 
                                ? 'bg-ohafia-secondary-500 text-white' 
                                : 'bg-ohafia-secondary-100 hover:bg-ohafia-secondary-200 text-ohafia-secondary-600'}`}
                            title="Listen with text-to-speech"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-ohafia-sand-100 flex items-center justify-center ml-3 flex-shrink-0" title="No audio available">
                            <Volume2 className="w-5 h-5 text-ohafia-earth-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state for assets */}
        {assets.length === 0 && !isLoading && (
          <div className="card p-8 text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-ohafia-sand-100 dark:bg-ohafia-earth-700 flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-ohafia-earth-300 dark:text-ohafia-sand-400" />
            </div>
            <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">No vocabulary yet</h3>
            <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
              Vocabulary content is being prepared. Check back soon!
            </p>
          </div>
        )}

        {/* Lesson units */}
        <section>
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-4">Course Lessons</h2>
          
          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                // Unlock lesson if previous is completed, or if it's the first lesson
                const previousLesson = index > 0 ? lessons[index - 1] : null;
                const isPreviousCompleted = previousLesson ? isLessonCompleted(previousLesson.id) : true;
                const isLocked = index > 0 && !isPreviousCompleted;
                const isCompleted = isLessonCompleted(lesson.id);
                const lessonProgress = getLessonProgress(lesson.id);

                return (
                  <div key={lesson.id} className="card overflow-hidden">
                    <button
                      onClick={() => !isLocked && navigate(`/practice?lesson=${lesson.id}`)}
                      disabled={isLocked}
                      className={`w-full p-4 flex items-center gap-4 transition-colors
                        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ohafia-sand-50 cursor-pointer'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative
                        ${isCompleted 
                          ? 'bg-ohafia-secondary-500 text-white' 
                          : isLocked 
                            ? 'bg-ohafia-sand-200 text-ohafia-earth-400'
                            : 'bg-ohafia-primary-100 text-ohafia-primary-600'}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : isLocked ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className={`font-semibold ${isLocked ? 'text-ohafia-earth-400 dark:text-ohafia-sand-500' : 'text-ohafia-earth-800 dark:text-ohafia-sand-100'}`}>
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500">
                            {lesson.estimated_minutes || 10} min
                          </span>
                          <span className="text-xs text-ohafia-primary-500 font-medium">
                            +{lesson.xp_reward || 10} XP
                          </span>
                          {lessonProgress > 0 && !isCompleted && (
                            <span className="text-xs text-ohafia-secondary-500 font-medium">
                              {lessonProgress}% done
                            </span>
                          )}
                        </div>
                      </div>
                      {!isLocked && (
                        <ChevronRight className="w-5 h-5 text-ohafia-earth-300" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-ohafia-sand-100 dark:bg-ohafia-earth-700 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-ohafia-earth-300 dark:text-ohafia-sand-400" />
              </div>
              <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">No lessons yet</h3>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
                Course lessons are being prepared. In the meantime, explore the vocabulary above!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
