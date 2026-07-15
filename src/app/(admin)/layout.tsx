import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import { ConfirmationProvider } from "@/components/ConfirmationModal";
import { PushNotificationsProvider } from "@/contexts/PushNotificationsContext";
import "./layout.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PushNotificationsProvider>
        <ConfirmationProvider>
          <div className="admin-layout">
            <Sidebar />
            <main className="admin-main">
              <AdminRouteGuard>{children}</AdminRouteGuard>
            </main>
          </div>
        </ConfirmationProvider>
      </PushNotificationsProvider>
    </AuthProvider>
  );
}
