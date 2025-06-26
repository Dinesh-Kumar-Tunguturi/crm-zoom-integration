// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     // ✅ Remove all query/hash tokens
//     window.history.replaceState(null, "", window.location.pathname);

//     // ✅ Show message for 2 sec then redirect
//     setTimeout(() => {
//       router.push("/emailConfirmed");
//     }, 1500);
//   }, []);

//   return (
//     // <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center">
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-800">
//         Verifying email, please wait...
//       </div>
//     </div>
//   );
// }



//------------------------------This code running perfectly--------------------------------
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
//--------------------Till here-------------------------------------------


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmailVerifyRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const errorCode = params.get("error_code");
    const errorDesc = params.get("error_description");

    // Extract email from the user's session or external source if available
    // You might already know the email based on your flow (optional improvement)
    const email = localStorage.getItem("applywizz_user_email"); // if stored earlier

    if (errorCode === "otp_expired" || errorCode === "invalid_email") {
      const redirectURL = email
        ? `/link-expired?email=${email}`
        : "/link-expired";
      router.replace(redirectURL);
    } else {
      // Handle success or show a loader
      router.replace("/dashboard"); // or wherever you want
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-blue-600">Verifying email, please wait...</p>
    </div>
  );
}
