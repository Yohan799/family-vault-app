import { Search, Plus, Folder, X, AlertTriangle, FileX, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { categoryNameSchema, sanitizeInput } from "@/lib/validation";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryName } from "@/lib/categoryTranslations";
import { useAuth } from "@/contexts/AuthContext";
import { VaultHomeSkeleton } from "@/components/skeletons";
import { useCategories, useAllDocuments, useAllSubcategories, useInvalidateVault } from "@/hooks/useVaultData";
import { deleteCategoryWithCascade } from "@/services/vaultService";
import BottomNavigation from "@/components/BottomNavigation";

const VaultHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // React Query hooks for cached data fetching
  const { data: customCategories = [], isLoading, isPending } = useCategories(user?.id);
  const { data: allDocuments = [] } = useAllDocuments(user?.id);
  const { data: allSubcategories = [] } = useAllSubcategories(user?.id);
  const { invalidateCategories } = useInvalidateVault();

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; category: any | null }>({
    show: false,
    category: null
  });

  // Long-press state management
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetCategory, setActionSheetCategory] = useState<any | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const userId = user?.id;

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

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Long-press event handlers
  const handlePressStart = useCallback((category: any, e: React.TouchEvent | React.MouseEvent) => {
    if (!category.isCustom) return;
    
    e.preventDefault();
    setIsLongPressing(true);
    
    const timer = setTimeout(() => {
      setActionSheetCategory(category);
      setShowActionSheet(true);
      setIsLongPressing(false);
    }, 500);
    
    setLongPressTimer(timer);
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
  }, [longPressTimer]);

  const handlePressMove = useCallback(() => {
    // Cancel long-press if finger moves
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setIsLongPressing(false);
    }
  }, [longPressTimer]);

  const handleAddCategory = useCallback(async () => {
    const sanitizedName = sanitizeInput(categoryName);
    const validation = categoryNameSchema.safeParse(sanitizedName);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || t("vault.invalidName");
      toast({
        title: t("vault.validationError"),
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
        title: t("vault.categoryCreatedSuccess"),
        description: t("vault.categoryAddedToVault"),
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

      // Invalidate cache to refetch with new category
      invalidateCategories(userId);

      toast({
        title: t("vault.categoryCreatedSuccess"),
        description: `${validation.data} ${t("vault.categoryAddedToVault")}`
      });

      setCategoryName("");
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: t("common.error"),
        description: t("vault.createCategoryFailed"),
        variant: "destructive"
      });
    }
  }, [categoryName, customCategories, userId, toast, invalidateCategories, t]);

  const handleDeleteClick = useCallback((category: any, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!category.isCustom) {
      toast({
        title: t("vault.cannotDeleteDefault"),
        description: t("vault.defaultCannotDelete"),
        variant: "destructive"
      });
      return;
    }

    setDeleteConfirm({ show: true, category });
  }, [toast, t]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm.category || !userId) return;

    const categoryId = deleteConfirm.category.id;
    const catName = deleteConfirm.category.name;

    try {
      await deleteCategoryWithCascade(categoryId, userId);

      // Invalidate cache to refetch without deleted category
      invalidateCategories(userId);

      toast({
        title: t("vault.categoryDeletedSuccess"),
        description: `${catName} ${t("vault.categoryDeletedDesc")}`
      });

      setDeleteConfirm({ show: false, category: null });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: t("common.error"),
        description: t("vault.deleteCategoryFailed"),
        variant: "destructive"
      });
    }
  }, [deleteConfirm.category, userId, toast, invalidateCategories, t]);

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

  if (isLoading || isPending || !user?.id) {
    return <VaultHomeSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen bg-[#FCFCF9] pb-20">
        <div className="bg-[#FCFCF9] p-6 pt-4">
          <h1 className="text-2xl font-bold text-center text-[#1F2121]">{t("vault.title")}</h1>
          <p className="text-center text-[#626C71] text-sm mt-1">{totalDocuments} {t("common.documents")}</p>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors duration-200" />
            <Input
              ref={searchInputRef}
              placeholder={t("vault.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 bg-card border-none rounded-xl shadow-premium-sm focus:shadow-premium-md"
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
                        onClick={() => !isLongPressing && navigate(`/vault/${category.id}`)}
                        onTouchStart={(e) => handlePressStart(category, e)}
                        onTouchEnd={handlePressEnd}
                        onTouchMove={handlePressMove}
                        onMouseDown={(e) => handlePressStart(category, e)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`w-full bg-accent rounded-2xl glass-category transition-transform duration-150 ${
                          isLongPressing ? 'scale-95' : 'scale-100'
                        } ${searchQuery
                          ? "p-4 flex items-center gap-4"
                          : "p-4 h-full flex flex-col items-center justify-between text-center min-h-[140px]"
                          }`}
                      >
                        <div className={searchQuery ? "" : "flex flex-col items-center"}>
                          <div className={`flex items-center justify-center flex-shrink-0 ${searchQuery ? "w-14 h-14" : "w-12 h-12"
                            }`}>
                            <Icon className={`text-primary ${searchQuery ? "w-8 h-8" : "w-7 h-7"}`} />
                          </div>
                          <div className={searchQuery ? "flex-1 text-left" : "w-full mt-2"}>
                            <h3 className={`font-semibold text-foreground line-clamp-2 ${searchQuery ? "text-lg" : "text-base"}`}>
                              {getCategoryName(category.id, category.name, t)}
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchQuery && result.totalMatches > 0
                            ? `${result.totalMatches} ${result.totalMatches === 1 ? t("vault.match") : t("vault.matches")}`
                            : `${category.documentCount} ${t("common.documents")}`
                          }
                        </p>
                      </button>


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
                  className="bg-accent border-2 border-dashed border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center glass-add-button min-h-[140px]"
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <Plus className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t("vault.addCategory")}</h3>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Sheet for Long-Press */}
        {showActionSheet && actionSheetCategory && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
            onClick={() => setShowActionSheet(false)}
          >
            <div 
              className="bg-card rounded-t-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getCategoryName(actionSheetCategory.id, actionSheetCategory.name, t)}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {actionSheetCategory.documentCount} {t("common.documents")}
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setShowActionSheet(false);
                    handleDeleteClick(actionSheetCategory, {} as any);
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  {t("vault.deleteCategory")}
                </Button>
                
                <Button
                  onClick={() => setShowActionSheet(false)}
                  variant="outline"
                  className="w-full"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </div>
        )}

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
        <BottomNavigation activeTab="vault" />


      </div>
    </>
  );
};

export default VaultHome;
