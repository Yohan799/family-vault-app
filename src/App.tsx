import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLockGate } from "@/components/AppLockGate";
import { Capacitor } from "@capacitor/core";

// Lazy load all pages for code splitting
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PasswordResetOTP = lazy(() => import("./pages/PasswordResetOTP"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vault = lazy(() => import("./pages/Vault"));
const VaultHome = lazy(() => import("./pages/vault/VaultHome"));
const CategoryView = lazy(() => import("./pages/vault/CategoryView"));
const SubcategoryView = lazy(() => import("./pages/vault/SubcategoryView"));
const NestedFolderView = lazy(() => import("./pages/vault/NestedFolderView"));
const CreateCategory = lazy(() => import("./pages/vault/CreateCategory"));
const ManageAccess = lazy(() => import("./pages/vault/ManageAccess"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NomineeCenter = lazy(() => import("./pages/NomineeCenter"));
const VerifyNominee = lazy(() => import("./pages/VerifyNominee"));
const EmergencyAccess = lazy(() => import("./pages/EmergencyAccess"));
const InactivityTriggers = lazy(() => import("./pages/InactivityTriggers"));
const TimeCapsule = lazy(() => import("./pages/TimeCapsule"));
const CustomizeQuickActions = lazy(() => import("./pages/CustomizeQuickActions"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const BackupFrequency = lazy(() => import("./pages/BackupFrequency"));
const BackupHistory = lazy(() => import("./pages/BackupHistory"));
const Notifications = lazy(() => import("./pages/Notifications"));
const EmailPreferences = lazy(() => import("./pages/EmailPreferences"));
const ActiveSessions = lazy(() => import("./pages/ActiveSessions"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"));
const TwoFactorVerify = lazy(() => import("./pages/TwoFactorVerify"));
const AppLockSetup = lazy(() => import("./pages/AppLockSetup"));
const SetupPIN = lazy(() => import("./pages/SetupPIN"));
const LanguageSettings = lazy(() => import("./pages/LanguageSettings"));
const VerifyEmailPending = lazy(() => import("./pages/VerifyEmailPending"));
const VerifyEmailConfirm = lazy(() => import("./pages/VerifyEmailConfirm"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Lightweight loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Redirect authenticated users away from onboarding/auth pages
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return <PageLoader />;
  }

  // If user is logged in, don't render children (will redirect)
  if (user) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

// Back button handler component
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("backButton", ({ canGoBack }) => {
          const currentPath = location.pathname;
          const authPaths = ['/', '/onboarding', '/signup', '/signin', '/forgot-password', '/password-reset-otp', '/reset-password', '/verify-email-pending', '/verify-email'];

          // If authenticated and on auth page, minimize app instead of going back
          if (user && authPaths.includes(currentPath)) {
            App.minimizeApp();
            return;
          }

          // If on dashboard (main page after login), minimize app
          if (currentPath === '/dashboard') {
            App.minimizeApp();
            return;
          }

          if (canGoBack) {
            window.history.back();
          } else {
            App.minimizeApp();
          }
        });
      });
    }
  }, [navigate, location.pathname, user]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <AppLockGate>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BackButtonHandler />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<AuthRedirect><Onboarding /></AuthRedirect>} />
                  <Route path="/onboarding" element={<AuthRedirect><Onboarding /></AuthRedirect>} />
                  <Route path="/signup" element={<AuthRedirect><SignUp /></AuthRedirect>} />
                  <Route path="/signin" element={<AuthRedirect><SignIn /></AuthRedirect>} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/password-reset-otp" element={<PasswordResetOTP />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
                  <Route path="/verify-email" element={<VerifyEmailConfirm />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
                  <Route path="/vault/home" element={<ProtectedRoute><VaultHome /></ProtectedRoute>} />
                  <Route path="/vault/create-category" element={<ProtectedRoute><CreateCategory /></ProtectedRoute>} />
                  <Route path="/vault/:categoryId" element={<ProtectedRoute><CategoryView /></ProtectedRoute>} />
                  <Route path="/vault/:categoryId/:subcategoryId" element={<ProtectedRoute><SubcategoryView /></ProtectedRoute>} />
                  <Route path="/vault/:categoryId/:subcategoryId/:folderId" element={<ProtectedRoute><NestedFolderView /></ProtectedRoute>} />
                  <Route path="/vault/manage-access/:documentId" element={<ProtectedRoute><ManageAccess /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/nominee-center" element={<ProtectedRoute><NomineeCenter /></ProtectedRoute>} />
                  <Route path="/verify-nominee" element={<VerifyNominee />} />
                  <Route path="/emergency-access" element={<EmergencyAccess />} />
                  <Route path="/inactivity-triggers" element={<ProtectedRoute><InactivityTriggers /></ProtectedRoute>} />
                  <Route path="/time-capsule" element={<ProtectedRoute><TimeCapsule /></ProtectedRoute>} />
                  <Route path="/customize-quick-actions" element={<ProtectedRoute><CustomizeQuickActions /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                  <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                  <Route path="/backup-frequency" element={<ProtectedRoute><BackupFrequency /></ProtectedRoute>} />
                  <Route path="/backup-history" element={<ProtectedRoute><BackupHistory /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/email-preferences" element={<ProtectedRoute><EmailPreferences /></ProtectedRoute>} />
                  <Route path="/active-sessions" element={<ProtectedRoute><ActiveSessions /></ProtectedRoute>} />
                  <Route path="/help-center" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
                  <Route path="/two-factor-setup" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />
                  <Route path="/two-factor-verify" element={<ProtectedRoute><TwoFactorVerify /></ProtectedRoute>} />
                  <Route path="/app-lock-setup" element={<ProtectedRoute><AppLockSetup /></ProtectedRoute>} />
                  <Route path="/setup-pin" element={<ProtectedRoute><SetupPIN /></ProtectedRoute>} />
                  <Route path="/language-settings" element={<ProtectedRoute><LanguageSettings /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AppLockGate>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
