import { Check, Globe } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { useLanguage, languages, Language } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const LanguageSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = (langCode: Language) => {
    if (langCode !== language) {
      setLanguage(langCode);
      toast({
        title: t("toast.languageChanged"),
        duration: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 pt-10 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">{t("language.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("language.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full bg-card rounded-xl p-4 flex items-center gap-4 transition-colors ${isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent"
                }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
              >
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{lang.name}</h3>
                <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
              </div>
              {isSelected && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-medium">
                    {t("language.current")}
                  </span>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSettings;
