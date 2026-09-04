import type { RouteObject } from "react-router";
import AdminHomePage from "./page";
import { adminMqttBrokerRoutes } from "./mqtt-broker/router";
import AdminContextFilePage from "./context-file/page";
import { adminIotAgentRoutes } from "./iot-agent-json/router";

export const AdminDashboardRouter: RouteObject[] = [
  {
    index: true,
    element: <AdminHomePage />,
  },
  adminMqttBrokerRoutes,
  adminIotAgentRoutes,
  {
    path: "context-file",
    element: <AdminContextFilePage />,
  },
];
