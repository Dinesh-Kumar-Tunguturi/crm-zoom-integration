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




"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EmailConfirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-green-600 text-xl">
            ✅ Email Verified
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Your email is now verified.</p>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
