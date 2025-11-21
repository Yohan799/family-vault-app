import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 1700);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-card rounded-[2rem] shadow-lg flex items-center justify-center">
            <Shield className="w-14 h-14 text-primary" strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to Family Vault
          </h1>
          <p className="text-muted-foreground text-lg">
            Your Digital Vault & Legacy Planner
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
