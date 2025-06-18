// import type React from "react"
// import type { Metadata } from "next"
// import { Inter } from "next/font/google"
// import "./globals.css"
// import { Toaster } from "@/components/ui/toaster"
// import { AuthProvider } from "@/components/providers/auth-provider"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "ApplyWizz CRM",
//   description: "Enterprise CRM Solution",
//     generator: 'v0.dev'
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <AuthProvider>
//           {children}
//           <Toaster />
//         </AuthProvider>
//       </body>
//     </html>
//   )
// }



import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/providers/auth-provider"
import { SidebarProvider } from "@/components/ui/sidebar" // ✅ added
import { LoadingProvider } from "@/components/providers/LoadingContext"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ApplyWizz CRM",
  description: "Enterprise CRM Solution",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
         <LoadingProvider>
        <AuthProvider>
          <SidebarProvider> {/* ✅ Wrap your entire app with sidebar context */}
              {children}
             <Toaster />
          </SidebarProvider>
        </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  )
}

