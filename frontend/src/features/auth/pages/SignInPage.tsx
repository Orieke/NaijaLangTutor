import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn, signInWithOtp, user, isOnboardingComplete, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useOtp, setUseOtp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Watch for successful sign-in and redirect
  useEffect(() => {
    if (user && !isSubmitting) {
      if (isOnboardingComplete) {
        navigate('/home', { replace: true });
      } else {
        navigate('/auth/onboarding', { replace: true });
      }
    }
  }, [user, isOnboardingComplete, navigate, isSubmitting]);

  // Format error messages to be more user-friendly
  const formatErrorMessage = (errorMsg: string | null): string | null => {
    if (!errorMsg) return null;
    
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Email or password is incorrect. Please try again.',
      'Email not confirmed': 'Please verify your email first. Check your inbox for the verification link.',
      'Invalid email': 'Please enter a valid email address.',
      'User not found': 'No account found with this email. Would you like to sign up?',
      'Too many requests': 'Too many attempts. Please wait a few minutes and try again.',
      'Network error': 'Unable to connect. Please check your internet connection.',
    };

    for (const [key, friendly] of Object.entries(errorMap)) {
      if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
        return friendly;
      }
    }

    if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
      return 'Connection problem. Please check your internet and try again.';
    }

    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      if (useOtp) {
        await signInWithOtp(email);
        // Successfully sent - show confirmation screen
        setOtpSent(true);
      } else {
        await signIn(email, password);
        // Navigation handled by useEffect watching user state
      }
    } catch {
      // Error is handled by store, keep otpSent as false
      setOtpSent(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formatErrorMessage(error);

  // Show success state after OTP sent
  if (otpSent && useOtp) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-ohafia-sand-50 to-white dark:from-ohafia-earth-900 dark:to-ohafia-earth-800">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-scale-in">
            <Mail className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-3">
            Magic Link Sent! ✨
          </h1>
          <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-2 text-lg">
            We've sent a sign-in link to:
          </p>
          <p className="font-bold text-xl text-ohafia-primary-600 dark:text-ohafia-primary-400 mb-6 break-all">
            {email}
          </p>
          
          {/* Step-by-step instructions */}
          <div className="bg-ohafia-primary-50 dark:bg-ohafia-primary-900/20 border-2 border-ohafia-primary-200 dark:border-ohafia-primary-800 rounded-2xl p-5 w-full mb-6">
            <h3 className="font-semibold text-ohafia-primary-700 dark:text-ohafia-primary-300 mb-4 text-left">What to do next:</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">Open your email app</p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-400">Check inbox for "Sign in to Asụsụ Ohafia"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">Click the magic link</p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-400">Tap "Sign In" button in the email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">You're signed in!</p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-400">The app will open automatically</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tips section */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 w-full mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>💡 Tip:</strong> Don't see the email? Check your <strong>spam/junk folder</strong>. The link expires in 1 hour.
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => {
                setOtpSent(false);
                clearError();
              }}
              className="w-full py-3 px-4 rounded-xl border-2 border-ohafia-sand-300 dark:border-ohafia-earth-600 text-ohafia-earth-700 dark:text-ohafia-sand-200 font-medium hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 transition-colors"
            >
              ← Try a different email
            </button>
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await signInWithOtp(email);
                } catch {
                  // Error handled by store
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-ohafia-primary-600 dark:text-ohafia-primary-400 font-medium hover:bg-ohafia-primary-50 dark:hover:bg-ohafia-primary-900/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resending...' : "Didn't receive it? Resend link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-ohafia-sand-50 to-white dark:from-ohafia-earth-900 dark:to-ohafia-earth-800">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-ohafia-earth-700 dark:text-ohafia-sand-300" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-8">
          Continue your Igbo learning journey
        </p>

        {/* Error message */}
        {displayError && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{displayError}</p>
              {error?.toLowerCase().includes('not found') && (
                <Link to="/auth/sign-up" className="text-sm text-red-600 dark:text-red-400 underline mt-1 inline-block">
                  Create an account →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Sign-in method selector */}
        <div className="flex gap-2 p-1 bg-ohafia-sand-100 dark:bg-ohafia-earth-700 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setUseOtp(true)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              useOtp 
                ? 'bg-white dark:bg-ohafia-earth-600 text-ohafia-earth-900 dark:text-ohafia-sand-50 shadow-sm' 
                : 'text-ohafia-earth-600 dark:text-ohafia-sand-400 hover:text-ohafia-earth-900 dark:hover:text-ohafia-sand-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Magic Link
            </span>
          </button>
          <button
            type="button"
            onClick={() => setUseOtp(false)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              !useOtp 
                ? 'bg-white dark:bg-ohafia-earth-600 text-ohafia-earth-900 dark:text-ohafia-sand-50 shadow-sm' 
                : 'text-ohafia-earth-600 dark:text-ohafia-sand-400 hover:text-ohafia-earth-900 dark:hover:text-ohafia-sand-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400 dark:text-ohafia-sand-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-12"
                placeholder="your.email@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password input (only if not using OTP) */}
          {!useOtp && (
            <div className="animate-fade-in">
              <label htmlFor="password" className="block text-sm font-medium text-ohafia-earth-700 dark:text-ohafia-sand-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400 dark:text-ohafia-sand-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12 pr-12"
                  placeholder="Enter your password"
                  required={!useOtp}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ohafia-earth-400 dark:text-ohafia-sand-500 hover:text-ohafia-earth-600 dark:hover:text-ohafia-sand-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Link 
                to="/auth/forgot-password" 
                className="text-sm text-ohafia-primary-600 dark:text-ohafia-primary-400 hover:underline mt-2 inline-block"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Helper text for magic link */}
          {useOtp && (
            <div className="text-center p-4 bg-ohafia-sand-50 dark:bg-ohafia-earth-700 rounded-xl border border-ohafia-sand-200 dark:border-ohafia-earth-600">
              <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">
                ✨ <strong>No password needed!</strong><br />
                We'll send a secure sign-in link to your email.
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {useOtp ? 'Sending magic link...' : 'Signing in...'}
              </span>
            ) : (
              useOtp ? 'Send me a magic link' : 'Sign in'
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p className="mt-8 text-center text-ohafia-earth-600 dark:text-ohafia-sand-400">
          New to Asụsụ Ohafia?{' '}
          <Link to="/auth/sign-up" className="text-ohafia-primary-600 dark:text-ohafia-primary-400 font-semibold hover:text-ohafia-primary-700 dark:hover:text-ohafia-primary-300">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
