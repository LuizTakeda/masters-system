import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router";
import { useMe } from "../../../hooks/use-me";
import { Loader2 } from "lucide-react";
export default function AdminLayout() {
    const { isLoading, isError, user } = useMe();
    if (isLoading) {
        return (_jsx("div", { className: "w-full h-full flex justify-center items-center", children: _jsx(Loader2, { className: "animate-spin" }) }));
    }
    if (isError || !user || !user.roles.includes("system-admin")) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return (_jsx(Outlet, {}));
}
