import { ArrowLeft, Mountain, Factory, Gavel, CreditCard, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const CreateCategory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [selectedColor, setSelectedColor] = useState(3);

  const icons = [
    { icon: Mountain, id: 0 },
    { icon: Factory, id: 1 },
    { icon: Gavel, id: 2 },
    { icon: CreditCard, id: 3 },
    { icon: Briefcase, id: 4 },
  ];

  const colors = [
    { bg: "bg-red-400", id: 0 },
    { bg: "bg-orange-400", id: 1 },
    { bg: "bg-yellow-400", id: 2 },
    { bg: "bg-green-400", id: 3 },
    { bg: "bg-blue-400", id: 4 },
    { bg: "bg-blue-400", id: 5 },
  ];

  const handleCreate = () => {
    if (!categoryName.trim()) {
      toast({
        title: t("vault.nameRequired"),
        description: t("vault.enterCategoryName"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("vault.categoryCreatedSuccess"),
      description: `${categoryName} ${t("vault.categoryAddedToVault")}`,
    });
    navigate("/vault");
  };

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      {/* Header */}
      <div className="bg-[#FCFCF9] p-6 pt-4 border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-[#1F2121]" />
          </button>
          <h1 className="text-xl font-bold text-[#1F2121]">{t("vault.createCategory")}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category Name */}
        <div className="space-y-2">
          <label className="font-semibold text-[#1F2121]">{t("vault.categoryName")}</label>
          <Input
            placeholder={t("vault.categoryNamePlaceholder")}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="h-12 bg-white border-border rounded-xl"
          />
        </div>

        {/* Choose Icon */}
        <div className="space-y-3">
          <label className="font-semibold text-[#1F2121]">{t("vault.chooseIcon")}</label>
          <div className="flex gap-3">
            {icons.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedIcon(item.id)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${selectedIcon === item.id
                    ? "bg-[#2563EB] border-2 border-[#2563EB]"
                    : "bg-white border-2 border-border"
                    }`}
                >
                  <Icon
                    className={`w-6 h-6 ${selectedIcon === item.id ? "text-white" : "text-muted-foreground"
                      }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Choose Color */}
        <div className="space-y-3">
          <label className="font-semibold text-[#1F2121]">{t("vault.chooseColor")}</label>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`w-12 h-12 rounded-full ${color.bg} ${selectedColor === color.id ? "ring-4 ring-offset-2 ring-primary" : ""
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#FCFCF9] space-y-3">
        <Button
          onClick={handleCreate}
          className="w-full h-14 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-full text-base font-semibold"
        >
          + {t("vault.createCategory")}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full h-14 border-2 border-[#2563EB] text-[#2563EB] rounded-full text-base font-semibold hover:bg-transparent"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
};

export default CreateCategory;
