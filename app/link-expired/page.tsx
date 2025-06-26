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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEmail } from '../context/EmailProvider';

export default function LinkExpired() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { signupEmail } = useEmail();

  // Get email from URL params first, then context, then sessionStorage
  const email = searchParams.get("email") || 
               signupEmail || 
               sessionStorage.getItem('signup_email');

  const handleResend = async () => {
    if (!email) {
      setMessage("❌ No email found. Please sign up again.");
      return;
    }

    setLoading(true);
    setMessage("Resending...");

    try {
      const res = await fetch("https://akbsvhaaajgwjlqrxikn.supabase.co/functions/v1/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to resend email");
      setMessage("✅ Confirmation email sent. Please check your inbox.");
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : "Failed to send request"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md space-y-4">
        <h1 className="text-xl font-bold text-red-600">
          Your confirmation link has expired.
        </h1>
        
        {email && <p className="text-gray-700">We'll resend to: <strong>{email}</strong></p>}

        <Button 
          onClick={handleResend} 
          disabled={!email || loading}
          className="w-full max-w-xs"
        >
          {loading ? "Sending..." : "Resend Confirmation Email"}
        </Button>

        {message && (
          <p className={`mt-2 text-sm ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}