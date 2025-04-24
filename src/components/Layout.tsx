
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ProfileModal from "./ProfileModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User, X } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Mappa i valori della palette ai colori di sfondo
  const paletteBackgrounds = {
    default: "bg-[#009fef]",
    green: "bg-[#23c69e]",
    red: "bg-[#ff325b]",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className={cn(
        "sticky top-0 z-10 border-b",
        paletteBackgrounds[profile.palette] || "bg-[#009fef]",
        "text-white"
      )}>
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Spese Trasferta</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden flex items-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-white hover:bg-white/20 hover:text-[#333333]"
              )}
            >
              Home
            </Link>
            <Link
              to="/summary"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-white hover:bg-white/20 hover:text-[#333333]"
              )}
            >
              Riepilogo
            </Link>
            {user && (
              <span className="text-white text-xs">
                {user.email?.substring(0, 15)}...
              </span>
            )}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="focus:outline-none"
            >
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-90">
                {profile.photo ? (
                  <AvatarImage src={profile.photo} alt="Foto profilo" />
                ) : (
                  <AvatarFallback>
                    <User size={16} />
                  </AvatarFallback>
                )}
              </Avatar>
            </button>
            <Link
              to="/login"
              onClick={handleSignOut}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-white hover:bg-white/20 hover:text-[#333333]"
              )}
            >
              Esci
            </Link>
          </nav>
        </div>
        
        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <div className={cn(
            "md:hidden py-2 px-4",
            paletteBackgrounds[profile.palette] || "bg-[#009fef]"
          )}>
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className={cn(
                  "px-4 py-2 text-white hover:bg-white/20 rounded-md",
                  "flex items-center"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/summary"
                className={cn(
                  "px-4 py-2 text-white hover:bg-white/20 rounded-md",
                  "flex items-center"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Riepilogo
              </Link>
              {user && (
                <div className="px-4 py-2 text-white">
                  {user.email}
                </div>
              )}
              <div className="px-4 py-2">
                <button 
                  onClick={() => {
                    setShowProfileModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center text-white hover:bg-white/20 rounded-md px-2 py-1"
                >
                  <span className="mr-2">Profilo</span>
                  <Avatar className="h-6 w-6">
                    {profile.photo ? (
                      <AvatarImage src={profile.photo} alt="Foto profilo" />
                    ) : (
                      <AvatarFallback>
                        <User size={12} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>
              </div>
              <Link
                to="/login"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "px-4 py-2 text-white hover:bg-white/20 rounded-md",
                  "flex items-center"
                )}
              >
                Esci
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 container py-6">
        <Outlet />
      </main>
      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </div>
  );
}
