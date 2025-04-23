
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // Provide a fallback UI while loading
  if (isLoading) {
    console.log("🛡️ ProtectedRoute: Loading auth state");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Verificando autenticazione...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("🛡️ ProtectedRoute: No authenticated user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If we're here, the user is authenticated
  console.log("🛡️ ProtectedRoute: User authenticated", user.email);
  
  // Render child routes if authenticated
  return <Outlet />;
}
