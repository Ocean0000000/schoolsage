"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  const handleClickLogin = async () => {
    const currentUser = await getCurrentAuthenticatedUser();
    console.log(currentUser);
    if (currentUser) {
      router.push("/classes");
    }
  };

  return (
    <div className="flex gap-8 w-screen mt-4">
      <Link href="/login" className="ml-auto" onClick={handleClickLogin}>
        Login
      </Link>
      <Link href="/signup" className="mr-8">
        Sign Up
      </Link>
    </div>
  );
}
