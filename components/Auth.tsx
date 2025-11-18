"use client";

import { useEffect } from "react";
import { configureAuth } from "@/lib/auth";

export default function Auth() {
  useEffect(() => {
    configureAuth();
  }, []);

  return null;
}
