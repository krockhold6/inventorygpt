import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatProgramWhen } from "@/lib/format"
import { supabase } from "@/lib/supabase"
import type { Program } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ProgramsAdminListPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error: qError } = await supabase
        .from("programs")
        .select("*")
        .order("starts_at", { ascending: false })
      if (cancelled) return
      if (qError) setError(qError.message)
      else setPrograms((data ?? []) as Program[])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage programs</h1>
          <p className="text-sm text-muted-foreground">
            Create happenings, set eligibility, and view rosters.
          </p>
        </div>
        <Link
          to="/admin/programs/new"
          className={cn(buttonVariants())}
        >
          New program
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Programs</CardTitle>
          <CardDescription>All programs you can administer.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No programs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{program.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatProgramWhen(program.starts_at, program.ends_at)}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Link
                        to={`/admin/programs/${program.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/admin/programs/${program.id}/registrations`}
                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                      >
                        Roster
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
