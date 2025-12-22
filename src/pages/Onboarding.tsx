import { useState, useEffect } from "react";
import { Shield, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  const onboardingSteps = [
    {
      icon: Shield,
      title: t("onboarding.step1Title"),
      description: t("onboarding.step1Desc"),
    },
    {
      icon: FileText,
      title: t("onboarding.step2Title"),
      description: t("onboarding.step2Desc"),
    },
    {
      icon: Users,
      title: t("onboarding.step3Title"),
      description: t("onboarding.step3Desc"),
    },
  ];

  useEffect(() => {
    // If authenticated, redirect to dashboard
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Check if onboarding was already completed
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true' && !user && !isLoading) {
      navigate("/signup", { replace: true });
    }
  }, [navigate, user, isLoading]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      localStorage.setItem('onboardingComplete', 'true');
      navigate("/signup");
    }
  };

  const handleSkip = () => {
    // Mark onboarding as complete
    localStorage.setItem('onboardingComplete', 'true');
    navigate("/signup");
  };

  // Show loading while checking auth state - prevents flash of onboarding for signed-in users
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-all duration-200 hover:scale-105"
          >
            {t("onboarding.skip")}
          </button>
        </div>

        <div className="bg-card rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div
              key={currentStep}
              className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center animate-in zoom-in-75 duration-500 shadow-lg shadow-primary/10"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Icon className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Animated Text */}
          <div
            key={`text-${currentStep}`}
            className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          <Button
            onClick={handleNext}
            className="w-full group"
            size="lg"
          >
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              {currentStep < onboardingSteps.length - 1 ? t("onboarding.next") : t("onboarding.getStarted")}
            </span>
            {currentStep < onboardingSteps.length - 1 && (
              <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Button>

          {/* Enhanced Progress Dots */}
          <div className="flex justify-center gap-3">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                    ? "w-8 bg-primary shadow-md shadow-primary/30"
                    : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-border hover:bg-muted-foreground/30"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;