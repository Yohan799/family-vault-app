import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { Capacitor } from "@capacitor/core";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Minimal offset for toast positioning
  // CSS safe-area-inset automatically handles status bar spacing
  const getToastOffset = (): string => {
    if (Capacitor.isNativePlatform()) {
      return "16px"; // Minimal offset, safe-area-inset handles status bar
    }
    return "16px"; // Consistent minimal offset for web
  };

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={getToastOffset()}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

