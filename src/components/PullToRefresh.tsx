import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export const PullToRefresh = ({ children, onRefresh, className = '' }: PullToRefreshProps) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only enable pull when scrolled to top
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            // Apply resistance to pull
            const resistance = Math.min(diff * 0.5, MAX_PULL);
            setPullDistance(resistance);

            // Prevent page scroll when pulling
            if (diff > 10) {
                e.preventDefault();
            }
        }
    }, [isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(60); // Keep spinner visible

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, isRefreshing, onRefresh]);

    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const shouldShowSpinner = pullDistance > 20 || isRefreshing;

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
        >
            {/* Pull indicator */}
            <div
                className="flex justify-center items-center overflow-hidden transition-all duration-200 ease-out"
                style={{
                    height: shouldShowSpinner ? `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px` : '0px',
                    opacity: progress
                }}
            >
                <div
                    className="flex items-center justify-center"
                    style={{
                        transform: `rotate(${isRefreshing ? 0 : progress * 180}deg)`,
                    }}
                >
                    <Loader2
                        className={`w-6 h-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </div>
            </div>

            {/* Content with pull transform */}
            <div
                style={{
                    transform: `translateY(${isRefreshing ? 0 : Math.max(0, pullDistance - (shouldShowSpinner ? pullDistance : 0))}px)`,
                    transition: isPulling.current ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
