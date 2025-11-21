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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center">
            <Shield className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Family Vault
          </h1>
          <p className="text-muted-foreground">
            Your Digital Vault & Legacy Planner
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
