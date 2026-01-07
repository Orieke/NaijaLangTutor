import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, signInWithOtp, isLoading, error, clearError } = useAuthStore();
  
  const email = location.state?.email || '';
  const isNewUser = location.state?.isNewUser || false;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/auth/sign-in');
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const token = otp.join('');
    if (token.length !== 6) return;

    try {
      await verifyOtp(email, token);
      navigate(isNewUser ? '/auth/onboarding' : '/home');
    } catch {
      // Error is handled by store
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    clearError();
    
    try {
      await signInWithOtp(email);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch {
      // Error is handled by store
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link to="/auth/sign-in" className="p-2 -ml-2 rounded-xl hover:bg-ohafia-sand-200 transition-colors">
          <ArrowLeft className="w-6 h-6 text-ohafia-earth-700" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-ohafia-primary-100 flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-ohafia-primary-600" />
        </div>

        <h1 className="font-display text-3xl font-bold text-ohafia-earth-900 mb-2 text-center">
          Check your email
        </h1>
        <p className="text-ohafia-earth-600 mb-8 text-center max-w-sm">
          We sent a verification code to{' '}
          <span className="font-semibold text-ohafia-earth-800">{email}</span>
        </p>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-50 text-red-700 animate-fade-in w-full max-w-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-ohafia-sand-300 bg-white
                         focus:border-ohafia-primary-500 focus:ring-2 focus:ring-ohafia-primary-200 focus:outline-none
                         transition-all duration-200"
              />
            ))}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !isComplete}
            className="btn-primary w-full py-4 mb-4"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner w-5 h-5"></span>
                Verifying...
              </span>
            ) : (
              'Verify email'
            )}
          </button>

          {/* Resend link */}
          <p className="text-center text-ohafia-earth-600">
            Didn't receive the code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-ohafia-earth-400">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-ohafia-primary-600 font-semibold hover:text-ohafia-primary-700"
              >
                Resend code
              </button>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
