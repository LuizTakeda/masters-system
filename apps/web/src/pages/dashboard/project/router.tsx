import type { RouteObject } from "react-router";
import ProjectHomePage from "./page";

export const ProjectDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <ProjectHomePage />,
  },
];