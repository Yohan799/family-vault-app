// Helper to get localized category and subcategory names
// Maps category/subcategory IDs to translation keys

export const categoryKeyMap: Record<string, string> = {
  "real-estate": "category.realEstate",
  "medical": "category.medical",
  "education": "category.education",
  "insurance": "category.insurance",
  "personal": "category.personal",
};

export const subcategoryKeyMap: Record<string, string> = {
  // Real Estate
  "residential": "subcategory.residential",
  "commercial": "subcategory.commercial",
  "land": "subcategory.land",
  "industrial": "subcategory.industrial",
  "rental": "subcategory.rental",
  "property-tax": "subcategory.propertyTax",
  "sale-deeds": "subcategory.saleDeeds",
  "property-documents": "subcategory.propertyDocuments",
  // Medical
  "prescription": "subcategory.prescription",
  "test-reports": "subcategory.testReports",
  "hospital-records": "subcategory.hospitalRecords",
  "vaccination": "subcategory.vaccination",
  "insurance-claims": "subcategory.insuranceClaims",
  // Education
  "certificates": "subcategory.certificates",
  "transcripts": "subcategory.transcripts",
  "degrees": "subcategory.degrees",
  "id-cards": "subcategory.idCards",
  "scholarships": "subcategory.scholarships",
  // Insurance
  "health": "subcategory.health",
  "life": "subcategory.life",
  "vehicle": "subcategory.vehicle",
  "property": "subcategory.property",
  "travel": "subcategory.travel",
  // Personal
  "identity": "subcategory.identity",
  "bank": "subcategory.bank",
  "tax": "subcategory.tax",
  "legal": "subcategory.legal",
};

export const quickActionKeyMap: Record<string, { title: string; subtitle: string }> = {
  "vault": { title: "quickAction.vault.title", subtitle: "quickAction.vault.subtitle" },
  "nominees": { title: "quickAction.nominees.title", subtitle: "quickAction.nominees.subtitle" },
  "time-capsule": { title: "quickAction.timeCapsule.title", subtitle: "quickAction.timeCapsule.subtitle" },
  "inactivity": { title: "quickAction.inactivity.title", subtitle: "quickAction.inactivity.subtitle" },
};

export const getCategoryName = (
  categoryId: string,
  originalName: string,
  t: (key: string) => string
): string => {
  const key = categoryKeyMap[categoryId];
  if (key) {
    const translated = t(key);
    return translated !== key ? translated : originalName;
  }
  return originalName;
};

export const getSubcategoryName = (
  subcategoryId: string,
  originalName: string,
  t: (key: string) => string
): string => {
  const key = subcategoryKeyMap[subcategoryId];
  if (key) {
    const translated = t(key);
    return translated !== key ? translated : originalName;
  }
  return originalName;
};

export const getQuickActionText = (
  actionKey: string,
  field: "title" | "subtitle",
  originalText: string,
  t: (key: string) => string
): string => {
  const mapping = quickActionKeyMap[actionKey];
  if (mapping) {
    const key = field === "title" ? mapping.title : mapping.subtitle;
    const translated = t(key);
    return translated !== key ? translated : originalText;
  }
  return originalText;
};
