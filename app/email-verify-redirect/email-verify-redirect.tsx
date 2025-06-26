"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Suspense } from "react";


export default function EmailVerifyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const email = searchParams.get("email");

      if (!type || !token_hash || !email) {
        router.replace("/link-expired");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          type: type as any,
          token_hash,
          email
        });

        if (error) {
          // Token expired - redirect with email for resend
          router.replace(`/link-expired?email=${encodeURIComponent(email)}`);
          return;
        }

        // Success - verify session exists
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.replace("/emailConfirmed");
        } else {
          // Edge case: verified but no session
          router.replace(`/link-expired?email=${encodeURIComponent(email)}`);
        }
      } catch (error) {
        router.replace(`/link-expired?email=${encodeURIComponent(email)}`);
      }
    };

    verifyToken();
  }, [router, searchParams]);

  return <div className="min-h-screen flex items-center justify-center">
    <p className="text-blue-600">Verifying your email...</p>
  </div>;
}