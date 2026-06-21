import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
