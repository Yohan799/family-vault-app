import { Search, Info, Eye, Download, UserPlus, Home, Settings } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Vault as VaultIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { GrantAccessModal } from "@/components/vault/GrantAccessModal";
import { NomineeSelectionModal } from "@/components/vault/NomineeSelectionModal";

interface Nominee {
  id: string;
  fullName: string;
  relationship: string;
  email: string;
  phone: string;
  verified: boolean;
}

const ManageAccess = () => {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const [grantOpen, setGrantOpen] = useState(false);
  const [nomineeSelectOpen, setNomineeSelectOpen] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [documentName, setDocumentName] = useState("Document");
  const [loading, setLoading] = useState(true);
  const [grantedAccess, setGrantedAccess] = useState<any[]>([]);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        // Try to find the document by searching localStorage keys
        const keys = Object.keys(localStorage);
        let foundDoc = null;

        for (const key of keys) {
          if (key.startsWith('documents_')) {
            try {
              const docs = JSON.parse(localStorage.getItem(key) || '[]');
              foundDoc = docs.find((doc: any) => doc.id === documentId);
              if (foundDoc) break;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }

        if (foundDoc) {
          setDocumentName(foundDoc.name);
        }

        // Load granted access
        if (documentId) {
          const accessKey = `document_access_${documentId}`;
          const access = JSON.parse(localStorage.getItem(accessKey) || '[]');
          setGrantedAccess(access);
        }
      } catch (error) {
        console.error('Error loading document:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  // Build people list with owner and granted access
  const people = [
    {
      id: "owner",
      name: "You",
      role: "Owner",
      avatar: "/placeholder.svg",
      permissions: [],
    },
    ...grantedAccess.map((access: any) => {
      const permissions = [];
      if (access.permission === "view-only" || access.permission === "view-download") {
        permissions.push("view");
      }

      if (access.permission === "download-only" || access.permission === "view-download") {
        permissions.push("download");
      }

      return {
        id: access.nomineeId,
        name: access.personName,
        role: access.permission === "view-only" ? "Can View" :
          access.permission === "download-only" ? "Can Download" :
            "Can View & Download",
        avatar: "/placeholder.svg",
        permissions,
      };
    }),
  ];

  const handleAddPerson = () => {
    // Open nominee selection modal
    setNomineeSelectOpen(true);
  };

  const handleNomineeSelected = (nominee: Nominee) => {
    setSelectedNominee(nominee);
    setGrantOpen(true);
  };

  const handleAccessGranted = () => {
    // Reload granted access
    if (documentId) {
      const accessKey = `document_access_${documentId}`;
      const access = JSON.parse(localStorage.getItem(accessKey) || '[]');
      setGrantedAccess(access);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#FCFCF9] pb-20">
        {/* Header */}
        <div className="bg-[#FCFCF9] p-6 border-b">
          <div className="flex items-center justify-between">
            <BackButton />
            <h1 className="text-xl font-bold text-[#1F2121]">Manage Access</h1>
            <button className="p-1">
              <Info className="w-6 h-6 text-[#1F2121]" />
            </button>
          </div>
          <p className="text-center text-[#626C71] text-sm mt-2">
            {loading ? "Loading..." : documentName}
          </p>
        </div>

        <div className="p-6 space-y-6 pb-24">
          {/* Search */}
          <div>
            <h2 className="font-semibold text-[#1F2121] mb-3">People with access</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search people"
                className="pl-12 h-12 bg-[#F5F5F5] border-none rounded-xl"
              />
            </div>
          </div>

          {/* People List */}
          <div className="space-y-3">
            {people.map((person) => (
              <div key={person.id} className="flex items-center gap-4 p-2">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={person.avatar} />
                  <AvatarFallback>{person.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1F2121]">{person.name}</h3>
                  <p className="text-sm text-[#626C71]">{person.role}</p>
                </div>
                {person.permissions.length > 0 && (
                  <div className="flex gap-2">
                    {person.permissions.includes("view") && (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    {person.permissions.includes("download") && (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddPerson}
          className="fixed bottom-24 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <UserPlus className="w-6 h-6 text-white" />
        </button>

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
            <button
              onClick={() => navigate("/vault")}
              className="flex flex-col items-center gap-1 text-primary relative"
            >
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

      <NomineeSelectionModal
        open={nomineeSelectOpen}
        onOpenChange={setNomineeSelectOpen}
        onSelectNominee={handleNomineeSelected}
      />

      <GrantAccessModal
        open={grantOpen}
        onOpenChange={setGrantOpen}
        personName={selectedNominee?.fullName || ""}
        documentId={documentId}
        nomineeId={selectedNominee?.id}
        onAccessGranted={handleAccessGranted}
      />
    </>
  );
};

export default ManageAccess;
