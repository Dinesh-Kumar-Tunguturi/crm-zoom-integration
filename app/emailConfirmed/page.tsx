
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

    setTimeout(() => {
      setShowDialog(false);
    }, 3000);
    return;
  }

  setDialogTitle("✅ Password Updated");
  setDialogMessage("Your password was successfully updated.");
  setShowDialog(true);

  setTimeout(() => {
    setDialogTitle("🔁 Redirecting...");
    setDialogMessage("Redirecting you to login...");
  }, 1500);

  setTimeout(async () => {
    await supabase.auth.signOut();
    window.location.href = "https://applywizzcrm.vercel.app/";
  }, 3000);
};



  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-green-600 text-xl">
            Email Verified
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
