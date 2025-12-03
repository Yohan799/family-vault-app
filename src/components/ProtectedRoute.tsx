import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LockScreen } from "@/components/LockScreen";
import { getLockState, lockApp, type AppLockType } from "@/services/appLockService";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, profile } = useAuth();
    const location = useLocation();
    const [isLocked, setIsLocked] = useState(false);
    const [lockType, setLockType] = useState<AppLockType>(null);
    const [hasCheckedLock, setHasCheckedLock] = useState(false);

    useEffect(() => {
        // Check if app should be locked on mount
        if (isAuthenticated && profile && !hasCheckedLock) {
            const lockState = getLockState();
            const profileLockType = profile.app_lock_type as AppLockType;
            
            if (profileLockType && lockState.isLocked) {
                setIsLocked(true);
                setLockType(profileLockType);
            } else if (profileLockType && !lockState.isLocked) {
                // First time opening app with lock enabled - lock it
                const sessionKey = 'app_session_unlocked';
                const isUnlockedThisSession = sessionStorage.getItem(sessionKey);
                
                if (!isUnlockedThisSession) {
                    lockApp(profileLockType);
                    setIsLocked(true);
                    setLockType(profileLockType);
                }
            }
            setHasCheckedLock(true);
        }
    }, [isAuthenticated, profile, hasCheckedLock]);

    const handleUnlock = () => {
        setIsLocked(false);
        // Mark as unlocked for this session
        sessionStorage.setItem('app_session_unlocked', 'true');
    };

    // Show nothing while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to sign in if not authenticated, saving the intended destination
    if (!isAuthenticated) {
        return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
    }

    // Show lock screen if locked
    if (isLocked && lockType) {
        return <LockScreen lockType={lockType} onUnlock={handleUnlock} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
