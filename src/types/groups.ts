// Types for document groups feature

export interface DocumentGroup {
    id: string;
    user_id: string;
    category_id?: string;
    subcategory_id?: string;
    parent_folder_id?: string;
    name: string;
    folder_type: 'folder' | 'group';
    icon?: string;
    icon_bg_color?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface CreateGroupInput {
    name: string;
    subcategory_id: string;
    icon?: string;
    icon_bg_color?: string;
    description?: string;
}

export interface GroupWithDocuments extends DocumentGroup {
    document_count: number;
    documents?: any[];
}

// Predefined icons for groups
export const GROUP_ICONS = [
    { name: 'Users', label: 'Family' },
    { name: 'Heart', label: 'Health' },
    { name: 'Briefcase', label: 'Work' },
    { name: 'GraduationCap', label: 'Education' },
    { name: 'Home', label: 'Home' },
    { name: 'Car', label: 'Vehicle' },
    { name: 'Wallet', label: 'Finance' },
    { name: 'Shield', label: 'Insurance' },
    { name: 'FileText', label: 'Documents' },
    { name: 'Lock', label: 'Private' },
    { name: 'Star', label: 'Important' },
    { name: 'Folder', label: 'General' },
] as const;

// Predefined colors for group icons
export const GROUP_COLORS = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-pink-500', label: 'Pink' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-teal-500', label: 'Teal' },
    { value: 'bg-indigo-500', label: 'Indigo' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-gray-500', label: 'Gray' },
] as const;
