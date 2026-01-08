import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, Play, RotateCcw, Volume2, Check, X, Loader2, ArrowLeft, AlertCircle, Square, BookOpen, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useAudioPlayer } from '@/lib/audio-service';
import type { Asset, Lesson } from '@/types/database';

type PracticeMode = 'speak' | 'listen' | 'flashcard';

interface PracticeWord {
  id: string;
  igbo: string;
  english: string;
  audioUrl: string;
}

interface LessonWithAssetCount extends Lesson {
  assetCount: number;
}

export function PracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { speak, stop, isPlaying: ttsSpeaking } = useAudioPlayer();
  const lessonId = searchParams.get('lesson');

  const [mode, setMode] = useState<PracticeMode>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  // Data fetching state
  const [practiceWords, setPracticeWords] = useState<PracticeWord[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // Available lessons for selection
  const [availableLessons, setAvailableLessons] = useState<LessonWithAssetCount[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  // Fetch available lessons when no lesson is selected
  useEffect(() => {
    async function fetchAvailableLessons() {
      if (lessonId) return; // Don't fetch if we already have a lesson
      
      setIsLoadingLessons(true);
      try {
        // Fetch lessons with their asset counts
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Get asset counts for each lesson
        const lessonsWithCounts: LessonWithAssetCount[] = await Promise.all(
          (lessons || []).map(async (lesson) => {
            const { count } = await supabase
              .from('assets')
              .select('id', { count: 'exact', head: true })
              .eq('lesson_id', lesson.id)
              .in('status', ['approved', 'pending']);
            
            return {
              ...lesson,
              assetCount: count || 0,
            };
          })
        );

        // Filter to only lessons with vocabulary
        setAvailableLessons(lessonsWithCounts.filter(l => l.assetCount > 0));
      } catch (err) {
        console.error('Error fetching lessons:', err);
      } finally {
        setIsLoadingLessons(false);
        setIsLoading(false);
      }
    }

    fetchAvailableLessons();
  }, [lessonId]);

  // Fetch lesson and assets from database
  useEffect(() => {
    async function fetchPracticeContent() {
      if (!lessonId) {
        setError('No lesson selected');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch lesson info
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        setLesson(lessonData);

        // Fetch assets for this lesson with audio submissions
        const { data: assetsData, error: assetsError } = await supabase
          .from('assets')
          .select(`
            *,
            audio_submissions (audio_url, status)
          `)
          .eq('lesson_id', lessonId)
          .in('status', ['approved', 'pending'])
          .order('created_at', { ascending: true });

        if (assetsError) throw assetsError;

        // Transform assets to practice words, including audio from submissions
        const words: PracticeWord[] = (assetsData || []).map((asset: Asset & { audio_submissions?: { audio_url: string; status: string }[] }) => {
          // Check for audio from submissions if asset doesn't have audio_url
          let audioUrl = asset.audio_url || '';
          if (!audioUrl && asset.audio_submissions?.length) {
            const approvedAudio = asset.audio_submissions.find(s => s.status === 'approved');
            const pendingAudio = asset.audio_submissions.find(s => s.status === 'pending');
            audioUrl = (approvedAudio || pendingAudio)?.audio_url || '';
          }
          return {
            id: asset.id,
            igbo: asset.igbo_text,
            english: asset.english_text,
            audioUrl,
          };
        }).filter(word => word.igbo && word.english);

        if (words.length === 0) {
          setError('No vocabulary found for this lesson');
        }

        setPracticeWords(words);
        console.log('Practice words loaded:', words);
      } catch (err) {
        console.error('Error fetching practice content:', err);
        setError('Failed to load practice content');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPracticeContent();
  }, [lessonId]);

  const currentWord = practiceWords[currentIndex] || { id: '', igbo: '', english: '', audioUrl: '' };
  const progress = practiceWords.length > 0 ? ((currentIndex + 1) / practiceWords.length) * 100 : 0;

  const handleNext = () => {
    console.log('Next clicked, currentIndex:', currentIndex, 'total:', practiceWords.length);
    // Clean up recorded audio when moving to next word
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    if (currentIndex < practiceWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setFeedback(null);
    } else {
      // Practice complete - save progress
      handlePracticeComplete();
    }
  };

  const handlePrevious = () => {
    console.log('Previous clicked, currentIndex:', currentIndex);
    // Clean up recorded audio when moving to previous word
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
      setFeedback(null);
    }
  };

  const handlePracticeComplete = async () => {
    if (!user || !lessonId) return;

    const accuracy = practiceWords.length > 0 
      ? Math.round((correctCount / practiceWords.length) * 100) 
      : 0;

    try {
      // Save or update progress
      const { error: progressError } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          accuracy_rate: accuracy,
          completed_assets: practiceWords.map(w => w.id),
          last_practiced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (progressError) {
        console.error('Error saving progress:', progressError);
      }

      // Navigate to completion screen or back to learn
      navigate('/learn', { 
        state: { 
          completed: true, 
          lessonId, 
          accuracy,
          lessonTitle: lesson?.title 
        } 
      });
    } catch (err) {
      console.error('Error completing practice:', err);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        // Clear previous recording
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
          setRecordedAudioUrl(null);
        }
        recordedChunksRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error starting recording:', err);
        setError('Could not access microphone. Please allow microphone access.');
      }
    }
  };

  const handlePlayAudio = async () => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stop(); // Stop TTS if playing

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    // Try to play recorded audio first, then asset audio, then TTS
    const audioToPlay = currentWord.audioUrl;

    if (audioToPlay) {
      try {
        const audio = new Audio(audioToPlay);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          // Fallback to TTS if audio fails
          console.log('Audio playback failed, using TTS');
          speakWithTTS();
        };
        await audio.play();
      } catch (err) {
        console.error('Error playing audio:', err);
        speakWithTTS();
      }
    } else {
      // No audio URL, use TTS
      speakWithTTS();
    }
  };

  const speakWithTTS = () => {
    speak(currentWord.igbo, {
      rate: 0.8,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const playRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(recordedAudioUrl);
    audioRef.current = audio;
    audio.onended = () => {
      audioRef.current = null;
    };
    audio.play();
  };

  const handleAnswer = (correct: boolean) => {
    setFeedback(correct ? 'correct' : 'incorrect');
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
    setTimeout(() => {
      if (currentIndex < practiceWords.length - 1) {
        handleNext();
      } else {
        handlePracticeComplete();
      }
    }, 1000);
  };

  // Loading state
  if (isLoading || isLoadingLessons) {
    return (
      <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ohafia-primary-600 mx-auto mb-4" />
          <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">Loading practice...</p>
        </div>
      </div>
    );
  }

  // No lesson selected - show lesson selector
  if (!lessonId) {
    return (
      <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900">
        {/* Header */}
        <header className="bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 -ml-2 rounded-lg hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
              Practice
            </h1>
          </div>
        </header>

        <div className="p-6 max-w-2xl mx-auto">
          {/* Welcome section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-ohafia-primary-600 dark:text-ohafia-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">
              Choose a Lesson to Practice
            </h2>
            <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">
              Select a lesson below to start practicing vocabulary with flashcards, speaking, and listening exercises.
            </p>
          </div>

          {/* Lesson list */}
          {availableLessons.length > 0 ? (
            <div className="space-y-3">
              {availableLessons.map((lessonItem) => (
                <button
                  key={lessonItem.id}
                  onClick={() => setSearchParams({ lesson: lessonItem.id })}
                  className="w-full bg-white dark:bg-ohafia-earth-800 rounded-2xl p-4 border border-ohafia-sand-200 dark:border-ohafia-earth-700 hover:border-ohafia-primary-300 dark:hover:border-ohafia-primary-600 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-ohafia-primary-600 dark:text-ohafia-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 group-hover:text-ohafia-primary-600 dark:group-hover:text-ohafia-primary-400 transition-colors">
                        {lessonItem.title}
                      </h3>
                      <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 truncate">
                        {lessonItem.description || `${lessonItem.assetCount} words to practice`}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300">
                          {lessonItem.assetCount} words
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ohafia-secondary-100 dark:bg-ohafia-secondary-900/30 text-ohafia-secondary-700 dark:text-ohafia-secondary-400 capitalize">
                          {lessonItem.difficulty || 'beginner'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-ohafia-earth-400 dark:text-ohafia-sand-500 group-hover:text-ohafia-primary-600 dark:group-hover:text-ohafia-primary-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-ohafia-earth-400 dark:text-ohafia-sand-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">
                No Lessons Available Yet
              </h3>
              <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-6">
                There are no lessons with vocabulary to practice at the moment.
              </p>
              <button
                onClick={() => navigate('/learn')}
                className="btn-primary"
              >
                Explore Lessons
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lesson selected but no vocabulary - show error with option to select another
  if (error || practiceWords.length === 0) {
    return (
      <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900">
        {/* Header */}
        <header className="bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchParams({})}
              className="p-2 -ml-2 rounded-lg hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
              Practice
            </h1>
          </div>
        </header>

        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-ohafia-sand-100 dark:bg-ohafia-earth-700 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-ohafia-earth-400 dark:text-ohafia-sand-500" />
            </div>
            <h2 className="text-xl font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">
              {lesson?.title ? `"${lesson.title}" has no vocabulary yet` : 'No vocabulary available'}
            </h2>
            <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-8">
              This lesson doesn't have any vocabulary to practice. Try selecting a different lesson.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setSearchParams({})}
                className="btn-primary w-full"
              >
                Choose Another Lesson
              </button>
              <button
                onClick={() => navigate('/learn')}
                className="btn-outline w-full"
              >
                Browse All Lessons
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/learn')}
            className="p-2 -ml-2 rounded-lg hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
              {lesson?.title || 'Practice'}
            </h1>
            <span className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
              {currentIndex + 1} of {practiceWords.length} words
            </span>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </header>

      {/* Mode selector */}
      <div className="px-6 py-4">
        <div className="flex bg-ohafia-sand-200 dark:bg-ohafia-earth-700 rounded-xl p-1">
          {(['speak', 'listen', 'flashcard'] as PracticeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${mode === m 
                  ? 'bg-white dark:bg-ohafia-earth-600 text-ohafia-primary-600 dark:text-ohafia-primary-300 shadow-sm' 
                  : 'text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:text-ohafia-earth-800 dark:hover:text-ohafia-sand-100'}`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main practice area */}
      <main className="flex-1 px-6 pb-6 flex flex-col">
        {/* Word card */}
        <div className={`card flex-1 flex flex-col items-center justify-center p-8 mb-6 transition-colors duration-300
          ${feedback === 'correct' ? 'bg-ohafia-secondary-50 border-ohafia-secondary-300' : ''}
          ${feedback === 'incorrect' ? 'bg-red-50 border-red-300' : ''}`}
        >
          {mode === 'speak' && (
            <>
              <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400 text-sm mb-2">Say this word:</p>
              <h2 className="text-4xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 igbo-text mb-4">
                {currentWord.igbo}
              </h2>
              <p className="text-lg text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-8">{currentWord.english}</p>
              
              {/* Native audio player */}
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying || ttsSpeaking}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl mb-6 transition-colors
                  ${isPlaying || ttsSpeaking 
                    ? 'bg-ohafia-primary-100 text-ohafia-primary-700' 
                    : 'bg-ohafia-sand-100 text-ohafia-primary-600 hover:bg-ohafia-sand-200'}`}
              >
                {isPlaying || ttsSpeaking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Playing...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Listen to native speaker</span>
                  </>
                )}
              </button>

              {/* Recording button */}
              <button
                onClick={handleRecord}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg
                  ${isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-ohafia-primary-500 hover:bg-ohafia-primary-600'}`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 text-white" fill="white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-4">
                {isRecording ? 'Recording... Tap to stop' : 'Tap to record'}
              </p>

              {/* Play back recorded audio */}
              {recordedAudioUrl && !isRecording && (
                <button
                  onClick={playRecordedAudio}
                  className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-ohafia-secondary-100 text-ohafia-secondary-700 hover:bg-ohafia-secondary-200 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Play your recording</span>
                </button>
              )}
            </>
          )}

          {mode === 'listen' && (
            <>
              <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400 text-sm mb-4">Listen and identify:</p>
              
              {/* Audio play button */}
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying || ttsSpeaking}
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 transition-all shadow-lg
                  ${isPlaying || ttsSpeaking
                    ? 'bg-ohafia-primary-400'
                    : 'bg-ohafia-primary-500 hover:bg-ohafia-primary-600'}`}
              >
                {isPlaying || ttsSpeaking ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              {/* Answer options - show 4 options including the correct one */}
              <div className="w-full space-y-3">
                {(() => {
                  // Get up to 3 wrong answers and shuffle with correct answer
                  const otherWords = practiceWords.filter(w => w.id !== currentWord.id);
                  const wrongOptions = otherWords.slice(0, 3);
                  const allOptions = [...wrongOptions, currentWord].sort(() => Math.random() - 0.5);
                  return allOptions.map((word) => (
                    <button
                      key={word.id}
                      onClick={() => handleAnswer(word.id === currentWord.id)}
                      className="w-full p-4 card-interactive text-left"
                    >
                      <span className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">{word.english}</span>
                    </button>
                  ));
                })()}
              </div>
            </>
          )}

          {mode === 'flashcard' && (
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              {!showAnswer ? (
                <>
                  <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400 text-sm mb-4">What does this mean?</p>
                  <h2 className="text-4xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 igbo-text mb-4">
                    {currentWord.igbo}
                  </h2>
                  <p className="text-sm text-ohafia-earth-400 dark:text-ohafia-sand-500">Tap to reveal</p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 igbo-text mb-2">
                    {currentWord.igbo}
                  </h2>
                  <p className="text-2xl text-ohafia-primary-600 dark:text-ohafia-primary-400 mb-8">{currentWord.english}</p>
                  
                  {/* Self-assessment buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                      Again
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-ohafia-secondary-100 text-ohafia-secondary-700 font-medium hover:bg-ohafia-secondary-200 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      Got it
                    </button>
                  </div>
                </>
              )}
            </button>
          )}

          {/* Feedback overlay */}
          {feedback && (
            <div className={`absolute inset-0 flex items-center justify-center bg-opacity-90 rounded-2xl animate-scale-in
              ${feedback === 'correct' ? 'bg-ohafia-secondary-500' : 'bg-red-500'}`}
            >
              <div className="text-white text-center">
                {feedback === 'correct' ? (
                  <>
                    <Check className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-xl font-bold">Correct!</p>
                  </>
                ) : (
                  <>
                    <X className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-xl font-bold">Try again</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="btn-ghost px-6 py-3 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => { setCurrentIndex(0); setShowAnswer(false); setFeedback(null); }}
            className="p-3 rounded-xl text-ohafia-earth-500 dark:text-ohafia-sand-400 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-700"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="btn-primary px-6 py-3"
          >
            {currentIndex === practiceWords.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}
