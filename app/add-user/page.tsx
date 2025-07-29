
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

const roles = ["Admin", "Finance", "Sales", "Marketing", "Accounts","Marketing Associate", 
              "Sales Associate", "Finance Associate", "Accounts Associate"];

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
    emailRedirectTo: `https://applywizz-crm-tool.vercel.app/email-verify-redirect?email=${email}`,
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
          user_email:email,
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