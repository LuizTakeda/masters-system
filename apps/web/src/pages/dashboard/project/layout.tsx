import { Navigate, Outlet, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { useMe } from "@/hooks/use-me";

export default function ProjectLayout() {
  const { project } = useParams<{ project: string }>();
  const { isLoading, isError, user } = useMe();

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const hasProjectAccess = Boolean(project && user?.groups.includes(project));

  if (isError || !user || !hasProjectAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}