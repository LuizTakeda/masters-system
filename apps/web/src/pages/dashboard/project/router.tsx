import type { RouteObject } from "react-router";
import ProjectHomePage from "./page";
import ProjectContextFilePage from "./context-file/page";
import ProjectDevicePage from "./devices/page";
import EntitiesPage from "./entities/page";
import ProjectEntityTelemetryPage from "./entities/entitie/page";

export const ProjectDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <ProjectHomePage />,
  },
  {
    path: "device",
    element: <ProjectDevicePage />,
  },
  {
    path: "entitie",
    element: <EntitiesPage />,
  },
  {
    path: "entitie/:entityId",
    element: <ProjectEntityTelemetryPage />,
  },
  {
    path: "context-file",
    element: <ProjectContextFilePage />,
  },
];
