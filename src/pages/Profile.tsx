import { ArrowLeft, User, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ProfileSkeleton } from "@/components/skeletons";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

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
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Profile</h1>
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
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium text-foreground">{displayName}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{profile.phone || "Not set"}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium text-foreground">{memberSince}</p>
            </div>
          </div>

          {profile.date_of_birth && (
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="font-medium text-foreground">{format(new Date(profile.date_of_birth), "MMMM d, yyyy")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <Button
          onClick={() => navigate("/edit-profile")}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary rounded-xl h-12"
        >
          Edit Profile
        </Button>
      </div>
    </div>
  );
};

export default Profile;
