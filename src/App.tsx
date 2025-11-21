import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import VaultHome from "./pages/vault/VaultHome";
import CategoryView from "./pages/vault/CategoryView";
import SubcategoryView from "./pages/vault/SubcategoryView";
import CreateCategory from "./pages/vault/CreateCategory";
import ManageAccess from "./pages/vault/ManageAccess";
import SettingsPage from "./pages/SettingsPage";
import NomineeCenter from "./pages/NomineeCenter";
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
import ContactSupport from "./pages/ContactSupport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/vault/home" element={<VaultHome />} />
          <Route path="/vault/create-category" element={<CreateCategory />} />
          <Route path="/vault/:categoryId" element={<CategoryView />} />
          <Route path="/vault/:categoryId/:subcategoryId" element={<SubcategoryView />} />
          <Route path="/vault/manage-access/:documentId" element={<ManageAccess />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/nominee-center" element={<NomineeCenter />} />
          <Route path="/inactivity-triggers" element={<InactivityTriggers />} />
          <Route path="/time-capsule" element={<TimeCapsule />} />
          <Route path="/customize-quick-actions" element={<CustomizeQuickActions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/auto-lock-timeout" element={<AutoLockTimeout />} />
          <Route path="/backup-frequency" element={<BackupFrequency />} />
          <Route path="/backup-history" element={<BackupHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/email-preferences" element={<EmailPreferences />} />
          <Route path="/active-sessions" element={<ActiveSessions />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/contact-support" element={<ContactSupport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
