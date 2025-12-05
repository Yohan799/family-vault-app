import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right";
}

interface SpotlightTourProps {
    isOpen: boolean;
    onClose: () => void;
    steps: TourStep[];
}

const SpotlightTour = ({ isOpen, onClose, steps }: SpotlightTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0, rotation: 0 });

    const updatePositions = useCallback(() => {
        if (!isOpen || currentStep >= steps.length) return;

        const step = steps[currentStep];
        const element = document.querySelector(`[data-tour-id="${step.targetId}"]`);

        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);

            // Calculate tooltip position based on step position preference
            const padding = 16;
            const tooltipWidth = Math.min(300, window.innerWidth - 32);
            const tooltipHeight = 200;
            const arrowOffset = 20;
            const gap = 12; // Gap between element and tooltip

            let top = 0;
            let left = 0;
            let arrowTop = 0;
            let arrowLeft = 0;
            let arrowRotation = 0;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let position = step.position || "bottom";

            // Check if there's enough space, if not, flip position
            const spaceAbove = rect.top;
            const spaceBelow = viewportHeight - rect.bottom;

            if (position === "bottom" && spaceBelow < tooltipHeight + arrowOffset + gap) {
                position = "top";
            } else if (position === "top" && spaceAbove < tooltipHeight + arrowOffset + gap) {
                position = "bottom";
            }

            switch (position) {
                case "top":
                    top = rect.top - tooltipHeight - arrowOffset - gap;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    arrowTop = rect.top - arrowOffset;
                    arrowLeft = rect.left + rect.width / 2 - 12;
                    arrowRotation = 180;
                    break;
                case "bottom":
                    top = rect.bottom + arrowOffset + gap;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    arrowTop = rect.bottom + gap;
                    arrowLeft = rect.left + rect.width / 2 - 12;
                    arrowRotation = 0;
                    break;
                case "left":
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - arrowOffset - gap;
                    arrowTop = rect.top + rect.height / 2 - 12;
                    arrowLeft = rect.left - arrowOffset;
                    arrowRotation = 90;
                    break;
                case "right":
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + arrowOffset + gap;
                    arrowTop = rect.top + rect.height / 2 - 12;
                    arrowLeft = rect.right + gap;
                    arrowRotation = -90;
                    break;
            }

            // Keep tooltip within viewport bounds (but don't let it cover the target)
            if (left < padding) left = padding;
            if (left + tooltipWidth > viewportWidth - padding) {
                left = viewportWidth - tooltipWidth - padding;
            }

            // For top position, don't push down if it would cover the element
            if (position === "top" && top < padding) {
                top = padding;
            }
            // For bottom position, don't push up if it would cover the element
            if (position === "bottom" && top + tooltipHeight > viewportHeight - 70) {
                // Account for bottom nav
                top = viewportHeight - tooltipHeight - 70;
            }

            setTooltipPosition({ top, left });
            setArrowPosition({ top: arrowTop, left: arrowLeft, rotation: arrowRotation });
        }
    }, [isOpen, currentStep, steps]);

    useEffect(() => {
        updatePositions();
        window.addEventListener("resize", updatePositions);
        window.addEventListener("scroll", updatePositions);
        return () => {
            window.removeEventListener("resize", updatePositions);
            window.removeEventListener("scroll", updatePositions);
        };
    }, [updatePositions]);

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            // Small delay to ensure DOM is ready
            setTimeout(updatePositions, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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

    const currentTourStep = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Dark overlay with spotlight cutout */}
            <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.75)"
                    mask="url(#spotlight-mask)"
                    style={{ pointerEvents: "auto" }}
                    onClick={onClose}
                />
            </svg>

            {/* Highlight border around target */}
            {targetRect && (
                <div
                    className="fixed border-2 border-primary rounded-xl pointer-events-none animate-pulse"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: "0 0 0 4px rgba(124, 58, 237, 0.3)",
                    }}
                />
            )}

            {/* Animated Arrow */}
            <div
                className="fixed pointer-events-none z-[10000]"
                style={{
                    top: arrowPosition.top,
                    left: arrowPosition.left,
                    transform: `rotate(${arrowPosition.rotation}deg)`,
                }}
            >
                <svg
                    width="24"
                    height="32"
                    viewBox="0 0 24 32"
                    className="animate-bounce text-primary drop-shadow-lg"
                    style={{ animationDuration: "0.8s" }}
                >
                    <path
                        d="M12 0 L24 16 L18 16 L18 32 L6 32 L6 16 L0 16 Z"
                        fill="currentColor"
                    />
                </svg>
            </div>

            {/* Tooltip */}
            <div
                className="fixed z-[10001] w-[300px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                }}
            >
                {/* Header with progress */}
                <div className="bg-primary/10 px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-1">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-6 h-1.5 rounded-full transition-all ${index === currentStep
                                        ? "bg-primary"
                                        : index < currentStep
                                            ? "bg-primary/50"
                                            : "bg-muted"
                                        }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        {currentTourStep.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {currentTourStep.description}
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
                                    Done
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
                            onClick={onClose}
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
