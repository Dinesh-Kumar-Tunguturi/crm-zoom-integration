// // app/email-confirmed/page.tsx
// export default function EmailConfirmed() {
//   return (
//     <div className="flex flex-col items-center justify-center h-screen">
//       <h1 className="text-2xl font-bold">✅ Email Verified</h1>
//       <p className="text-gray-600 mt-2">Your email is now verified.</p>
//       <a
//         href="/"
//         className="mt-6 text-blue-600 underline hover:text-blue-800"
//       >
//         Go to Login
//       </a>
//     </div>
//   );
// }




// app/email-confirmed/page.tsx

// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// export default function EmailConfirmed() {
//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
//       <Card className="w-full max-w-md text-center shadow-xl">
//         <CardHeader>
//           <CardTitle className="text-xl font-bold">✅ Email Verified</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
//           <a
//             href="/"
//             className="text-blue-600 underline hover:text-blue-800 font-medium"
//           >
//             Go to Login
//           </a>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }




// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";

// export default function EmailConfirmed() {
//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//             <Card className="max-w-md w-full shadow-lg">
//                 <CardHeader>
//                     <CardTitle className="text-center text-green-600 text-xl">
//                         ✅ Email Verified
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent className="text-center space-y-4">
//                     <p className="text-gray-600">Your email is now verified.</p>
//                     {/* <Link href="/">
//             <Button variant="outline" className="w-full">
//               Go to Login
//             </Button>
//           </Link> */}
//                     <a
//                         href="https://applywizzcrm.vercel.app/"
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 underline hover:opacity-80 cursor-pointer"
//                     >
//                         https://applywizzcrm.vercel.app/
//                     </a>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }







// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { supabase } from "@/utils/supabase/client"; // Make sure path is correct
// import { toast } from "@/components/ui/use-toast"; // optional for feedback
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";


// const [email, setEmail] = useState("");
// const [password, setPassword] = useState("");
// const [loading, setLoading] = useState(false);

// const handlePasswordUpdate = async () => {
//     setLoading(true);
//     const { error } = await supabase.auth.updateUser({
//         email,
//         password,
//     });

//     setLoading(false);

//     if (error) {
//         toast({ title: "❌ Failed", description: error.message, variant: "destructive" });
//     } else {
//         toast({ title: "✅ Password Updated", description: "You can now sign in using this password." });
//     }
// };


// export default function EmailConfirmed() {
//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//             <Card className="max-w-md w-full shadow-lg">
//                 <CardHeader>
//                     <CardTitle className="text-center text-green-600 text-xl">
//                         ✅ Email Verified
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent className="text-center space-y-4">
//     <p className="text-gray-600">Your email is now verified.</p>

//     <div className="space-y-2 text-left">
//         <p>Please update your password</p>
//         <Label htmlFor="email">Email</Label>
//         <Input
//             id="email"
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="Enter your email"
//         />

//         <Label htmlFor="password">New Password</Label>
//         <Input
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Set new password"
//         />

//         <Button
//             className="w-full mt-2"
//             onClick={handlePasswordUpdate}
//             disabled={loading}
//         >
//             {loading ? "Updating..." : "Update Password"}
//         </Button>
//     </div>

//     <a
//         href="https://applywizzcrm.vercel.app/"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="text-blue-600 underline hover:opacity-80 cursor-pointer block"
//     >
//         https://applywizzcrm.vercel.app/
//     </a>
// </CardContent>

//             </Card>
//         </div>
//     );
// }





"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function EmailConfirmed() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [showDialog, setShowDialog] = useState(false);
const [dialogMessage, setDialogMessage] = useState("");
const [dialogTitle, setDialogTitle] = useState("");



  useEffect(() => {
  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  };

  getSession();
}, []);

const handlePasswordUpdate = async () => {
  setLoading(true);

  const { error } = await supabase.auth.updateUser({
    password,
  });

  setLoading(false);

  if (error) {
    setDialogTitle("❌ Update Failed");
    setDialogMessage(error.message);
    setShowDialog(true);
  } else {
    setDialogTitle("✅ Password Updated");
    setDialogMessage("You can now log in with your new password.");
    setShowDialog(true);
  }

  // Auto-close dialog after 3 seconds
  setTimeout(() => {
    setShowDialog(false);
  }, 3000);
};


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-green-600 text-xl">
            ✅ Email Verified
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p>Your email is now verified.</p>
            <p className="mt-1 text-blue-600 underline">
              <a
                href="https://applywizzcrm.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://applywizzcrm.vercel.app/
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Set a new password to complete your setup:
            </p>

            <Label htmlFor="email">Email</Label>
<Input
  id="email"
  type="email"
  value={email}
  disabled
  className="bg-gray-100 cursor-not-allowed"
/>

<Label htmlFor="password">New Password</Label>
<div className="relative">
  <Input
    id="password"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Enter your new password"
    className="pr-10"
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-2.5 text-gray-500"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>

  <Button
  className="w-full mt-2"
  onClick={handlePasswordUpdate}
  disabled={loading || password.length < 6}
>
  {loading ? "Updating..." : "Update Password"}
</Button>

<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>{dialogTitle}</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-gray-600">{dialogMessage}</p>
  </DialogContent>
</Dialog>


</div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
