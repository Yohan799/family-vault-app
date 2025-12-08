import { Search, Filter, Home, Settings, Vault, Plus, Folder, X, AlertTriangle, FileX, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { categoryNameSchema, sanitizeInput } from "@/lib/validation";
import { AccessControlModal } from "@/components/vault/AccessControlModal";
import { ActionMenu, createCategoryActionMenu } from "@/components/vault/ActionMenu";
import { format, parse } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryName } from "@/lib/categoryTranslations";

const VaultHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<any[]>([]);
  // Initialize with hardcoded categories immediately for instant display
  const [customCategories, setCustomCategories] = useState<any[]>(
    vaultCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      iconBgColor: cat.iconBgColor,
      documentCount: 0,
      subcategories: [],
      isCustom: false,
    }))
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; category: any | null }>({
    show: false,
    category: null
  });
  const [accessControlCategory, setAccessControlCategory] = useState<any | null>(null);

  useEffect(() => {
    loadCategories();
    loadAllDocuments();
    loadAllSubcategories();
  }, []);

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        // Search is performed via useMemo below
        setTimeout(() => setIsSearching(false), 100);
      } else {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadAllDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { getAllUserDocuments } = await import('@/services/vaultService');
      const docs = await getAllUserDocuments(user.id);
      setAllDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadAllSubcategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { getAllUserSubcategories } = await import('@/services/vaultService');
      const subs = await getAllUserSubcategories(user.id);

      // Merge with hardcoded subcategories from vaultCategories
      const hardcodedSubs = vaultCategories.flatMap(cat =>
        cat.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          icon: sub.icon,
          category_id: cat.id,
          is_custom: false,
        }))
      );

      // Combine database subcategories with hardcoded ones (database takes priority)
      const subMap = new Map();
      hardcodedSubs.forEach(sub => subMap.set(sub.id, sub));
      subs.forEach(sub => subMap.set(sub.id, sub));

      setAllSubcategories(Array.from(subMap.values()));
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signin");
        return;
      }

      // Sync default categories first
      const { syncDefaultCategories, getCategoryDocumentCount } = await import('@/services/vaultService');
      await syncDefaultCategories(user.id);

      // Start with hardcoded default categories as the base
      const baseCategories = vaultCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        iconBgColor: cat.iconBgColor,
        documentCount: 0,
        subcategories: [],
        isCustom: false,
      }));

      // Query custom categories from database
      const { data: customCatsData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_custom', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading custom categories:", error);
      }

      // Add custom categories to the list
      const customCats = await Promise.all((customCatsData || []).map(async (cat: any) => {
        const docCount = await getCategoryDocumentCount(cat.id, user.id);
        return {
          id: cat.id,
          name: cat.name,
          icon: Folder,
          iconBgColor: cat.icon_bg_color || "bg-yellow-100",
          documentCount: docCount,
          subcategories: [],
          isCustom: true
        };
      }));

      // Get document counts for default categories
      const categoriesWithCounts = await Promise.all(baseCategories.map(async (cat) => {
        const docCount = await getCategoryDocumentCount(cat.id, user.id);
        return {
          ...cat,
          documentCount: docCount
        };
      }));

      // Merge: defaults + custom categories
      const allCats = [...categoriesWithCounts, ...customCats];

      setCustomCategories(allCats);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Showing default categories.",
        variant: "destructive"
      });
      // Fallback to hardcoded defaults on error
      setCustomCategories(vaultCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        iconBgColor: cat.iconBgColor,
        documentCount: 0,
        subcategories: [],
        isCustom: false,
      })));
    }
  };

  const handleAddCategory = async () => {
    const sanitizedName = sanitizeInput(categoryName);
    const validation = categoryNameSchema.safeParse(sanitizedName);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid category name";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    const isDuplicate = customCategories.some(
      cat => cat.name.toLowerCase() === validation.data.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Category already exists",
        description: "This category name is already in use",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: validation.data,
          is_custom: true,
          icon_bg_color: "bg-yellow-100"
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Category created!",
        description: `${validation.data} has been added to your vault`
      });

      setCategoryName("");
      setShowAddDialog(false);
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (category: any, e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent deletion of default categories
    if (!category.isCustom) {
      toast({
        title: "Cannot delete",
        description: "Default categories cannot be deleted",
        variant: "destructive"
      });
      return;
    }

    setDeleteConfirm({ show: true, category });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.category) return;

    const categoryId = deleteConfirm.category.id;
    const categoryName = deleteConfirm.category.name;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Use cascade delete from vault service
      const { deleteCategoryWithCascade } = await import('@/services/vaultService');
      await deleteCategoryWithCascade(categoryId, user.id);

      toast({
        title: "Category deleted",
        description: `${categoryName} and all related content have been removed`
      });

      setDeleteConfirm({ show: false, category: null });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  const totalDocuments = customCategories.reduce((sum, cat) => sum + cat.documentCount, 0);

  // Perform comprehensive search and filter results
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return customCategories.map(cat => ({
        category: cat,
        matchedSubcategories: [],
        matchedDocuments: [],
        totalMatches: 0,
      }));
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    customCategories.forEach((category) => {
      const categoryMatches = category.name.toLowerCase().includes(query);

      // Find matching subcategories for this category
      const matchingSubcategories = allSubcategories.filter(sub =>
        sub.category_id === category.id && sub.name.toLowerCase().includes(query)
      );

      // Find matching documents (at category level or subcategory level)
      const matchingDocs = allDocuments.filter((doc) => {
        if (doc.category_id !== category.id) return false;

        // Match by document name
        const nameMatch = doc.file_name?.toLowerCase().includes(query);

        // Match by upload date (flexible parsing)
        let dateMatch = false;
        if (doc.uploaded_at) {
          try {
            const uploadDate = new Date(doc.uploaded_at);
            const formattedDate = format(uploadDate, 'MMM dd, yyyy').toLowerCase();
            const yearOnly = format(uploadDate, 'yyyy');
            const monthOnly = format(uploadDate, 'MMM').toLowerCase();
            const dayMonth = format(uploadDate, 'dd MMM').toLowerCase();

            dateMatch = formattedDate.includes(query) ||
              yearOnly.includes(query) ||
              monthOnly.includes(query) ||
              dayMonth.includes(query);
          } catch (e) {
            // Invalid date, skip
          }
        }

        return nameMatch || dateMatch;
      });

      // Include category if it matches or has matching subcategories or documents
      if (categoryMatches || matchingSubcategories.length > 0 || matchingDocs.length > 0) {
        results.push({
          category: category,
          matchedSubcategories: matchingSubcategories,
          matchedDocuments: matchingDocs,
          totalMatches: matchingSubcategories.length + matchingDocs.length,
        });
      }
    });

    return results;
  }, [searchQuery, customCategories, allDocuments, allSubcategories]);

  const allCategories = searchQuery ? filteredResults : filteredResults.map(r => r.category);

  return (
    <div className="min-h-screen bg-[#FCFCF9] pb-20">
      <div className="bg-[#FCFCF9] p-6">
        <h1 className="text-2xl font-bold text-center text-[#1F2121]">{t("vault.title")}</h1>
        <p className="text-center text-[#626C71] text-sm mt-1">{totalDocuments} {t("common.documents")}</p>

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("vault.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-12 bg-[#F5F5F5] border-none rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-[#626C71] mt-2">
            {t("vault.resultsFound", { count: filteredResults.length })}
          </p>
        )}
      </div>

      <div className="px-6">
        {filteredResults.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center mb-4">
              <FileX className="w-8 h-8 text-[#6D28D9]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1F2121] mb-2">{t("vault.noResults")}</h3>
            <p className="text-sm text-[#626C71] max-w-xs">
              {t("vault.noResultsDesc")}
            </p>
            <Button
              onClick={() => setSearchQuery("")}
              className="mt-4"
              variant="outline"
            >
              {t("vault.clearSearch")}
            </Button>
          </div>
        ) : (
          <div className={searchQuery ? "space-y-4" : "grid grid-cols-2 gap-3 items-stretch"}>
            {filteredResults.map((result) => {
              const category = result.category;
              const Icon = category.icon;

              return (
                <div key={category.id} className={searchQuery ? "space-y-2" : "h-full"}>
                  {/* Category Tile */}
                  <div className="relative h-full">
                    <button
                      onClick={() => navigate(`/vault/${category.id}`)}
                      className={`w-full bg-[#F3E8FF] rounded-2xl hover:opacity-80 transition-opacity ${searchQuery
                        ? "p-4 flex items-center gap-4"
                        : "p-4 h-full flex flex-col items-center justify-between text-center min-h-[140px]"
                        }`}
                    >
                      <div className={searchQuery ? "" : "flex flex-col items-center"}>
                        <div className={`${category.iconBgColor} rounded-full flex items-center justify-center flex-shrink-0 ${searchQuery ? "w-14 h-14" : "w-12 h-12"
                          }`}>
                          <Icon className={`text-[#6D28D9] ${searchQuery ? "w-7 h-7" : "w-6 h-6"}`} />
                        </div>
                        <div className={searchQuery ? "flex-1 text-left" : "w-full mt-2"}>
                          <h3 className={`font-semibold text-[#1F2121] line-clamp-2 ${searchQuery ? "text-lg" : "text-base"}`}>
                            {getCategoryName(category.id, category.name, t)}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-[#626C71] mt-1">
                        {searchQuery && result.totalMatches > 0
                          ? `${result.totalMatches} ${result.totalMatches === 1 ? t("vault.match") : t("vault.matches")}`
                          : `${category.documentCount} ${t("common.documents")}`
                        }
                      </p>
                    </button>

                    {/* Action Menu - Always show for all categories */}
                    <div className="absolute top-2 right-2 z-10">
                      <ActionMenu
                        items={createCategoryActionMenu(
                          () => setAccessControlCategory(category),
                          category.isCustom ? () => handleDeleteClick(category, { stopPropagation: () => { } } as any) : undefined
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded Results: Matching Subcategories */}
                  {searchQuery && result.matchedSubcategories && result.matchedSubcategories.length > 0 && (
                    <div className="ml-4 space-y-2">
                      {result.matchedSubcategories.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/vault/${category.id}/${sub.id}`)}
                          className="w-full bg-purple-50 rounded-xl p-3 flex items-center gap-3 hover:bg-purple-100 transition-colors"
                        >
                          <Folder className="w-5 h-5 text-[#6D28D9] flex-shrink-0" />
                          <span className="font-medium text-[#1F2121] text-sm">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Expanded Results: Matching Documents (show first 3) */}
                  {searchQuery && result.matchedDocuments && result.matchedDocuments.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {result.matchedDocuments.slice(0, 3).map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-2 text-sm text-[#626C71] py-1">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{doc.file_name}</span>
                        </div>
                      ))}
                      {result.matchedDocuments.length > 3 && (
                        <p className="text-xs text-[#626C71] pl-6">
                          +{result.matchedDocuments.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!searchQuery && (
              <button
                onClick={() => setShowAddDialog(true)}
                className="w-full bg-[#F3E8FF] border-2 border-dashed border-[#6D28D9] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-7 h-7 text-[#6D28D9]" />
                </div>
                <h3 className="font-semibold text-[#1F2121]">Add Category</h3>
              </button>
            )}
          </div>
        )}
      </div>

      {deleteConfirm.show && deleteConfirm.category && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Delete Category?</h2>
            </div>

            <p className="text-foreground mb-2">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.category.name}</span>?
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-purple-800 font-medium">
                {deleteConfirm.category.documentCount} {deleteConfirm.category.documentCount === 1 ? 'document' : 'documents'} will be deleted
              </p>
              <p className="text-xs text-purple-600 mt-1">This action cannot be undone</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm({ show: false, category: null })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-3xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowAddDialog(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-foreground mb-6">Add Category</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category Name
                </label>
                <Input
                  placeholder="e.g. Vehicles, Investments, etc."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="bg-background border-border"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCategory}
                  className="flex-1"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {accessControlCategory && (
        <AccessControlModal
          resourceType="category"
          resourceId={accessControlCategory.id}
          resourceName={accessControlCategory.name}
          onClose={() => setAccessControlCategory(null)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-primary relative">
            <Vault className="w-6 h-6" />
            <span className="text-xs font-medium">Vault</span>
            <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VaultHome;
