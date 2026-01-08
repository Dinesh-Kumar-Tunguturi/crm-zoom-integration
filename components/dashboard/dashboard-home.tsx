// //components/dashboard/dashboard-home.tsx
// "use client"

// import { useAuth } from "@/components/providers/auth-provider"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Users, TrendingUp, UserCheck, DollarSign, BarChart3 } from "lucide-react"
// import Link from "next/link"

// const moduleCards = [
//   {
//     title: "Marketing CRM",
//     description: "Manage leads and marketing campaigns",
//     icon: Users,
//     href: "/marketing",
//     module: "marketing",
//     color: "bg-blue-500",
//   },
//   {
//     title: "Sales CRM",
//     description: "Track sales pipeline and deals",
//     icon: TrendingUp,
//     href: "/sales",
//     module: "sales",
//     color: "bg-green-500",
//   },
//   {
//     title: "Account Management",
//     description: "Manage client relationships",
//     icon: UserCheck,
//     href: "/account-management",
//     module: "account-management",
//     color: "bg-purple-500",
//   },
//   {
//     title: "Finance CRM",
//     description: "Track revenue and payments",
//     icon: DollarSign,
//     href: "/finance",
//     module: "finance",
//     color: "bg-orange-500",
//   },
// ]

// export function DashboardHome() {
//   const { user, hasAccess } = useAuth()

//   const accessibleModules = moduleCards.filter((card) => hasAccess(card.module))

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
//         <p className="text-gray-600 mt-2">Here's what's happening with your CRM today.</p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {accessibleModules.map((card) => (
//           <Link key={card.title} href={card.href}>
//             <Card className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
//                 <div className={`p-2 rounded-lg ${card.color}`}>
//                   <card.icon className="h-4 w-4 text-white" />
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription>{card.description}</CardDescription>
//               </CardContent>
//             </Card>
//           </Link>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <BarChart3 className="h-5 w-5" />
//               Quick Stats
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-600">Total Leads</span>
//               <span className="font-semibold">1,234</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-600">Active Deals</span>
//               <span className="font-semibold">56</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-sm text-gray-600">Monthly Revenue</span>
//               <span className="font-semibold">₹2,45,000</span>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Activity</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             <div className="text-sm">
//               <p className="font-medium">New lead assigned</p>
//               <p className="text-gray-500">John Smith - 2 minutes ago</p>
//             </div>
//             <div className="text-sm">
//               <p className="font-medium">Deal closed</p>
//               <p className="text-gray-500">ABC Corp - ₹50,000 - 1 hour ago</p>
//             </div>
//             <div className="text-sm">
//               <p className="font-medium">Follow-up scheduled</p>
//               <p className="text-gray-500">XYZ Ltd - Tomorrow 10:00 AM</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }











// // components/dashboard/dashboard-home.tsx
// "use client"

// import { useState } from "react"
// import { useAuth } from "@/components/providers/auth-provider"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import {
//   Users,
//   TrendingUp,
//   UserCheck,
//   DollarSign,
//   BarChart3,
//   Link2,
//   ShieldCheck,
//   FileText,
//   Eye,
//   EyeOff,
//   Pencil,
// } from "lucide-react"
// import Link from "next/link"

// /* ===============================
//    MODULE CARDS
// ================================ */
// const moduleCards = [
//   { title: "Marketing CRM", description: "Manage leads and marketing campaigns", icon: Users, href: "/marketing", module: "marketing", color: "bg-blue-500" },
//   { title: "Sales CRM", description: "Track sales pipeline and deals", icon: TrendingUp, href: "/sales", module: "sales", color: "bg-green-500" },
//   { title: "Account Management", description: "Manage client relationships", icon: UserCheck, href: "/account-management", module: "account-management", color: "bg-purple-500" },
//   { title: "Finance CRM", description: "Track revenue and payments", icon: DollarSign, href: "/finance", module: "finance", color: "bg-orange-500" },
// ]

// /* ===============================
//    SECURITY CONFIG (UI-ONLY)
// ================================ */
// const ADMIN_PASSWORD = "Nikhil@1092"

