import { useState } from "react";
import { Shield, Mail, Key, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
  category_id: string;
  subcategory_id: string;
}

interface AccessControl {
  access_level: string;
  resource_id: string;
}

const EmergencyAccess = () => {
  const [step, setStep] = useState<"email" | "otp" | "documents">("email");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const handleEmailSubmit = async () => {
    if (!nomineeEmail) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // Check if nominee exists and is verified
      const { data: nominee, error: nomineeError } = await supabase
        .from("nominees")
        .select("id, user_id, status")
        .eq("email", nomineeEmail)
        .eq("status", "verified")
        .is("deleted_at", null)
        .single();

      if (nomineeError || !nominee) {
        toast.error("Email not found or not verified as a nominee");
        setLoading(false);
        return;
      }

      // Check if emergency access is granted
      const { data: trigger, error: triggerError } = await supabase
        .from("inactivity_triggers")
        .select("emergency_access_granted")
        .eq("user_id", nominee.user_id)
        .eq("is_active", true)
        .single();

      if (triggerError || !trigger || !trigger.emergency_access_granted) {
        toast.error("Emergency access has not been granted for this account yet");
        setLoading(false);
        return;
      }

      // Send OTP
      const { error: otpError } = await supabase.functions.invoke("send-emergency-otp", {
        body: { nomineeEmail },
      });

      if (otpError) {
        console.error("Error sending OTP:", otpError);
        toast.error("Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }

      setUserId(nominee.user_id);
      setStep("otp");
      toast.success("OTP sent to your email");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("nominee_email", nomineeEmail)
        .eq("otp_code", otpCode)
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        toast.error("Invalid or expired OTP");
        setLoading(false);
        return;
      }

      // Mark OTP as verified
      await supabase
        .from("otp_verifications")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", otpRecord.id);

      // Get nominee's access controls
      const { data: nominee } = await supabase
        .from("nominees")
        .select("id")
        .eq("email", nomineeEmail)
        .single();

      if (!nominee) {
        toast.error("Nominee not found");
        setLoading(false);
        return;
      }

      const { data: controls, error: controlsError } = await supabase
        .from("access_controls")
        .select("access_level, resource_id, resource_type")
        .eq("nominee_id", nominee.id);

      if (controlsError) {
        console.error("Error fetching access controls:", controlsError);
      }

      // Get documents this nominee has access to
      const documentIds = controls
        ?.filter((c) => c.resource_type === "document")
        .map((c) => c.resource_id) || [];

      if (documentIds.length === 0) {
        toast.info("No documents have been shared with you");
        setStep("documents");
        setLoading(false);
        return;
      }

      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .in("id", documentIds)
        .is("deleted_at", null);

      if (docsError) {
        console.error("Error fetching documents:", docsError);
        toast.error("Failed to load documents");
        setLoading(false);
        return;
      }

      setDocuments(docs || []);
      setAccessControls(controls || []);
      setStep("documents");
      toast.success("Access verified successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canDownload = (documentId: string) => {
    const control = accessControls.find((c) => c.resource_id === documentId);
    return control?.access_level === "download" || control?.access_level === "view";
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_url, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document");
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    if (!canDownload(doc.id)) {
      toast.error("You don't have download permission for this document");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_url, 3600);

      if (error) throw error;

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = doc.file_name;
      link.click();
      toast.success("Document download started");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Emergency Access Portal</h1>
          <p className="text-muted-foreground">
            Verify your identity to access shared documents
          </p>
        </div>

        {step === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Enter Your Email
              </CardTitle>
              <CardDescription>
                We'll verify if you have emergency access and send you an OTP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Nominee Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={nomineeEmail}
                  onChange={(e) => setNomineeEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                />
              </div>
              <Button onClick={handleEmailSubmit} disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "otp" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Enter OTP Code
              </CardTitle>
              <CardDescription>
                We sent a 6-digit code to {nomineeEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleOTPVerify()}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOTPVerify} disabled={loading} className="flex-1">
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button variant="outline" onClick={() => setStep("email")}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "documents" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shared Documents
              </CardTitle>
              <CardDescription>
                Documents you have emergency access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No documents have been shared with you
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.file_size / 1024).toFixed(2)} KB •{" "}
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canDownload(doc.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p className="font-medium mb-1">About Emergency Access</p>
          <p>
            This portal is activated when a Family Vault user has been inactive for an extended
            period. Only verified nominees with explicitly granted permissions can access shared
            documents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccess;