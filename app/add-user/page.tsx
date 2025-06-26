// "use client";

// import { useState } from "react";
// import { supabase } from '@/utils/supabase/client';
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";

// const roles = ["Admin", "Finance", "Sales", "Marketing", "Accounts"];

// export default function AddUserPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("Sales");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   // const [fullName, setFullName] = useState("");



//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     try {
//       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//         email,
//         password,
//       });

//       if (signUpError) throw signUpError;
//       const authId = signUpData.user?.id;
//         if (!authId) throw new Error("User ID not returned");

//         await new Promise((res) => setTimeout(res, 1500)); // ✅ wait for auth.users to complete

//         const { data: uidData, error: uidError } = await supabase.rpc("generate_user_id");
//         if (uidError) throw uidError;

//         const customUserId = uidData;

//         // const { error: profileError } = await supabase.from("profiles").insert([
//         //   {
//         //     user_id: customUserId,
//         //     auth_id: authId,
//         //     roles: role,
//         //   },
//         // ]);
//         const { error: profileError } = await supabase.from("profiles").insert([
//   {
//     user_id: customUserId,
//     auth_id: authId,
//     roles: role,
//     // full_name: fullName, // assuming your 'profiles' table has this column
//   },
// ]);


//       if (profileError) throw profileError;

//       setMessage("✅ User created. Ask them to verify email.");
//     } catch (err: any) {
//       setMessage("❌ " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//           <ProtectedRoute allowedRoles={["add-user","Super Admin"]}>

//     <DashboardLayout>
//       <div className="space-y-6">
//         {/* 🔹 Page Header */}
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
//             <p className="text-gray-600 mt-2">Register a new employee and assign role</p>
//           </div>
//         </div>

//         {/* 📦 Full-width Signup Form Card */}
//         <Card className="w-full">
//           <CardHeader>
//             <CardTitle>Signup Form</CardTitle>
//             <p className="text-sm text-muted-foreground">Create login access with role</p>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSignup} className="space-y-4 w-full">
//               {/* <Input
//                   type="text"
//                   placeholder="Full Name"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   required
//                   className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
//                 /> */}

//               <Input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
//               />
//               {/* <Input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
//               /> */}
//               <div className="relative w-full">
//                 <Input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none pr-12"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   className="absolute inset-y-0 right-3 flex items-center text-gray-500"
//                   tabIndex={-1}
//                 >
//                   {showPassword ? (
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 12c-2.5 0-4.71-1.28-6-3 1.29-1.72 3.5-3 6-3s4.71 1.28 6 3c-1.29 1.72-3.5 3-6 3z" />
//                       <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
//                     </svg>
//                   ) : (
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path d="M4.293 4.293a1 1 0 011.414 0L15.707 14.293a1 1 0 01-1.414 1.414L13.1 14.514A8.45 8.45 0 0110 15c-5 0-8.27-4.11-9-7a8.456 8.456 0 014.048-5.394L4.293 4.293zM14.829 12.414L12.1 9.686A3 3 0 0010 7a3 3 0 00-1.143.232L5.707 4.08a8.464 8.464 0 014.293-1.08c5 0 8.27 4.11 9 7-.337 1.337-1.032 2.674-2.17 3.962l-1.707-1.548z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>

