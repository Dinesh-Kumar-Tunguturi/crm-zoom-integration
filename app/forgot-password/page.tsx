"use client";

import { useState } from "react";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";

export default function ForgotPasswordPage() {
  // Open the dialog immediately when the route loads
  const [open, setOpen] = useState(true);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
      <ForgotPasswordDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
