import { ArrowLeft, Search, Filter, Home, Settings, Sparkles } from "lucide-react";
import { Vault as VaultIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { vaultCategories } from "@/data/vaultCategories";

const CategoryView = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const category = vaultCategories.find((cat) => cat.id === categoryId);

  if (!category) {
    navigate("/vault");
    return null;
  }

  const CategoryIcon = category.icon;

  return (
    <div className="min-h-screen bg-[#FCFCF9] pb-20">
      {/* Header */}
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
            <p className="text-[#626C71] text-sm mt-1">{category.documentCount} Documents</p>
          </div>
        </div>

        {/* Search Bar */}
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

      {/* Subcategories Grid */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {category.subcategories.map((subcategory) => {
          const SubIcon = subcategory.icon;
          return (
            <button
              key={subcategory.id}
              onClick={() => navigate(`/vault/${categoryId}/${subcategory.id}`)}
              className="bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
            >
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <SubIcon className="w-7 h-7 text-[#6D28D9]" />
              </div>
              <h3 className="font-semibold text-[#1F2121] text-center mb-1">{subcategory.name}</h3>
              <p className="text-sm text-[#626C71]">{subcategory.documentCount} Documents</p>
            </button>
          );
        })}

        {/* Create New */}
        <button
          onClick={() => navigate("/vault/create-category")}
          className="bg-[#F3E8FF] rounded-2xl p-5 flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
        >
          <div className="w-14 h-14 bg-[#E5E7EB] rounded-full flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-muted-foreground" />
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

export default CategoryView;
