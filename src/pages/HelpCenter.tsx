import { useState } from "react";
import { ArrowLeft, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const HelpCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I upload documents?",
      answer: "Go to Vault, select a category, and tap the + button. You can upload from your device, scan documents with your camera, or import from Google Drive."
    },
    {
      question: "What is Two-Factor Authentication?",
      answer: "2FA adds an extra security layer. When enabled, you'll receive a code via email each time you sign in, in addition to your password."
    },
    {
      question: "How do Time Capsules work?",
      answer: "Time Capsules let you schedule messages to be sent on a specific date. Create one from your dashboard, set a release date, and we'll automatically email it to your recipient."
    },
    {
      question: "What happens if I'm inactive?",
      answer: "If enabled, the Inactivity Trigger monitors your activity. After prolonged inactivity, it sends alerts to you, then your nominees, and can grant emergency access to your vault."
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-support-message", {
        body: {
          name: profile.full_name || "User",
          email: profile.email,
          subject: formData.subject,
          message: formData.message,
        },
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "We'll get back to you soon!",
      });
      setFormData({ subject: "", message: "" });
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:+1234567890" className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-accent transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-foreground">Call</span>
          </a>
          
          <a href="mailto:support@familyvault.com" className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-accent transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-foreground">Email</span>
          </a>
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="bg-card rounded-2xl px-4 border-0">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium text-foreground pr-2">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Form */}
        <div className="bg-card rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="h-12 rounded-xl"
            />
            <Textarea
              placeholder="Describe your issue or question..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              className="min-h-32 rounded-xl resize-none"
            />
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl">
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;