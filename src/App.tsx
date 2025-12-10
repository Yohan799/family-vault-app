import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLockGate } from "@/components/AppLockGate";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordResetOTP from "./pages/PasswordResetOTP";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import VaultHome from "./pages/vault/VaultHome";
import CategoryView from "./pages/vault/CategoryView";
import SubcategoryView from "./pages/vault/SubcategoryView";
import NestedFolderView from "./pages/vault/NestedFolderView";
import CreateCategory from "./pages/vault/CreateCategory";
import ManageAccess from "./pages/vault/ManageAccess";
import SettingsPage from "./pages/SettingsPage";
import NomineeCenter from "./pages/NomineeCenter";
import VerifyNominee from "./pages/VerifyNominee";
import EmergencyAccess from "./pages/EmergencyAccess";
import InactivityTriggers from "./pages/InactivityTriggers";
import TimeCapsule from "./pages/TimeCapsule";
import CustomizeQuickActions from "./pages/CustomizeQuickActions";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import AutoLockTimeout from "./pages/AutoLockTimeout";
import BackupFrequency from "./pages/BackupFrequency";
import BackupHistory from "./pages/BackupHistory";
import Notifications from "./pages/Notifications";
import EmailPreferences from "./pages/EmailPreferences";
import ActiveSessions from "./pages/ActiveSessions";
import HelpCenter from "./pages/HelpCenter";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import AppLockSetup from "./pages/AppLockSetup";
import SetupPIN from "./pages/SetupPIN";
import LanguageSettings from "./pages/LanguageSettings";
import NotFound from "./pages/NotFound";
import { Capacitor } from "@capacitor/core";

const queryClient = new QueryClient();

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
          const authPaths = ['/', '/onboarding', '/signup', '/signin', '/forgot-password', '/password-reset-otp', '/reset-password'];

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
              <Routes>
                <Route path="/" element={<Onboarding />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/password-reset-otp" element={<PasswordResetOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                <Route path="/auto-lock-timeout" element={<ProtectedRoute><AutoLockTimeout /></ProtectedRoute>} />
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppLockGate>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

