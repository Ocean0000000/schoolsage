"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentAuthenticatedUser } from "@/lib/auth";

export default function CallbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function checkAuthentication() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const user = await getCurrentAuthenticatedUser();

        if (user) {
          router.push("/classes");
        } else {
          setError("Authentication failed");
          setTimeout(() => router.push("/login"), 2000);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Authentication failed");
        setTimeout(() => router.push("/login"), 2000);
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
          <p className="text-lg font-semibold">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
}
