//app/email-verify-redirect/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmailVerifyRedirect() {
  const router = useRouter();

  useEffect(() => {
    const href = window.location.href;
    const hash = window.location.hash;

    console.log("href : ",href);
    console.log("hash : ",hash);
    console.log("🧪 Just landed on email-verify-redirect");

    // ✅ Extract email
    const emailMatch = href.match(/email=([^&#]+)/);
    const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null;
    console.log("🔍 Extracted email:", email);

    if (email) {
      localStorage.setItem("applywizz_user_email", email);
      console.log("📦 Email stored in localStorage");
    }

    // ✅ Check if hash contains error info
    if (hash.includes("error=access_denied") || hash.includes("error=otp_expired")) {
      console.warn("🚫 Link is expired or access denied");
      router.push("/link-expired");
      return;
    }

    // ✅ Else, redirect to confirmation page
    router.push("/emailConfirmed");
  }, [router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="text-lg font-medium text-blue-600">
        Verifying your email...
      </div>
    </div>
  );
}
