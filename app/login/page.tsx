"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentAuthenticatedUser,
  signInWithEmail,
  signInWithGoogle,
  signInWithMicrosoft,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLoginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const signInResult = await signInWithEmail(email, password);

      if (signInResult.isSignedIn) {
        router.push("/classes");
      }
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    if (error && (email || password)) {
      setError(false);
    }
  }, [email, password, error]);

  useEffect(() => {
    async function checkAuthentication() {
      const user = await getCurrentAuthenticatedUser();
      if (user) {
        router.push("/classes");
      }
    }
    checkAuthentication();
  }, [router]);

  return (
    <section className="bg-schoolsage flex min-h-screen items-center justify-center">
      <section className="flex flex-col items-center justify-center gap-4">
        <Image
          className="logo"
          src="/logo.png"
          alt="logo"
          width={480}
          height={480}
        />
        <form
          className="flex w-full flex-col items-center justify-center"
          onSubmit={handleLoginWithEmail}
        >
          <fieldset className="flex w-full flex-col gap-4 border-none">
            <input
              className="h-10 w-full rounded-lg border-none bg-slate-50 px-4 text-sm placeholder-neutral-700 focus:outline-none"
              type="text"
              id="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="h-10 w-full rounded-lg border-none bg-slate-50 px-4 text-sm placeholder-neutral-700 focus:outline-none"
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex w-full items-center justify-between">
              <Link
                href="/forgot-password"
                className="cursor-pointer pl-2 text-sm font-semibold text-cyan-600 underline"
              >
                Forgot password?
              </Link>
              <button
                type="submit"
                className="w-32 cursor-pointer rounded border-none bg-cyan-400 px-4 py-2 text-slate-50"
                disabled={!email || !password}
              >
                Login
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600">Invalid email or password.</p>
            )}
          </fieldset>
        </form>
        <div className="my-4 w-full rounded-full border-t-2 border-neutral-700/20"></div>
        <section className="flex w-full justify-around gap-4">
          <button
            type="button"
            className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded border-none bg-slate-50 text-neutral-700"
            onClick={signInWithGoogle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 16 16"
            >
              <title>Google Logo</title>
              <g fill="none" fillRule="evenodd" clipRule="evenodd">
                <path
                  fill="#f44336"
                  d="M7.209 1.061c.725-.081 1.154-.081 1.933 0a6.57 6.57 0 0 1 3.65 1.82a100 100 0 0 0-1.986 1.93q-1.876-1.59-4.188-.734q-1.696.78-2.362 2.528a78 78 0 0 1-2.148-1.658a.26.26 0 0 0-.16-.027q1.683-3.245 5.26-3.86"
                  opacity={0.987}
                ></path>
                <path
                  fill="#ffc107"
                  d="M1.946 4.92q.085-.013.161.027a78 78 0 0 0 2.148 1.658A7.6 7.6 0 0 0 4.04 7.99q.037.678.215 1.331L2 11.116Q.527 8.038 1.946 4.92"
                  opacity={0.997}
                ></path>
                <path
                  fill="#448aff"
                  d="M12.685 13.29a26 26 0 0 0-2.202-1.74q1.15-.812 1.396-2.228H8.122V6.713q3.25-.027 6.497.055q.616 3.345-1.423 6.032a7 7 0 0 1-.51.49"
                  opacity={0.999}
                ></path>
                <path
                  fill="#43a047"
                  d="M4.255 9.322q1.23 3.057 4.51 2.854a3.94 3.94 0 0 0 1.718-.626q1.148.812 2.202 1.74a6.62 6.62 0 0 1-4.027 1.684a6.4 6.4 0 0 1-1.02 0Q3.82 14.524 2 11.116z"
                  opacity={0.993}
                ></path>
              </g>
            </svg>
            Sign in with Google
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded border-none bg-slate-50 text-neutral-700"
            onClick={signInWithMicrosoft}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 256 256"
            >
              <title>Microsoft Logo</title>
              <path fill="#f1511b" d="M121.666 121.666H0V0h121.666z"></path>
              <path fill="#80cc28" d="M256 121.666H134.335V0H256z"></path>
              <path
                fill="#00adef"
                d="M121.663 256.002H0V134.336h121.663z"
              ></path>
              <path fill="#fbbc09" d="M256 256.002H134.335V134.336H256z"></path>
            </svg>
            Sign in with Microsoft
          </button>
        </section>
        <div className="flex gap-2 text-sm font-semibold text-cyan-600">
          <p>Still not a user?</p>
          <Link className="cursor-pointer underline" href="/signup">
            Sign Up
          </Link>
        </div>
      </section>
    </section>
  );
}
