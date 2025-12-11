import { z } from "zod";

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Category & Folder Name Validation
export const categoryNameSchema = z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_&()]+$/, "Only letters, numbers, spaces, and basic symbols allowed")
    .transform((val) => val.trim());

// Nominee Validation
export const nomineeSchema = z.object({
    fullName: z
        .string()
        .min(1, "Full name is required")
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),

    relationship: z
        .string()
        .min(1, "Relationship is required")
        .max(50, "Relationship must be less than 50 characters"),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address")
        .toLowerCase(),

    phone: z
        .string()
        .min(1, "Phone number is required")
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (use international format)")
        .optional()
        .or(z.literal("")),
});

// Time Capsule Validation
export const timeCapsuleSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be less than 100 characters"),

    message: z
        .string()
        .min(1, "Message is required")
        .min(10, "Message must be at least 10 characters")
        .max(5000, "Message must be less than 5000 characters"),

    releaseDate: z
        .string()
        .min(1, "Release date is required")
        .refine((date) => {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return selectedDate > today;
        }, "Release date must be in the future"),

    recipientEmail: z
        .string()
        .min(1, "Recipient email is required")
        .email("Invalid email address")
        .toLowerCase(),

    phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
        .optional()
        .or(z.literal("")),
});

// Inactivity Trigger Validation
export const inactivityTriggerSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name must be less than 100 characters"),

    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),

    type: z.enum(["no-login", "no-activity", "custom"], {
        errorMap: () => ({ message: "Please select a valid trigger type" }),
    }),

    duration: z
        .string()
        .min(1, "Duration is required")
        .refine((val) => {
            const num = parseInt(val);
            return !isNaN(num) && num > 0 && num <= 365;
        }, "Duration must be between 1 and 365 days"),
});

// Profile Validation
export const profileSchema = z.object({
    fullName: z
        .string()
        .min(1, "Full name is required")
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address")
        .toLowerCase(),

    phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
        .optional()
        .or(z.literal("")),
});

// Password Validation
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Document File Validation
// Allowed MIME types for explicit matching
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/heic",
    "image/heif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Image extensions for fallback validation when MIME type is empty/generic
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];

export const documentFileSchema = z.object({
    name: z.string().min(1, "File name is required"),
    size: z
        .number()
        .max(20 * 1024 * 1024, "File size must be less than 20MB"),
    type: z
        .string()
        .refine(
            (type) => {
                // Accept if MIME type is in allowed list
                if (ALLOWED_MIME_TYPES.includes(type)) return true;
                // Accept any image/* type (camera captures may have various formats)
                if (type.startsWith('image/')) return true;
                // Accept empty/generic types (will validate by extension in validateFile)
                if (!type || type === 'application/octet-stream') return true;
                return false;
            },
            "Invalid file type. Allowed: PDF, Images, DOC, DOCX, XLS, XLSX"
        ),
});

/**
 * Check if filename has an image extension
 */
export const hasImageExtension = (filename: string): boolean => {
    const lowerName = filename.toLowerCase();
    return IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates data against a Zod schema and returns errors
 */
export const validateData = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } => {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
    });

    return { success: false, errors };
};

/**
 * Sanitizes user input by removing dangerous characters
 */
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
        .replace(/[<>]/g, ""); // Remove < and > characters
};

/**
 * Validates file before upload
 */
export const validateFile = (
    file: File
): { valid: boolean; error?: string } => {
    // First check size - 20MB limit
    if (file.size > 20 * 1024 * 1024) {
        return { valid: false, error: "File size must be less than 20MB" };
    }

    // Check if file has valid name
    if (!file.name || file.name.trim() === '') {
        return { valid: false, error: "File name is required" };
    }

    const mimeType = file.type || '';

    // Accept known MIME types
    if (ALLOWED_MIME_TYPES.includes(mimeType)) {
        return { valid: true };
    }

    // Accept any image/* type (camera/scanner captures)
    if (mimeType.startsWith('image/')) {
        return { valid: true };
    }

    // For empty or generic MIME types, check file extension
    if (!mimeType || mimeType === 'application/octet-stream') {
        if (hasImageExtension(file.name)) {
            return { valid: true };
        }
        // Allow files with common document extensions
        const docExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const lowerName = file.name.toLowerCase();
        if (docExtensions.some(ext => lowerName.endsWith(ext))) {
            return { valid: true };
        }
    }

    return {
        valid: false,
        error: "Invalid file type. Allowed: PDF, Images, DOC, DOCX, XLS, XLSX",
    };
};

/**
 * Validates phone number format
 */
export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Checks if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
};

/**
 * Formats phone number to international format
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // If it doesn't start with +, add country code assumption
    if (!cleaned.startsWith("+")) {
        return `+91${cleaned}`; // Default to India, adjust as needed
    }

    return cleaned;
};

/**
 * Truncates text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
};

// ============================================
// TYPE EXPORTS
// ============================================

// ============================================
// GMAIL-ONLY AND 10-DIGIT PHONE VALIDATION
// ============================================

/**
 * Validates Gmail-only email addresses
 */
export const validateGmailOnly = (email: string): boolean => {
    const gmailRegex = /^[^\s@]+@gmail\.com$/i;
    return gmailRegex.test(email);
};

/**
 * Validates phone number is exactly 10 digits
 */
export const validatePhoneExact10 = (phone: string): boolean => {
    return /^[0-9]{10}$/.test(phone);
};

// ============================================
// TYPE EXPORTS
// ============================================

export type NomineeFormData = z.infer<typeof nomineeSchema>;
export type TimeCapsuleFormData = z.infer<typeof timeCapsuleSchema>;
export type InactivityTriggerFormData = z.infer<typeof inactivityTriggerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
