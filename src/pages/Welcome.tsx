import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo_fv.jpg";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // If authenticated, redirect to dashboard
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Only start timer if not authenticated
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        navigate("/onboarding");
      }, 1700);

      return () => clearTimeout(timer);
    }
  }, [navigate, user, isLoading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4">
            <img src={logo} alt="Family Vault Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            {t("welcome.title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("welcome.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;