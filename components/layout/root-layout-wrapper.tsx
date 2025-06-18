"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth")

  return (
    <>
      {isAuthPage ? (
        <>
          {children}
          <Toaster />
        </>
      ) : (
        <SidebarProvider>
          {children}
          <Toaster />
        </SidebarProvider>
      )}
    </>
  )
}
