"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardHome } from "@/components/dashboard/dashboard-home"

export default function HomePage() {
  const { user } = useAuth()

  if (!user) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  )
}
