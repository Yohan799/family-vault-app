import { Search, Filter, Upload, FileText, Home, Settings, Folder, Plus, X, AlertTriangle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Vault as VaultIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";
import { DocumentOptionsModal } from "@/components/vault/DocumentOptionsModal";
import { LockDocumentModal } from "@/components/vault/LockDocumentModal";
import { RenameDocumentModal } from "@/components/vault/RenameDocumentModal";
import { categoryNameSchema, sanitizeInput } from "@/lib/validation";
import { AccessControlModal } from "@/components/vault/AccessControlModal";
import { ActionMenu, createDocumentActionMenu } from "@/components/vault/ActionMenu";
import { DocumentViewerModal } from "@/components/vault/DocumentViewerModal";
import { filterItems, debounce } from "@/lib/searchUtils";
import { SubcategoryViewSkeleton } from "@/components/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSubcategoryName } from "@/lib/categoryTranslations";
import { PullToRefresh } from "@/components/PullToRefresh";
import { getDocuments, formatFileSize, deleteDocument, downloadDocument, incrementViewCount } from "@/lib/documentStorage";

const SubcategoryView = () => {
  const navigate = useNavigate();
  const { categoryId, subcategoryId } = useParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState({ name: "", id: "" });
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [nestedFolders, setNestedFolders] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; folder: any | null }>({ show: false, folder: null });
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<{ show: boolean; doc: any | null }>({ show: false, doc: null });
  const [accessControlDocument, setAccessControlDocument] = useState<any | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/vault");
        return;
      }

      // Check if default category first
      const defaultCategory = vaultCategories.find(cat => cat.id === categoryId);

      // Load category from database if not default
      let foundCategory: any = null;
      if (defaultCategory) {
        foundCategory = {
          id: defaultCategory.id,
          name: defaultCategory.name,
          icon: defaultCategory.icon,
          iconBgColor: defaultCategory.iconBgColor,
          subcategories: defaultCategory.subcategories,
          isCustom: false
        };
      } else {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle();

        if (categoryData) {
          foundCategory = {
            id: categoryData.id,
            name: categoryData.name,
            icon: Folder,
            iconBgColor: categoryData.icon_bg_color || "bg-yellow-100",
            subcategories: [],
            isCustom: true
          };
        }
      }

      if (!foundCategory) {
        setLoading(false);
        navigate("/vault");
        return;
      }
      setCategory(foundCategory);

      // Check if default subcategory first
      const defaultSub = defaultCategory?.subcategories?.find(sub => sub.id === subcategoryId);

      let foundSubcategory: any = null;
      if (defaultSub) {
        foundSubcategory = {
          id: defaultSub.id,
          name: defaultSub.name,
          icon: defaultSub.icon,
          isCustom: false
        };
      } else {
        const { data: subData } = await supabase
          .from('subcategories')
          .select('*')
          .eq('id', subcategoryId)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle();

        if (subData) {
          foundSubcategory = {
            id: subData.id,
            name: subData.name,
            icon: Folder,
            isCustom: true
          };
        }
      }

      if (!foundSubcategory) {
        setLoading(false);
        navigate(`/vault/${categoryId}`);
        return;
      }
      setSubcategory(foundSubcategory);

      // Load folders from database
      const { data: foldersData } = await supabase
        .from('folders')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('user_id', user.id)
        .is('parent_folder_id', null)
        .is('deleted_at', null);

      const folders = (foldersData || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        icon: Folder,
        documentCount: 0,
        isCustom: true
      }));
      setNestedFolders(folders);

      // Load documents from Supabase
      const storedDocs = await getDocuments(categoryId!, subcategoryId!);

      // Format documents for display
      const formattedDocs = storedDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        size: formatFileSize(doc.size),
        date: new Date(doc.date).toLocaleDateString(),
      }));

      setDocuments(formattedDocs);
      setLoading(false);
    } catch (error) {
      console.error("Error loading subcategory data:", error);
      toast({
        title: "Error",
        description: "Failed to load subcategory data",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const debouncedSearch = debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300);

    debouncedSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [categoryId, subcategoryId]);

  const handleAddFolder = async () => {
    const sanitizedName = sanitizeInput(folderName);
    const validation = categoryNameSchema.safeParse(sanitizedName);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid folder name";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    const isDuplicate = nestedFolders.some(
      folder => folder.name.toLowerCase() === validation.data.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Folder already exists",
        description: "This folder name is already in use",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newFolderData, error } = await supabase
        .from('folders')
        .insert({
          name: validation.data,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newFolder = {
        id: newFolderData.id,
        name: newFolderData.name,
        icon: Folder,
        documentCount: 0,
        isCustom: true
      };

      setNestedFolders([...nestedFolders, newFolder]);

      toast({
        title: "Folder created!",
        description: `${validation.data} has been added`
      });

      setFolderName("");
      setShowAddFolderDialog(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, folder });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.folder) return;

    const folderIdToDelete = deleteConfirm.folder.id;
    const folderNameToDelete = deleteConfirm.folder.name;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete folders",
          variant: "destructive"
        });
        setDeleteConfirm({ show: false, folder: null });
        return;
      }

      const { error } = await supabase
        .from('folders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', folderIdToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      const updated = nestedFolders.filter(f => f.id !== folderIdToDelete);
      setNestedFolders(updated);

      toast({
        title: "Folder deleted",
        description: `${folderNameToDelete} has been removed`
      });

      setDeleteConfirm({ show: false, folder: null });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
      setDeleteConfirm({ show: false, folder: null });
    }
  };

  const handleDocumentOptions = (doc: any) => {
    setSelectedDoc({ name: doc.name, id: doc.id });
    setOptionsOpen(true);
  };

  const handleLockDocument = () => {
    setOptionsOpen(false);
    setLockOpen(true);
  };

  const handleDownloadDocument = useCallback(async (doc: any) => {
    try {
      const storedDocs = await getDocuments(categoryId!, subcategoryId!);
      const fullDoc = storedDocs.find(d => d.id === doc.id);

      if (!fullDoc) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive"
        });
        return;
      }

      await downloadDocument(fullDoc);

      toast({
        title: "Download started",
        description: `Downloading ${doc.name}`,
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download failed",
        description: "Could not download the document",
        variant: "destructive"
      });
    }
  }, [categoryId, subcategoryId, toast]);

  const handleViewDocument = useCallback(async (doc: any) => {
    try {
      const storedDocs = await getDocuments(categoryId!, subcategoryId!);
      const fullDoc = storedDocs.find(d => d.id === doc.id);

      if (!fullDoc) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive"
        });
        return;
      }

      if (!fullDoc.fileUrl) {
        toast({
          title: "Error",
          description: "Document URL is not available. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Increment view count (don't await to not block UI)
      incrementViewCount(fullDoc.id);

      // Open in modal viewer
      setViewingDoc({
        fileUrl: fullDoc.fileUrl,
        name: fullDoc.name,
        type: fullDoc.type
      });
      setViewerOpen(true);
    } catch (error) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: "Could not open the document. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  }, [categoryId, subcategoryId, toast]);

  const handleDeleteDocument = (doc: any) => {
    setDeleteDocConfirm({ show: true, doc });
  };

  const confirmDeleteDocument = useCallback(async () => {
    if (!deleteDocConfirm.doc) return;

    try {
      const result = await deleteDocument(deleteDocConfirm.doc.id);

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to delete document",
          variant: "destructive"
        });
        setDeleteDocConfirm({ show: false, doc: null });
        return;
      }

      // Update state immediately (optimistic update)
      setDocuments(prev => prev.filter(d => d.id !== deleteDocConfirm.doc!.id));

      toast({
        title: "Document deleted",
        description: `${deleteDocConfirm.doc.name} has been removed`,
      });

      setDeleteDocConfirm({ show: false, doc: null });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Could not delete the document. Please try again.",
        variant: "destructive"
      });
      setDeleteDocConfirm({ show: false, doc: null });
    }
  }, [deleteDocConfirm.doc, toast]);

  if (loading) {
    return <SubcategoryViewSkeleton />;
  }

  if (!category || !subcategory) {
    navigate("/vault");
    return null;
  }

  const SubcategoryIcon = subcategory.icon || Folder;

  // Filter folders and documents based on search
  const filteredFolders = filterItems(nestedFolders, debouncedQuery, {
    searchKeys: ['name'],
  });

  const filteredDocuments = filterItems(documents, debouncedQuery, {
    searchKeys: ['name'],
    dateKeys: ['date'],
    filenameKeys: ['name']
  });

  const hasSearchResults = filteredFolders.length > 0 || filteredDocuments.length > 0;
  const showNoResults = debouncedQuery && !hasSearchResults;

  return (
    <>
      <PullToRefresh onRefresh={loadData} className="min-h-screen bg-[#FCFCF9] pb-20">
        <div className="bg-[#FCFCF9] p-6">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
            <div className="flex-1 text-center -ml-10">
              <div className="flex items-center justify-center gap-2">
                <SubcategoryIcon className="w-6 h-6 text-[#1F2121]" />
                <h1 className="text-2xl font-bold text-[#1F2121]">{getSubcategoryName(subcategory.id, subcategory.name, t)}</h1>
              </div>
              <p className="text-[#626C71] text-sm mt-1">{documents.length} {t("common.documents")}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t("folder.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 bg-[#F5F5F5] border-none rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-accent rounded-full p-1"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {showNoResults && (
          <div className="px-6 text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">{t("folder.noResults")}</p>
            <p className="text-muted-foreground/60 text-sm mt-2">{t("folder.tryDifferent")}</p>
          </div>
        )}

        {filteredFolders.length > 0 && !showNoResults && (
          <div className="px-6 mb-6">
            <h2 className="text-lg font-semibold text-[#1F2121] mb-3">{t("folder.folders")}</h2>
            <div className="grid grid-cols-2 gap-3 items-stretch">
              {filteredFolders.map((folder) => (
                <div key={folder.id} className="relative h-full">
                  <button
                    onClick={() => navigate(`/vault/${categoryId}/${subcategoryId}/${folder.id}`)}
                    className="w-full h-full bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center justify-between hover:opacity-80 transition-opacity min-h-[160px]"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <Folder className="w-7 h-7 text-[#6D28D9]" />
                      </div>
                      <h3 className="font-semibold text-[#1F2121] text-center mb-1 line-clamp-2">{folder.name}</h3>
                    </div>
                    <p className="text-sm text-[#626C71]">{folder.documentCount || 0} {t("common.documents")}</p>
                  </button>

                  {folder.isCustom && (
                    <button
                      onClick={(e) => handleDeleteClick(folder, e)}
                      className="absolute top-2 right-2 w-7 h-7 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors z-10"
                      title="Delete folder"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ))}

              {!debouncedQuery && (
                <button
                  onClick={() => setShowAddFolderDialog(true)}
                  className="bg-[#F3E8FF] border-2 border-dashed border-[#6D28D9] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity min-h-[160px]"
                >
                  <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-7 h-7 text-[#6D28D9]" />
                  </div>
                  <h3 className="font-semibold text-[#1F2121]">{t("folder.addFolder")}</h3>
                </button>
              )}
            </div>
          </div>
        )}

        {nestedFolders.length === 0 && !debouncedQuery && !showNoResults && (
          <div className="px-6 mb-6">
            <button
              onClick={() => setShowAddFolderDialog(true)}
              className="w-full bg-[#F3E8FF] border-2 border-dashed border-[#6D28D9] rounded-2xl p-6 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
            >
              <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-[#6D28D9]" />
              </div>
              <h3 className="font-semibold text-[#1F2121] mb-1">{t("folder.createFolder")}</h3>
              <p className="text-sm text-[#626C71]">{t("folder.organizeDocuments")}</p>
            </button>
          </div>
        )}

        {!showNoResults && (
          <div className="px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1F2121]">{t("common.documents")}</h2>
              {filteredDocuments.length > 0 && (
                <Button
                  onClick={() => setUploadOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("folder.upload")}
                </Button>
              )}
            </div>

            {filteredDocuments.length === 0 && !debouncedQuery ? (
              <div className="bg-card rounded-2xl p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t("folder.noDocuments")}</p>
                <Button
                  onClick={() => setUploadOpen(true)}
                  variant="outline"
                  className="min-h-[44px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("folder.uploadDocument")}
                </Button>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-card rounded-xl p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground truncate">{doc.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {doc.size} • {doc.date}
                        </p>
                      </div>
                    </div>
                    <ActionMenu
                      items={createDocumentActionMenu(
                        () => handleViewDocument(doc),
                        () => handleDownloadDocument(doc),
                        () => setAccessControlDocument(doc),
                        () => handleDeleteDocument(doc)
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Folder Delete Confirmation */}
        {deleteConfirm.show && deleteConfirm.folder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t("folder.deleteTitle")}</h2>
              </div>

              <p className="text-foreground mb-2">
                {t("folder.deleteConfirm")} <span className="font-semibold">{deleteConfirm.folder.name}</span>?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  {deleteConfirm.folder.documentCount || 0} {t("common.documents")} {t("folder.willBeDeleted")}
                </p>
                <p className="text-xs text-red-600 mt-1">{t("folder.cannotUndo")}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, folder: null })}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document Delete Confirmation */}
        {deleteDocConfirm.show && deleteDocConfirm.doc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t("folder.deleteDocTitle")}</h2>
              </div>

              <p className="text-foreground mb-4">
                {t("folder.deleteDocConfirm")} <span className="font-semibold">{deleteDocConfirm.doc.name}</span>?
              </p>

              <p className="text-sm text-red-600 mb-6">{t("folder.cannotUndo")}</p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDocConfirm({ show: false, doc: null })}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={confirmDeleteDocument}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Folder Dialog */}
        {showAddFolderDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowAddFolderDialog(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-6">{t("folder.addFolder")}</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t("folder.folderName")}
                  </label>
                  <Input
                    placeholder={t("folder.folderPlaceholder")}
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="bg-background border-border"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFolderDialog(false)}
                    className="flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleAddFolder}
                    className="flex-1"
                  >
                    {t("common.add")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <UploadDocumentModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          subcategoryName={subcategory.name}
          categoryId={categoryId!}
          subcategoryId={subcategoryId!}
          onUploadComplete={loadData}
        />

        <DocumentOptionsModal
          open={optionsOpen}
          onOpenChange={setOptionsOpen}
          documentName={selectedDoc.name}
          documentId={selectedDoc.id}
          categoryId={categoryId!}
          subcategoryId={subcategoryId!}
          onDelete={loadData}
          onView={(fileUrl, name, type) => {
            setViewingDoc({ fileUrl, name, type });
            setViewerOpen(true);
          }}
          onRename={() => setRenameOpen(true)}
        />

        <RenameDocumentModal
          open={renameOpen}
          onOpenChange={setRenameOpen}
          documentId={selectedDoc.id}
          currentName={selectedDoc.name}
          onRenameSuccess={loadData}
        />

        <LockDocumentModal
          open={lockOpen}
          onOpenChange={(open) => setLockOpen(open)}
          documentName={selectedDoc.name}
        />

        {accessControlDocument && (
          <AccessControlModal
            resourceType="document"
            resourceId={accessControlDocument.id}
            resourceName={accessControlDocument.name}
            onClose={() => setAccessControlDocument(null)}
          />
        )}

        <DocumentViewerModal
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewingDoc(null);
          }}
          documentUrl={viewingDoc?.fileUrl || ''}
          documentName={viewingDoc?.name || ''}
          documentType={viewingDoc?.type || ''}
        />
      </PullToRefresh>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.home")}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-primary relative">
            <VaultIcon className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.vault")}</span>
            <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.settings")}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SubcategoryView;
