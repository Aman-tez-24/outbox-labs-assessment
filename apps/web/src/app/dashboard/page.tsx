import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <p className="text-sm text-neutral-500">Loading dashboard...</p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}
