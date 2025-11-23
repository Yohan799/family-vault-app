import { ArrowLeft, Search, Book, Shield, FileText, HelpCircle, Video, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const HelpCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const topics = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of Family Vault",
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Keep your data safe and secure",
    },
    {
      icon: FileText,
      title: "Managing Documents",
      description: "Upload, organize, and share files",
    },
    {
      icon: HelpCircle,
      title: "FAQs",
      description: "Frequently asked questions",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
    },
    {
      icon: MessageCircle,
      title: "Contact Support",
      description: "Get help from our team",
    },
  ];

  const handleTopicClick = (title: string) => {
    if (title === "Contact Support") {
      navigate("/contact-support");
    } else {
      toast({
        title: `Opening ${title}`,
        description: "Help content will be displayed here",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Help Center</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
          <Input
            placeholder="Search for help..."
            className="pl-10 bg-primary-foreground/10 border-0 text-primary-foreground placeholder:text-primary-foreground/60"
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Browse Topics</h2>

        <div className="grid gap-4">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <button
                key={index}
                onClick={() => handleTopicClick(topic.title)}
                className="bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors text-left"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{topic.title}</h3>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
