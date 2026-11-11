import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { formatProgramWhen } from "@/lib/format"
import { supabase } from "@/lib/supabase"
import type { Program } from "@/lib/types"

export function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [program, setProgram] = useState<Program | null>(null)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      const { data, error: qError } = await supabase
        .from("programs")
        .select("*")
        .eq("slug", slug)
        .maybeSingle()
      if (cancelled) return
      if (qError || !data) {
        setProgram(null)
        setError(qError?.message ?? "Program not found")
        setLoading(false)
        return
      }
      setProgram(data as Program)
      setError(null)
      if (user) {
        const { data: reg } = await supabase
          .from("program_registrations")
          .select("id")
          .eq("program_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle()
        if (!cancelled) setRegistered(Boolean(reg))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [slug, user])

  async function handleRegister() {
    if (!program || !user) return
    setBusy(true)
    setMessage(null)
    setError(null)
    const { error: insError } = await supabase
      .from("program_registrations")
      .insert({ program_id: program.id, user_id: user.id })
    if (insError) {
      setError(insError.message)
    } else {
      setRegistered(true)
      setMessage("You are registered for this program.")
    }
    setBusy(false)
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!program) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Program not found</CardTitle>
          <CardDescription>
            {error ?? "This program may be unpublished or you may not have access."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
            Back to programs
          </Link>
        </CardContent>
      </Card>
    )
  }

  const canSignup =
    program.status === "published" && user && !registered

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← All programs
      </Link>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">{program.title}</CardTitle>
              <CardDescription>
                {formatProgramWhen(program.starts_at, program.ends_at)}
                {program.location ? ` · ${program.location}` : ""}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {program.eligibility_mode === "open" ? "Open" : "Dealership members"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {program.description_md || "No description yet."}
          </div>
          {program.capacity != null ? (
            <p className="text-sm text-muted-foreground">
              Capacity: {program.capacity} participants
            </p>
          ) : null}
          {!user ? (
            <Alert>
              <AlertTitle>Sign in to register</AlertTitle>
              <AlertDescription>
                <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>{" "}
                to sign up for this program.
              </AlertDescription>
            </Alert>
          ) : registered ? (
            <Alert>
              <AlertTitle>You&apos;re registered</AlertTitle>
              <AlertDescription>See you at the program.</AlertDescription>
            </Alert>
          ) : program.status !== "published" ? (
            <p className="text-sm text-muted-foreground">
              Registration is not open for this program.
            </p>
          ) : (
            <Button disabled={!canSignup || busy} onClick={() => void handleRegister()}>
              {busy ? "Signing up…" : "Sign up for this program"}
            </Button>
          )}
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