// export function DashboardHome() {
//   const { user, hasAccess } = useAuth()
//   const accessibleModules = moduleCards.filter((c) => hasAccess(c.module))



//   /* ===============================
//      URL STATE
//   ================================ */
//   const [appUrl, setAppUrl] = useState("https://applywizz-onboarding-form.vercel.app/")
//   const [addonUrl, setAddonUrl] = useState("https://applywizz-onboarding-addons.vercel.app/")
//   const [adminPassword, setAdminPassword] = useState(ADMIN_PASSWORD)

//   return (
//     <div className="space-y-10">
//       {/* HEADER */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
//         <p className="text-gray-600 mt-2">Here's what's happening with your CRM today.</p>
//       </div>

//       {/* MODULE GRID */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {accessibleModules.map((card) => (
//           <Link key={card.title} href={card.href}>
//             <Card className="hover:shadow-xl transition cursor-pointer">
//               <CardHeader className="flex flex-row justify-between pb-2">
//                 <CardTitle className="text-sm">{card.title}</CardTitle>
//                 <div className={`p-2 rounded-lg ${card.color}`}>
//                   <card.icon className="h-4 w-4 text-white" />
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription>{card.description}</CardDescription>
//               </CardContent>
//             </Card>
//           </Link>
//         ))}
//       </div>

//       {/* CLIENT ONBOARDING */}
//       <div>
//         <h2 className="text-2xl font-bold mb-2">Client Onboarding Forms</h2>
//         <p className="text-gray-600 mb-6">
//           Choose the correct onboarding form based on the client's selected services.
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* APPLICATIONS CARD */}
//           <OnboardingCard
//             title="Applications + Add-ons Onboarding"
//             color="indigo"
//             description="Use this form when the client has opted for job applications."
//             url={appUrl}
//             setUrl={setAppUrl}
//             userRole={user?.role}
//             adminPassword={adminPassword}
//             setAdminPassword={setAdminPassword}
//           >
//             <ul className="list-disc ml-5 space-y-1">
//               <li>Clients opted for <strong>Job Applications</strong></li>
//               <li>Re-send during renewal if applications are newly added</li>
//               <li>Data flows to <strong>Task Management Tool</strong></li>
//             </ul>
//           </OnboardingCard>

//           {/* ADDONS CARD */}
//           <OnboardingCard
//             title="Add-ons Only Onboarding"
//             color="emerald"
//             description="Use this form when the client opted only for add-ons."
//             url={addonUrl}
//             setUrl={setAddonUrl}
//             userRole={user?.role}
//             adminPassword={adminPassword}
//             setAdminPassword={setAdminPassword}
//           >
//             <ul className="list-disc ml-5 space-y-1">
//               <li>Resume review, portfolio, mock interviews</li>
//               <li>No job application data collected</li>
//               <li>Do not use if applications are enabled</li>
//             </ul>
//           </OnboardingCard>
//         </div>
//       </div>
//     </div>
//   )
// }

// /* ===============================
//    REUSABLE ONBOARDING CARD
// ================================ */
// function OnboardingCard({
//   title,
//   description,
//   color,
//   url,
//   setUrl,
//   userRole,
//   adminPassword,
//   setAdminPassword,
//   children,
// }: any) {
//   const [showPasswordValue, setShowPasswordValue] = useState(false)
//   const colorClasses = {
//     indigo: {
//       border: 'border-indigo-200',
//       icon: 'text-indigo-600',
//       text: 'text-indigo-700',
//       button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
//       gradient: 'bg-gradient-to-br from-indigo-50 to-transparent'
//     },
//     emerald: {
//       border: 'border-emerald-200',
//       icon: 'text-emerald-600',
//       text: 'text-emerald-700',
//       button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
//       gradient: 'bg-gradient-to-br from-emerald-50 to-transparent'
//     }
//   }[color] || {
//     border: 'border-gray-200',
//     icon: 'text-gray-600',
//     text: 'text-gray-700',
//     button: 'bg-gray-600 hover:bg-gray-700 text-white',
//     gradient: 'bg-gradient-to-br from-gray-50 to-transparent'
//   }

//   const handleChangeUrlClick = () => {
//     // Step 1: Ask for password
//     const inputPassword = window.prompt("🔒 Enter admin password to change URL:")

