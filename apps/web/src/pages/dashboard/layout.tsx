import { Outlet } from "react-router";

export default function DashboardLayout(){
  return (
    <div>
      <div>
        SideBar
      </div>
      <div>
        <Outlet/>        
      </div>
    </div>
  );
}