import { Search, Filter, Upload, MoreVertical, FileText, Home, Settings, Folder, Plus, X, AlertTriangle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Vault as VaultIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";
import { DocumentOptionsModal } from "@/components/vault/DocumentOptionsModal";
import { LockDocumentModal } from "@/components/vault/LockDocumentModal";
import { RenameDocumentModal } from "@/components/vault/RenameDocumentModal";
import { categoryNameSchema, sanitizeInput } from "@/lib/validation";
import { filterItems, debounce } from "@/lib/searchUtils";
import { supabase } from "@/integrations/supabase/client";


const NestedFolderView = () => {
  const navigate = useNavigate();
  const { categoryId, subcategoryId, folderId } = useParams();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState({ name: "", id: "" });
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [nestedFolders, setNestedFolders] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; folder: any | null }>({
    show: false,
    folder: null
  });
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);
  const [renameOpen, setRenameOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const debouncedSearch = debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300);

    debouncedSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    loadFolderData();
  }, [folderId, subcategoryId, categoryId, navigate, toast]);

  const loadFolderData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/vault");
        return;
      }

      // Load current folder from database
      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (!folderData) {
        navigate(`/vault/${categoryId}/${subcategoryId}`);
        return;
      }

      setCurrentFolder({
        id: folderData.id,
        name: folderData.name,
        documentCount: 0,
        depth: 1,
        isCustom: true
      });

      // Load nested folders from database
      const { data: nestedFoldersData } = await supabase
        .from('folders')
        .select('*')
        .eq('parent_folder_id', folderId)
        .eq('user_id', user.id)
        .is('deleted_at', null);

      const folders = (nestedFoldersData || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        icon: Folder,
        documentCount: 0,
        depth: 2,
        isCustom: true
      }));
      setNestedFolders(folders);

      // Load documents from Supabase
      const { getDocuments, formatFileSize } = await import('@/lib/documentStorage');
      const storedDocs = await getDocuments(categoryId!, subcategoryId!, folderId);

      const formattedDocs = storedDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        size: formatFileSize(doc.size),
        date: new Date(doc.date).toLocaleDateString(),
      }));
      setDocuments(formattedDocs);

      setLoading(false);
    } catch (error) {
      console.error("Error loading folder data:", error);
      toast({
        title: "Error",
        description: "Failed to load folder data",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

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

    const currentDepth = currentFolder?.depth || 1;
    if (currentDepth >= 3) {
      toast({
        title: "Maximum depth reached",
        description: "Cannot create folders beyond 3 levels deep",
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
          parent_folder_id: folderId,
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
        depth: currentDepth + 1,
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
    if (!deleteConfirm.folder || isDeletingFolder) return;

    const folderIdToDelete = deleteConfirm.folder.id;
    const folderNameToDelete = deleteConfirm.folder.name;

    setIsDeletingFolder(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete folders",
          variant: "destructive"
        });
        setDeleteConfirm({ show: false, folder: null });
        setIsDeletingFolder(false);
        return;
      }

      console.log('[NestedFolderView] Deleting folder:', folderIdToDelete, 'for user:', user.id);

      const { data, error } = await supabase
        .from('folders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', folderIdToDelete)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[NestedFolderView] Delete error:', error);
        throw error;
      }

      // Verify the update actually modified a row
      if (!data || data.length === 0) {
        console.error('[NestedFolderView] No rows updated - folder not found or permission denied');
        throw new Error("Folder not found or you don't have permission to delete it");
      }

      console.log('[NestedFolderView] Folder deleted successfully:', data);

      const updated = nestedFolders.filter(f => f.id !== folderIdToDelete);
      setNestedFolders(updated);

      toast({
        title: "Folder deleted",
        description: `${folderNameToDelete} has been removed`
      });

      setDeleteConfirm({ show: false, folder: null });
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete folder",
        variant: "destructive"
      });
      setDeleteConfirm({ show: false, folder: null });
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const handleDocumentOptions = (doc: any) => {
    setSelectedDoc(doc);
    setOptionsOpen(true);
  };

  const handleLockDocument = () => {
    setOptionsOpen(false);
    setLockOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!currentFolder) {
    navigate(`/vault/${categoryId}/${subcategoryId}`);
    return null;
  }

  const canAddMore = (currentFolder?.depth || 0) < 3;

  // Filter folders based on search
  const filteredFolders = filterItems(nestedFolders, debouncedQuery, {
    searchKeys: ['name'],
  });

  const showNoResults = debouncedQuery && filteredFolders.length === 0;

  return (
    <>
      <div className="min-h-screen bg-[#FCFCF9] pb-20">
        <div className="bg-[#FCFCF9] p-6 pt-14">
          <div className="flex items-center gap-4 mb-4">
            <BackButton to={`/vault/${categoryId}/${subcategoryId}`} />
            <div className="flex-1 text-center -ml-10">
              <div className="flex items-center justify-center gap-2">
                <Folder className="w-6 h-6 text-[#1F2121]" />
                <h1 className="text-2xl font-bold text-[#1F2121]">{currentFolder.name}</h1>
              </div>
              <p className="text-[#626C71] text-sm mt-1">{currentFolder.documentCount || 0} Documents</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
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
            <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No matching folders found</p>
            <p className="text-muted-foreground/60 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {filteredFolders.length > 0 && !showNoResults && (
          <div className="px-6 mb-6">
            <h2 className="text-lg font-semibold text-[#1F2121] mb-3">Subfolders</h2>
            <div className="grid grid-cols-2 gap-3">
              {filteredFolders.map((folder) => (
                <div key={folder.id} className="relative">
                  <button
                    onClick={() => navigate(`/vault/${categoryId}/${subcategoryId}/${folder.id}`)}
                    className="w-full bg-[#DBEAFE] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                      <Folder className="w-7 h-7 text-[#2563EB]" />
                    </div>
                    <h3 className="font-semibold text-[#1F2121] text-center mb-1">{folder.name}</h3>
                    <p className="text-sm text-[#626C71]">{folder.documentCount || 0} Documents</p>
                  </button>

                  {folder.isCustom && (
                    <button
                      onClick={(e) => handleDeleteClick(folder, e)}
                      className="absolute top-1 right-1 w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors z-10 touch-manipulation"
                      title="Delete folder"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ))}

              {canAddMore && !debouncedQuery && (
                <button
                  onClick={() => setShowAddFolderDialog(true)}
                  className="bg-[#DBEAFE] border-2 border-dashed border-[#2563EB] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-7 h-7 text-[#2563EB]" />
                  </div>
                  <h3 className="font-semibold text-[#1F2121]">Add Folder</h3>
                </button>
              )}
            </div>
          </div>
        )}

        {nestedFolders.length === 0 && canAddMore && !debouncedQuery && !showNoResults && (
          <div className="px-6 mb-6">
            <button
              onClick={() => setShowAddFolderDialog(true)}
              className="w-full bg-[#DBEAFE] border-2 border-dashed border-[#2563EB] rounded-2xl p-6 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
            >
              <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-[#2563EB]" />
              </div>
              <h3 className="font-semibold text-[#1F2121] mb-1">Create Subfolder</h3>
              <p className="text-sm text-[#626C71]">Organize documents into subfolders</p>
            </button>
          </div>
        )}

        {!showNoResults && (
          <div className="px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1F2121]">Documents</h2>
              <Button
                onClick={() => setUploadOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No documents yet</p>
                <Button
                  onClick={() => setUploadOpen(true)}
                  variant="outline"
                  className="min-h-[44px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
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
                    <button
                      onClick={() => handleDocumentOptions(doc)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {deleteConfirm.show && deleteConfirm.folder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Delete Folder?</h2>
              </div>

              <p className="text-foreground mb-2">
                Are you sure you want to delete <span className="font-semibold">{deleteConfirm.folder.name}</span>?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  {deleteConfirm.folder.documentCount || 0} {deleteConfirm.folder.documentCount === 1 ? 'document' : 'documents'} will be deleted
                </p>
                <p className="text-xs text-red-600 mt-1">This action cannot be undone</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, folder: null })}
                  className="flex-1"
                  disabled={isDeletingFolder}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  disabled={isDeletingFolder}
                >
                  {isDeletingFolder ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAddFolderDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowAddFolderDialog(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-6">Add Subfolder</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Folder Name
                  </label>
                  <Input
                    placeholder="e.g. 2024 Records, Contracts, etc."
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
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFolder}
                    className="flex-1"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <UploadDocumentModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          categoryId={categoryId!}
          subcategoryId={subcategoryId!}
          folderId={folderId}
          subcategoryName={currentFolder?.name || "Folder"}
        />

        <DocumentOptionsModal
          open={optionsOpen}
          onOpenChange={setOptionsOpen}
          documentName={selectedDoc.name}
          documentId={selectedDoc.id}
          categoryId={categoryId!}
          subcategoryId={subcategoryId!}
          folderId={folderId}
          onRename={() => setRenameOpen(true)}
          onDelete={loadFolderData}
        />

        <RenameDocumentModal
          open={renameOpen}
          onOpenChange={setRenameOpen}
          documentId={selectedDoc.id}
          currentName={selectedDoc.name}
          onRenameSuccess={loadFolderData}
        />

        <LockDocumentModal
          open={lockOpen}
          onOpenChange={(open) => setLockOpen(open)}
          documentName={selectedDoc.name}
        />
      </div>

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
    </>
  );
};

export default NestedFolderView;
