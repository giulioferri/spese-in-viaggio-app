
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, PieChart, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ProfileModal from "./ProfileModal";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Layout() {
  const [openProfile, setOpenProfile] = useState(false);
  const { profile, isLoading } = useProfile();

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container flex justify-between items-center">
          <h1 className="text-xl font-bold">Spese Trasferta</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Profilo utente"
              onClick={() => setOpenProfile(true)}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : profile.photo ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.photo} />
                  <AvatarFallback>
                    <User size={20} />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User size={22} />
              )}
            </Button>
          </div>
        </div>
        <ProfileModal open={openProfile} onOpenChange={setOpenProfile} />
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6">
        <Outlet />
      </main>
      
      {/* Bottom navigation */}
      <nav className="bg-white p-4 border-t">
        <div className="container flex justify-around">
          <Link to="/">
            <Button variant="ghost" className="flex flex-col items-center gap-1">
              <Home size={20} />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link to="/summary">
            <Button variant="ghost" className="flex flex-col items-center gap-1">
              <PieChart size={20} />
              <span className="text-xs">Riepiloghi</span>
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
