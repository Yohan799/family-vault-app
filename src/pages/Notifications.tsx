import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">No new notifications</p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
