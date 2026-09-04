import type { RouteObject } from "react-router";
import ProjectHomePage from "./page";
import ProjectContextFilePage from "./context-file/page";
import ProjectDevicePage from "./device/page";

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
    path: "devices",
    element: <ProjectDevicePage />,
  },
  {
    path: "context-file",
    element: <ProjectContextFilePage />,
  },
];
