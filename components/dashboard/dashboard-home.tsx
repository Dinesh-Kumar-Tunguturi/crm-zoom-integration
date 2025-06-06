"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, UserCheck, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"

const moduleCards = [
  {
    title: "Marketing CRM",
    description: "Manage leads and marketing campaigns",
    icon: Users,
    href: "/marketing",
    module: "marketing",
    color: "bg-blue-500",
  },
  {
    title: "Sales CRM",
    description: "Track sales pipeline and deals",
    icon: TrendingUp,
    href: "/sales",
    module: "sales",
    color: "bg-green-500",
  },
  {
    title: "Account Management",
    description: "Manage client relationships",
    icon: UserCheck,
    href: "/account-management",
    module: "account-management",
    color: "bg-purple-500",
  },
  {
    title: "Finance CRM",
    description: "Track revenue and payments",
    icon: DollarSign,
    href: "/finance",
    module: "finance",
    color: "bg-orange-500",
  },
]

export function DashboardHome() {
  const { user, hasAccess } = useAuth()

  const accessibleModules = moduleCards.filter((card) => hasAccess(card.module))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your CRM today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accessibleModules.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Leads</span>
              <span className="font-semibold">1,234</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Deals</span>
              <span className="font-semibold">56</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Revenue</span>
              <span className="font-semibold">₹2,45,000</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium">New lead assigned</p>
              <p className="text-gray-500">John Smith - 2 minutes ago</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">Deal closed</p>
              <p className="text-gray-500">ABC Corp - ₹50,000 - 1 hour ago</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">Follow-up scheduled</p>
              <p className="text-gray-500">XYZ Ltd - Tomorrow 10:00 AM</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
