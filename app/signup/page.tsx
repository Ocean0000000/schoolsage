"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  signInWithGoogle,
  signInWithMicrosoft,
  signUpWithEmail,
} from "@/lib/auth";
import { validateCredentials } from "@/lib/utils";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentConfirmationLink, setSentConfirmationLink] = useState(false);

  if (error && (firstName || lastName || email || password)) {
    setError(null);
  }

  const handleSignUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      return;
    }

    const validationError = validateCredentials(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await signUpWithEmail(email, password, {
        given_name: firstName,
        family_name: lastName,
      });

      setSentConfirmationLink(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setError(null);
    } catch {
      setError("An error occurred during sign up. Please try again.");
    }
  };

  return (
    <section className="bg-schoolsage flex min-h-screen items-center justify-center">
      <section className="flex flex-col items-center justify-center gap-2">
        <Image
          className="logo"
          src="/logo.png"
          alt="logo"
          width={480}
          height={480}
        />
        <form
          className="flex w-full flex-col items-center justify-center"
          onSubmit={handleSignUpWithEmail}
        >
          <fieldset className="flex w-full flex-col gap-4 border-none">
            <div className="flex justify-between gap-4">
              <div className="flex flex-1 flex-col">
                <input
                  type="text"
                  className="h-10 w-full rounded-lg border-none bg-slate-50 px-4 text-sm placeholder-neutral-700 focus:outline-none"
                  id="firstName"
                  name="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col">
                <input
                  type="text"
                  className="h-10 w-full rounded-lg border-none bg-slate-50 px-4 text-sm placeholder-neutral-700 focus:outline-none"
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <input
              type="email"
              className="h-10 w-full rounded-lg border-none bg-slate-50 px-4 text-sm placeholder-neutral-700 focus:outline-none"
              id="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="h-10 w-full rounded-lg border-none bg-slate-50 px-4 text-sm placeholder-neutral-700 focus:outline-none"
              id="password"
              name="password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="disabled:bg-schoolsage-disabled mt-3 w-full cursor-pointer rounded border-none bg-cyan-400 px-4 py-2 text-slate-50 disabled:cursor-default"
              disabled={!firstName || !lastName || !email || !password}
            >
              Sign Up
            </button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {sentConfirmationLink && (
              <p className="mt-2 text-sm text-green-600">
                A confirmation link has been sent to your email. Please check
                your inbox.
              </p>
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
            Sign up with Google
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
            Sign up with Microsoft
          </button>
        </section>
        <div className="mt-2 flex gap-2 text-sm font-semibold text-cyan-600">
          <p>Already a user?</p>
          <Link className="cursor-pointer underline" href="/login">
            Login
          </Link>
        </div>
      </section>
    </section>
  );
}
