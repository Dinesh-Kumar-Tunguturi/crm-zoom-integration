
// "use client";

// import { createContext, useContext, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// export type UserRole =
//   | "Super Admin"
//   | "Marketing"
//   | "Sales"
//   | "Account Management"
//   | "Finance";

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: UserRole;
//   avatar?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => void;
//   hasAccess: (module: string) => boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//   const restoreSession = async () => {
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) {
//       setUser(null);
//       return;
//     }

//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("auth_id", user.id)
//       .single();

//     if (!profile || profileError) {
//       setUser(null);
//       return;
//     }

//     const userData: User = {
//       id: profile.user_id,
//       name: user.user_metadata?.full_name || "User",
//       email: user.email!,
//       role: convertRole(profile.roles),
//     };

//     setUser(userData);
//   };

//   restoreSession();
// }, []);


//   const login = async (email: string, password: string): Promise<boolean> => {
//     const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (authError || !authData.user) {
//       return false;
//     }

//     const authId = authData.user.id;

//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("auth_id", authId)
//       .single();

//     if (profileError || !profile) {
//       return false;
//     }

//     const userData: User = {
//       id: profile.user_id,
//       name: authData.user.user_metadata?.full_name || "User",
//       email: authData.user.email!,
//       role: convertRole(profile.roles),
//     };

//     setUser(userData);

//     // 🚀 Redirect based on role
//     switch (userData.role) {
//       case "Super Admin":
//         router.push("/");
//         break;
//       case "Marketing":
//         router.push("/marketing");
//         break;
//       case "Sales":
//         router.push("/sales");
//         break;
//       case "Account Management":
//         router.push("/account-management");
//         break;
//       case "Finance":
//         router.push("/finance");
//         break;
//       default:
//         router.push("/unauthorized");
//         break;
//     }

//     return true;
//   };

//   const logout = async () => {
//     await supabase.auth.signOut();
//     setUser(null);
//     router.push("/");
//   };

//   const hasAccess = (module: string): boolean => {
//     if (!user) return false;
//     if (user.role === "Super Admin") return true;

//     const accessMap: Record<UserRole, string[]> = {
//       "Super Admin": ["admin", "marketing", "sales", "account-management", "finance"],
//       Marketing: ["marketing"],
//       Sales: ["sales"],
//       "Account Management": ["account-management"],
//       Finance: ["finance"],
//     };

//     return accessMap[user.role]?.includes(module) || false;
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, hasAccess }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used inside AuthProvider");
//   }
//   return context;
// }

// function convertRole(role: string): UserRole {
//   const map: Record<string, UserRole> = {
//     Admin: "Super Admin",
//     Marketing: "Marketing",
//     Sales: "Sales",
//     Account: "Account Management",
//     Accounts: "Account Management",
//     Finance: "Finance",
//     "Finance Team": "Finance",
//     "Sales Team": "Sales",
//     "Marketing Team": "Marketing",
//     "Account Management Team": "Account Management",
//   };

//   return map[role] || "Super Admin";
// }








"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export type UserRole =
  | "Super Admin"
  | "Marketing"
  | "Sales"
  | "Account Management"
  | "Finance";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
  const restoreSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!profile || profileError) {
      setUser(null);
      return;
    }

    const userData: User = {
      id: profile.user_id,
      name: user.user_metadata?.full_name || "User",
      email: user.email!,
      role: convertRole(profile.roles),
    };

    setUser(userData);
  };

  restoreSession();
}, []);


  const login = async (email: string, password: string): Promise<boolean> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return false;
    }

    const authId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (profileError || !profile) {
      return false;
    }

    const userData: User = {
      id: profile.user_id,
      name: authData.user.user_metadata?.full_name || "User",
      email: authData.user.email!,
      role: convertRole(profile.roles),
    };

    setUser(userData);

    // 🚀 Redirect based on role
    switch (userData.role) {
      case "Super Admin":
        router.push("/");
        break;
      case "Marketing":
        router.push("/marketing");
        break;
      case "Sales":
        router.push("/sales");
        break;
      case "Account Management":
        router.push("/account-management");
        break;
      case "Finance":
        router.push("/finance");
        break;
      default:
        router.push("/unauthorized");
        break;
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const hasAccess = (module: string): boolean => {
    if (!user) return false;
    if (user.role === "Super Admin") return true;

    const accessMap: Record<UserRole, string[]> = {
      "Super Admin": ["admin", "marketing", "sales", "account-management", "finance"],
      Marketing: ["marketing"],
      Sales: ["sales"],
      "Account Management": ["account-management"],
      Finance: ["finance"],
    };

    return accessMap[user.role]?.includes(module) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

function convertRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    Admin: "Super Admin",
    Marketing: "Marketing",
    Sales: "Sales",
    Account: "Account Management",
    Accounts: "Account Management",
    Finance: "Finance",
    "Finance Team": "Finance",
    "Sales Team": "Sales",
    "Marketing Team": "Marketing",
    "Account Management Team": "Account Management",
  };

  return map[role] || "Super Admin";
}
