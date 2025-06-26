//-----------------This code is running perfectly----------------------
// "use client";

// import { useState, useEffect } from "react";
// import { supabase } from "@/utils/supabase/client";
// import { Button } from "@/components/ui/button";

// export default function LinkExpired() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     const fetchEmail = async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       if (session?.user?.email) {
//         setEmail(session.user.email);
//       }
//     };

//     fetchEmail();
//   }, []);

//   const handleResend = async () => {
//     setMessage("Resending...");

//     if (!email) {
//       setMessage("❌ We couldn’t detect your email. Please sign up again.");
//       return;
//     }

//     const { error } = await supabase.auth.resend({
//       type: "signup",
//       email,
//       options: {
//         emailRedirectTo: "https://applywizzcrm.vercel.app/email-verify-redirect",
//       },
//     });

//     if (error) {
//       setMessage("❌ Could not resend email. Please try again later.");
//     } else {
//       setMessage("✅ Confirmation email sent. Please check your inbox.");
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
//       <div className="text-center max-w-md space-y-4">
//         <h1 className="text-xl font-bold text-red-600">
//           Your confirmation link has expired.
//         </h1>
//         <p className="text-gray-700">
//           Don’t worry! You can resend the verification email by clicking below.
//         </p>

//         <Button onClick={handleResend} disabled={!email}>
//           Resend Confirmation Email
//         </Button>

//         {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
//       </div>
//     </div>
//   );
// }
//---------------------------Till here-------------------------------------------



//----------------------This one is most better than top code-------------------

// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";

// export default function LinkExpired() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const emailFromQuery = urlParams.get("email");
//     if (emailFromQuery) {
//       setEmail(emailFromQuery);
//     }
//   }, []);

//   const handleResend = async () => {
//     setLoading(true);
//     setMessage("Resending...");

//     if (!email) {
//       setMessage("❌ No email found. Please sign up again.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch("https://akbsvhaaajgwjlqrxikn.supabase.co/functions/v1/resend-confirmation", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email }),
//       });

//       const result = await res.json();

//       if (!res.ok) {
//         setMessage("❌ " + (result.error || "Could not resend email."));
//       } else {
//         setMessage("✅ Confirmation email sent. Please check your inbox.");
//       }
//     } catch (err) {
//       setMessage("❌ Failed to send request.");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
//       <div className="text-center max-w-md space-y-4">
//         <h1 className="text-xl font-bold text-red-600">
//           Your confirmation link has expired.
//         </h1>
//         <p className="text-gray-700">
//           Don’t worry! You can resend the verification email by clicking below.
//         </p>

//         <Button onClick={handleResend} disabled={!email || loading}>
//           {loading ? "Sending..." : "Resend Confirmation Email"}
//         </Button>

//         {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
//       </div>
//     </div>
//   );
// }
//-----------------Till hre this one is better------------------



// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";

// export default function LinkExpired() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const emailFromQuery = urlParams.get("email");

//     if (emailFromQuery) {
//       setEmail(emailFromQuery);
//     } else {
//       // fallback: try localStorage
//       const fallbackEmail = localStorage.getItem("applywizz_user_email");
//       if (fallbackEmail) setEmail(fallbackEmail);
//     }
//   }, []);

//   const handleResend = async () => {
//     setLoading(true);
//     setMessage("Resending...");

//     if (!email) {
//       setMessage("❌ No email found. Please sign up again.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch("https://akbsvhaaajgwjlqrxikn.supabase.co/functions/v1/resend-confirmation", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const result = await res.json();
//       if (!res.ok) {
//         setMessage("❌ " + (result.error || "Could not resend email."));
//       } else {
//         setMessage("✅ Confirmation email sent. Please check your inbox.");
//       }
//     } catch (err) {
//       setMessage("❌ Failed to send request.");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
//       <div className="text-center max-w-md space-y-4">
//         <h1 className="text-xl font-bold text-red-600">
//           Your confirmation link has expired.
//         </h1>
//         <p className="text-gray-700">
//           Don’t worry! You can resend the verification email by clicking below.
//         </p>

//         <Button onClick={handleResend} disabled={!email || loading}>
//           {loading ? "Sending..." : "Resend Confirmation Email"}
//         </Button>

//         {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
//       </div>
//     </div>
//   );
// }


// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { useSearchParams } from "next/navigation";

// export default function LinkExpired() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     // First try to get email from URL params
//     const emailFromQuery = searchParams.get("email");
    
//     if (emailFromQuery) {
//       setEmail(decodeURIComponent(emailFromQuery));
//     } else {
//       // Fallback to localStorage if URL param not available
//       const fallbackEmail = localStorage.getItem("applywizz_user_email");
//       if (fallbackEmail) {
//         setEmail(fallbackEmail);
//       }
//     }
//   }, [searchParams]);

//   const handleResend = async () => {
//     setLoading(true);
//     setMessage("Resending...");

//     if (!email) {
//       setMessage("❌ No email found. Please sign up again.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch("https://akbsvhaaajgwjlqrxikn.supabase.co/functions/v1/resend-confirmation", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const result = await res.json();
//       if (!res.ok) {
//         throw new Error(result.error || "Could not resend email.");
//       }
      
//       setMessage("✅ Confirmation email sent. Please check your inbox.");
//       // Store email in localStorage for future reference
//       localStorage.setItem("applywizz_user_email", email);
//     } catch (err) {
//       setMessage(`❌ ${err instanceof Error ? err.message : "Failed to send request."}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
//       <div className="text-center max-w-md space-y-4">
//         <h1 className="text-xl font-bold text-red-600">
//           Your confirmation link has expired.
//         </h1>
//         <p className="text-gray-700">
//           Don't worry! You can resend the verification email by clicking below.
//         </p>

//         <Button 
//           onClick={handleResend} 
//           disabled={!email || loading}
//           className="w-full max-w-xs"
//         >
//           {loading ? "Sending..." : "Resend Confirmation Email"}
//         </Button>

//         {message && (
//           <p className={`mt-2 text-sm ${
//             message.startsWith("✅") ? "text-green-600" : "text-red-600"
//           }`}>
//             {message}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }


// app/link-expired/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LinkExpired() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract email from ALL possible sources
    const emailFromParams = searchParams.get("email");
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const emailFromHash = hashParams.get("email");

    const resolvedEmail = emailFromParams || emailFromHash;
    if (resolvedEmail) {
      setEmail(decodeURIComponent(resolvedEmail));
      // Store as fallback
      sessionStorage.setItem('pending_verification_email', resolvedEmail);
    }
  }, [searchParams]);

  // app/link-expired/page.tsx
// app/link-expired/page.tsx
const handleResend = async () => {
  setLoading(true);
  setMessage("Sending...");

  try {
    const response = await fetch(
      'https://akbsvhaaajgwjlqrxikn.supabase.co/functions/v1/resend-confirmation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add this authorization header
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to resend");
    }

    setMessage("✅ New confirmation email sent!");
  } catch (error) {
    setMessage(`❌ ${error instanceof Error ? error.message : "Failed to send"}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            Link Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Your verification link has expired (valid for 45 seconds).
          </p>

          {email && (
            <p className="text-center text-sm font-medium">
              Resending to: <span className="text-blue-600">{email}</span>
            </p>
          )}

          <Button
            onClick={handleResend}
            disabled={!email || loading}
            className="w-full"
          >
            {loading ? "Sending..." : "Send New Confirmation Email"}
          </Button>

          {message && (
            <p className={`text-center text-sm ${
              message.includes("successfully") ? "text-green-600" : "text-red-600"
            }`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}