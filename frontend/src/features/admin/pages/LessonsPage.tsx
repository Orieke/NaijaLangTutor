import { useEffect, useState } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  GripVertical,
  BookOpen,
  MoreVertical
} from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';

export function LessonsPage() {
  const { lessons, fetchLessons, createLesson, updateLesson, deleteLesson, isLoading } = useAdminStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
  });
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLesson) {
      await updateLesson(editingLesson, formData);
    } else {
      await createLesson({
        ...formData,
        order_index: lessons.length,
        is_published: false,
      });
    }
    
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (lesson: typeof lessons[0]) => {
    setEditingLesson(lesson.id);
    const diff = lesson.difficulty || 'beginner';
    const validDiff = ['beginner', 'intermediate', 'advanced'].includes(diff) ? diff as 'beginner' | 'intermediate' | 'advanced' : 'beginner';
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      category: lesson.category || '',
      difficulty: validDiff,
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      await deleteLesson(id);
    }
    setOpenMenu(null);
  };

  const resetForm = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      difficulty: 'beginner',
    });
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-ohafia-sand-50 mb-2">Lesson Management</h1>
          <p className="text-gray-600 dark:text-ohafia-sand-300">
            Create and organize the learning curriculum
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lesson
        </button>
      </header>

      {isLoading ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-8 text-center">
          <div className="w-8 h-8 border-4 border-ohafia-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-ohafia-sand-400 mt-4">Loading lessons...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-ohafia-earth-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-2">No lessons yet</h2>
          <p className="text-gray-500 dark:text-ohafia-sand-400 mb-4">Create your first lesson to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Create Lesson
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div 
              key={lesson.id}
              className="bg-white dark:bg-ohafia-earth-800 rounded-xl border border-gray-200 dark:border-ohafia-earth-700 p-4 flex items-center gap-4"
            >
              <button className="p-1 cursor-grab text-gray-400 dark:text-ohafia-sand-500 hover:text-gray-600 dark:hover:text-ohafia-sand-300">
                <GripVertical className="w-5 h-5" />
              </button>
              
              <span className="w-8 h-8 rounded-lg bg-ohafia-primary/10 dark:bg-ohafia-primary/20 flex items-center justify-center text-sm font-medium text-ohafia-primary">
                {index + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-ohafia-sand-50">{lesson.title}</p>
                  {lesson.is_published ? (
                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-ohafia-earth-700 text-gray-600 dark:text-ohafia-sand-400 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-ohafia-sand-400 truncate">{lesson.description}</p>
              </div>

              <div className="flex items-center gap-3">
                {lesson.difficulty && (
                  <span className={`px-2 py-1 text-xs rounded-full ${difficultyColors[lesson.difficulty]}`}>
                    {lesson.difficulty}
                  </span>
                )}
                
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === lesson.id ? null : lesson.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-ohafia-earth-700 rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500 dark:text-ohafia-sand-400" />
                  </button>

                  {openMenu === lesson.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-ohafia-earth-800 rounded-xl shadow-lg border border-gray-200 dark:border-ohafia-earth-700 py-1 z-10">
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-ohafia-sand-200 hover:bg-gray-50 dark:hover:bg-ohafia-earth-700 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ohafia-earth-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-ohafia-sand-50 mb-4">
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-700 text-gray-900 dark:text-ohafia-sand-100 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                  placeholder="e.g., Greetings & Introductions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-700 text-gray-900 dark:text-ohafia-sand-100 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                  placeholder="What will learners gain from this lesson?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-700 text-gray-900 dark:text-ohafia-sand-100 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                  placeholder="e.g., Basics, Culture, Grammar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ohafia-sand-200 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-ohafia-earth-600 bg-white dark:bg-ohafia-earth-700 text-gray-900 dark:text-ohafia-sand-100 focus:outline-none focus:ring-2 focus:ring-ohafia-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.title.trim() || isLoading}
                  className="btn-primary flex-1"
                >
                  {editingLesson ? 'Save Changes' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
