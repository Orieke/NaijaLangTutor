import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  User,
  Calendar,
  BookOpen,
  Target,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  user: {
    display_name: string | null;
    proficiency_level: string | null;
    created_at: string;
    streak_count: number;
    total_xp: number;
  };
}

interface UserStats {
  totalAttempts: number;
  correctAttempts: number;
  lessonsCompleted: number;
  daysActive: number;
}

export function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('role_requests')
        .select(`
          *,
          user:profiles!role_requests_user_id_fkey (
            display_name,
            proficiency_level,
            created_at,
            streak_count,
            total_xp
          )
        `)
        .order('created_at', { ascending: false });
      
      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setRequests(data || []);
    } catch (err: any) {
      console.error('Error fetching role requests:', err);
      setError(err?.message || 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserStats(userId: string) {
    if (userStats[userId]) return; // Already fetched
    
    try {
      // Get attempt stats
      const { data: attempts, error: attemptsError } = await supabase
        .from('attempts')
        .select('is_correct, created_at')
        .eq('user_id', userId);
      
      if (attemptsError) throw attemptsError;
      
      // Get completed lessons
      const { data: progress, error: progressError } = await supabase
        .from('progress')
        .select('is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true);
      
      if (progressError) throw progressError;
      
      // Calculate unique days active
      const uniqueDays = new Set(
        (attempts || []).map(a => new Date(a.created_at).toDateString())
      ).size;
      
      setUserStats(prev => ({
        ...prev,
        [userId]: {
          totalAttempts: attempts?.length || 0,
          correctAttempts: attempts?.filter(a => a.is_correct).length || 0,
          lessonsCompleted: progress?.length || 0,
          daysActive: uniqueDays,
        }
      }));
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  }

  async function handleApprove(requestId: string) {
    setProcessingId(requestId);
    
    try {
      const { data, error } = await supabase.rpc('approve_role_request', {
        request_id: requestId,
        admin_notes: reviewNotes[requestId] || null
      });
      
      if (error) throw error;
      
      // Check the response
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to approve request');
      }
      
      // Refresh the list
      await fetchRequests();
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert('Failed to approve request: ' + (err?.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(requestId: string) {
    if (!reviewNotes[requestId]?.trim()) {
      alert('Please provide a reason for declining');
      return;
    }
    
    setProcessingId(requestId);
    
    try {
      const { data, error } = await supabase.rpc('decline_role_request', {
        request_id: requestId,
        admin_notes: reviewNotes[requestId]
      });
      
      if (error) throw error;
      
      // Check the response
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to decline request');
      }
      
      // Refresh the list
      await fetchRequests();
    } catch (err: any) {
      console.error('Error declining request:', err);
      alert('Failed to decline request: ' + (err?.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  }

  function toggleExpand(requestId: string, userId: string) {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(requestId);
      fetchUserStats(userId);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-ohafia-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-400">{error}</p>
        <button onClick={fetchRequests} className="mt-4 btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">Role Requests</h1>
          <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400">Review contributor access requests</p>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-ohafia-primary-500 text-white'
                : 'bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-ohafia-primary-500 text-white'
                : 'bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-600'
            }`}
          >
            All Requests
          </button>
        </div>
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="card p-8 text-center">
          <UserPlus className="w-12 h-12 text-ohafia-earth-300 dark:text-ohafia-sand-600 mx-auto mb-4" />
          <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400">
            {filter === 'pending' ? 'No pending requests' : 'No requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="card overflow-hidden">
              {/* Request header */}
              <button
                onClick={() => toggleExpand(request.id, request.user_id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-ohafia-sand-50 dark:hover:bg-ohafia-earth-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-ohafia-primary-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-ohafia-primary-600" />
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                      {request.user?.display_name || 'Unknown User'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'pending' 
                        ? 'bg-amber-100 text-amber-700'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
                    Requested {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {expandedRequest === request.id ? (
                  <ChevronUp className="w-5 h-5 text-ohafia-earth-400 dark:text-ohafia-sand-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-ohafia-earth-400 dark:text-ohafia-sand-500" />
                )}
              </button>
              
              {/* Expanded details */}
              {expandedRequest === request.id && (
                <div className="border-t border-ohafia-sand-200 dark:border-ohafia-earth-700 p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-800/50">
                  {/* User stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-3 text-center">
                      <Target className="w-5 h-5 text-ohafia-primary-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                        {userStats[request.user_id]?.totalAttempts || 0}
                      </p>
                      <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Total Attempts</p>
                    </div>
                    <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-3 text-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                        {userStats[request.user_id]?.totalAttempts 
                          ? Math.round((userStats[request.user_id].correctAttempts / userStats[request.user_id].totalAttempts) * 100)
                          : 0}%
                      </p>
                      <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Accuracy</p>
                    </div>
                    <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-3 text-center">
                      <BookOpen className="w-5 h-5 text-ohafia-secondary-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                        {userStats[request.user_id]?.lessonsCompleted || 0}
                      </p>
                      <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Lessons Done</p>
                    </div>
                    <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-3 text-center">
                      <Calendar className="w-5 h-5 text-ohafia-accent-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">
                        {userStats[request.user_id]?.daysActive || 0}
                      </p>
                      <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Days Active</p>
                    </div>
                  </div>
                  
                  {/* User info */}
                  <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">User Info</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-ohafia-earth-500 dark:text-ohafia-sand-400">Level:</span>{' '}
                        <span className="font-medium dark:text-ohafia-sand-200">{request.user?.proficiency_level || 'beginner'}</span>
                      </div>
                      <div>
                        <span className="text-ohafia-earth-500 dark:text-ohafia-sand-400">XP:</span>{' '}
                        <span className="font-medium dark:text-ohafia-sand-200">{request.user?.total_xp || 0}</span>
                      </div>
                      <div>
                        <span className="text-ohafia-earth-500 dark:text-ohafia-sand-400">Streak:</span>{' '}
                        <span className="font-medium dark:text-ohafia-sand-200">{request.user?.streak_count || 0} days</span>
                      </div>
                      <div>
                        <span className="text-ohafia-earth-500 dark:text-ohafia-sand-400">Joined:</span>{' '}
                        <span className="font-medium dark:text-ohafia-sand-200">
                          {request.user?.created_at 
                            ? new Date(request.user.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Request reason */}
                  <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">Request Reason</h4>
                    <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">{request.reason}</p>
                  </div>
                  
                  {/* Actions for pending requests */}
                  {request.status === 'pending' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-1">
                          Review Notes (required for decline)
                        </label>
                        <textarea
                          value={reviewNotes[request.id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          placeholder="Add notes about your decision..."
                          className="input-field min-h-[80px] resize-none"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDecline(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 btn-ghost text-red-600 hover:bg-red-50"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Decline
                        </button>
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 btn-primary"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show review notes for processed requests */}
                  {request.status !== 'pending' && request.review_notes && (
                    <div className="bg-white dark:bg-ohafia-earth-800 rounded-lg p-4">
                      <h4 className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">Admin Notes</h4>
                      <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">{request.review_notes}</p>
                      {request.reviewed_at && (
                        <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500 mt-2">
                          Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
