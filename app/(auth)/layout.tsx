"use client";

import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth layout error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-600"></div>
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
