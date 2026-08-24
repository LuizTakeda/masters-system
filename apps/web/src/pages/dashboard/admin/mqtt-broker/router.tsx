import type { RouteObject } from "react-router";
import MqttBrokerLayout from "./layout";
import ClientsPage from "./clients/page";
import GroupsPage from "./groups/page";
import RolePage from "./roles/page";
import MqttAnalyticsPage from "./page";

export const adminMqttBrokerRoutes: RouteObject = {
  path: "mqtt-broker",
  element: <MqttBrokerLayout />,
  children: [
    { index: true, element: <MqttAnalyticsPage /> },
    { path: "clients", element: <ClientsPage /> },
    { path: "groups", element: <GroupsPage /> },
    { path: "roles", element: <RolePage /> },
  ],
};