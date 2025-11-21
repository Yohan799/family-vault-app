import { ArrowLeft, Search, Filter, Upload, ChevronRight, MoreVertical, FileText, Home, Settings } from "lucide-react";
import { Vault as VaultIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";
import { useState } from "react";
import { UploadDocumentModal } from "@/components/vault/UploadDocumentModal";
import { DocumentOptionsModal } from "@/components/vault/DocumentOptionsModal";
import { LockDocumentModal } from "@/components/vault/LockDocumentModal";

const SubcategoryView = () => {
  const navigate = useNavigate();
  const { categoryId, subcategoryId } = useParams();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState({ name: "", id: "" });

  const category = vaultCategories.find((cat) => cat.id === categoryId);
  const subcategory = category?.subcategories.find((sub) => sub.id === subcategoryId);

  if (!category || !subcategory) {
    navigate("/vault");
    return null;
  }

  const SubIcon = subcategory.icon;

  // Documents state - starts empty, populates when users upload
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);

  const handleDocumentOptions = (doc: any) => {
    setSelectedDoc(doc);
    setOptionsOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-[#FCFCF9] pb-20">
        {/* Header */}
        <div className="bg-[#FCFCF9] p-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(`/vault/${categoryId}`)} className="p-1">
              <ArrowLeft className="w-6 h-6 text-[#1F2121]" />
            </button>
            <div className="flex-1 text-center -ml-10">
              <div className="flex items-center justify-center gap-2">
                <SubIcon className="w-6 h-6 text-red-500" />
                <h1 className="text-2xl font-bold text-[#1F2121]">{subcategory.name}</h1>
              </div>
              <p className="text-[#626C71] text-sm mt-1">{documents.length} Documents</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-12 pr-12 h-12 bg-[#E8E8E8] border-none rounded-xl"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Upload Section */}
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full bg-[#F3E8FF] rounded-2xl p-4 flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-white/60 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#1F2121]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[#1F2121]">Upload Document</h3>
              <p className="text-sm text-[#626C71]">Add new files to your {subcategory.name.toLowerCase()} vault</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#626C71]" />
          </button>

          {/* Documents List */}
          <div>
            <h2 className="font-bold text-[#1F2121] mb-3">Uploaded Documents</h2>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-card rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1F2121]">{doc.name}</h3>
                      <p className="text-sm text-[#626C71]">{doc.size} - {doc.date}</p>
                    </div>
                    <button
                      onClick={() => handleDocumentOptions(doc)}
                      className="p-2 hover:bg-muted rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5 text-[#626C71]" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-[#1F2121] mb-2">No Documents Yet</h3>
                <p className="text-sm text-[#626C71]">
                  Upload your first document to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
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

      <UploadDocumentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categoryName={subcategory.name}
      />
      <DocumentOptionsModal
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        documentName={selectedDoc.name}
        documentId={selectedDoc.id}
      />
      <LockDocumentModal
        open={lockOpen}
        onOpenChange={setLockOpen}
        documentName={selectedDoc.name}
      />
    </>
  );
};

export default SubcategoryView;
