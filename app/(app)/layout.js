import DashboardProvider from "@/components/dashboard-provider";
import AppShell from "@/components/app-shell";

export default function AppLayout({ children }) {
  return (
    <DashboardProvider>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  );
}
