import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import logo from "@/assets/logo_fv.jpg";

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
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4">
            <img src={logo} alt="Family Vault Logo" className="w-full h-full object-contain" />
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
