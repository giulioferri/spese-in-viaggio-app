
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, PieChart, User, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ProfileModal from "./ProfileModal";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

export default function Layout() {
  const [openProfile, setOpenProfile] = useState(false);
  const { profile, isLoading } = useProfile();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

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
              className="rounded-full bg-white/20 hover:bg-white/30"
              aria-label="Profilo utente"
              onClick={() => setOpenProfile(true)}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : profile.photo ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.photo} />
                  <AvatarFallback>
                    <User size={20} className="text-primary" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User size={22} className="text-foreground" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => signOut()}
              className="bg-white/20 hover:bg-white/30"
              aria-label="Logout"
            >
              <LogOut size={20} className="text-foreground" />
            </Button>
          </div>
        </div>
        <ProfileModal open={openProfile} onOpenChange={setOpenProfile} />
      </header>

      {/* Main content */}
      <main className={`flex-1 container py-6 ${isMobile ? 'pb-28' : ''}`}>
        <Outlet />
      </main>
      
      {/* Bottom navigation (fixed always on mobile) */}
      <nav className="bg-white p-4 border-t fixed bottom-0 left-0 w-full z-50 md:static md:w-auto md:z-auto">
        <div className="container flex justify-around">
          <Link to="/">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center gap-1 h-[52px]"
            >
              <Home size={20} />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link to="/summary">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center gap-1 h-[52px]"
            >
              <PieChart size={20} />
              <span className="text-xs">Riepiloghi</span>
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}

