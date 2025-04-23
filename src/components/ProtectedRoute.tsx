
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      console.log("🛡️ ProtectedRoute: Loading auth state");
    } else if (user) {
      console.log("🛡️ ProtectedRoute: User authenticated", user.email);
      console.log("🛡️ User details:", {
        id: user.id,
        email: user.email,
        providerIds: user.app_metadata?.providers,
        authMethod: user.app_metadata?.provider
      });
    } else {
      console.log("🛡️ ProtectedRoute: No authenticated user, redirecting to login");
    }
  }, [user, isLoading]);

  // Provide a fallback UI while loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Verificando autenticazione...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
