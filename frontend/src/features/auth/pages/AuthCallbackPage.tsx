import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (accessToken && refreshToken) {
          // Set the session manually
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
        } else {
          // Try to get session from code exchange (for PKCE flow)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          
          // If exchange fails, try getting existing session
          if (exchangeError) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('Unable to verify your sign-in. Please try again.');
            }
          }
        }

        // Re-initialize auth store to pick up the new session
        await initialize();
        
        setStatus('success');
        
        // Navigate after a brief moment to show success
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleAuthCallback();
  }, [navigate, initialize]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-ohafia-sand-50 to-white">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 rounded-full bg-ohafia-primary-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-ohafia-primary-600 animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-2">
              Verifying your sign-in...
            </h1>
            <p className="text-ohafia-earth-600">
              Please wait while we securely sign you in.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-2">
              Welcome back! 🎉
            </h1>
            <p className="text-ohafia-earth-600">
              You've been signed in successfully. Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 mb-2">
              Sign-in failed
            </h1>
            <p className="text-ohafia-earth-600 mb-6">
              {errorMessage || 'Something went wrong. Please try signing in again.'}
            </p>
            <button
              onClick={() => navigate('/auth/sign-in', { replace: true })}
              className="btn-primary px-8 py-3"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
