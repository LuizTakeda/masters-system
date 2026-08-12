import { Outlet } from "react-router";
import { SidebarProvider } from "../../components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { useEffect } from "react";

export default function DashboardLayout() {
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/auth/me");

        // Se o token for inválido/ausente (401), o redirecionamento acontece AQUI
        if (!response.ok) {
          // Removida a barra extra, pois o pathname já tem a barra inicial
          const redirectTo = `${window.location.origin}${window.location.pathname}`;

          window.location.href = `/api/auth?redirectTo=${encodeURIComponent(redirectTo)}`;
          return; // Para a execução para não tentar fazer o .json() abaixo
        }

        const data = await response.json();
        console.log("Usuário logado:", data);

      } catch (error) {
        // O catch agora serve apenas para erros de rede (Sem internet, Backend offline)
        console.error("Falha de conexão com o servidor:", error);
      }
    })()
  }, []);

  return (
    <SidebarProvider>
      <div>
        <Outlet />
      </div>
    </SidebarProvider>
  );
}