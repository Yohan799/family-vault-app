import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => void;
    updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        // Mock signup - simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find((u: any) => u.email === email)) {
            throw new Error('User already exists');
        }

        // Create new user
        const newUser: User = {
            id: `user-${Date.now()}`,
            email,
            fullName,
            createdAt: new Date().toISOString(),
        };

        // Store password separately (in real app, this would be hashed on backend)
        const userWithPassword = { ...newUser, password };
        users.push(userWithPassword);
        localStorage.setItem('users', JSON.stringify(users));

        // Set as current user
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        // Mark as first login for feature tour
        localStorage.setItem('isFirstLogin', 'true');

        setUser(newUser);
    };

    const signIn = async (email: string, password: string) => {
        // Mock signin - simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Remove password before setting user state
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
    };

    const signInWithGoogle = async () => {
        // Mock Google signin
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockGoogleUser: User = {
            id: `google-${Date.now()}`,
            email: 'user@gmail.com',
            fullName: 'Google User',
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
            createdAt: new Date().toISOString(),
        };

        localStorage.setItem('currentUser', JSON.stringify(mockGoogleUser));
        localStorage.setItem('isFirstLogin', 'true');
        setUser(mockGoogleUser);
    };

    const signOut = () => {
        localStorage.removeItem('currentUser');
        setUser(null);
    };

    const updateProfile = (updates: Partial<User>) => {
        if (!user) return;

        const updatedUser = { ...user, ...updates };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Also update in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('users', JSON.stringify(users));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                signUp,
                signIn,
                signInWithGoogle,
                signOut,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
