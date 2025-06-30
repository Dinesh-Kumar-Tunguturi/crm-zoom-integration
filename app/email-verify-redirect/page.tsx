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
    // <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
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

      // if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
      //   router.push("/link-expired");
      //   return;
      // }

      // if (!authCode) {
      //   console.error("No auth code found in URL.");
      //   router.push("/link-expired");
      //   return;
      // }

      // const { error } = await supabase.auth.exchangeCodeForSession(authCode);

      // if (error) {
      //   const msg = error.message.toLowerCase();
      //   if (msg.includes("expired") || msg.includes("invalid") || error.status === 400) {
      //     router.push("/link-expired");
      //   } else {
      //     console.error("Token exchange failed:", error.message);
      //   }
      //   return;
      // }

      // window.history.replaceState(null, "", window.location.pathname);

      // setTimeout(() => {
      //   router.push("/emailConfirmed");
      // }, 1500);
//     };

//     handleRedirect();
//   }, [router]);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying email.., please wait ...
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
//       const href = window.location.href;
//       console.log(href);

//       console.log("🧪 Just landed on email-verify-redirect");

//       // Extract email safely (before any # or &)
//       const emailMatch = href.match(/email=([^&#]+)/);
//       const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null;
//       console.log("🔍 Extracted email:", email);

//       if (email) {
//         localStorage.setItem("applywizz_user_email", email);
//         console.log("📦 Email stored in localStorage");
//       }

//       // Extract code safely (before any # or &)
//       const codeMatch = href.match(/code=([^&#]+)/);
//       const authCode = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
//       console.log("🔍 Extracted authCode:", authCode);

//       // ⛔ If code is missing or contains error values, redirect
//       if (!authCode || authCode === "otp_expired" || authCode === "access_denied") {
//         console.warn("🚫 Invalid or expired auth code");
//         router.push("/link-expired");
//         return;
//       }

//       // ✅ Attempt to exchange code for session
//       const { error } = await supabase.auth.exchangeCodeForSession(authCode);

//       if (error) {
//         console.error("❌ Session exchange failed:", error.message);
//         router.push("/link-expired");
//         return;
//       }

//       // ✅ Go to confirmation page
//       router.push("/emailConfirmed");
//     };

//     handleRedirect();
//   }, [router]);

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
//       <div className="text-lg font-medium text-blue-600">
//         Verifying your email...
//       </div>
//     </div>
//   );
// }



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
