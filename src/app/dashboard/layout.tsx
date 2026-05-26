import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Settings,
  Activity,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Сотрудники", href: "/employees", icon: Users },
  { name: "Встречи", href: "/meetings", icon: Calendar },
  { name: "Экшн-айтемы", href: "/action-items", icon: CheckSquare },
  { name: "Настройки", href: "/settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">1:1 Keeper</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <UserNav />
        </div>
      </header>

      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}
