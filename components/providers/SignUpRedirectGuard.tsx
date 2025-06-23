"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupRedirectGuard() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes("type=signup")) {
      // Remove the token from URL and redirect to confirmation page
      router.replace("/emailConfirmed");
    }
  }, []);

  return null;
}
