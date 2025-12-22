import { Home, Settings, Vault } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

type TabType = "home" | "vault" | "settings";

interface BottomNavigationProps {
    activeTab: TabType;
}

const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const tabs = [
        { key: "home" as TabType, icon: Home, label: t("nav.home"), path: "/dashboard" },
        { key: "vault" as TabType, icon: Vault, label: t("nav.vault"), path: "/vault" },
        { key: "settings" as TabType, icon: Settings, label: t("nav.settings"), path: "/settings" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 shadow-premium-lg">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => !isActive && navigate(tab.path)}
                            className={`flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 ${isActive ? "text-primary relative" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{tab.label}</span>
                            {isActive && (
                                <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavigation;
