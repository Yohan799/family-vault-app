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
    if (onboardingComplete === 'true' && !user) {
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

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
          >
            {t("onboarding.skip")}
          </button>
        </div>

        <div className="bg-card rounded-3xl shadow-xl p-8 space-y-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          <Button onClick={handleNext} className="w-full" size="lg">
            {currentStep < onboardingSteps.length - 1 ? t("onboarding.next") : t("onboarding.getStarted")}
          </Button>

          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentStep ? "w-8 bg-primary" : "w-1 bg-border"
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