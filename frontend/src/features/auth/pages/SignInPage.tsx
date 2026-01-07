import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Sparkles, CheckCircle } from 'lucide-react';
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
        setOtpSent(true);
        // Don't navigate - show success message instead
      } else {
        await signIn(email, password);
        // Navigation handled by useEffect watching user state
      }
    } catch {
      // Error is handled by store
      setOtpSent(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formatErrorMessage(error);

  // Show success state after OTP sent
  if (otpSent && useOtp) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-ohafia-sand-50 to-white">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-3">
            Check your email! 📧
          </h1>
          <p className="text-ohafia-earth-600 mb-2">
            We sent a magic sign-in link to:
          </p>
          <p className="font-semibold text-ohafia-primary-600 mb-6">
            {email}
          </p>
          <div className="bg-ohafia-sand-100 rounded-xl p-4 w-full mb-6">
            <p className="text-sm text-ohafia-earth-600">
              Click the link in your email to sign in instantly. The link expires in 1 hour.
            </p>
          </div>
          <button
            onClick={() => {
              setOtpSent(false);
              clearError();
            }}
            className="text-ohafia-primary-600 font-medium hover:underline"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-ohafia-sand-50 to-white">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-ohafia-sand-200 transition-colors">
          <ArrowLeft className="w-6 h-6 text-ohafia-earth-700" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-ohafia-earth-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-ohafia-earth-600 mb-8">
          Continue your Igbo learning journey
        </p>

        {/* Error message */}
        {displayError && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-100 text-red-700 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{displayError}</p>
              {error?.toLowerCase().includes('not found') && (
                <Link to="/auth/sign-up" className="text-sm text-red-600 underline mt-1 inline-block">
                  Create an account →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Sign-in method selector */}
        <div className="flex gap-2 p-1 bg-ohafia-sand-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setUseOtp(true)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              useOtp 
                ? 'bg-white text-ohafia-earth-900 shadow-sm' 
                : 'text-ohafia-earth-600 hover:text-ohafia-earth-900'
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
                ? 'bg-white text-ohafia-earth-900 shadow-sm' 
                : 'text-ohafia-earth-600 hover:text-ohafia-earth-900'
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
            <label htmlFor="email" className="block text-sm font-medium text-ohafia-earth-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400" />
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
              <label htmlFor="password" className="block text-sm font-medium text-ohafia-earth-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400" />
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ohafia-earth-400 hover:text-ohafia-earth-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Link 
                to="/auth/forgot-password" 
                className="text-sm text-ohafia-primary-600 hover:underline mt-2 inline-block"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Helper text for magic link */}
          {useOtp && (
            <div className="text-center p-4 bg-ohafia-sand-50 rounded-xl border border-ohafia-sand-200">
              <p className="text-sm text-ohafia-earth-600">
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
        <p className="mt-8 text-center text-ohafia-earth-600">
          New to Asụsụ Ohafia?{' '}
          <Link to="/auth/sign-up" className="text-ohafia-primary-600 font-semibold hover:text-ohafia-primary-700">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
