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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-ohafia-sand-50 to-white dark:from-ohafia-earth-900 dark:to-ohafia-earth-800">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="w-24 h-24 rounded-full bg-ohafia-primary-100 dark:bg-ohafia-primary-900/30 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-ohafia-primary-600 dark:text-ohafia-primary-400 animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-3">
              Signing you in... ✨
            </h1>
            <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-6">
              Verifying your magic link, just a moment!
            </p>
            <div className="bg-ohafia-sand-100 dark:bg-ohafia-earth-700 rounded-xl p-4">
              <p className="text-sm text-ohafia-earth-500 dark:text-ohafia-sand-400">
                🔒 Securely authenticating your account
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-3">
              Welcome! 🎉
            </h1>
            <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-4">
              You're signed in successfully!
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-700 dark:text-green-300">
                🚀 Taking you to your learning dashboard...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-ohafia-earth-400 dark:text-ohafia-sand-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting...</span>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ohafia-earth-900 dark:text-ohafia-sand-50 mb-3">
              Oops! Link expired or invalid 😕
            </h1>
            <p className="text-ohafia-earth-600 dark:text-ohafia-sand-300 mb-6">
              {errorMessage || 'The magic link may have expired or already been used.'}
            </p>
            
            <div className="bg-ohafia-sand-100 dark:bg-ohafia-earth-700 rounded-xl p-5 mb-6 text-left">
              <p className="font-medium text-ohafia-earth-800 dark:text-ohafia-sand-100 mb-3">This can happen when:</p>
              <ul className="space-y-2 text-sm text-ohafia-earth-600 dark:text-ohafia-sand-300">
                <li className="flex items-start gap-2">
                  <span>⏱️</span>
                  <span>The link expired (valid for 1 hour)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🔗</span>
                  <span>The link was already used once</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📋</span>
                  <span>The link was copied incorrectly</span>
                </li>
              </ul>
            </div>
            
            <div className="w-full space-y-3">
              <button
                onClick={() => navigate('/auth/sign-in', { replace: true })}
                className="btn-primary w-full py-3"
              >
                Get a new magic link
              </button>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full py-3 text-ohafia-earth-600 dark:text-ohafia-sand-400 hover:text-ohafia-earth-800 dark:hover:text-ohafia-sand-200 transition-colors"
              >
                Go to homepage
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
