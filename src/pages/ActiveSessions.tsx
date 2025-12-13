import { Smartphone, Monitor, Tablet, MapPin, Clock } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchSessions, endSession, endAllOtherSessions, cleanupDuplicateSessions, type UserSession } from "@/services/sessionService";
import { format } from "date-fns";

const ActiveSessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
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
      // Clean up duplicates first
      const cleaned = await cleanupDuplicateSessions(user.id);
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} duplicate sessions`);
      }
      const data = await fetchSessions(user.id);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        variant: "destructive",
        title: t("toast.error"),
        description: t("sessions.loading"),
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
        title: t("sessions.ended"),
        description: `${deviceName} ${t("sessions.loggedOut")}`,
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        variant: "destructive",
        title: t("toast.error"),
        description: t("sessions.ended"),
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
        title: t("sessions.allEnded"),
        description: t("sessions.allLoggedOut"),
      });
    } catch (error) {
      console.error('Error ending sessions:', error);
      toast({
        variant: "destructive",
        title: t("toast.error"),
        description: t("sessions.allEnded"),
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
      <div className="bg-primary/20 text-foreground p-4 pt-14 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <BackButton to="/settings" />
          <h1 className="text-xl font-bold text-foreground">{t("sessions.title")}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-muted-foreground text-sm">
          {t("sessions.subtitle")}
        </p>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("sessions.loading")}
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
                            {t("sessions.current")}
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
                          {t("sessions.endSession")}
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
            <h3 className="font-semibold text-foreground mb-1 text-sm">{t("sessions.noSessions")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("sessions.noSessionsDesc")}
            </p>
          </div>
        )}

        {sessions.length > 1 && sessions.some(s => !s.is_current) && (
          <Button
            variant="outline"
            className="w-full h-10 rounded-lg text-sm"
            onClick={handleEndAllOtherSessions}
          >
            {t("sessions.endAllOther")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActiveSessions;
