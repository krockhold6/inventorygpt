import { Link, Outlet, useLocation } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              South Dayton Toyota Delivery
            </p>
            <Link to="/" className="text-lg font-semibold tracking-tight">
              Programs
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className={cn(
                buttonVariants({
                  variant: location.pathname === "/" ? "secondary" : "ghost",
                  size: "sm",
                }),
              )}
            >
              Programs
            </Link>
            {isAdmin ? (
              <Link
                to="/admin/programs"
                className={cn(
                  buttonVariants({
                    variant: location.pathname.startsWith("/admin")
                      ? "secondary"
                      : "ghost",
                    size: "sm",
                  }),
                )}
              >
                Admin
              </Link>
            ) : null}
            {user ? (
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
