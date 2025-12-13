import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SpotlightStep {
    targetId: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface SpotlightTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const tourSteps: SpotlightStep[] = [
    {
        targetId: "tour-greeting",
        title: "Welcome to Family Vault!",
        description: "This is your dashboard - the central hub for managing your digital legacy.",
        position: "bottom",
    },
    {
        targetId: "tour-vault",
        title: "Digital Vault",
        description: "Securely store and organize your important documents, photos, and files.",
        position: "bottom",
    },
    {
        targetId: "tour-nominees",
        title: "Nominee Center",
        description: "Add trusted family members who can access your vault when needed.",
        position: "bottom",
    },
    {
        targetId: "tour-inactivity-triggers",
        title: "Inactivity Triggers",
        description: "Set up automatic check-ins. If you become inactive, documents are shared with nominees.",
        position: "bottom",
    },
    {
        targetId: "tour-time-capsule",
        title: "Time Capsule",
        description: "Create messages to be delivered to loved ones at a future date.",
        position: "top",
    },
    {
        targetId: "tour-readiness-score",
        title: "Readiness Score",
        description: "Track your progress in securing your digital legacy. Aim for 100%!",
        position: "top",
    },
];

const SpotlightTour = ({ isOpen, onClose }: SpotlightTourProps) => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

    const updateSpotlight = useCallback(() => {
        const step = tourSteps[currentStep];
        const element = document.getElementById(step.targetId);

        if (element) {
            const rect = element.getBoundingClientRect();
            setSpotlightRect(rect);

            // Scroll element into view if needed
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setSpotlightRect(null);
        }
    }, [currentStep]);

    useEffect(() => {
        if (isOpen) {
            // Small delay to let the DOM settle
            const timer = setTimeout(updateSpotlight, 300);
            window.addEventListener('resize', updateSpotlight);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', updateSpotlight);
            };
        }
    }, [isOpen, currentStep, updateSpotlight]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            // Find next step with existing element
            let nextStep = currentStep + 1;
            while (nextStep < tourSteps.length) {
                const element = document.getElementById(tourSteps[nextStep].targetId);
                if (element) {
                    setCurrentStep(nextStep);
                    return;
                }
                nextStep++;
            }
            // No more valid steps, close tour
            handleClose();
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        localStorage.setItem("isFirstLogin", "false");
        setCurrentStep(0);
        onClose();
    };

    const step = tourSteps[currentStep];
    const isLastStep = currentStep === tourSteps.length - 1;

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        if (!spotlightRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        const padding = 16;
        const tooltipWidth = 320;
        const position = step.position || 'bottom';

        switch (position) {
            case 'top':
                return {
                    bottom: `${window.innerHeight - spotlightRect.top + padding}px`,
                    left: `${Math.max(padding, Math.min(spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
                };
            case 'bottom':
                return {
                    top: `${spotlightRect.bottom + padding}px`,
                    left: `${Math.max(padding, Math.min(spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
                };
            case 'left':
                return {
                    top: `${spotlightRect.top}px`,
                    right: `${window.innerWidth - spotlightRect.left + padding}px`,
                };
            case 'right':
                return {
                    top: `${spotlightRect.top}px`,
                    left: `${spotlightRect.right + padding}px`,
                };
            default:
                return {
                    top: `${spotlightRect.bottom + padding}px`,
                    left: `${spotlightRect.left}px`,
                };
        }
    };

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Dark overlay with spotlight hole */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {spotlightRect && (
                            <rect
                                x={spotlightRect.left - 8}
                                y={spotlightRect.top - 8}
                                width={spotlightRect.width + 16}
                                height={spotlightRect.height + 16}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.75)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Highlight border around element */}
            {spotlightRect && (
                <div
                    className="absolute border-2 border-primary rounded-xl pointer-events-none animate-pulse"
                    style={{
                        left: spotlightRect.left - 8,
                        top: spotlightRect.top - 8,
                        width: spotlightRect.width + 16,
                        height: spotlightRect.height + 16,
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                className="absolute w-80 bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                style={getTooltipStyle()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                Step {currentStep + 1} of {tourSteps.length}
                            </span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="flex gap-1">
                        {tourSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 flex-1 rounded-full transition-all ${index <= currentStep ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {step.description}
                    </p>

                    {/* Navigation */}
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevious}
                                className="flex-1"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleNext}
                            className="flex-1"
                        >
                            {isLastStep ? (
                                <>
                                    Get Started
                                    <Check className="w-4 h-4 ml-1" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>

                    {!isLastStep && (
                        <button
                            onClick={handleClose}
                            className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip Tour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpotlightTour;
