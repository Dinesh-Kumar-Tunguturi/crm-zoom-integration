
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmailConfirmed() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "expired">("pending");

  useEffect(() => {
    const verifyEmail = async () => {
      setLoading(true);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token_hash = urlParams.get("token_hash");
        const type = urlParams.get("type");
        const emailFromQuery = urlParams.get("email");

        if (type === "email" && token_hash && emailFromQuery) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: "email",
            token_hash,
            email: emailFromQuery,
          });

          if (error) {
            if (error.message.includes("expired") || error.message.includes("invalid")) {
              setVerificationStatus("expired");
              return;
            }
            throw error;
          }

          setVerificationStatus("verified");
          setEmail(data.user?.email || "");
        } else {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !session?.user) {
            setVerificationStatus("expired");
            return;
          }

          setVerificationStatus("verified");
          setEmail(session.user.email || "");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setVerificationStatus("expired");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, []);

  const handlePasswordUpdate = async () => {
    if (!password || password.length < 6) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setDialogTitle("✅ Password Updated");
      setDialogMessage("Your password was successfully updated.");
      setShowDialog(true);

      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = "https://applywizz-crm-tool.vercel.app/";
      }, 2000);
    } catch (error: any) {
      setDialogTitle("❌ Update Failed");
      setDialogMessage(error.message || "Failed to update password");
      setShowDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toast({
        title: "✅ Confirmation Sent",
        description: "A new verification email has been sent to your address.",
      });
      router.push("/link-expired");
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to resend confirmation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus === "pending") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Verifying Email...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "expired") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-red-600 text-xl">
              Verification Link Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              Your verification link has expired. Please request a new one.
            </p>
            <Button
              className="w-full"
              onClick={handleResendConfirmation}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                href="https://applywizz-crm-tool.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://applywizz-crm-tool.vercel.app/
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
                placeholder="Enter your new password (min 6 characters)"
                className="pr-10"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              className="w-full mt-4"
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
        </CardContent>
      </Card>
    </div>
  );
}
