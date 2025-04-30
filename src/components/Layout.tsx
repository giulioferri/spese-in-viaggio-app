
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ProfileModal from "./ProfileModal";
import ThemeToggle from "./ThemeToggle";
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
    ochre: "bg-[#F5A623]",
  };

  // Determina le classi per il testo e hover in base alla palette
  const getTextClasses = (palette: string) => {
    if (palette === "ochre") {
      return "text-[#222222] hover:bg-black/10 hover:text-[#000000]";
    }
    return "text-white hover:bg-white/20 hover:text-[#333333]";
  };

  const textClasses = getTextClasses(profile.palette);

  return (
    <div className="flex min-h-screen flex-col">
      <header className={cn(
        "sticky top-0 z-10 border-b",
        paletteBackgrounds[profile.palette] || "bg-[#009fef]",
        profile.palette === "ochre" ? "text-[#222222]" : "text-white"
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
                textClasses
              )}
            >
              Home
            </Link>
            <Link
              to="/summary"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                textClasses
              )}
            >
              Riepilogo
            </Link>
            {user && (
              <span className={profile.palette === "ochre" ? "text-[#222222] text-xs" : "text-white text-xs"}>
                {user.email?.substring(0, 15)}...
              </span>
            )}
            <ThemeToggle />
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
                textClasses
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
                  "px-4 py-2 rounded-md flex items-center",
                  profile.palette === "ochre" ? "text-[#222222] hover:bg-black/10" : "text-white hover:bg-white/20"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/summary"
                className={cn(
                  "px-4 py-2 rounded-md flex items-center",
                  profile.palette === "ochre" ? "text-[#222222] hover:bg-black/10" : "text-white hover:bg-white/20"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Riepilogo
              </Link>
              {user && (
                <div className={cn(
                  "px-4 py-2",
                  profile.palette === "ochre" ? "text-[#222222]" : "text-white"
                )}>
                  {user.email}
                </div>
              )}
              <div className="px-4 py-2">
                <ThemeToggle />
              </div>
              <div className="px-4 py-2">
                <button 
                  onClick={() => {
                    setShowProfileModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center rounded-md px-2 py-1",
                    profile.palette === "ochre" ? "text-[#222222] hover:bg-black/10" : "text-white hover:bg-white/20"
                  )}
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
                  "px-4 py-2 rounded-md flex items-center",
                  profile.palette === "ochre" ? "text-[#222222] hover:bg-black/10" : "text-white hover:bg-white/20"
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
