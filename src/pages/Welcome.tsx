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
      <div className="flex flex-col items-center text-center max-w-sm sm:max-w-md">
        {/* Logo - Larger responsive sizing */}
        <img 
          src={splashLogo} 
          alt="Family Vault Logo" 
          className="w-[140px] sm:w-[160px] md:w-[200px] h-auto mb-8 object-contain"
        />
        
        {/* Title - Larger responsive font sizing */}
        <h1 className="text-[28px] sm:text-[32px] md:text-4xl font-bold text-foreground leading-tight">
          {t("welcome.title")}
        </h1>
        
        {/* Subtitle - Larger responsive font sizing */}
        <p className="text-base sm:text-lg md:text-xl font-normal text-muted-foreground leading-relaxed mt-3 max-w-[320px] sm:max-w-[400px]">
          {t("welcome.subtitle")}
        </p>
      </div>
    </div>
  );
};

export default Welcome;
