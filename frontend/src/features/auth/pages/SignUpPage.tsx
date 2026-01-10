import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, User, MailCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, error, clearError } = useAuthStore();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
  ];

  const isPasswordValid = passwordRequirements.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validate display name
    if (displayName.trim().length < 2) {
      setValidationError('Please enter your name (at least 2 characters).');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError('Oops! Your passwords don\'t match. Please try again.');
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setValidationError('Please create a stronger password that meets all the requirements below.');
      return;
    }

    // Validate terms agreement
    if (!agreed) {
      setValidationError('Please accept the Terms of Service to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { needsVerification } = await signUp(email, password, displayName.trim());
      if (needsVerification) {
        // Show email sent confirmation instead of navigating away
        setShowEmailSent(true);
      } else {
        navigate('/auth/onboarding');
      }
    } catch (err) {
      // Error is set in the store, we just need to stop loading
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format error messages to be more user-friendly
  const formatErrorMessage = (errorMsg: string | null): string | null => {
    if (!errorMsg) return null;
    
    const errorMap: Record<string, string> = {
      'User already registered': 'This email is already registered. Try signing in instead!',
      'Invalid email': 'Please enter a valid email address.',
      'Password should be at least 6 characters': 'Your password needs to be at least 6 characters long.',
      'Signup disabled': 'Sign up is currently unavailable. Please try again later.',
      'Email rate limit exceeded': 'Too many attempts. Please wait a few minutes and try again.',
      'Network error': 'Unable to connect. Please check your internet connection.',
    };

    // Check if the error matches any known pattern
    for (const [key, friendly] of Object.entries(errorMap)) {
      if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
        return friendly;
      }
    }

    // Generic fallback
    if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
      return 'Connection problem. Please check your internet and try again.';
    }

    return errorMsg;
  };

  const displayError = formatErrorMessage(error) || validationError;

  // Show email verification message after successful signup
  if (showEmailSent) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-ohafia-sand-50 to-white dark:from-ohafia-earth-900 dark:to-ohafia-earth-800">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-ohafia-sand-200 dark:hover:bg-ohafia-earth-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-ohafia-earth-700 dark:text-ohafia-sand-300" />
          </Link>
        </div>

        {/* Email Sent Confirmation */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-scale-in">
            <MailCheck className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="font-display text-3xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-3">
            Almost There! 🎉
          </h1>
          <p className="text-lg text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-2">
            We've sent a verification link to:
          </p>
          <p className="text-xl font-bold text-ohafia-primary-600 dark:text-ohafia-primary-400 break-all mb-6">
            {email}
          </p>
          
          {/* Step-by-step instructions */}
          <div className="bg-ohafia-primary-50 dark:bg-ohafia-primary-900/20 border-2 border-ohafia-primary-200 dark:border-ohafia-primary-800 rounded-2xl p-5 w-full mb-6">
            <h3 className="font-semibold text-ohafia-primary-700 dark:text-ohafia-primary-300 mb-4 text-left">Complete your registration:</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">Open your email app</p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-400">Look for "Confirm your email" from Asụsụ Ohafia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">Click the verification link</p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-400">This confirms your email is real</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-ohafia-primary-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <div>
                  <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100">Start learning!</p>
                  <p className="text-sm text-ohafia-earth-600 dark:text-ohafia-sand-400">You'll be taken to your personalized setup</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 w-full mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>⚠️ Important:</strong> You must verify your email before you can sign in. Check your <strong>spam/junk folder</strong> if you don't see it!
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => {
                setShowEmailSent(false);
                clearError();
              }}
              className="w-full py-3 px-4 rounded-xl border-2 border-ohafia-sand-300 dark:border-ohafia-earth-600 text-ohafia-earth-700 dark:text-ohafia-sand-200 font-medium hover:bg-ohafia-sand-100 dark:hover:bg-ohafia-earth-700 transition-colors"
            >
              ← Use a different email
            </button>
            <Link 
              to="/auth/sign-in" 
              className="block w-full py-3 text-center text-ohafia-primary-600 dark:text-ohafia-primary-400 font-medium hover:text-ohafia-primary-700 dark:hover:text-ohafia-primary-300"
            >
              Already verified? Sign in →
            </Link>
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
          Join Asụsụ Ohafia 🎉
        </h1>
        <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-8">
          Create your free account and start learning Igbo (Ohafia dialect) today!
        </p>

        {/* Error message */}
        {displayError && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{displayError}</p>
              {error?.includes('already registered') && (
                <Link to="/auth/sign-in" className="text-sm text-red-600 dark:text-red-400 underline mt-1 inline-block">
                  Go to Sign In →
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display name input */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-ohafia-earth-700 mb-2">
              What should we call you?
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400" />
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input pl-12"
                placeholder="Your name (e.g., Ada, Chinedu)"
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <p className="mt-1.5 text-xs text-ohafia-earth-500">
              This is how we'll greet you in the app
            </p>
          </div>

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
            <p className="mt-1.5 text-xs text-ohafia-earth-500">
              We'll send a verification link to this email
            </p>
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ohafia-earth-700 mb-2">
              Create password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-12 pr-12"
                placeholder="Choose a secure password"
                required
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
            
            {/* Password requirements - always visible for clarity */}
            <div className="mt-3 p-3 rounded-lg bg-ohafia-sand-50 border border-ohafia-sand-200">
              <p className="text-xs font-medium text-ohafia-earth-600 mb-2">Password must have:</p>
              <div className="space-y-1.5">
                {passwordRequirements.map((req) => (
                  <div key={req.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`w-4 h-4 transition-colors ${req.met ? 'text-green-500' : 'text-ohafia-earth-300'}`}
                    />
                    <span className={`text-xs ${req.met ? 'text-green-600 font-medium' : 'text-ohafia-earth-500'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ohafia-earth-700 mb-2">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ohafia-earth-400" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input pl-12 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Type your password again"
                required
                disabled={isSubmitting}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Passwords don't match yet
              </p>
            )}
            {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
              <p className="mt-1.5 text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Passwords match!
              </p>
            )}
          </div>

          {/* Terms agreement */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-ohafia-sand-50 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-ohafia-sand-300 text-ohafia-primary-500 focus:ring-ohafia-primary-500"
              disabled={isSubmitting}
            />
            <span className="text-sm text-ohafia-earth-600">
              I agree to the{' '}
              <a href="#" className="text-ohafia-primary-600 hover:underline font-medium">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-ohafia-primary-600 hover:underline font-medium">Privacy Policy</a>
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !agreed || !isPasswordValid || password !== confirmPassword || displayName.trim().length < 2}
            className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating your account...
              </span>
            ) : (
              'Create my free account'
            )}
          </button>

          {/* What happens next */}
          <div className="text-center text-xs text-ohafia-earth-500 bg-ohafia-sand-50 p-3 rounded-lg">
            <p>📧 After signing up, check your email for a verification link.</p>
          </div>
        </form>

        {/* Sign in link */}
        <p className="mt-8 text-center text-ohafia-earth-600">
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="text-ohafia-primary-600 font-semibold hover:text-ohafia-primary-700">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
