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




// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const handleRedirect = async () => {
//       const url = new URL(window.location.href);
//       const authCode = url.searchParams.get("code");

//       // ⛔ Check if Supabase added error in hash (e.g., #error=access_denied...)
//       const hash = window.location.hash;

//       if (hash.includes("error=access_denied") && hash.includes("otp_expired")) {
//         router.push("/link-expired");
//         return;
//       }

//       if (!authCode) {
//         console.error("No auth code found in URL.");
//         router.push("/link-expired");
//         return;
//       }

//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         const msg = error.message.toLowerCase();
//         if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
//           router.push("/link-expired");
//         } else {
//           console.error("Token exchange failed:", error.message);
//         }
//         return;
//       }

//       // ✅ Clean the URL
//       window.history.replaceState(null, "", window.location.pathname);

//       // ✅ Redirect
//       setTimeout(() => {
//         router.push("/emailConfirmed");
//       }, 1500);
//     };

//     handleRedirect();
//   }, [router]);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying email, please wait...
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const handleRedirect = async () => {
//       const url = new URL(window.location.href);
//       const authCode = url.searchParams.get("code");
//       const emailFromQuery = url.searchParams.get("email");
//       const hash = window.location.hash;

//       // ✅ Store email in localStorage if passed in URL
//       if (emailFromQuery) {
//         localStorage.setItem("applywizz_user_email", emailFromQuery);
//       }

//       // ⛔ If Supabase added error in hash
//       if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
//         router.push("/link-expired");
//         return;
//       }

//       // ⛔ If auth code is missing
//       if (!authCode) {
//         console.error("No auth code found in URL.");
//         router.push("/link-expired");
//         return;
//       }

//       // ✅ Try to exchange code for session
//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         const msg = error.message.toLowerCase();
//         if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
//           router.push("/link-expired");
//         } else {
//           console.error("Token exchange failed:", error.message);
//         }
//         return;
//       }

//       // ✅ Clean the URL and redirect to success page
//       window.history.replaceState(null, "", window.location.pathname);

//       setTimeout(() => {
//         router.push("/emailConfirmed");
//       }, 1500);
//     };

//     handleRedirect();
//   }, [router]);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying email, please wait...
//       </div>
//     </div>
//   );
// }




// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const handleRedirect = async () => {
//       const url = new URL(window.location.href);
//       const authCode = url.searchParams.get("code");
//       const emailFromQuery = url.searchParams.get("email");
//       const hash = window.location.hash;

//       // ✅ Store & print email
//       if (emailFromQuery) {
//         const decodedEmail = decodeURIComponent(emailFromQuery);
//         localStorage.setItem("applywizz_user_email", decodedEmail);
//         console.log("📨 Email from URL:", decodedEmail);
//       }

//       // ⛔ If Supabase added error in hash
//       if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
//         router.push("/link-expired");
//         return;
//       }

//       // ⛔ If auth code is missing
//       if (!authCode) {
//         console.error("No auth code found in URL.");
//         router.push("/link-expired");
//         return;
//       }

//       // ✅ Try to exchange code for session
//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         const msg = error.message.toLowerCase();
//         if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
//           router.push("/link-expired");
//         } else {
//           console.error("Token exchange failed:", error.message);
//         }
//         return;
//       }

//       // ✅ Clean the URL and redirect to success page
//       window.history.replaceState(null, "", window.location.pathname);

//       setTimeout(() => {
//         router.push("/emailConfirmed");
//       }, 1500);
//     };

//     handleRedirect();
//   }, [router]);

//   // return (
//   //   <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//   //     <div className="text-lg font-medium text-blue-600">
//   //       Verifying email, please wait...
//   //     </div>
//   //   </div>
//   // );
// }

//--------------------SEIDNING re-emails to users inbox--------------
// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export const dynamic = "force-dynamic"; // 👈 IMPORTANT!

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const handleRedirect = async () => {
//       const url = new URL(window.location.href);
//       const authCode = url.searchParams.get("code");
//       const emailFromQuery = url.searchParams.get("email");
//       const hash = window.location.hash;

//       if (emailFromQuery) {
//         console.log("✅ User email from URL:", emailFromQuery); // 👈 your log
//         localStorage.setItem("applywizz_user_email", emailFromQuery);
//       }

//       if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
//         router.push("/link-expired");
//         return;
//       }

//       if (!authCode) {
//         console.error("No auth code found in URL.");
//         router.push("/link-expired");
//         return;
//       }

//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         const msg = error.message.toLowerCase();
//         if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
//           router.push("/link-expired");
//         } else {
//           console.error("Token exchange failed:", error.message);
//         }
//         return;
//       }

//       window.history.replaceState(null, "", window.location.pathname);

//       setTimeout(() => {
//         router.push("/emailConfirmed");
//       }, 1500);
//     };

//     handleRedirect();
//   }, [router]);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying email, please wait...
//       </div>
//     </div>
//   );
// }

//---------------------sendig re-emails to users inbox-----------
// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export default function EmailVerifyRedirect() {
//   const router = useRouter();

//   useEffect(() => {
//     const handleRedirect = async () => {
//       const url = new URL(window.location.href);
//       const authCode = url.searchParams.get("code");
//       const emailFromQuery = url.searchParams.get("email");

//       // ✅ Always store email for fallback in link-expired
//       if (emailFromQuery) {
//         localStorage.setItem("applywizz_user_email", emailFromQuery);
//         console.log("✅ Email stored:", emailFromQuery);
//       }

//       // ⛔ If code is missing from URL, redirect to expired page
//       if (!authCode) {
//         console.warn("❌ No auth code found in URL.");
//         router.push("/link-expired");
//         return;
//       }

//       // ✅ Try exchanging code for session
//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         const msg = error.message.toLowerCase();
//         console.warn("❌ Supabase error:", msg);
//         if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
//           router.push("/link-expired");
//         } else {
//           // Rare errors: log for debugging
//           console.error("Unexpected error:", error.message);
//           router.push("/link-expired");
//         }
//         return;
//       }

//       // ✅ Success: go to confirmation page
//       router.push("/emailConfirmed");
//     };

//     handleRedirect();
//   }, [router]);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying email, please wait...
//       </div>
//     </div>
//   );
// }






"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export const dynamic = "force-dynamic"; // Avoid caching for auth flow

export default function EmailVerifyRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const hash = window.location.hash; // e.g. #access_token=abc&refresh_token=xyz&type=signup&email=abc@example.com&expires_in=3600
      const queryString = hash.startsWith("#") ? hash.slice(1) : hash; // remove #
      const queryParts = queryString.split("&");

      const params: Record<string, string> = {};
      for (const part of queryParts) {
        const [key, value] = part.split("=");
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      }

      const authCode = params["code"];
      const emailFromQuery = params["email"];

      if (emailFromQuery) {
        localStorage.setItem("applywizz_user_email", emailFromQuery);
        console.log("✅ Email stored:", emailFromQuery);
      }

      if (!authCode) {
        console.warn("❌ Auth code missing in hash.");
        router.push("/link-expired");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (error) {
        const msg = error.message.toLowerCase();
        console.warn("❌ Supabase error:", msg);
        if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
          router.push("/link-expired");
        } else {
          console.error("🔴 Unknown error:", error.message);
          router.push("/link-expired");
        }
        return;
      }

      window.history.replaceState(null, "", window.location.pathname);

      setTimeout(() => {
        router.push("/emailConfirmed");
      }, 1000);
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="text-lg font-medium text-blue-600">
        Verifying email, please wait...
      </div>
    </div>
  );
}
