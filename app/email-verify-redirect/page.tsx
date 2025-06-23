"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmailVerifyRedirect() {
  const router = useRouter();

  useEffect(() => {
    // ✅ Remove all query/hash tokens
    window.history.replaceState(null, "", window.location.pathname);

    // ✅ Show message for 2 sec then redirect
    setTimeout(() => {
      router.push("/email-confirmed");
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center">
      <div className="text-lg font-medium text-gray-800">
        Verifying email, please wait...
      </div>
    </div>
  );
}
