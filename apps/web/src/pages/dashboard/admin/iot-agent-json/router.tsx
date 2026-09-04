import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import IotAgentJsonLayout from "./layout";
import ServicesPage from "./services/page";
import DevicesPlaceholderPage from "./devices/page";

export const adminIotAgentRoutes: RouteObject = {
  path: "iot-agent-json",
  element: <IotAgentJsonLayout />,
  children: [
    { index: true, element: <Navigate to="services" replace /> },
    { path: "services", element: <ServicesPage /> },
    { path: "devices", element: <DevicesPlaceholderPage /> },
  ],
};
