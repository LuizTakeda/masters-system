import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SidebarTrigger } from "../../../components/ui/sidebar";
export default function PageHeader(props) {
    return (_jsx("div", { className: "bg-sidebar pt-3 pb-0.5", children: _jsxs("div", { className: "flex items-center px-2 py-2 gap-1 rounded-tl-3xl bg-secondary", children: [_jsx(SidebarTrigger, {}), _jsx("h1", { className: "text-2xl font-medium", children: props.children })] }) }));
}
