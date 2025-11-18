"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { confirmSignUpWithEmail } from "@/lib/auth";

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const username = searchParams.get("username");
    const code = searchParams.get("code");

    if (!username || !code) return;

    confirmSignUpWithEmail(username, code).then((result) => {
      if (result.isSignUpComplete) {
        router.push("/login");
      } else {
        router.push("/callback");
      }
    });
  }, [searchParams, router]);

  return null;
}