//     if (!inputPassword) {
//       // User cancelled
//       return
//     }

//     // Step 2: Verify password using dynamic state
//     if (inputPassword !== adminPassword) {
//       alert("❌ Incorrect password. Please try again.")
//       return
//     }

//     // Step 3: Password is correct, now ask for new URL
//     const newUrl = window.prompt("✏️ Enter new URL:", url)

//     if (!newUrl || newUrl.trim() === "") {
//       // User cancelled or entered empty
//       return
//     }

//     // Step 4: Confirm the change
//     const confirmed = window.confirm(`Are you sure you want to change the URL to:\n\n${newUrl}`)

//     if (confirmed) {
//       setUrl(newUrl)
//       alert("✅ URL updated successfully!")
//     }
//   }

//   const handleChangePassword = () => {
//     const newPassword = window.prompt("🔑 Enter new admin password:", adminPassword)

//     if (!newPassword || newPassword.trim() === "") {
//       // User cancelled or entered empty
//       return
//     }

//     const confirmed = window.confirm(`Are you sure you want to change the password to:\n\n${newPassword}`)

//     if (confirmed) {
//       setAdminPassword(newPassword)
//       alert("✅ Password updated successfully!")
//     }
//   }

//   return (
//     <Card className={`relative overflow-hidden ${colorClasses.border}`}>
//       <div className={`absolute inset-0 ${colorClasses.gradient} pointer-events-none`} />
//       <CardHeader className="relative">
//         <CardTitle className="flex items-center gap-2">
//           <FileText className={`h-5 w-5 ${colorClasses.icon}`} />
//           {title}
//         </CardTitle>
//         <CardDescription>{description}</CardDescription>
//       </CardHeader>

//       <CardContent className="space-y-4 text-sm relative">
//         <div className="space-y-2 text-gray-700">
//           <p className="font-medium">When to use this onboarding link:</p>
//           {children}
//         </div>

//         <div className="pt-3 border-t space-y-3">
//           <div className="flex items-center justify-between">
//             <p className="flex items-center gap-2 font-medium text-gray-900">
//               <Link2 className="h-4 w-4" /> Onboarding Link
//             </p>

//             <button
//               onClick={handleChangeUrlClick}
//               className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 py-2 px-3 border border-gray-300 rounded-md transition-colors duration-200"
//             >
//               <Pencil className="h-4 w-4" />
//               Change URL
//             </button>
//           </div>

//           <Link
//             href={url}
//             target="_blank"
//             rel="noopener noreferrer"
//             className={`block underline break-all ${colorClasses.text} hover:opacity-80 transition-opacity`}
//           >
//             {url}
//           </Link>
//         </div>

//         <div className="pt-3 border-t">
//           <div className="flex items-center justify-between mb-2">
//             <p className="flex items-center gap-2 font-medium text-gray-900">
//               <ShieldCheck className="h-4 w-4" /> Test / Handling Credentials
//             </p>

//             {userRole === "Super Admin" && (
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={handleChangePassword}
//                   className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-1 px-3 rounded transition-colors"
//                 >
//                   🔑 Change Password
//                 </button>
//                 <button
//                   onClick={() => setShowPasswordValue(!showPasswordValue)}
//                   className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 py-1 px-2 border border-gray-300 rounded transition-colors"
//                 >
//                   {showPasswordValue ? <EyeOff size={14} /> : <Eye size={14} />}
//                   {showPasswordValue ? "Hide" : "See"} Password
//                 </button>
//               </div>
//             )}
//           </div>

//           <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-700 space-y-1">
//             <p><strong>AWL ID:</strong> AWL-4207</p>
//             <p><strong>Email:</strong> shyamtesting@gmail.com</p>
//             <p><strong>Phone:</strong> +1 666 666 666</p>
//             {userRole === "Super Admin" && (
//               <p>
//                 <strong>Admin Password:</strong>{" "}
//                 {showPasswordValue ? (
//                   <span className="font-mono text-indigo-600">{adminPassword}</span>
//                 ) : (
//                   <span className="text-gray-400">••••••••</span>
//                 )}
//               </p>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }






