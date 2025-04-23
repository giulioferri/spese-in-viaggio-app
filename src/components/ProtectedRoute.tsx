
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
    } else {
      console.log("🛡️ ProtectedRoute: No authenticated user, redirecting to login");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
