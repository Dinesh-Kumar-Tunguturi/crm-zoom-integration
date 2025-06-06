// "use client"

// import type React from "react"
// import { createContext, useContext, useState } from "react"

// type UserRole = "Super Admin" | "Marketing Team" | "Sales Team" | "Account Management Team" | "Finance Team"

// interface User {
//   id: string
//   name: string
//   email: string
//   role: UserRole
//   avatar?: string
// }

// interface UserContextType {
//   user: User | null
//   setUser: (user: User | null) => void
//   hasAccess: (module: string) => boolean
// }

// const UserContext = createContext<UserContextType | undefined>(undefined)

// export function UserProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>({
//     id: "1",
//     name: "John Doe",
//     email: "john@applywizz.com",
//     role: "Super Admin",
//     avatar: "/placeholder.svg?height=32&width=32",
//   })

//   const hasAccess = (module: string): boolean => {
//     if (!user) return false
//     if (user.role === "Super Admin") return true

//     const roleAccess: Record<UserRole, string[]> = {
//       "Super Admin": ["marketing", "sales", "account-management", "finance"],
//       "Marketing Team": ["marketing"],
//       "Sales Team": ["sales"],
//       "Account Management Team": ["account-management"],
//       "Finance Team": ["finance"],
//     }

//     return roleAccess[user.role]?.includes(module) || false
//   }

//   return <UserContext.Provider value={{ user, setUser, hasAccess }}>{children}</UserContext.Provider>
// }

// export function useUser() {
//   const context = useContext(UserContext)
//   if (context === undefined) {
//     throw new Error("useUser must be used within a UserProvider")
//   }
//   return context
// }



// user-provider.tsx


// user-provider.tsx
"use client";

import type React from "react";
import { AuthProvider } from "./auth-provider";

// ✅ Correctly defines and exports the wrapper component
export function UserProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

