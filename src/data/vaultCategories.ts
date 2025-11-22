import { Home, Briefcase, GraduationCap, Shield, User, Mountain, Factory, Pill, TestTube, Hospital, Syringe, FileText, CreditCard, Car, Plane, IdCard, ScrollText, Award, Building, FileCheck, Landmark, Building2, Key, ClipboardList } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Subcategory {
  id: string;
  name: string;
  icon: LucideIcon;
  documentCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  iconBgColor: string;
  documentCount: number;
  subcategories: Subcategory[];
}

export const vaultCategories: Category[] = [
  {
    id: "real-estate",
    name: "Real Estate",
    icon: Home,
    iconBgColor: "bg-red-100",
    documentCount: 0,
    subcategories: [
      { id: "residential", name: "Residential Property", icon: Home, documentCount: 0 },
      { id: "commercial", name: "Commercial Property", icon: Building2, documentCount: 0 },
      { id: "land", name: "Land", icon: Mountain, documentCount: 0 },
      { id: "industrial", name: "Industrial", icon: Factory, documentCount: 0 },
      { id: "rental", name: "Rental Properties", icon: Key, documentCount: 0 },
      { id: "property-tax", name: "Property Tax", icon: FileText, documentCount: 0 },
      { id: "sale-deeds", name: "Sale/Purchase Deeds", icon: ScrollText, documentCount: 0 },
      { id: "property-documents", name: "Property Documents", icon: ClipboardList, documentCount: 0 },
    ],
  },
  {
    id: "medical",
    name: "Medical",
    icon: Briefcase,
    iconBgColor: "bg-purple-100",
    documentCount: 0,
    subcategories: [
      { id: "prescription", name: "Prescription", icon: Pill, documentCount: 0 },
      { id: "test-reports", name: "Test Reports", icon: TestTube, documentCount: 0 },
      { id: "hospital-records", name: "Hospital Records", icon: Hospital, documentCount: 0 },
      { id: "vaccination", name: "Vaccination Records", icon: Syringe, documentCount: 0 },
      { id: "insurance-claims", name: "Insurance Claims", icon: FileText, documentCount: 0 },
    ],
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    iconBgColor: "bg-blue-100",
    documentCount: 0,
    subcategories: [
      { id: "certificates", name: "Certificates", icon: Award, documentCount: 0 },
      { id: "transcripts", name: "Transcripts", icon: ScrollText, documentCount: 0 },
      { id: "degrees", name: "Degrees", icon: GraduationCap, documentCount: 0 },
      { id: "id-cards", name: "ID Cards", icon: IdCard, documentCount: 0 },
      { id: "scholarships", name: "Scholarships", icon: FileCheck, documentCount: 0 },
    ],
  },
  {
    id: "insurance",
    name: "Insurance",
    icon: Shield,
    iconBgColor: "bg-green-100",
    documentCount: 0,
    subcategories: [
      { id: "health", name: "Health", icon: Hospital, documentCount: 0 },
      { id: "life", name: "Life", icon: User, documentCount: 0 },
      { id: "vehicle", name: "Vehicle", icon: Car, documentCount: 0 },
      { id: "property", name: "Property", icon: Building, documentCount: 0 },
      { id: "travel", name: "Travel", icon: Plane, documentCount: 0 },
    ],
  },
  {
    id: "personal",
    name: "Personal",
    icon: User,
    iconBgColor: "bg-pink-100",
    documentCount: 0,
    subcategories: [
      { id: "identity", name: "Identity", icon: IdCard, documentCount: 0 },
      { id: "bank", name: "Bank", icon: Landmark, documentCount: 0 },
      { id: "tax", name: "Tax", icon: FileText, documentCount: 0 },
      { id: "legal", name: "Legal", icon: ScrollText, documentCount: 0 },
      { id: "certificates", name: "Certificates", icon: Award, documentCount: 0 },
    ],
  },
];
