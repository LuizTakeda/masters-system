import { jsx as _jsx } from "react/jsx-runtime";
import PageHeader from "./components/page-header";
export default function DashboardPage() {
    return (_jsx("main", { children: _jsx(PageHeader, { children: "Pagina principal" }) }));
}
