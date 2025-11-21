import { Search, Filter, Home, Settings, Sparkles } from "lucide-react";
import { Vault as VaultIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";

const VaultHome = () => {
  const navigate = useNavigate();

  const totalDocuments = vaultCategories.reduce((sum, cat) => sum + cat.documentCount, 0);

  return (
    <div className="min-h-screen bg-[#FCFCF9] pb-20">
      {/* Header */}
      <div className="bg-[#FCFCF9] p-6">
        <h1 className="text-2xl font-bold text-center text-[#1F2121]">My Vault</h1>
        <p className="text-center text-[#626C71] text-sm mt-1">{totalDocuments} Documents</p>

        {/* Search Bar */}
        <div className="relative mt-6">
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

      {/* Categories Grid */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {vaultCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => navigate(`/vault/${category.id}`)}
              className="bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
            >
              <div className={`w-14 h-14 ${category.iconBgColor} rounded-full flex items-center justify-center mb-3`}>
                <Icon className="w-7 h-7 text-[#6D28D9]" />
              </div>
              <h3 className="font-semibold text-[#1F2121] text-center mb-1">{category.name}</h3>
              <p className="text-sm text-[#626C71]">{category.documentCount} Documents</p>
            </button>
          );
        })}

        {/* Create New */}
        <button
          onClick={() => navigate("/vault/create-category")}
          className="bg-[#F3E8FF] border-2 border-dashed border-[#D1D5DB] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
        >
          <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-[#6D28D9]" />
          </div>
          <h3 className="font-semibold text-[#1F2121]">Create New</h3>
        </button>
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
  );
};

export default VaultHome;
