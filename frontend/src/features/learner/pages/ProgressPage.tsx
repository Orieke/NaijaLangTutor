import { useState, useEffect } from 'react';
import { Flame, BookOpen, Mic, Headphones, Trophy, Target, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';

interface UserStats {
  totalXP: number;
  wordsLearned: number;
  lessonsCompleted: number;
  totalLessons: number;
  currentStreak: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

interface WeeklyActivity {
  day: string;
  date: string;
  attempts: number;
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
}

interface WeeklyStats {
  totalAttempts: number;
  correctAttempts: number;
  daysActive: number;
  lessonsPracticed?: number;
}

export function ProgressPage() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    wordsLearned: 0,
    lessonsCompleted: 0,
    totalLessons: 0,
    currentStreak: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0,
  });
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalAttempts: 0,
    correctAttempts: 0,
    daysActive: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchUserProgress();
    }
  }, [profile?.id]);

  async function fetchUserProgress() {
    if (!profile?.id) return;
    
    setIsLoading(true);
    
    try {
      // Fetch user profile stats including last_active_at
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp, streak_count, last_active_at, created_at')
        .eq('id', profile.id)
        .single();

      // Fetch all attempts for the user (include score to determine correctness)
      const { data: attempts, error: attemptsError } = await supabase
        .from('attempts')
        .select('id, is_correct, score, created_at, asset_id')
        .eq('user_id', profile.id);
      
      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
      }

      // Fetch progress records (lessons completed)
      const { data: progressRecords, error: progressError } = await supabase
        .from('progress')
        .select('lesson_id, is_completed, completed_assets, last_practiced_at')
        .eq('user_id', profile.id);
      
      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Fetch total lessons count
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true);

      // Calculate stats
      const totalAttempts = attempts?.length || 0;
      // Consider an attempt correct if is_correct is true OR score >= 70
      const correctAttempts = attempts?.filter(a => a.is_correct === true || (a.score !== null && a.score >= 70))?.length || 0;
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
      
      // Count unique assets learned from multiple sources:
      // 1. Assets with correct attempts (is_correct = true OR score >= 70)
      // 2. Assets in progress.completed_assets arrays
      const learnedAssetsSet = new Set<string>();
      
      // From attempts with correct answers
      attempts?.filter(a => a.is_correct === true || (a.score !== null && a.score >= 70))
        .forEach(a => learnedAssetsSet.add(a.asset_id));
      
      // From progress completed_assets arrays
      progressRecords?.forEach(p => {
        if (p.completed_assets && Array.isArray(p.completed_assets)) {
          p.completed_assets.forEach((assetId: string) => learnedAssetsSet.add(assetId));
        }
      });
      
      const uniqueAssetsLearned = learnedAssetsSet.size;

      // Count completed lessons
      const lessonsCompleted = progressRecords?.filter(p => p.is_completed)?.length || 0;
      
      console.log('Progress Debug:', {
        totalAttempts,
        correctAttempts,
        uniqueAssetsLearned,
        lessonsCompleted,
        attemptsData: attempts?.slice(0, 3),
        progressData: progressRecords?.slice(0, 3),
      });

      setStats({
        totalXP: profileData?.total_xp || 0,
        wordsLearned: uniqueAssetsLearned,
        lessonsCompleted,
        totalLessons: totalLessons || 0,
        currentStreak: profileData?.streak_count || 0,
        totalAttempts,
        correctAttempts,
        accuracy,
      });

      // Calculate weekly activity from multiple sources:
      // 1. Attempts (practice exercises)
      // 2. Progress records (last_practiced_at - lesson practice)
      const today = new Date();
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekActivity: WeeklyActivity[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Get start and end of the day for comparison
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Count attempts on this day
        const dayAttempts = attempts?.filter(a => {
          const attemptDate = new Date(a.created_at);
          return attemptDate >= dayStart && attemptDate <= dayEnd;
        })?.length || 0;
        
        // Check if user practiced any lessons on this day
        const dayPracticed = progressRecords?.some(p => {
          if (!p.last_practiced_at) return false;
          const practiceDate = new Date(p.last_practiced_at);
          return practiceDate >= dayStart && practiceDate <= dayEnd;
        }) || false;
        
        // Day is active if there were attempts OR lesson practice
        const hasActivity = dayAttempts > 0 || dayPracticed;
        
        weekActivity.push({
          day: weekDays[date.getDay()],
          date: date.toISOString().split('T')[0],
          attempts: dayAttempts,
          completed: hasActivity,
        });
      }
      
      console.log('Weekly Activity Debug:', {
        weekActivity,
        profileLastActive: profileData?.last_active_at,
        progressRecords: progressRecords?.map(p => ({ lesson_id: p.lesson_id, last_practiced_at: p.last_practiced_at })),
      });
      
      setWeeklyActivity(weekActivity);

      // Calculate weekly stats
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      const weeklyAttempts = attempts?.filter(a => {
        const attemptDate = new Date(a.created_at);
        return attemptDate >= weekStart;
      }) || [];
      
      // Consider correct if is_correct OR score >= 70
      const weeklyCorrect = weeklyAttempts.filter(a => a.is_correct === true || (a.score !== null && a.score >= 70)).length;
      const daysWithActivity = weekActivity.filter(d => d.completed).length;
      
      // Count lessons practiced this week
      const lessonsPracticedThisWeek = progressRecords?.filter(p => {
        if (!p.last_practiced_at) return false;
        const practiceDate = new Date(p.last_practiced_at);
        return practiceDate >= weekStart;
      })?.length || 0;
      
      setWeeklyStats({
        totalAttempts: weeklyAttempts.length,
        correctAttempts: weeklyCorrect,
        daysActive: daysWithActivity,
        lessonsPracticed: lessonsPracticedThisWeek,
      });

      // Calculate achievements
      const userAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first lesson',
          icon: '🎯',
          earned: lessonsCompleted >= 1,
        },
        {
          id: '2',
          title: 'Week Warrior',
          description: '7 day streak',
          icon: '🔥',
          earned: (profileData?.streak_count || 0) >= 7,
          progress: Math.min(100, ((profileData?.streak_count || 0) / 7) * 100),
        },
        {
          id: '3',
          title: 'Word Master',
          description: 'Learn 100 words',
          icon: '📚',
          earned: uniqueAssetsLearned >= 100,
          progress: Math.min(100, (uniqueAssetsLearned / 100) * 100),
        },
        {
          id: '4',
          title: 'Perfect Score',
          description: 'Get 100% accuracy on 10+ attempts',
          icon: '⭐',
          earned: accuracy === 100 && totalAttempts >= 10,
        },
        {
          id: '5',
          title: 'Dedicated Learner',
          description: 'Complete 10 lessons',
          icon: '🏆',
          earned: lessonsCompleted >= 10,
          progress: Math.min(100, (lessonsCompleted / 10) * 100),
        },
      ];
      
      setAchievements(userAchievements);

    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ohafia-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ohafia-sand-50 dark:bg-ohafia-earth-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-ohafia-secondary-500 to-ohafia-secondary-700 text-white px-6 pt-8 pb-12 rounded-b-3xl">
        <h1 className="text-2xl font-bold mb-6">Your Progress</h1>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Trophy} label="Total XP" value={stats.totalXP.toLocaleString()} />
          <StatCard icon={Flame} label="Day Streak" value={stats.currentStreak} />
          <StatCard icon={BookOpen} label="Words Learned" value={stats.wordsLearned} />
          <StatCard icon={Target} label="Lessons Done" value={`${stats.lessonsCompleted}/${stats.totalLessons}`} />
        </div>
      </header>

      <main className="px-6 py-6 -mt-4 pb-safe">
        {/* Accuracy card */}
        <section className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">Overall Accuracy</h2>
            <span className="text-2xl font-bold text-ohafia-secondary-600 dark:text-ohafia-secondary-400">{stats.accuracy}%</span>
          </div>
          <div className="progress-bar h-3">
            <div 
              className="h-full rounded-full bg-ohafia-secondary-500 transition-all duration-500"
              style={{ width: `${stats.accuracy}%` }}
            ></div>
          </div>
          <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400 mt-2">
            {stats.correctAttempts} correct out of {stats.totalAttempts} attempts
          </p>
        </section>

        {/* Weekly activity */}
        <section className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50">This Week</h2>
            <span className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{weeklyStats.daysActive} of 7 days active</span>
          </div>
          
          {/* Weekly summary stats */}
          <div className="flex justify-between text-center mb-4 pb-4 border-b border-ohafia-sand-200 dark:border-ohafia-earth-700">
            <div>
              <p className="text-lg font-bold text-ohafia-secondary-600 dark:text-ohafia-secondary-400">{weeklyStats.daysActive}</p>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Days Active</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ohafia-primary-600 dark:text-ohafia-primary-400">{weeklyStats.lessonsPracticed || 0}</p>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Lessons</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{weeklyStats.totalAttempts}</p>
              <p className="text-xs text-ohafia-earth-500 dark:text-ohafia-sand-400">Exercises</p>
            </div>
          </div>
          
          <div className="flex justify-between">
            {weeklyActivity.map((day) => (
              <div key={day.date} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1
                  ${day.completed 
                    ? 'bg-ohafia-secondary-500 text-white' 
                    : 'bg-ohafia-sand-200 dark:bg-ohafia-earth-700 text-ohafia-earth-400 dark:text-ohafia-sand-500'}`}
                >
                  {day.completed ? (
                    <span className="text-lg">✓</span>
                  ) : (
                    <span className="text-xs">—</span>
                  )}
                </div>
                <span className={`text-xs ${day.completed ? 'text-ohafia-earth-700 dark:text-ohafia-sand-200 font-medium' : 'text-ohafia-earth-400 dark:text-ohafia-sand-500'}`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Skills breakdown - based on attempt types */}
        <section className="mb-6">
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-4">Learning Stats</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-ohafia-primary-600 dark:text-ohafia-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-200 text-sm">Total Attempts</p>
                  <p className="text-lg font-bold text-ohafia-primary-600 dark:text-ohafia-primary-400">{stats.totalAttempts}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-ohafia-secondary-100 dark:bg-ohafia-secondary-900/30 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-ohafia-secondary-600 dark:text-ohafia-secondary-400" />
                </div>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-200 text-sm">Correct</p>
                  <p className="text-lg font-bold text-ohafia-secondary-600 dark:text-ohafia-secondary-400">{stats.correctAttempts}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-ohafia-accent-100 dark:bg-ohafia-accent-900/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-ohafia-accent-600 dark:text-ohafia-accent-400" />
                </div>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-200 text-sm">Words Learned</p>
                  <p className="text-lg font-bold text-ohafia-accent-600 dark:text-ohafia-accent-400">{stats.wordsLearned}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-200 text-sm">Accuracy</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.accuracy}%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="font-semibold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-4">Achievements</h2>
          
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`card p-4 flex items-center gap-4
                  ${achievement.earned ? '' : 'opacity-60'}`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl
                  ${achievement.earned 
                    ? 'bg-ohafia-accent-100 dark:bg-ohafia-accent-900/30' 
                    : 'bg-ohafia-sand-200 dark:bg-ohafia-earth-700 grayscale'}`}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-ohafia-earth-800 dark:text-ohafia-sand-100">{achievement.title}</h3>
                  <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">{achievement.description}</p>
                  {achievement.progress !== undefined && !achievement.earned && (
                    <div className="mt-2">
                      <div className="progress-bar h-1.5">
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-ohafia-earth-400 dark:text-ohafia-sand-500 mt-1">{achievement.progress}% complete</p>
                    </div>
                  )}
                </div>
                {achievement.earned && (
                  <span className="text-ohafia-secondary-500 dark:text-ohafia-secondary-400 text-sm font-medium">✓ Earned</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-white/80" />
        <span className="text-sm text-white/80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
