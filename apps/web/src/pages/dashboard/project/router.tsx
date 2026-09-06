import type { RouteObject } from "react-router";
import ProjectHomePage from "./page";
import ProjectContextFilePage from "./context-file/page";
import ProjectDevicePage from "./device/page";
import EntitiesPage from "./entities/page";

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
    path: "context-file",
    element: <ProjectContextFilePage />,
  },
];
