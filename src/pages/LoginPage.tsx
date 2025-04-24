
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canInstallPWA, installPWA } from "@/registerSW";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp, signInWithGoogle, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [canInstall, setCanInstall] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("🔑 LoginPage: Rendering", { 
      isUserLoggedIn: !!user,
      isLoading
    });

    if (user) {
      console.log("🔑 LoginPage: User already logged in, redirecting to home");
      navigate("/");
    }

    // Verifica se la PWA può essere installata all'avvio
    setCanInstall(canInstallPWA());

    // Aggiorna lo stato se l'app diventa installabile
    const handlePwaInstallable = () => {
      console.log("PWA installabile rilevata");
      setCanInstall(true);
    };
    
    window.addEventListener('pwaInstallable', handlePwaInstallable);
    
    return () => {
      window.removeEventListener('pwaInstallable', handlePwaInstallable);
    };
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`🔑 LoginPage: Form submitted with ${activeTab}`, { email });
    if (activeTab === "login") {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("🔑 LoginPage: Google login initiated");
    await signInWithGoogle();
  };

  const handleInstall = () => {
    installPWA();
  };

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
          
          {canInstall && (
            <div className="pt-2">
              <Button 
                onClick={handleInstall} 
                variant="outline" 
                className="w-full flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Installa App
              </Button>
            </div>
          )}
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