// components/dashboard/dashboard-home.tsx
"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Users,
  TrendingUp,
  UserCheck,
  DollarSign,
  BarChart3,
  Link2,
  ShieldCheck,
  FileText,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react"
import Link from "next/link"

/* ===============================
   MODULE CARDS
================================ */
const moduleCards = [
  { title: "Marketing CRM", description: "Manage leads and marketing campaigns", icon: Users, href: "/marketing", module: "marketing", color: "bg-blue-500" },
  { title: "Sales CRM", description: "Track sales pipeline and deals", icon: TrendingUp, href: "/sales", module: "sales", color: "bg-green-500" },
  { title: "Account Management", description: "Manage client relationships", icon: UserCheck, href: "/account-management", module: "account-management", color: "bg-purple-500" },
  { title: "Finance CRM", description: "Track revenue and payments", icon: DollarSign, href: "/finance", module: "finance", color: "bg-orange-500" },
]

/* ===============================
   SECURITY CONFIG (UI-ONLY)
================================ */
const ADMIN_PASSWORD = "Nikhil@1092"

export function DashboardHome() {
  const { user, hasAccess } = useAuth()
  const accessibleModules = moduleCards.filter((c) => hasAccess(c.module))



  /* ===============================
     URL STATE
  ================================ */
  const [appUrl, setAppUrl] = useState("https://applywizz-onboarding-form.vercel.app/")
  const [addonUrl, setAddonUrl] = useState("https://applywizz-onboarding-addons.vercel.app/")
  const [adminPassword, setAdminPassword] = useState(ADMIN_PASSWORD)

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your CRM today.</p>
      </div>

      {/* MODULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accessibleModules.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-xl transition cursor-pointer">
              <CardHeader className="flex flex-row justify-between pb-2">
                <CardTitle className="text-sm">{card.title}</CardTitle>
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

      {/* CLIENT ONBOARDING */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Client Onboarding Forms</h2>
        <p className="text-gray-600 mb-6">
          Choose the correct onboarding form based on the client's selected services.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* APPLICATIONS CARD */}
          <OnboardingCard
            title="Applications + Add-ons Onboarding"
            color="indigo"
            description="Use this form when the client has opted for job applications."
            url={appUrl}
            setUrl={setAppUrl}
            userRole={user?.role}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
          >
            <div className="space-y-2">
              {/* <p className="font-semibold text-gray-800">When to send this link:</p> */}
              <ul className="list-disc ml-5 space-y-1">
                <li>Client opted <strong>Job Applications</strong> service</li>
                <li>Client opted <strong>Applications + Add-ons</strong> package</li>
                <li>Client initially chose only add-ons, but during <strong>renewal</strong> they added applications</li>
              </ul>

              {/* <p className="font-semibold text-gray-800 pt-2">This onboarding form collects:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Job application preferences</li>
                <li>Resume & profile information</li>
                <li>All selected add-on services</li>
              </ul> */}

              <p className="text-gray-600 pt-2 italic text-xs">
                📌 After submission, forwarding the details to the <strong>Task Management Tool</strong> for processing.
              </p>
            </div>
          </OnboardingCard>

          {/* ADDONS CARD */}
          <OnboardingCard
            title="Add-ons Only Onboarding"
            color="emerald"
            description="Use this form when the client opted only for add-ons."
            url={addonUrl}
            setUrl={setAddonUrl}
            userRole={user?.role}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
          >
            <div className="space-y-2">
              {/* <p className="font-semibold text-gray-800">When to send this link:</p> */}
              <ul className="list-disc ml-5 space-y-1">
                <li>Client opted <strong>only add-on services</strong> (no job applications)</li>
                <li>Services like resume review, portfolio support, or mock interviews</li>
              </ul>

              {/* <p className="font-semibold text-gray-800 pt-2">This onboarding form collects:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Resume review inputs</li>
                <li>Portfolio or profile service requirements</li>
                <li>Mock interview preferences</li>
              </ul> */}

              <p className="text-red-600 pt-2 font-medium text-xs">
                ⚠️ Important: Do NOT use this link if the client has opted for job applications at any stage.
              </p>
            </div>
          </OnboardingCard>
        </div>
      </div>
    </div>
  )
}

