import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, User, Target, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import type { AgeGroup, LearningStyle } from '@/types/database';

const steps = ['Profile', 'Goals', 'Style'];

const goals = [
  { id: 'speak', label: 'Speak fluently', icon: '🗣️' },
  { id: 'read', label: 'Read & understand', icon: '📖' },
  { id: 'write', label: 'Write correctly', icon: '✍️' },
  { id: 'culture', label: 'Learn culture', icon: '🎭' },
  { id: 'connect', label: 'Connect with family', icon: '👨‍👩‍👧‍👦' },
  { id: 'heritage', label: 'Preserve heritage', icon: '🌍' },
];

const ageGroups: { id: AgeGroup; label: string; description: string }[] = [
  { id: 'child', label: 'Child', description: 'Under 13 years' },
  { id: 'teen', label: 'Teen', description: '13-17 years' },
  { id: 'adult', label: 'Adult', description: '18+ years' },
];

const learningStyles: { id: LearningStyle; label: string; description: string; icon: string }[] = [
  { id: 'auditory', label: 'Audio-first', description: 'I learn best by listening', icon: '🎧' },
  { id: 'reading', label: 'Reading-first', description: 'I prefer reading & writing', icon: '📚' },
  { id: 'visual', label: 'Visual', description: 'I learn by seeing', icon: '👁️' },
  { id: 'kinesthetic', label: 'Hands-on', description: 'I like learning by doing', icon: '🎯' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, completeOnboarding, isLoading, isOnboardingComplete } = useAuthStore();
  
  const [step, setStep] = useState(0);
  // Pre-fill display name from profile or user metadata
  const existingName = profile?.display_name || user?.user_metadata?.display_name || '';
  const [fullName, setFullName] = useState(existingName);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or already onboarded
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }
  
  if (isOnboardingComplete) {
    return <Navigate to="/home" replace />;
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return fullName.trim().length >= 2 && ageGroup !== null;
      case 1:
        return selectedGoals.length >= 1;
      case 2:
        return learningStyle !== null;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setError(null);
      try {
        await completeOnboarding({
          fullName: fullName || existingName || 'Learner',
          ageGroup: ageGroup!,
          learningStyle: learningStyle!,
          goals: selectedGoals,
        });
        navigate('/home');
      } catch (err) {
        console.error('Onboarding error:', err);
        setError(err instanceof Error ? err.message : 'Failed to save your preferences. Please try again.');
      }
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ohafia-sand-50 via-ohafia-sand-100 to-ohafia-primary-50 flex flex-col px-6 py-8">
      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 p-4 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                ${index < step ? 'bg-ohafia-secondary-500 text-white' : index === step ? 'bg-ohafia-primary-500 text-white' : 'bg-ohafia-sand-200 text-ohafia-earth-400'}`}
            >
              {index < step ? <CheckCircle className="w-5 h-5" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-1 mx-1 rounded transition-colors duration-300
                  ${index < step ? 'bg-ohafia-secondary-500' : 'bg-ohafia-sand-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 animate-fade-in">
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-ohafia-primary-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-ohafia-primary-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-2">
                Let's get to know you
              </h1>
              <p className="text-ohafia-earth-600">Tell us a bit about yourself</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ohafia-earth-700 mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ohafia-earth-700 mb-3">
                Age group
              </label>
              <div className="grid grid-cols-3 gap-3">
                {ageGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setAgeGroup(group.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200
                      ${ageGroup === group.id 
                        ? 'border-ohafia-primary-500 bg-ohafia-primary-50' 
                        : 'border-ohafia-sand-200 bg-white hover:border-ohafia-primary-200'}`}
                  >
                    <span className="block font-semibold text-ohafia-earth-800">{group.label}</span>
                    <span className="block text-xs text-ohafia-earth-500 mt-1">{group.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-ohafia-accent-100 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-ohafia-accent-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-2">
                What are your goals?
              </h1>
              <p className="text-ohafia-earth-600">Select all that apply</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${selectedGoals.includes(goal.id) 
                      ? 'border-ohafia-primary-500 bg-ohafia-primary-50' 
                      : 'border-ohafia-sand-200 bg-white hover:border-ohafia-primary-200'}`}
                >
                  <span className="text-2xl mb-2 block">{goal.icon}</span>
                  <span className="font-medium text-ohafia-earth-800 text-sm">{goal.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-ohafia-secondary-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-ohafia-secondary-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-2">
                How do you learn best?
              </h1>
              <p className="text-ohafia-earth-600">We'll personalize your experience</p>
            </div>

            <div className="space-y-3">
              {learningStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setLearningStyle(style.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4
                    ${learningStyle === style.id 
                      ? 'border-ohafia-primary-500 bg-ohafia-primary-50' 
                      : 'border-ohafia-sand-200 bg-white hover:border-ohafia-primary-200'}`}
                >
                  <span className="text-3xl">{style.icon}</span>
                  <div>
                    <span className="font-semibold text-ohafia-earth-800 block">{style.label}</span>
                    <span className="text-sm text-ohafia-earth-500">{style.description}</span>
                  </div>
                  {learningStyle === style.id && (
                    <CheckCircle className="w-6 h-6 text-ohafia-primary-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <button
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
          className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving your preferences...
            </span>
          ) : step === steps.length - 1 ? (
            '🎉 Start learning'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
