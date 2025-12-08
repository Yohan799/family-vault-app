import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ProfileSkeleton } from "@/components/skeletons";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { t } = useLanguage();

  if (!profile || !user) {
    return <ProfileSkeleton />;
  }

  const displayName = profile.full_name || "User";
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = format(new Date(user.created_at), "MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-8">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        </div>

        {/* Profile Avatar */}
        <div className="flex flex-col items-center">
          <Avatar className="w-24 h-24 bg-white mb-4">
            {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} alt="Profile" />}
            <AvatarFallback className="bg-white text-primary font-bold text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Profile Details */}
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t("profile.fullName")}</p>
              <p className="font-medium text-foreground">{displayName}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t("profile.email")}</p>
              <p className="font-medium text-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t("profile.phone")}</p>
              <p className="font-medium text-foreground">{profile.phone || t("profile.notSet")}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t("profile.memberSince")}</p>
              <p className="font-medium text-foreground">{memberSince}</p>
            </div>
          </div>

          {profile.date_of_birth && (
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t("profile.dateOfBirth")}</p>
                <p className="font-medium text-foreground">
                  {(() => {
                    const [year, month, day] = profile.date_of_birth.split('-').map(Number);
                    return format(new Date(year, month - 1, day), "MMMM d, yyyy");
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <Button
          onClick={() => navigate("/edit-profile")}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary rounded-xl h-12"
        >
          {t("profile.edit")}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
