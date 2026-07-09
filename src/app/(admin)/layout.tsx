import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import "./layout.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