//               <Select value={role} onValueChange={setRole}>
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select Role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {roles.map((r) => (
//                     <SelectItem key={r} value={r}>
//                       {r}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <Button type="submit" className="w-full" disabled={loading}>
//                 {loading ? "Creating..." : "Create User"}
//               </Button>
//               {message && <p className="text-sm text-center mt-2">{message}</p>}
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </DashboardLayout>
//     </ProtectedRoute>
//   );
// }








// "use client";

// import { useState } from "react";
// import { supabase } from '@/utils/supabase/client';
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";

// const roles = ["Admin", "Finance", "Sales", "Marketing", "Accounts"];

// export default function AddUserPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("Sales");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [fullName, setFullName] = useState(""); // ← Add this line



//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     try {
//       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: { full_name: fullName },
//           // emailRedirectTo: "https://applywizzcrm.vercel.app/emailConfirmed",
//           // emailRedirectTo: "https://applywizzcrm.vercel.app/email-verify-redirect",
//           emailRedirectTo: `https://applywizzcrm.vercel.app/email-verify-redirect?email=${email}`


//         }

//       });

//       if (signUpError) throw signUpError;

//       localStorage.setItem("applywizz_user_email", email);

//       const authId = signUpData.user?.id;
//       if (!authId) throw new Error("User ID not returned");

//       await new Promise((res) => setTimeout(res, 1500)); // ✅ wait for auth.users to complete

//       const { data: uidData, error: uidError } = await supabase.rpc("generate_user_id");
//       if (uidError) throw uidError;

//       const customUserId = uidData;

//       const { error: profileError } = await supabase.from("profiles").insert([
//         {
//           user_id: customUserId,
//           auth_id: authId,
//           roles: role,
//           full_name: fullName, // ✅ added here

//         },
//       ]);

//       if (profileError) throw profileError;

//       // setMessage("✅ User created. Ask them to verify email.");
//       const now = new Date();
// const timeString = now.toLocaleTimeString([], {
//   hour: '2-digit',
//   minute: '2-digit',
//   second: '2-digit',
//   hour12: true
// });
// setMessage(`✅ User created at ${timeString}. Ask them to verify email.`);

//     } catch (err: any) {
//       setMessage("❌ " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

  

//   return (
//     <ProtectedRoute allowedRoles={["add-user", "Super Admin"]}>

//       <DashboardLayout>
//         <div className="space-y-6">
//           {/* 🔹 Page Header */}
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
//               <p className="text-gray-600 mt-2">Register a new employee and assign role</p>
//             </div>
//           </div>

//           {/* 📦 Full-width Signup Form Card */}
//           <Card className="w-full">
//             <CardHeader>
//               <CardTitle>Signup Form</CardTitle>
//               <p className="text-sm text-muted-foreground">Create login access with role</p>
//             </CardHeader>
//             <CardContent>
//               <form onSubmit={handleSignup} className="space-y-4 w-full">

//                 <Input
//                   type="text"
//                   placeholder="Full Name"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   required
//                 />


//                 <Input
//                   type="email"
//                   placeholder="Email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
//                 />
//                 {/* <Input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
//               /> */}
//                 <div className="relative w-full">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="w-full bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black focus:outline-none pr-12"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword((prev) => !prev)}
//                     className="absolute inset-y-0 right-3 flex items-center text-gray-500"
//                     tabIndex={-1}
//                   >
//                     {showPassword ? (
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-5 w-5"
//                         viewBox="0 0 20 20"
//                         fill="currentColor"
//                       >
//                         <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 12c-2.5 0-4.71-1.28-6-3 1.29-1.72 3.5-3 6-3s4.71 1.28 6 3c-1.29 1.72-3.5 3-6 3z" />
//                         <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
//                       </svg>
//                     ) : (
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-5 w-5"
//                         viewBox="0 0 20 20"
//                         fill="currentColor"
//                       >
//                         <path d="M4.293 4.293a1 1 0 011.414 0L15.707 14.293a1 1 0 01-1.414 1.414L13.1 14.514A8.45 8.45 0 0110 15c-5 0-8.27-4.11-9-7a8.456 8.456 0 014.048-5.394L4.293 4.293zM14.829 12.414L12.1 9.686A3 3 0 0010 7a3 3 0 00-1.143.232L5.707 4.08a8.464 8.464 0 014.293-1.08c5 0 8.27 4.11 9 7-.337 1.337-1.032 2.674-2.17 3.962l-1.707-1.548z" />
//                       </svg>
//                     )}
//                   </button>
//                 </div>

//                 <Select value={role} onValueChange={setRole}>
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select Role" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {roles.map((r) => (
//                       <SelectItem key={r} value={r}>
//                         {r}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <Button type="submit" className="w-full" disabled={loading}>
//                   {loading ? "Creating..." : "Create User"}
//                 </Button>
//                 {message && <p className="text-sm text-center mt-2">{message}</p>}
//               </form>
//             </CardContent>
//           </Card>
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }



"use client";

import { useState } from "react";
import { supabase } from '@/utils/supabase/client';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEmail } from "../context/EmailProvider";

const roles = ["Admin", "Finance", "Sales", "Marketing", "Accounts"];

export default function AddUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Sales");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const { setSignupEmail } = useEmail();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Store email in context and sessionStorage
      setSignupEmail(email);
      sessionStorage.setItem('signup_email', email);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
    emailRedirectTo: `https://applywizzcrm.vercel.app/email-verify-redirect?email=${email}`,
        }
      });

      if (signUpError) throw signUpError;

      // Store email in localStorage as fallback
      localStorage.setItem("applywizz_user_email", email);

      const authId = signUpData.user?.id;
      if (!authId) throw new Error("User ID not returned");

      await new Promise((res) => setTimeout(res, 1500)); // Wait for auth.users to complete

      const { data: uidData, error: uidError } = await supabase.rpc("generate_user_id");
      if (uidError) throw uidError;

      const customUserId = uidData;

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          user_id: customUserId,
          auth_id: authId,
          roles: role,
          full_name: fullName,
        },
      ]);

      if (profileError) throw profileError;

      const now = new Date();
      const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setMessage(`✅ User created at ${timeString}. Ask them to verify email.`);

    } catch (err: any) {
      // Clear email storage on error
      setSignupEmail('');
      sessionStorage.removeItem('signup_email');
      localStorage.removeItem("applywizz_user_email");
      
      setMessage("❌ " + (err.message || "Failed to create user"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["add-user", "Super Admin"]}>
      <DashboardLayout>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 text-xs text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating User..." : "Create User"}
                </Button>

                {message && (
                  <p className={`mt-2 text-sm text-center ${
                    message.startsWith("✅") ? "text-green-600" : "text-red-600"
                  }`}>
                    {message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}