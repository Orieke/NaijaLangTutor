import { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Play,
  Pause,
  Volume2,
  Clock,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Asset, Audio } from '@/types/database';

export function ReviewQueuePage() {
  const { user } = useAuthStore();
  const { reviewQueue, fetchReviewQueue, approveItem, rejectItem, isLoading } = useAdminStore();
  
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchReviewQueue();
  }, [fetchReviewQueue]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleApprove = async (id: string, type: 'asset' | 'audio') => {
    if (!user) return;
    await approveItem(id, type, user.id);
    setSelectedItem(null);
  };

  const handleReject = async () => {
    if (!user || !selectedItem || !rejectReason.trim()) return;
    const item = reviewQueue.find(i => i.id === selectedItem);
    if (!item) return;
    
    await rejectItem(selectedItem, item.type, user.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedItem(null);
  };

  const openRejectModal = (id: string) => {
    setSelectedItem(id);
    setShowRejectModal(true);
  };

  const playAudio = async (audioItem: Audio) => {
    try {
      // Stop currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // If clicking the same audio, just stop it
      if (playingAudioId === audioItem.id) {
        setPlayingAudioId(null);
        return;
      }

      setPlayingAudioId(audioItem.id);

      const audio = new window.Audio(audioItem.audio_url);
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50 mb-2">Review Queue</h1>
        <p className="text-gray-600 dark:text-ohafia-sand-300">
          Review and approve community contributions
        </p>
      </header>

      {isLoading ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-8 text-center">
          <div className="w-8 h-8 border-4 border-ohafia-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-ohafia-sand-400 mt-4">Loading queue...</p>
        </div>
      ) : reviewQueue.length === 0 ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-2">All caught up!</h2>
          <p className="text-gray-500 dark:text-ohafia-sand-400">No items pending review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewQueue.map(item => {
            const asset = item.type === 'asset' ? item.item as Asset : null;
            
            return (
              <div 
                key={item.id}
                className={`bg-white dark:bg-ohafia-earth-800 rounded-xl border transition-all
                  ${selectedItem === item.id 
                    ? 'border-ohafia-primary shadow-lg' 
                    : 'border-gray-200 dark:border-ohafia-earth-700 hover:border-gray-300 dark:hover:border-ohafia-earth-600'}`}
              >
                <button
                  onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                      ${item.type === 'asset' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      {item.type === 'asset' ? (
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">
                        {asset ? asset.igbo_text : 'Audio Recording'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-ohafia-sand-400">
                        {asset ? asset.english_text : 'Pronunciation recording'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-ohafia-sand-400">
                      <Clock className="w-4 h-4" />
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className={`w-5 h-5 text-gray-400 dark:text-ohafia-sand-500 transition-transform
                      ${selectedItem === item.id ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {selectedItem === item.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-ohafia-earth-700">
                    <div className="py-4">
                      {item.type === 'asset' && asset && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 mb-1">Igbo Text</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-ohafia-sand-50">{asset.igbo_text}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 mb-1">English Translation</p>
                            <p className="text-lg text-gray-900 dark:text-ohafia-sand-100">{asset.english_text}</p>
                          </div>
                          {asset.pronunciation_guide && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 mb-1">Pronunciation</p>
                              <p className="text-gray-900 dark:text-ohafia-sand-100 italic">/{asset.pronunciation_guide}/</p>
                            </div>
                          )}
                          {asset.cultural_note && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 mb-1">Cultural Note</p>
                              <p className="text-gray-900 dark:text-ohafia-sand-100">{asset.cultural_note}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === 'audio' && (
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => playAudio(item.item as Audio)}
                            className={`btn-secondary flex items-center gap-2 ${
                              playingAudioId === item.id ? 'bg-ohafia-primary-100 border-ohafia-primary-500' : ''
                            }`}
                          >
                            {playingAudioId === item.id ? (
                              <>
                                <Pause className="w-4 h-4" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Play Audio
                              </>
                            )}
                          </button>
                          <span className="text-sm text-gray-500 dark:text-ohafia-sand-400">
                            Audio submission for review
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-ohafia-earth-700">
                      <button
                        onClick={() => handleApprove(item.id, item.type)}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(item.id)}
                        className="btn-secondary flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-4">
              Reject Submission
            </h3>
            <p className="text-gray-600 dark:text-ohafia-sand-300 mb-4">
              Please provide a reason for rejection to help the contributor improve.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 dark:bg-ohafia-earth-900 dark:text-ohafia-sand-50 focus:outline-none focus:ring-2 focus:ring-ohafia-primary focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isLoading}
                className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
