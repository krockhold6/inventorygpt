import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
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

export function ProgramsListPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const { data, error: qError } = await supabase
        .from("programs")
        .select("*")
        .eq("status", "published")
        .order("starts_at", { ascending: true })
      if (cancelled) return
      if (qError) {
        setError(qError.message)
        setPrograms([])
      } else {
        setError(null)
        setPrograms((data ?? []) as Program[])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading programs…</p>
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Could not load programs. {error}
      </p>
    )
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No programs yet</CardTitle>
          <CardDescription>
            Check back soon for upcoming happenings.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <ListHeader />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Eligibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>
                    <Link
                      to={`/programs/${program.slug}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {program.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatProgramWhen(program.starts_at, program.ends_at)}
                  </TableCell>
                  <TableCell>{program.location ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {program.eligibility_mode === "open"
                        ? "Open"
                        : "Dealerships"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ListHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Programs</h1>
      <p className="text-sm text-muted-foreground">
        Upcoming happenings you can sign up for.
      </p>
    </div>
  )
}
