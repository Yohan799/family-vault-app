import { Home, FolderOpen, Settings, Search, SlidersHorizontal, Plus, HomeIcon, Stethoscope, GraduationCap, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Vault = () => {
  const navigate = useNavigate();

  const categories = [
    { icon: HomeIcon, name: "Real Estate", count: 8, color: "bg-blue-100 text-blue-600" },
    { icon: Stethoscope, name: "Medical", count: 0, color: "bg-pink-100 text-pink-600" },
    { icon: GraduationCap, name: "Education", count: 5, color: "bg-purple-100 text-purple-600" },
    { icon: FileText, name: "Insurance", count: 12, color: "bg-violet-100 text-violet-600" },
    { icon: User, name: "Personal", count: 7, color: "bg-indigo-100 text-indigo-600" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">My Vault</h1>

        {/* Search with Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search documents..."
            className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <button
                key={index}
                className="bg-card rounded-2xl p-6 text-center space-y-3 hover:bg-accent transition-colors border border-border"
              >
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} Documents</p>
                </div>
              </button>
            );
          })}

          {/* Create New Category */}
          <button className="bg-card rounded-2xl p-6 text-center space-y-3 hover:bg-accent transition-colors border-2 border-dashed border-border">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Create New</h3>
              <p className="text-sm text-muted-foreground">Add Category</p>
            </div>
          </button>
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
          <button className="flex flex-col items-center gap-1 text-primary">
            <FolderOpen className="w-6 h-6" />
            <span className="text-xs font-medium">Vault</span>
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

export default Vault;