/* ===============================
   REUSABLE ONBOARDING CARD
================================ */
function OnboardingCard({
  title,
  description,
  color,
  url,
  setUrl,
  userRole,
  adminPassword,
  setAdminPassword,
  children,
}: any) {
  const [showPasswordValue, setShowPasswordValue] = useState(false)
  const colorClasses = {
    indigo: {
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
      text: 'text-indigo-700',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      gradient: 'bg-gradient-to-br from-indigo-50 to-transparent'
    },
    emerald: {
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
      text: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      gradient: 'bg-gradient-to-br from-emerald-50 to-transparent'
    }
  }[color] || {
    border: 'border-gray-200',
    icon: 'text-gray-600',
    text: 'text-gray-700',
    button: 'bg-gray-600 hover:bg-gray-700 text-white',
    gradient: 'bg-gradient-to-br from-gray-50 to-transparent'
  }

  const handleChangeUrlClick = () => {
    // Step 1: Ask for password
    const inputPassword = window.prompt("🔒 Enter admin password to change URL:")

    if (!inputPassword) {
      // User cancelled
      return
    }

    // Step 2: Verify password using dynamic state
    if (inputPassword !== adminPassword) {
      alert("❌ Incorrect password. Please try again.")
      return
    }

    // Step 3: Password is correct, now ask for new URL
    const newUrl = window.prompt("✏️ Enter new URL:", url)

    if (!newUrl || newUrl.trim() === "") {
      // User cancelled or entered empty
      return
    }

    // Step 4: Confirm the change
    const confirmed = window.confirm(`Are you sure you want to change the URL to:\n\n${newUrl}`)

    if (confirmed) {
      setUrl(newUrl)
      alert("✅ URL updated successfully!")
    }
  }

  const handleChangePassword = () => {
    const newPassword = window.prompt("🔑 Enter new admin password:", adminPassword)

    if (!newPassword || newPassword.trim() === "") {
      // User cancelled or entered empty
      return
    }

    const confirmed = window.confirm(`Are you sure you want to change the password to:\n\n${newPassword}`)

    if (confirmed) {
      setAdminPassword(newPassword)
      alert("✅ Password updated successfully!")
    }
  }

  return (
    <Card className={`relative overflow-hidden ${colorClasses.border}`}>
      <div className={`absolute inset-0 ${colorClasses.gradient} pointer-events-none`} />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <FileText className={`h-5 w-5 ${colorClasses.icon}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm relative">
        <div className="space-y-2 text-gray-700">
          <p className="font-medium">When to use this onboarding link:</p>
          {children}
        </div>

        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-medium text-gray-900">
              <Link2 className="h-4 w-4" /> Onboarding Link
            </p>

            <button
              onClick={handleChangeUrlClick}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 py-2 px-3 border border-gray-300 rounded-md transition-colors duration-200"
            >
              <Pencil className="h-4 w-4" />
              Change URL
            </button>
          </div>

          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block underline break-all ${colorClasses.text} hover:opacity-80 transition-opacity`}
          >
            {url}
          </Link>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-2 font-medium text-gray-900">
              <ShieldCheck className="h-4 w-4" /> Test / Handling Credentials
            </p>

            {userRole === "Super Admin" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-1 px-3 rounded transition-colors"
                >
                  🔑 Change Password
                </button>
                <button
                  onClick={() => setShowPasswordValue(!showPasswordValue)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 py-1 px-2 border border-gray-300 rounded transition-colors"
                >
                  {showPasswordValue ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPasswordValue ? "Hide" : "See"} Password
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-700 space-y-1">
            <p><strong>AWL ID:</strong> AWL-4207</p>
            <p><strong>Email:</strong> shyamtesting@gmail.com</p>
            <p><strong>Phone:</strong> +1 666 666 666</p>
            {userRole === "Super Admin" && (
              <p>
                <strong>Admin Password:</strong>{" "}
                {showPasswordValue ? (
                  <span className="font-mono text-indigo-600">{adminPassword}</span>
                ) : (
                  <span className="text-gray-400">••••••••</span>
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
