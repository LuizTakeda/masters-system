import { Navigate, Outlet } from "react-router";
import { useMe } from "../../../hooks/use-me";
import { Loader2 } from "lucide-react";

export default function AdminLayout() {
  const { isLoading, isError, user } = useMe();

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (isError || !user || !user.roles.includes("system-admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Outlet />
  )
}