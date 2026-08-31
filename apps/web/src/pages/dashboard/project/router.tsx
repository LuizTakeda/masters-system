import type { RouteObject } from "react-router";
import ProjectHomePage from "./page";
import ProjectContextFilePage from "./context-file/page";

export const ProjectDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <ProjectHomePage />,
  },
  {
    path: "context-file",
    element: <ProjectContextFilePage />,
  },
];