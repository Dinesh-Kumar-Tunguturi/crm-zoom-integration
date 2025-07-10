// components/ForgotPasswordDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "../providers/auth-provider";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth()

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSendResetLink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/email-verify-redirect?email=${encodeURIComponent(email)}`,
      });

      if (error) throw error;

      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
        onOpenChange(false); // Close parent dialog
      }, 2000);
    } catch (error: any) {
      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
          </DialogHeader>

          <p id="reset-password-description" className="text-sm text-muted-foreground mb-2">
            Reset password link will be sent to this email. Please check your inbox.
          </p>

          <Label htmlFor="email">Email</Label>          
          <Input
            id="email"
            type="email"
            value={email}
            placeholder="Enter your registered email"
            readOnly
            className="bg-gray-100 text-red-800 font-semibold cursor-not-allowed"
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>✅ Reset Link Sent</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-900 font-semibold">Check your email to reset your password.</p>
        </DialogContent>
      </Dialog>

    </>
  );
}
