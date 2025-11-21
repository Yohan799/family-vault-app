import { ArrowLeft, Search, Info, Eye, Download, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { GrantAccessModal } from "@/components/vault/GrantAccessModal";

const ManageAccess = () => {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const [grantOpen, setGrantOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState("");

  const people = [
    {
      id: "1",
      name: "Maya Rodriguez",
      role: "Owner",
      avatar: "/placeholder.svg",
      permissions: [],
    },
    {
      id: "2",
      name: "Aarav Gupta",
      role: "Can Edit",
      avatar: "/placeholder.svg",
      permissions: ["view", "download"],
    },
    {
      id: "3",
      name: "Brenda Smith",
      role: "Can View",
      avatar: "/placeholder.svg",
      permissions: ["view"],
    },
    {
      id: "4",
      name: "Kenji Tanaka",
      role: "Can View",
      avatar: "/placeholder.svg",
      permissions: ["view"],
    },
  ];

  const handleAddPerson = () => {
    setSelectedPerson("Eleanor Vance");
    setGrantOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-[#FCFCF9]">
        {/* Header */}
        <div className="bg-[#FCFCF9] p-6 border-b">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-6 h-6 text-[#1F2121]" />
            </button>
            <h1 className="text-xl font-bold text-[#1F2121]">Manage Access</h1>
            <button className="p-1">
              <Info className="w-6 h-6 text-[#1F2121]" />
            </button>
          </div>
          <p className="text-center text-[#626C71] text-sm mt-2">Sale_Deed.pdf</p>
        </div>

        <div className="p-6 space-y-6">
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
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg"
        >
          <UserPlus className="w-6 h-6 text-white" />
        </button>
      </div>

      <GrantAccessModal
        open={grantOpen}
        onOpenChange={setGrantOpen}
        personName={selectedPerson}
      />
    </>
  );
};

export default ManageAccess;
