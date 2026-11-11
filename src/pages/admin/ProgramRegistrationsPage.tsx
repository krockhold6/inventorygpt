import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

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
import { supabase } from "@/lib/supabase"
import type { Program } from "@/lib/types"

type RosterRow = {
  id: string
  registered_at: string
  user_id: string
  display_name: string
  dealerships: string
}

export function ProgramRegistrationsPage() {
  const { id } = useParams<{ id: string }>()
  const [program, setProgram] = useState<Program | null>(null)
  const [rows, setRows] = useState<RosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      const { data: programData, error: programError } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (cancelled) return
      if (programError || !programData) {
        setError(programError?.message ?? "Program not found")
        setLoading(false)
        return
      }
      setProgram(programData as Program)

      const { data: regs, error: regError } = await supabase
        .from("program_registrations")
        .select("id, registered_at, user_id, profiles(display_name)")
        .eq("program_id", id)
        .order("registered_at", { ascending: true })
      if (regError) {
        setError(regError.message)
        setLoading(false)
        return
      }

      const userIds = (regs ?? []).map((r) => r.user_id)
      let dealershipByUser = new Map<string, string[]>()
      if (userIds.length > 0) {
        const { data: memberships } = await supabase
          .from("dealership_memberships")
          .select("user_id, dealerships(name)")
          .in("user_id", userIds)
        for (const m of memberships ?? []) {
          const dealership = m.dealerships as
            | { name: string }
            | { name: string }[]
            | null
          const name = Array.isArray(dealership)
            ? dealership[0]?.name
            : dealership?.name
          const label = name ?? "Unknown"
          const list = dealershipByUser.get(m.user_id) ?? []
          list.push(label)
          dealershipByUser.set(m.user_id, list)
        }
      }

      const roster: RosterRow[] = (regs ?? []).map((r) => ({
        id: r.id,
        registered_at: r.registered_at,
        user_id: r.user_id,
        display_name: (() => {
          const profile = r.profiles as
            | { display_name: string }
            | { display_name: string }[]
            | null
          if (Array.isArray(profile)) return profile[0]?.display_name ?? r.user_id
          return profile?.display_name ?? r.user_id
        })(),
        dealerships: (dealershipByUser.get(r.user_id) ?? []).join(", ") || "—",
      }))
      if (!cancelled) {
        setRows(roster)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading roster…</p>
  }

  return (
    <div className="space-y-4">
      <Link
        to="/admin/programs"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Programs admin
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{program?.title ?? "Program"} — Roster</CardTitle>
          <CardDescription>
            Registrants with display name and dealership affiliations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dealerships</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.display_name}</TableCell>
                    <TableCell>{row.dealerships}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.registered_at).toLocaleString()}
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
