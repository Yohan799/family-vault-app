import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import splashLogo from "@/assets/splash_logo.png";

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
        navigate("/onboarding", { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [navigate, user, isLoading]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="flex flex-col items-center text-center max-w-xs sm:max-w-sm">
        {/* Logo - Responsive sizing */}
        <img 
          src={splashLogo} 
          alt="Family Vault Logo" 
          className="w-24 sm:w-[120px] md:w-[140px] h-auto mb-6 object-contain"
        />
        
        {/* Title - Responsive font sizing */}
        <h1 className="text-[22px] sm:text-2xl md:text-[26px] font-semibold text-foreground leading-tight">
          {t("welcome.title")}
        </h1>
        
        {/* Subtitle - Responsive font sizing */}
        <p className="text-sm sm:text-[15px] md:text-base font-normal text-muted-foreground leading-relaxed mt-2 max-w-[280px] sm:max-w-[320px]">
          {t("welcome.subtitle")}
        </p>
      </div>
    </div>
  );
};

export default Welcome;
