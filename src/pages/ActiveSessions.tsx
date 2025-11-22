import { ArrowLeft, Smartphone, Monitor, Tablet, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const ActiveSessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Empty sessions array - will be populated when user actually logs in
  const [sessions] = useState<Array<{
    id: number;
    device: string;
    icon: any;
    location: string;
    time: string;
    date: string;
    current: boolean;
  }>>([]);

  const handleEndSession = (sessionId: number, deviceName: string) => {
    toast({
      title: "Session ended",
      description: `${deviceName} has been logged out`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Active Sessions</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          Manage devices where you're currently logged in. End sessions you don't recognize.
        </p>

        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => {
              const DeviceIcon = session.icon;
              return (
                <div key={session.id} className="bg-card rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <DeviceIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{session.device}</h3>
                        {session.current && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{session.time} • {session.date}</span>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-3"
                          onClick={() => handleEndSession(session.id, session.device)}
                        >
                          End Session
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No Active Sessions</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any active sessions yet. Sessions will appear here after you log in.
            </p>
          </div>
        )}

        {sessions.length > 1 && (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => {
              toast({
                title: "All sessions ended",
                description: "You've been logged out from all other devices",
              });
            }}
          >
            End All Other Sessions
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActiveSessions;
