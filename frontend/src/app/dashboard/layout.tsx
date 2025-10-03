import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardNav from "@/components/dashboard-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <DashboardNav />
        {children}
      </main>
    </SidebarProvider>
  );
}
