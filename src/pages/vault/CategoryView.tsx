import { ArrowLeft, Search, Filter, Home, Settings, Plus, Folder, X, AlertTriangle } from "lucide-react";
import { Vault as VaultIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { categoryNameSchema, sanitizeInput } from "@/lib/validation";
import { AccessControlModal } from "@/components/vault/AccessControlModal";
import { ActionMenu, createSubcategoryActionMenu } from "@/components/vault/ActionMenu";
import { supabase } from "@/integrations/supabase/client";

const CategoryView = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [customSubcategories, setCustomSubcategories] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalDocumentCount, setTotalDocumentCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; subcategory: any | null }>({
    show: false,
    subcategory: null
  });
  const [accessControlSubcategory, setAccessControlSubcategory] = useState<any | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      let foundCategory = vaultCategories.find((cat) => cat.id === categoryId);

      // If not found in hardcoded categories, check Supabase
      if (!foundCategory) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('categories')
              .select('*')
              .eq('id', categoryId)
              .eq('user_id', user.id)
              .is('deleted_at', null)
              .single();

            if (!error && data) {
              foundCategory = {
                id: data.id,
                name: data.name,
                icon: Folder,
                iconBgColor: data.icon_bg_color || "bg-yellow-100",
                documentCount: 0,
                subcategories: [],
                isCustom: true
              };
            }
          }
        } catch (e) {
          console.error("Error loading category from Supabase:", e);
        }
      }

      // Fallback to localStorage for backward compatibility
      if (!foundCategory) {
        const customCats = localStorage.getItem('custom_categories');
        if (customCats) {
          const parsed = JSON.parse(customCats);
          foundCategory = parsed.find((cat: any) => cat.id === categoryId);
        }
      }

      setCategory(foundCategory);

      if (foundCategory) {
        const stored = localStorage.getItem(`custom_subcategories_${categoryId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const restored = parsed.map((sub: any) => ({
              ...sub,
              icon: Folder
            }));
            setCustomSubcategories(restored);
          } catch (e) {
            console.error("Failed to parse custom subcategories", e);
            setCustomSubcategories([]);
          }
        } else {
          setCustomSubcategories([]);
        }

        // Get total document count from Supabase
        try {
          const { getAllDocumentsInCategory } = await import('@/lib/documentStorage');
          const docs = await getAllDocumentsInCategory(categoryId!);
          setTotalDocumentCount(docs.length);
        } catch (error) {
          console.error("Error loading document count:", error);
          setTotalDocumentCount(0);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [categoryId]);

  const handleAddSubcategory = () => {
    const sanitizedName = sanitizeInput(subcategoryName);
    const validation = categoryNameSchema.safeParse(sanitizedName);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid subcategory name";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    const allSubs = [...(category?.subcategories || []), ...customSubcategories];
    const isDuplicate = allSubs.some(
      sub => sub.name.toLowerCase() === validation.data.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Subcategory already exists",
        description: "This subcategory name is already in use",
        variant: "destructive"
      });
      return;
    }

    const newSubcategory = {
      id: `custom-${Date.now()}`,
      name: validation.data,
      icon: Folder,
      documentCount: 0,
      isCustom: true
    };

    const updated = [...customSubcategories, newSubcategory];
    setCustomSubcategories(updated);
    localStorage.setItem(`custom_subcategories_${categoryId}`, JSON.stringify(updated));

    toast({
      title: "Subcategory created!",
      description: `${validation.data} has been added`
    });

    setSubcategoryName("");
    setShowAddDialog(false);
  };

  const handleDeleteClick = (subcategory: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, subcategory });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.subcategory) return;

    const subcategoryId = deleteConfirm.subcategory.id;
    const subcategoryName = deleteConfirm.subcategory.name;

    const updated = customSubcategories.filter(sub => sub.id !== subcategoryId);
    setCustomSubcategories(updated);
    localStorage.setItem(`custom_subcategories_${categoryId}`, JSON.stringify(updated));
    localStorage.removeItem(`nested_folders_${subcategoryId}`);

    toast({
      title: "Subcategory deleted",
      description: `${subcategoryName} has been removed`
    });

    setDeleteConfirm({ show: false, subcategory: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!category) {
    navigate("/vault");
    return null;
  }

  const CategoryIcon = category?.icon || Folder;
  const allSubcategories = [...(category?.subcategories || []), ...customSubcategories];

  return (
    <div className="min-h-screen bg-[#FCFCF9] pb-20">
      <div className="bg-[#FCFCF9] p-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate("/vault")} className="p-1">
            <ArrowLeft className="w-6 h-6 text-[#1F2121]" />
          </button>
          <div className="flex-1 text-center -ml-10">
            <div className="flex items-center justify-center gap-2">
              <CategoryIcon className="w-6 h-6 text-[#1F2121]" />
              <h1 className="text-2xl font-bold text-[#1F2121]">{category.name}</h1>
            </div>
            <p className="text-[#626C71] text-sm mt-1">{totalDocumentCount} Documents</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-12 pr-12 h-12 bg-[#F5F5F5] border-none rounded-xl"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-6 grid grid-cols-2 gap-3">
        {allSubcategories.map((subcategory) => {
          const SubIcon = subcategory.icon || Folder;
          return (
            <div key={subcategory.id} className="relative">
              <button
                onClick={() => navigate(`/vault/${categoryId}/${subcategory.id}`)}
                className="w-full bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
              >
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <SubIcon className="w-7 h-7 text-[#6D28D9]" />
                </div>
                <h3 className="font-semibold text-[#1F2121] text-center mb-1">{subcategory.name}</h3>
                <p className="text-sm text-[#626C71]">{subcategory.documentCount} Documents</p>
              </button>

              {/* Action Menu - Three dots with Manage Access and Delete */}
              <div className="absolute top-2 right-2 z-10">
                <ActionMenu
                  items={createSubcategoryActionMenu(
                    () => setAccessControlSubcategory(subcategory),
                    subcategory.isCustom ? () => handleDeleteClick(subcategory, { stopPropagation: () => { } } as any) : undefined
                  )}
                />
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#F3E8FF] border-2 border-dashed border-[#6D28D9] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
        >
          <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mb-3">
            <Plus className="w-7 h-7 text-[#6D28D9]" />
          </div>
          <h3 className="font-semibold text-[#1F2121]">Add Subcategory</h3>
        </button>
      </div>


      {
        deleteConfirm.show && deleteConfirm.subcategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Delete Subcategory?</h2>
              </div>

              <p className="text-foreground mb-2">
                Are you sure you want to delete <span className="font-semibold">{deleteConfirm.subcategory.name}</span>?
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-purple-800 font-medium">
                  {deleteConfirm.subcategory.documentCount} {deleteConfirm.subcategory.documentCount === 1 ? 'document' : 'documents'} will be deleted
                </p>
                <p className="text-xs text-purple-600 mt-1">This action cannot be undone</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, subcategory: null })}
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
        )
      }

      {
        showAddDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowAddDialog(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-6">Add Subcategory</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Subcategory Name
                  </label>
                  <Input
                    placeholder="e.g. Home 1, Property A, etc."
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                    className="bg-background border-border"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
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
                    onClick={handleAddSubcategory}
                    className="flex-1"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {accessControlSubcategory && (
        <AccessControlModal
          resourceType="subcategory"
          resourceId={accessControlSubcategory.id}
          resourceName={accessControlSubcategory.name}
          onClose={() => setAccessControlSubcategory(null)}
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
            <VaultIcon className="w-6 h-6" />
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

export default CategoryView;
