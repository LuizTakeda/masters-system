import type { RouteObject } from "react-router";
import AdminHomePage from "./page";
import { adminMqttBrokerRoutes } from "./mqtt-broker/router";
import AdminContextFilePage from "./context-file/page";

export const AdminDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <AdminHomePage />,
  },
  adminMqttBrokerRoutes,
  {
    path: "context-file",
    element: <AdminContextFilePage />,
  },
];