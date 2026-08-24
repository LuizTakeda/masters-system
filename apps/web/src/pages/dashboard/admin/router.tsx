import type { RouteObject } from "react-router";
import AdminHomePage from "./page";
import { adminMqttBrokerRoutes } from "./mqtt-broker/router";

export const AdminDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <AdminHomePage />,
  },
  adminMqttBrokerRoutes,
];