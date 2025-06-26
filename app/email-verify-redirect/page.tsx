// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const handleRedirect = async () => {
//       // 👇 This exchanges the token from the URL and creates a session
//       const url = new URL(window.location.href);
//       const authCode = url.searchParams.get("code");
//       if (!authCode) {
//         console.error("No auth code found in URL.");
//         return;
//       }
//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         console.error("Token exchange failed:", error.message);
//         // Optional: show a user-friendly error or redirect to a fallback page
//         return;
//       }

//       // ✅ Clean the URL (remove tokens)
//       window.history.replaceState(null, "", window.location.pathname);

//       // ✅ Redirect after token exchange
//       setTimeout(() => {
//         router.push("/emailConfirmed");
//       }, 1500);
//     };

//     handleRedirect();
//   }, []);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying email, please wait...
//       </div>
//     </div>
//   );
// }





"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function LinkExpired() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };

    fetchEmail();
  }, []);

  const handleResend = async () => {
  setLoading(true);
  setMessage("Resending...");

  if (!email) {
    setMessage("❌ We couldn’t detect your email. Please sign up again.");
    setLoading(false);
    return;
  }

  const res = await fetch("https://akbsvhaaajgwjlqrxikn.supabase.co/functions/v1/resend-confirmation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const result = await res.json();

  if (!res.ok) {
    setMessage("❌ " + (result.error || "Could not resend email."));
  } else {
    setMessage("✅ Confirmation email sent. Please check your inbox.");
  }

  setLoading(false);
};


  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md space-y-4">
        <h1 className="text-xl font-bold text-red-600">
          Your confirmation link has expired.
        </h1>
        <p className="text-gray-700">
          Don’t worry! You can resend the verification email by clicking below.
        </p>

        {/* <Button onClick={handleResend} disabled={!email}>
          Resend Confirmation Email
        </Button> */}

        <Button onClick={handleResend} disabled={!email || loading}>
  {loading ? "Sending..." : "Resend Confirmation Email"}
</Button>


        {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
      </div>
    </div>
  );
}
