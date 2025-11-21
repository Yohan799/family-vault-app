import { ArrowLeft, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (subject && message) {
      toast({
        title: "Message sent!",
        description: "Our support team will respond within 24 hours",
      });
      setSubject("");
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Contact Support</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Send us a message</h2>
          <div className="bg-card rounded-2xl p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
              <Input
                placeholder="What do you need help with?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-background min-h-[120px]"
              />
            </div>
            <Button 
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
            >
              Send Message
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Other ways to reach us</h2>
          <div className="space-y-3">
            <a 
              href="mailto:support@familyvault.com"
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors border border-border"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@familyvault.com</p>
              </div>
              <div className="bg-primary/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Send Email</span>
              </div>
            </a>

            <button 
              onClick={() => {
                toast({
                  title: "Live Chat Starting",
                  description: "Connecting you to a support agent...",
                });
              }}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors border border-border"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Available 24/7</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-600">Online</span>
              </div>
            </button>

            <button 
              onClick={() => {
                toast({
                  title: "Call Now",
                  description: "Opening phone dialer...",
                });
              }}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors border border-border"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">Phone Support</h3>
                <p className="text-sm text-muted-foreground">1-800-FAMILY-VAULT</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
