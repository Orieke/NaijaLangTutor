import { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  X,
  Mail,
  User,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Feedback {
  id: string;
  user_id: string | null;
  type: 'feedback' | 'feature' | 'bug' | 'other';
  title: string;
  description: string;
  email: string | null;
  status: 'new' | 'reviewed' | 'in-progress' | 'resolved' | 'closed';
  admin_notes: string | null;
  user_agent: string | null;
  app_version: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

const typeConfig = {
  feedback: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Feedback' },
  feature: { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Feature Request' },
  bug: { icon: Bug, color: 'text-red-600', bg: 'bg-red-100', label: 'Bug Report' },
  other: { icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Other' },
};

const statusConfig = {
  new: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'New' },
  reviewed: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Reviewed' },
  'in-progress': { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-100', label: 'In Progress' },
  resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Resolved' },
  closed: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Closed' },
};

export function FeedbackManagementPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let query = supabase
        .from('feedback')
        .select(`
          *,
          profiles:user_id (
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching feedback:', error);
        if (error.code === '42P01') {
          setFetchError('The feedback table has not been created yet. Please run the create-feedback-table.sql migration in Supabase.');
        } else if (error.message?.includes('relationship') || error.message?.includes('schema cache')) {
          setFetchError(`Database relationship error: ${error.message}. You may need to update the foreign key on the feedback table to reference profiles instead of auth.users.`);
        } else {
          setFetchError(`Failed to load feedback: ${error.message}`);
        }
        return;
      }
      setFeedbackList(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFetchError('An unexpected error occurred while loading feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filterType, filterStatus]);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes || selectedFeedback?.admin_notes 
        })
        .eq('id', feedbackId);

      if (error) throw error;

      // Update local state
      setFeedbackList(prev => 
        prev.map(f => f.id === feedbackId ? { ...f, status: newStatus as Feedback['status'], admin_notes: adminNotes || f.admin_notes } : f)
      );
      
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback(prev => prev ? { ...prev, status: newStatus as Feedback['status'], admin_notes: adminNotes || prev.admin_notes } : null);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFeedback) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      setFeedbackList(prev => 
        prev.map(f => f.id === selectedFeedback.id ? { ...f, admin_notes: adminNotes } : f)
      );
      setSelectedFeedback(prev => prev ? { ...prev, admin_notes: adminNotes } : null);
      
      alert('Notes saved!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const openFeedbackDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
  };

  // Stats
  const stats = {
    total: feedbackList.length,
    new: feedbackList.filter(f => f.status === 'new').length,
    inProgress: feedbackList.filter(f => f.status === 'in-progress').length,
    resolved: feedbackList.filter(f => f.status === 'resolved').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">Feedback Management</h1>
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">Review and respond to user feedback and feature requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">Total</p>
          <p className="text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">{stats.total}</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-sm text-blue-600">New</p>
          <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
        </div>
        <div className="card p-4 border-l-4 border-purple-500">
          <p className="text-sm text-purple-600">In Progress</p>
          <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-sm text-green-600">Resolved</p>
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ohafia-earth-500 dark:text-ohafia-sand-400" />
            <span className="text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-200">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field py-1.5 text-sm"
            >
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button
            onClick={fetchFeedback}
            className="btn-ghost text-sm py-1.5 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="card divide-y divide-ohafia-sand-100 dark:divide-ohafia-earth-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-ohafia-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-ohafia-earth-500 dark:text-ohafia-sand-400">Loading feedback...</p>
          </div>
        ) : fetchError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">Error Loading Feedback</h3>
            <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400 mb-4">{fetchError}</p>
            <button onClick={fetchFeedback} className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-ohafia-sand-300 dark:text-ohafia-sand-600 mx-auto mb-4" />
            <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-2">No Feedback Found</h3>
            <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
              {filterType !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No feedback has been submitted yet. Users can submit feedback from their Profile page.'}
            </p>
          </div>
        ) : (
          feedbackList.map((feedback) => {
            const typeInfo = typeConfig[feedback.type];
            const statusInfo = statusConfig[feedback.status];
            const TypeIcon = typeInfo.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <button
                key={feedback.id}
                onClick={() => openFeedbackDetail(feedback)}
                className="w-full p-4 hover:bg-ohafia-sand-50 dark:hover:bg-ohafia-earth-700 transition-colors text-left flex items-start gap-4"
              >
                <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                  <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 truncate">
                      {feedback.title}
                    </h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 line-clamp-2 mb-2">
                    {feedback.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {feedback.profiles?.display_name || feedback.email || 'Anonymous'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(feedback.created_at)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-ohafia-earth-300 dark:text-ohafia-sand-500 shrink-0 mt-2" />
              </button>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-ohafia-earth-800 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const typeInfo = typeConfig[selectedFeedback.type];
                  const TypeIcon = typeInfo.icon;
                  return (
                    <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                      <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50">{selectedFeedback.title}</h2>
                  <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{typeConfig[selectedFeedback.type].label}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 rounded-lg"
              >
                <X className="w-5 h-5 text-ohafia-earth-500 dark:text-ohafia-sand-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const StatusIcon = config.icon;
                    const isActive = selectedFeedback.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedFeedback.id, status)}
                        disabled={isSaving}
                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                          ${isActive 
                            ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current` 
                            : 'bg-ohafia-sand-100 dark:bg-ohafia-earth-700 text-ohafia-earth-600 dark:text-ohafia-sand-300 hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-600'}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Description</label>
                <div className="p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-700 rounded-xl text-ohafia-earth-800 dark:text-ohafia-sand-200 whitespace-pre-wrap">
                  {selectedFeedback.description}
                </div>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Submitted By</label>
                  <div className="flex items-center gap-2 text-ohafia-earth-600 dark:text-ohafia-sand-300">
                    <User className="w-4 h-4" />
                    <span>{selectedFeedback.profiles?.display_name || 'Anonymous'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Contact Email</label>
                  <div className="flex items-center gap-2 text-ohafia-earth-600 dark:text-ohafia-sand-300">
                    <Mail className="w-4 h-4" />
                    <span>{selectedFeedback.email || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Created</label>
                  <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">{formatDate(selectedFeedback.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Last Updated</label>
                  <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300">{formatDate(selectedFeedback.updated_at)}</p>
                </div>
              </div>

              {/* App Info */}
              {(selectedFeedback.app_version || selectedFeedback.user_agent) && (
                <div>
                  <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">App Info</label>
                  <div className="p-3 bg-ohafia-sand-50 dark:bg-ohafia-earth-700 rounded-lg text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300 space-y-1">
                    {selectedFeedback.app_version && (
                      <p>Version: {selectedFeedback.app_version}</p>
                    )}
                    {selectedFeedback.user_agent && (
                      <p className="text-xs break-all">User Agent: {selectedFeedback.user_agent}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this feedback..."
                  className="input-field w-full h-24 resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="btn-secondary mt-2"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
