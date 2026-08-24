import { Route } from "react-router";
import MqttBrokerLayout from "./layout";
import ClientsPage from "./page";
import GroupsPage from "./groups/page";
import RolePage from "./roles/page";

export default function AdminMqttBrokerRouter() {
  return (
    <Route path="mqtt-broker" element={<MqttBrokerLayout />}>
      <Route index element={<ClientsPage />} />
      <Route path="groups" element={<GroupsPage />} />
      <Route path="roles" element={<RolePage />} />
    </Route>
  );
}