import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { initializeTheme } from '@/stores/theme-store';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ContributorLayout } from '@/components/layouts/ContributorLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';

// Auth pages
import { LandingPage } from '@/features/auth/pages/LandingPage';
import { SignInPage } from '@/features/auth/pages/SignInPage';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
import { OnboardingPage } from '@/features/auth/pages/OnboardingPage';

// Learner pages
import { HomePage } from '@/features/learner/pages/HomePage';
import { LearnPage } from '@/features/learner/pages/LearnPage';
import { PracticePage } from '@/features/learner/pages/PracticePage';
import { ProgressPage } from '@/features/learner/pages/ProgressPage';
import { ProfilePage } from '@/features/learner/pages/ProfilePage';
import { FeedbackPage } from '@/features/learner/pages/FeedbackPage';

// Contributor pages
import { ContributorDashboard } from '@/features/contributor/pages/ContributorDashboard';
import { CreateAssetPage } from '@/features/contributor/pages/CreateAssetPage';
import { MyAssetsPage } from '@/features/contributor/pages/MyAssetsPage';
import { RecordingStudioPage } from '@/features/contributor/pages/RecordingStudioPage';

// Admin pages
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { ReviewQueuePage } from '@/features/admin/pages/ReviewQueuePage';
import { UsersPage } from '@/features/admin/pages/UsersPage';
import { LessonsPage } from '@/features/admin/pages/LessonsPage';
import { AssetsPage } from '@/features/admin/pages/AssetsPage';
import { SettingsPage } from '@/features/admin/pages/SettingsPage';
import { RoleRequestsPage } from '@/features/admin/pages/RoleRequestsPage';
import { FeedbackManagementPage } from '@/features/admin/pages/FeedbackManagementPage';
import { CategoriesPage } from '@/features/admin/pages/CategoriesPage';

// Components
import { LoadingScreen } from '@/components/ui/LoadingScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isOnboardingComplete } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!isOnboardingComplete) {
    return <Navigate to="/auth/onboarding" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isOnboardingComplete } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user && isOnboardingComplete) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
    initializeTheme();
  }, [initialize]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/sign-in"
            element={
              <PublicRoute>
                <SignInPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/sign-up"
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/verify"
            element={
              <PublicRoute>
                <VerifyEmailPage />
              </PublicRoute>
            }
          />
          {/* Auth callback for magic links */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Route>

        {/* Onboarding (requires auth but not complete profile) */}
        <Route path="/auth/onboarding" element={<OnboardingPage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <LearnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <PracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Contributor routes */}
        <Route element={<ContributorLayout />}>
          <Route
            path="/contributor"
            element={
              <ProtectedRoute>
                <ContributorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contributor/create"
            element={
              <ProtectedRoute>
                <CreateAssetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contributor/my-assets"
            element={
              <ProtectedRoute>
                <MyAssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contributor/record"
            element={
              <ProtectedRoute>
                <RecordingStudioPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/review"
            element={
              <ProtectedRoute>
                <ReviewQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lessons"
            element={
              <ProtectedRoute>
                <LessonsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets"
            element={
              <ProtectedRoute>
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/role-requests"
            element={
              <ProtectedRoute>
                <RoleRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute>
                <FeedbackManagementPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
