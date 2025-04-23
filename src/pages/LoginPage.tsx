import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp, signInWithGoogle, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  useEffect(() => {
    // Separate state for checking auth to prevent redirect loops
    const checkAuth = async () => {
      try {
        console.log("🔑 LoginPage: Checking if user is already logged in", user?.email);
        
        // Check for errors in URL parameters from OAuth redirects
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error(`🔑 LoginPage: URL contains error: ${error}`, errorDescription);
          toast({
            title: "Errore di autenticazione",
            description: errorDescription || "Si è verificato un errore durante l'autenticazione",
            variant: "destructive",
          });
        }
        
        // If user is authenticated, redirect to home page
        if (user) {
          console.log("🔑 LoginPage: User already logged in, redirecting to home");
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("🔑 LoginPage: Error checking authentication", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    // Only run the check if we're still in checking state
    if (checkingAuth) {
      checkAuth();
    }
  }, [user, navigate, toast, checkingAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`🔑 LoginPage: Form submitted with ${activeTab}`, { email });
    try {
      if (activeTab === "login") {
        await signIn(email, password);
        // Don't navigate here - wait for auth state change to happen through listener
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      console.error("🔑 LoginPage: Authentication error", error);
      toast({
        title: activeTab === "login" ? "Errore di accesso" : "Errore di registrazione",
        description: "Si è verificato un errore durante l'autenticazione",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    console.log("🔑 LoginPage: Google login initiated");
    console.log("🔑 LoginPage: Application URL:", window.location.origin);
    console.log("🔑 LoginPage: Current URL:", window.location.href);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("🔑 LoginPage: Google login error", error);
      toast({
        title: "Errore di autenticazione Google",
        description: "Si è verificato un errore durante l'accesso con Google",
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Spese Trasferta</CardTitle>
          <CardDescription className="text-center">
            {activeTab === "login" 
              ? "Accedi al tuo account per continuare" 
              : "Crea un nuovo account per iniziare"}
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="register">Registrati</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pb-0">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nome@esempio.it" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <LogIn className="w-4 h-4" />
                    {isLoading ? "Attendere..." : "Accedi con Google"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : "Accedi"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="register" className="pb-0">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nome@esempio.it" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <LogIn className="w-4 h-4" />
                    {isLoading ? "Attendere..." : "Registrati con Google"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : "Registrati"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
