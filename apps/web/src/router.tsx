import { createBrowserRouter } from "react-router";
import RootPage from "./pages/(root)/page";
import DashboardLayout from "./pages/dashboard/layout";
import DashboardHomePage from "./pages/dashboard/page";
import DashboardProjectLayout from "./pages/dashboard/project/layout";
import { AdminDashboardRouter } from "./pages/dashboard/admin/router";
import AdminDashboardLayout from "./pages/dashboard/admin/layout";
import { ProjectDashboardRouter } from "./pages/dashboard/project/router";

export const router = createBrowserRouter([
  {
    index: true,
    element: <RootPage />,
  },
  {
    path: "dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardHomePage />,
      },
      {
        path: "admin",
        element: <AdminDashboardLayout />,
        children: AdminDashboardRouter,
      },
      {
        path: ":project",
        element: <DashboardProjectLayout />,
        children: ProjectDashboardRouter,
      },
    ],
  },
]);