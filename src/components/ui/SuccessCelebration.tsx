import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SuccessCelebrationProps {
    trigger: boolean;
    onComplete?: () => void;
    className?: string;
}

/**
 * A lightweight confetti-style celebration component.
 * Renders colorful particles that animate outward when triggered.
 */
const SuccessCelebration = ({ trigger, onComplete, className }: SuccessCelebrationProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [particles, setParticles] = useState<Array<{
        id: number;
        x: number;
        y: number;
        color: string;
        delay: number;
        size: number;
    }>>([]);

    const colors = [
        "bg-yellow-400",
        "bg-green-400",
        "bg-blue-400",
        "bg-pink-400",
        "bg-purple-400",
        "bg-orange-400",
    ];

    useEffect(() => {
        if (trigger) {
            // Generate random particles
            const newParticles = Array.from({ length: 24 }, (_, i) => ({
                id: i,
                x: Math.random() * 200 - 100, // -100 to 100
                y: Math.random() * -150 - 50, // -50 to -200 (upward)
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 0.2,
                size: Math.random() * 8 + 4, // 4-12px
            }));

            setParticles(newParticles);
            setIsVisible(true);

            // Hide after animation completes
            const timeout = setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [trigger, onComplete]);

    if (!isVisible) return null;

    return (
        <div className={cn("fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden", className)}>
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className={cn(
                        "absolute rounded-full",
                        particle.color
                    )}
                    style={{
                        width: particle.size,
                        height: particle.size,
                        animation: `celebrate 0.8s ease-out ${particle.delay}s forwards`,
                        "--tx": `${particle.x}px`,
                        "--ty": `${particle.y}px`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Central success icon */}
            <div className="animate-in zoom-in-50 duration-300">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                    <svg
                        className="w-8 h-8 text-white animate-in zoom-in-50 duration-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            {/* Add keyframe animation via style tag */}
            <style>{`
        @keyframes celebrate {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default SuccessCelebration;
