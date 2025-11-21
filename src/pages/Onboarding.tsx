import { useState } from "react";
import { Shield, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const onboardingSteps = [
  {
    icon: Shield,
    title: "Secure Your Family's Legacy",
    description: "Keep important documents safe and ensure your family has access when they need it most.",
  },
  {
    icon: FileText,
    title: "Organize Everything",
    description: "Store wills, insurance, medical records, and more in one secure digital vault.",
  },
  {
    icon: Users,
    title: "Share When Needed",
    description: "Grant trusted family members access to critical information during emergencies.",
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/signup");
    }
  };

  const handleSkip = () => {
    navigate("/signup");
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-8">
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
            Skip
          </Button>
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

          <div className="space-y-4">
            <Button onClick={handleNext} className="w-full" size="lg">
              {currentStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}
            </Button>

            <button
              onClick={() => navigate("/signin")}
              className="w-full text-sm text-primary hover:underline"
            >
              Learn More
            </button>
          </div>

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
