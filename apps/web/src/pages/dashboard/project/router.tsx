import type { RouteObject } from "react-router";
import ProjectHomePage from "./page";
import ContextFilePage from "./context/page";

export const ProjectDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <ProjectHomePage />,
  },
  {
    path: "context-file",
    element: <ContextFilePage />
  }
];