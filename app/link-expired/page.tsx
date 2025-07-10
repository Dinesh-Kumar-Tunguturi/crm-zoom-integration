//app/link-expired/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function LinkExpiredPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem("applywizz_user_email");
    if (storedEmail) {
      setEmail(storedEmail);
      console.log("🪪 Retrieved email from localStorage:", storedEmail);
    } else {
      console.warn("⚠️ No email found in localStorage.");
    }
  }, []);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "❌ Email not found",
        description: "We couldn't find your email. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("📤 Sending resend request for:", email);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Confirmation Sent",
        description: "A new verification link has been sent to your email.",
      });

      // Optional: redirect to login or confirmation wait page
      setTimeout(() => {
        router.push("/email-verify-redirect?email=" + encodeURIComponent(email));
      }, 2000);
    } catch (error: any) {
      console.error("❌ Resend error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to resend confirmation email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600 text-xl">
            Your confirmation link expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            No problem. Click the button below to resend.
          </p>

          <Input
            type="email"
            value={email}
            disabled
            className="cursor-not-allowed bg-gray-100"
          />

          <Button
            onClick={handleResendConfirmation}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Sending..." : "Resend Confirmation Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
