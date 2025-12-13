import { Search, Filter, Home, Settings, Vault, Plus, Folder, X, AlertTriangle, FileX, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { categoryNameSchema, sanitizeInput } from "@/lib/validation";
import { AccessControlModal } from "@/components/vault/AccessControlModal";
import { ActionMenu, createCategoryActionMenu } from "@/components/vault/ActionMenu";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryName } from "@/lib/categoryTranslations";
import { useAuth } from "@/contexts/AuthContext";
import { VaultHomeSkeleton } from "@/components/skeletons";

import { syncDefaultCategories, loadCategoriesOptimized, deleteCategoryWithCascade, getAllUserDocuments, getAllUserSubcategories } from "@/services/vaultService";

const VaultHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Use userId from context instead of calling getUser() repeatedly
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId]);

  // Optimized: Load all data in parallel
  const loadAllData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      // Only sync once per session (check sessionStorage)
      const syncKey = `vault_synced_${userId}`;
      const needsSync = !sessionStorage.getItem(syncKey);

      // Run all data loading in parallel
      const [_, docsResult, subsResult, catsResult] = await Promise.all([
        needsSync ? syncDefaultCategories(userId).then(() => sessionStorage.setItem(syncKey, 'true')) : Promise.resolve(),
        getAllUserDocuments(userId),
        getAllUserSubcategories(userId),
        loadCategoriesOptimized(userId)
      ]);

      setAllDocuments(docsResult);

      // Merge subcategories with hardcoded ones
      const hardcodedSubs = vaultCategories.flatMap(cat =>
        cat.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          icon: sub.icon,
          category_id: cat.id,
          is_custom: false,
        }))
      );
      const subMap = new Map();
      hardcodedSubs.forEach(sub => subMap.set(sub.id, sub));
      subsResult.forEach(sub => subMap.set(sub.id, sub));
      setAllSubcategories(Array.from(subMap.values()));

      // Build categories with counts
      const { categories: customCats, docCountMap } = catsResult;

      const baseCategories = vaultCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        iconBgColor: cat.iconBgColor,
        documentCount: docCountMap.get(cat.id) || 0,
        subcategories: [],
        isCustom: false,
      }));

      const customCatsWithCounts = customCats.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: Folder,
        iconBgColor: cat.icon_bg_color || "bg-yellow-100",
        documentCount: docCountMap.get(cat.id) || 0,
        subcategories: [],
        isCustom: true
      }));

      setCustomCategories([...baseCategories, ...customCatsWithCounts]);
    } catch (error) {
      console.error('Error loading vault data:', error);
      toast({
        title: "Error",
        description: "Failed to load vault data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 100);
      } else {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddCategory = useCallback(async () => {
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
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: validation.data,
          is_custom: true,
          icon_bg_color: "bg-yellow-100"
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      const newCategory = {
        id: data.id,
        name: data.name,
        icon: Folder,
        iconBgColor: "bg-yellow-100",
        documentCount: 0,
        subcategories: [],
        isCustom: true
      };
      setCustomCategories(prev => [...prev, newCategory]);

      toast({
        title: "Category created!",
        description: `${validation.data} has been added to your vault`
      });

      setCategoryName("");
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  }, [categoryName, customCategories, userId, toast]);

  const handleDeleteClick = useCallback((category: any, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!category.isCustom) {
      toast({
        title: "Cannot delete",
        description: "Default categories cannot be deleted",
        variant: "destructive"
      });
      return;
    }

    setDeleteConfirm({ show: true, category });
  }, [toast]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm.category || !userId) return;

    const categoryId = deleteConfirm.category.id;
    const catName = deleteConfirm.category.name;

    try {
      await deleteCategoryWithCascade(categoryId, userId);

      // Optimistic update
      setCustomCategories(prev => prev.filter(c => c.id !== categoryId));

      toast({
        title: "Category deleted",
        description: `${catName} and all related content have been removed`
      });

      setDeleteConfirm({ show: false, category: null });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  }, [deleteConfirm.category, userId, toast]);

  // Memoized calculations
  const totalDocuments = useMemo(() =>
    customCategories.reduce((sum, cat) => sum + cat.documentCount, 0),
    [customCategories]
  );

  // Memoized search results
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

      const matchingSubcategories = allSubcategories.filter(sub =>
        sub.category_id === category.id && sub.name.toLowerCase().includes(query)
      );

      const matchingDocs = allDocuments.filter((doc) => {
        if (doc.category_id !== category.id) return false;

        const nameMatch = doc.file_name?.toLowerCase().includes(query);

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

  if (isLoading) {
    return <VaultHomeSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen bg-[#FCFCF9] pb-20">
        <div className="bg-[#FCFCF9] p-6 pt-14">
          <h1 className="text-2xl font-bold text-center text-[#1F2121]">{t("vault.title")}</h1>
          <p className="text-center text-[#626C71] text-sm mt-1">{totalDocuments} {t("common.documents")}</p>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
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
              <div className="w-16 h-16 bg-[#DBEAFE] rounded-full flex items-center justify-center mb-4">
                <FileX className="w-8 h-8 text-[#2563EB]" />
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
                        className={`w-full bg-[#DBEAFE] rounded-2xl hover:opacity-80 transition-opacity ${searchQuery
                          ? "p-4 flex items-center gap-4"
                          : "p-4 h-full flex flex-col items-center justify-between text-center min-h-[140px]"
                          }`}
                      >
                        <div className={searchQuery ? "" : "flex flex-col items-center"}>
                          <div className={`${category.iconBgColor} rounded-full flex items-center justify-center flex-shrink-0 ${searchQuery ? "w-14 h-14" : "w-12 h-12"
                            }`}>
                            <Icon className={`text-[#2563EB] ${searchQuery ? "w-7 h-7" : "w-6 h-6"}`} />
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
                            className="w-full bg-blue-50 rounded-xl p-3 flex items-center gap-3 hover:bg-blue-100 transition-colors"
                          >
                            <Folder className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                            <span className="font-medium text-[#1F2121] text-sm">{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Expanded Results: Matching Documents */}
                    {searchQuery && result.matchedDocuments && result.matchedDocuments.length > 0 && (
                      <div className="ml-4 space-y-2">
                        {result.matchedDocuments.slice(0, 3).map((doc: any) => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              const subcatId = doc.subcategory_id;
                              if (subcatId) {
                                navigate(`/vault/${category.id}/${subcatId}`);
                              } else {
                                navigate(`/vault/${category.id}`);
                              }
                            }}
                            className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 text-left min-w-0">
                              <span className="font-medium text-[#1F2121] text-sm truncate block">{doc.file_name}</span>
                              <span className="text-xs text-gray-500">
                                {doc.uploaded_at && format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </button>
                        ))}
                        {result.matchedDocuments.length > 3 && (
                          <p className="text-xs text-gray-500 ml-2">
                            +{result.matchedDocuments.length - 3} more documents
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Category Button (only when not searching) */}
              {!searchQuery && (
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-[#DBEAFE] border-2 border-dashed border-[#2563EB] rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:opacity-80 transition-opacity min-h-[140px]"
                >
                  <div className="w-12 h-12 bg-white/60 rounded-full flex items-center justify-center mb-2">
                    <Plus className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <h3 className="font-semibold text-[#1F2121]">{t("vault.addCategory")}</h3>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirm.show && deleteConfirm.category && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t("vault.deleteCategory")}</h2>
              </div>

              <p className="text-foreground mb-2">
                {t("vault.deleteCategoryConfirm")} <span className="font-semibold">{getCategoryName(deleteConfirm.category.id, deleteConfirm.category.name, t)}</span>?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  {deleteConfirm.category.documentCount} {deleteConfirm.category.documentCount === 1 ? t("common.document") : t("common.documents")} {t("vault.willBeDeleted")}
                </p>
                <p className="text-xs text-blue-600 mt-1">{t("vault.cannotUndo")}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, category: null })}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowAddDialog(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-6">{t("vault.addCategory")}</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t("vault.categoryName")}
                  </label>
                  <Input
                    placeholder={t("vault.categoryNamePlaceholder")}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="bg-background border-border"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleAddCategory}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {t("common.create")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">{t("nav.home")}</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-primary relative">
              <Vault className="w-6 h-6" />
              <span className="text-xs font-medium">{t("nav.vault")}</span>
              <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
            </button>
            <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">{t("nav.settings")}</span>
            </button>
          </div>
        </div>

        {/* Access Control Modal */}
        {accessControlCategory && (
          <AccessControlModal
            isOpen={!!accessControlCategory}
            onClose={() => setAccessControlCategory(null)}
            resourceType="category"
            resourceId={accessControlCategory.id}
            resourceName={getCategoryName(accessControlCategory.id, accessControlCategory.name, t)}
          />
        )}
      </div>
    </>
  );
};

export default VaultHome;
