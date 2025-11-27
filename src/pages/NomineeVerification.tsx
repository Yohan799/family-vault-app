import { useState, useEffect } from "react";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const NomineeVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [countdown, setCountdown] = useState(30);

    // Get nominee details passed from NomineeCenter
    const nomineeEmail = location.state?.email || "nominee@example.com";
    const nomineeData = location.state?.nomineeData;

    useEffect(() => {
        // Countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            toast({
                title: "Invalid OTP",
                description: "Please enter the 6-digit code",
                variant: "destructive",
            });
            return;
        }

        setIsVerifying(true);

        // Mock verification (in real app, this would call API)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock: Always accept 123456, otherwise reject
        if (otp === "123456") {
            // Create and save the verified nominee
            if (nomineeData) {
                const newNominee = {
                    id: `nominee-${Date.now()}`,
                    fullName: nomineeData.fullName,
                    relation: nomineeData.relation,
                    email: nomineeEmail,
                    phone: nomineeData.phone || "",
                    verified: true,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nomineeData.fullName}`
                };

                const nominees = JSON.parse(localStorage.getItem("nominees") || "[]");
                const updated = [...nominees, newNominee];
                localStorage.setItem("nominees", JSON.stringify(updated));
            }

            toast({
                title: "Verification Successful!",
                description: "The nominee has been verified successfully.",
            });

            // Navigate back to nominee center
            setTimeout(() => {
                navigate("/nominee-center");
            }, 1000);
        } else {
            toast({
                title: "Verification Failed",
                description: "Invalid OTP. Please try again or resend the code.",
                variant: "destructive",
            });
            setOtp("");
            setIsVerifying(false);
        }

        setIsVerifying(false);
    };

    const handleResend = () => {
        setCountdown(30);
        setCanResend(false);
        toast({
            title: "Code Sent!",
            description: `A new verification code has been sent to ${nomineeEmail}`,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/nominee-center")}
                        className="text-foreground"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div className="flex-1 text-center -ml-10">
                        <h1 className="text-2xl font-bold">Verify Nominee</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Enter verification code
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Info Card */}
                <div className="bg-card rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-2">
                        Check Your Email
                    </h2>
                    <p className="text-sm text-muted-foreground mb-1">
                        We've sent a 6-digit verification code to:
                    </p>
                    <p className="text-sm font-medium text-foreground">{nomineeEmail}</p>
                </div>

                {/* OTP Input */}
                <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground block text-center">
                        Enter Verification Code
                    </label>
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                            disabled={isVerifying}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                                <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                                <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                                <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                                <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                                <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {/* Hint for testing */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800 text-center">
                            <strong>Testing Mode:</strong> Use code <code className="bg-yellow-200 px-1 rounded">123456</code> to verify
                        </p>
                    </div>
                </div>

                {/* Verify Button */}
                <Button
                    onClick={handleVerify}
                    disabled={otp.length !== 6 || isVerifying}
                    className="w-full h-12 rounded-xl"
                >
                    {isVerifying ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Verifying...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verify Code
                        </>
                    )}
                </Button>

                {/* Resend Code */}
                <div className="text-center">
                    {canResend ? (
                        <button
                            onClick={handleResend}
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            Resend Verification Code
                        </button>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Resend code in {countdown}s
                        </p>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">i</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground mb-1">
                            Why Verification?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Verifying nominees ensures that only trusted individuals can access
                            your vault in case of emergencies. This adds an extra layer of
                            security to protect your sensitive information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NomineeVerification;
