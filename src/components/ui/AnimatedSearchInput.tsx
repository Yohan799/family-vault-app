import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AnimatedSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholders: string[];
    className?: string;
}

/**
 * Search input with animated rotating placeholder text
 * Cycles through hint examples to show users what they can search for
 */
const AnimatedSearchInput: React.FC<AnimatedSearchInputProps> = ({
    value,
    onChange,
    placeholders,
    className = '',
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayText, setDisplayText] = useState(placeholders[0] || '');

    // Rotate through placeholders
    useEffect(() => {
        if (value || placeholders.length <= 1) return;

        const interval = setInterval(() => {
            setIsAnimating(true);

            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % placeholders.length);
                setDisplayText(placeholders[(currentIndex + 1) % placeholders.length]);
                setIsAnimating(false);
            }, 200);
        }, 3000);

        return () => clearInterval(interval);
    }, [value, placeholders, currentIndex]);

    // Update display text when placeholders change
    useEffect(() => {
        setDisplayText(placeholders[currentIndex] || '');
    }, [placeholders, currentIndex]);

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />

            {/* Animated placeholder overlay */}
            {!value && (
                <div
                    className={`absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-all duration-200 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                        }`}
                >
                    <span className="text-muted-foreground/70">Search for </span>
                    <span className="text-primary font-medium">{displayText}</span>
                </div>
            )}

            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder=""
                className="pl-12 pr-12 h-12 bg-card border-none rounded-xl"
            />

            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-accent rounded-full p-1 z-10"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            )}
        </div>
    );
};

export default AnimatedSearchInput;

// Predefined placeholder sets for different views
export const VAULT_HOME_PLACEHOLDERS = [
    'Medical',
    'Real Estate',
    'Insurance',
    'Finance',
    'Personal',
];

export const CATEGORY_PLACEHOLDERS: Record<string, string[]> = {
    medical: ['Prescriptions', 'Lab Reports', 'Health Records', 'Vaccination'],
    'real-estate': ['Property Docs', 'Residential', 'Commercial', 'Rental Agreements'],
    insurance: ['Life Insurance', 'Health Policy', 'Vehicle Insurance'],
    finance: ['Bank Statements', 'Tax Returns', 'Investments'],
    personal: ['ID Cards', 'Passport', 'Birth Certificate'],
    legal: ['Contracts', 'Agreements', 'Wills'],
};

export const DOCUMENT_PLACEHOLDERS = [
    'documents',
    'receipts',
    'reports',
    'certificates',
];
