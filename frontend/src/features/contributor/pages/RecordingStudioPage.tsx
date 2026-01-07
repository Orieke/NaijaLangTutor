import { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause,
  Upload,
  RotateCcw,
  Volume2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useContributorStore } from '@/stores/contributor-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';

interface RecordingState {
  isRecording: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
}

interface AssetForRecording {
  id: string;
  igbo_text: string;
  english_text: string;
  audio_url: string | null;
  has_audio_submission: boolean;
}

type FilterType = 'all' | 'with-audio' | 'without-audio';

export function RecordingStudioPage() {
  const { user } = useAuthStore();
  const { uploadAudio } = useContributorStore();

  const [assets, setAssets] = useState<AssetForRecording[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAsset, setSelectedAsset] = useState<AssetForRecording | null>(null);
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    audioUrl: null,
    audioBlob: null,
    duration: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Fetch approved assets with audio submission status
  useEffect(() => {
    async function fetchAssets() {
      setIsLoadingAssets(true);
      try {
        // Get approved assets with their audio submissions
        const { data, error } = await supabase
          .from('assets')
          .select(`
            id, igbo_text, english_text, audio_url,
            audio_submissions (id, audio_url, status)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Process to determine if asset has audio (from asset or submissions)
        const processedAssets = (data || []).map((asset: {
          id: string;
          igbo_text: string;
          english_text: string;
          audio_url: string | null;
          audio_submissions?: { id: string; audio_url: string; status: string }[];
        }) => {
          const hasSubmission = asset.audio_submissions && asset.audio_submissions.length > 0;
          const submissionUrl = hasSubmission ? asset.audio_submissions![0].audio_url : null;
          return {
            id: asset.id,
            igbo_text: asset.igbo_text,
            english_text: asset.english_text,
            audio_url: asset.audio_url || submissionUrl,
            has_audio_submission: !!(asset.audio_url || hasSubmission),
          };
        });

        setAssets(processedAssets);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets');
      } finally {
        setIsLoadingAssets(false);
      }
    }

    fetchAssets();
  }, []);

  useEffect(() => {
    return () => {
      if (recording.audioUrl) {
        URL.revokeObjectURL(recording.audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording.audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecording(prev => ({
          ...prev,
          isRecording: false,
          audioUrl: url,
          audioBlob: blob,
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(prev => ({ ...prev, isRecording: true, duration: 0 }));

      timerRef.current = window.setInterval(() => {
        setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } catch {
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording.isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (recording.audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (recording.audioUrl) {
      URL.revokeObjectURL(recording.audioUrl);
    }
    setRecording({
      isRecording: false,
      audioUrl: null,
      audioBlob: null,
      duration: 0,
    });
    setIsPlaying(false);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!recording.audioBlob || !selectedAsset || !user) {
      setError('Missing required data for upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    console.log('Starting upload...', {
      blobSize: recording.audioBlob.size,
      assetId: selectedAsset.id,
      userId: user.id,
    });

    try {
      const url = await uploadAudio(recording.audioBlob, selectedAsset.id, user.id);
      console.log('Upload result:', url);
      
      if (url) {
        setUploadSuccess(true);
        setTimeout(() => {
          resetRecording();
          setSelectedAsset(null);
        }, 2000);
      } else {
        // Get the error from the store
        const currentError = useContributorStore.getState().error;
        setError(currentError || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Computed metrics
  const totalAssets = assets.length;
  const withAudio = assets.filter(a => a.has_audio_submission).length;
  const withoutAudio = totalAssets - withAudio;

  // Filtered assets
  const filteredAssets = assets.filter(asset => {
    if (filter === 'with-audio') return asset.has_audio_submission;
    if (filter === 'without-audio') return !asset.has_audio_submission;
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">Recording Studio</h1>
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">
          Record audio pronunciations for learning assets
        </p>
      </header>

      {/* Metrics Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">{totalAssets}</p>
          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Total Assets</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{withAudio}</p>
          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">With Audio</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-ohafia-primary-500 dark:text-ohafia-primary-400">{withoutAudio}</p>
          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Need Recording</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Asset Selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-4">
            Select an Asset to Record
          </h2>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${filter === 'all'
                  ? 'bg-ohafia-primary-500 text-white'
                  : 'bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-600'}`}
            >
              All ({totalAssets})
            </button>
            <button
              onClick={() => setFilter('without-audio')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${filter === 'without-audio'
                  ? 'bg-ohafia-primary-500 text-white'
                  : 'bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-600'}`}
            >
              Need Recording ({withoutAudio})
            </button>
            <button
              onClick={() => setFilter('with-audio')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${filter === 'with-audio'
                  ? 'bg-ohafia-primary-500 text-white'
                  : 'bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-600'}`}
            >
              Has Audio ({withAudio})
            </button>
          </div>
          
          {isLoadingAssets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-ohafia-primary-500" />
              <span className="ml-2 text-ohafia-earth-500 dark:text-ohafia-sand-400">Loading assets...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-ohafia-earth-500 dark:text-ohafia-sand-400">
              <p>{filter === 'all' ? 'No approved assets available.' : `No assets ${filter === 'with-audio' ? 'with' : 'without'} audio.`}</p>
              <p className="text-sm mt-2">{filter === 'all' ? 'Assets need to be approved before recording.' : 'Try a different filter.'}</p>
            </div>
          ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  resetRecording();
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all
                  ${selectedAsset?.id === asset.id
                    ? 'border-ohafia-primary-500 bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30 ring-2 ring-ohafia-primary-500 ring-offset-1'
                    : 'border-ohafia-sand-300 dark:border-ohafia-earth-600 hover:border-ohafia-sand-400 dark:hover:border-ohafia-earth-500 bg-white dark:bg-ohafia-earth-800'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${selectedAsset?.id === asset.id ? 'text-ohafia-primary-700 dark:text-ohafia-primary-300' : 'text-ohafia-earth-900 dark:text-ohafia-sand-100'}`}>{asset.igbo_text}</p>
                    <p className={`text-sm ${selectedAsset?.id === asset.id ? 'text-ohafia-primary-600 dark:text-ohafia-primary-400' : 'text-ohafia-earth-500 dark:text-ohafia-sand-400'}`}>{asset.english_text}</p>
                  </div>
                  {asset.has_audio_submission ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <Volume2 className="w-4 h-4" />
                      Has audio
                    </span>
                  ) : (
                    <span className={`text-xs ${selectedAsset?.id === asset.id ? 'text-ohafia-primary-500 dark:text-ohafia-primary-400 font-medium' : 'text-ohafia-earth-400 dark:text-ohafia-sand-500'}`}>
                      Needs recording
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Recording Interface */}
        <div className="card p-6">
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-4">
            Recording
          </h2>

          {!selectedAsset ? (
            <div className="text-center py-12">
              <Mic className="w-12 h-12 text-ohafia-sand-300 dark:text-ohafia-earth-600 mx-auto mb-3" />
              <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400">
                Select an asset to start recording
              </p>
            </div>
          ) : (
            <>
              {/* Selected Asset Display */}
              <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-700 rounded-xl mb-6 text-center">
                <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-1">
                  {selectedAsset.igbo_text}
                </p>
                <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">{selectedAsset.english_text}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {uploadSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Recording uploaded successfully!
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex flex-col items-center">
                {/* Timer */}
                <div className="text-4xl font-mono text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-6">
                  {formatDuration(recording.duration)}
                </div>

                {/* Main Recording Button */}
                {!recording.audioUrl && (
                  <button
                    onClick={recording.isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg
                      ${recording.isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-ohafia-primary-500 hover:bg-ohafia-primary-600'}`}
                  >
                    {recording.isRecording ? (
                      <Square className="w-8 h-8 text-white" fill="white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>
                )}

                {/* Playback Controls */}
                {recording.audioUrl && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={isPlaying ? pauseRecording : playRecording}
                      className="w-16 h-16 rounded-full bg-ohafia-primary-500 hover:bg-ohafia-primary-600 flex items-center justify-center shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                      )}
                    </button>
                    <button
                      onClick={resetRecording}
                      className="w-12 h-12 rounded-full bg-ohafia-sand-200 dark:bg-ohafia-earth-600 hover:bg-ohafia-sand-300 dark:hover:bg-ohafia-earth-500 flex items-center justify-center"
                    >
                      <RotateCcw className="w-5 h-5 text-ohafia-earth-600 dark:text-ohafia-sand-300" />
                    </button>
                  </div>
                )}

                <audio
                  ref={audioRef}
                  src={recording.audioUrl || undefined}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Instructions */}
                <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-6 text-center">
                  {recording.isRecording
                    ? 'Recording... Click to stop'
                    : recording.audioUrl
                    ? 'Listen to your recording before uploading'
                    : 'Click the microphone to start recording'}
                </p>

                {/* Upload Button */}
                {recording.audioUrl && !uploadSuccess && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="btn-primary mt-6 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Recording'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recording Tips */}
      <div className="card p-6 mt-6 bg-gradient-to-r from-ohafia-sand-100 to-ohafia-sand-50 dark:from-ohafia-earth-800 dark:to-ohafia-earth-800">
        <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-3">Recording Tips</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">
          <div>
            <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-1">Environment</p>
            <p>Record in a quiet space without background noise or echo</p>
          </div>
          <div>
            <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-1">Pronunciation</p>
            <p>Speak clearly using authentic Ohafia dialect pronunciation</p>
          </div>
          <div>
            <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-1">Pacing</p>
            <p>Speak at a natural pace - not too fast or slow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
