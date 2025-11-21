import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";
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

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "support@familyvault.com",
      action: "Send Email",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Available 9 AM - 6 PM",
      action: "Start Chat",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+91 1800-XXX-XXXX",
      action: "Call Now",
    },
  ];

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
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="bg-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{method.title}</h3>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast({ title: method.action, description: "Opening communication channel" })}
                  >
                    {method.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
