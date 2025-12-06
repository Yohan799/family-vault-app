import { ArrowLeft, Smartphone, Monitor, Tablet, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSessions, endSession, endAllOtherSessions, type UserSession } from "@/services/sessionService";
import { format } from "date-fns";

const ActiveSessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await fetchSessions(user.id);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load active sessions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async (sessionId: string, deviceName: string) => {
    try {
      await endSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast({
        title: "Session ended",
        description: `${deviceName} has been logged out`,
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session",
      });
    }
  };

  const handleEndAllOtherSessions = async () => {
    if (!user) return;

    const currentSession = sessions.find(s => s.is_current);
    if (!currentSession) return;

    try {
      await endAllOtherSessions(user.id, currentSession.id);
      setSessions(sessions.filter(s => s.is_current));
      toast({
        title: "All sessions ended",
        description: "You've been logged out from all other devices",
      });
    } catch (error) {
      console.error('Error ending sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end sessions",
      });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-primary/20 text-foreground p-4 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Active Sessions</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-muted-foreground text-sm">
          Manage devices where you're currently logged in. End sessions you don't recognize.
        </p>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading sessions...
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.device_type);
              return (
                <div key={session.id} className="bg-card rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <DeviceIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{session.device_name}</h3>
                        {session.is_current && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {session.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{session.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(session.last_active_at), 'PPp')}</span>
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2 h-8 text-xs"
                          onClick={() => handleEndSession(session.id, session.device_name)}
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
          <div className="bg-card rounded-lg p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1 text-sm">No Active Sessions</h3>
            <p className="text-xs text-muted-foreground">
              You don't have any active sessions yet. Sessions will appear here after you log in.
            </p>
          </div>
        )}

        {sessions.length > 1 && sessions.some(s => !s.is_current) && (
          <Button
            variant="outline"
            className="w-full h-10 rounded-lg text-sm"
            onClick={handleEndAllOtherSessions}
          >
            End All Other Sessions
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActiveSessions;
