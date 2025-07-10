// components/ForgotPasswordDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/email-verify-redirect?email=${encodeURIComponent(email)}`,
      });

      console.log("🔗 Reset link sent to:", email);
      if (error) throw error;

      toast({
        title: "✅ Reset Link Sent",
        description: "Check your email to reset your password.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Could not send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
        </DialogHeader>

        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your registered email"
        />

        <Button
          onClick={handleSendResetLink}
          disabled={loading || !email}
          className="w-full mt-4"
        >
          {loading ? "Sending..." : "Send Reset Password Link"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
