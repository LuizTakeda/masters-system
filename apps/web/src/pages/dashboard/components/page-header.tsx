import type { ReactNode } from "react";
import { SidebarTrigger } from "../../../components/ui/sidebar";

type Props = {
  children: ReactNode
}

export default function PageHeader(props: Props) {
  return (
    <div className="bg-sidebar pt-3 pb-0.5">
      <div className="flex items-center px-2 py-2 gap-1 rounded-tl-3xl bg-secondary">
        <SidebarTrigger />
        <h1 className="text-2xl font-medium">
          {props.children}
        </h1>
      </div>
    </div>
  );
}