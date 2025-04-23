
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      console.log("🛡️ ProtectedRoute: Loading auth state");
    } else if (user) {
      console.log("🛡️ ProtectedRoute: User authenticated", user.email);
    } else {
      console.log("🛡️ ProtectedRoute: No authenticated user, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate]);

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
