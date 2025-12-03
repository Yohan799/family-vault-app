import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Vault, Users, Shield, Clock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureTourProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TourStep {
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
}

const tourSteps: TourStep[] = [
    {
        title: "Welcome to Family Vault!",
        description: "Your secure digital legacy platform. Keep your important documents safe and ensure they reach your loved ones when it matters most.",
        icon: Sparkles,
        iconColor: "text-yellow-500",
        iconBg: "bg-yellow-500/10",
    },
    {
        title: "Digital Vault",
        description: "Store documents securely. Everything encrypted and organized in one place.",
        icon: Vault,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-500/10",
    },
    {
        title: "Nominee Center",
        description: "Select trusted individuals who can access your documents. Verify their identity and control exactly what each person can see or download.",
        icon: Users,
        iconColor: "text-green-500",
        iconBg: "bg-green-500/10",
    },
    {
        title: "Inactivity Triggers",
        description: "Set up automatic check-ins to monitor your activity. If you become inactive, your documents will be securely shared with your nominees.",
        icon: Shield,
        iconColor: "text-red-500",
        iconBg: "bg-red-500/10",
    },
    {
        title: "Time Capsule",
        description: "Create messages and memories to be delivered at a future date. Leave behind words of wisdom, love letters, or important instructions.",
        icon: Clock,
        iconColor: "text-purple-500",
        iconBg: "bg-purple-500/10",
    },
    {
        title: "You're All Set!",
        description: "Start securing your legacy today. Upload your first document, add a nominee, or create a time capsule. We're here to help every step of the way.",
        icon: Check,
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-500/10",
    },
];

const FeatureTour = ({ isOpen, onClose }: FeatureTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const currentTourStep = tourSteps[currentStep];
    const Icon = currentTourStep.icon;
    const isLastStep = currentStep === tourSteps.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 pb-8">
                    <button
                        onClick={handleSkip}
                        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Skip tour"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Progress Indicator */}
                    <div className="flex gap-1.5 mb-6">
                        {tourSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${index === currentStep
                                        ? "bg-primary"
                                        : index < currentStep
                                            ? "bg-primary/50"
                                            : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className={`w-20 h-20 ${currentTourStep.iconBg} rounded-full flex items-center justify-center`}>
                            <Icon className={`w-10 h-10 ${currentTourStep.iconColor}`} strokeWidth={2} />
                        </div>
                    </div>

                    {/* Step Counter */}
                    <p className="text-center text-xs text-muted-foreground font-medium">
                        Step {currentStep + 1} of {tourSteps.length}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 pt-4">
                    <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
                        {currentTourStep.title}
                    </h2>
                    <p className="text-muted-foreground text-center leading-relaxed mb-6">
                        {currentTourStep.description}
                    </p>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                className="flex-1 h-12 rounded-xl border-2"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className={`h-12 rounded-xl font-semibold ${currentStep === 0 ? "flex-1" : "flex-1"
                                }`}
                        >
                            {isLastStep ? (
                                <>
                                    Get Started
                                    <Check className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Skip Button */}
                    {!isLastStep && (
                        <button
                            onClick={handleSkip}
                            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip Tour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureTour;
