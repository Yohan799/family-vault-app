import { ArrowLeft, User, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: "Raj Kumar",
    email: "raj@example.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    profileImage: null as string | null,
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem("profileData");
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
    const savedPhoto = localStorage.getItem("currentProfilePhoto");
    if (savedPhoto) {
      setProfileData(prev => ({ ...prev, profileImage: savedPhoto }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Profile Avatar */}
        <div className="flex flex-col items-center">
          <Avatar className="w-24 h-24 bg-primary-foreground mb-4">
            {profileData.profileImage && <AvatarImage src={profileData.profileImage} alt="Profile" />}
            <AvatarFallback className="bg-primary-foreground text-primary font-bold text-2xl">
              {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mb-1">{profileData.fullName}</h2>
          <p className="text-sm opacity-90">{profileData.email}</p>
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
              <p className="font-medium text-foreground">{profileData.fullName}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{profileData.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{profileData.phone}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium text-foreground">January 15, 2024</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-foreground">{profileData.location}</p>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <Button 
          onClick={() => navigate("/edit-profile")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
        >
          Edit Profile
        </Button>
      </div>
    </div>
  );
};

export default Profile;
