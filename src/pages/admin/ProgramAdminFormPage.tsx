import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth"
import { slugify } from "@/lib/format"
import { supabase } from "@/lib/supabase"
import type {
  Dealership,
  EligibilityMode,
  Program,
  ProgramStatus,
} from "@/lib/types"

const STATUS_OPTIONS: ProgramStatus[] = ["draft", "published", "closed"]
const ELIGIBILITY_OPTIONS: EligibilityMode[] = ["open", "dealerships"]

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function ProgramAdminFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === "new"
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [dealerships, setDealerships] = useState<Dealership[]>([])
  const [selectedDealerships, setSelectedDealerships] = useState<string[]>([])
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [descriptionMd, setDescriptionMd] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("")
  const [status, setStatus] = useState<ProgramStatus>("draft")
  const [eligibilityMode, setEligibilityMode] =
    useState<EligibilityMode>("open")

  const pageTitle = useMemo(
    () => (isNew ? "New program" : "Edit program"),
    [isNew],
  )

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("dealerships")
        .select("id, name, slug")
        .order("name")
      setDealerships((data ?? []) as Dealership[])
    })()
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    let cancelled = false
    void (async () => {
      const { data, error: qError } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (cancelled) return
      if (qError || !data) {
        setError(qError?.message ?? "Program not found")
        setLoading(false)
        return
      }
      const program = data as Program
      setTitle(program.title)
      setSlug(program.slug)
      setDescriptionMd(program.description_md)
      setStartsAt(toDatetimeLocalValue(program.starts_at))
      setEndsAt(toDatetimeLocalValue(program.ends_at))
      setLocation(program.location ?? "")
      setCapacity(program.capacity != null ? String(program.capacity) : "")
      setStatus(program.status)
      setEligibilityMode(program.eligibility_mode)

      const { data: links } = await supabase
        .from("program_dealerships")
        .select("dealership_id")
        .eq("program_id", id)
      if (!cancelled) {
        setSelectedDealerships((links ?? []).map((l) => l.dealership_id))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  function toggleDealership(dealershipId: string, checked: boolean) {
    setSelectedDealerships((prev) =>
      checked
        ? [...prev, dealershipId]
        : prev.filter((d) => d !== dealershipId),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description_md: descriptionMd,
      starts_at: fromDatetimeLocalValue(startsAt),
      ends_at: fromDatetimeLocalValue(endsAt),
      location: location.trim() || null,
      capacity: capacity ? Number(capacity) : null,
      status,
      eligibility_mode: eligibilityMode,
    }

    if (!payload.title || !payload.slug || !payload.starts_at) {
      setError("Title, slug, and start time are required.")
      setBusy(false)
      return
    }

    if (
      eligibilityMode === "dealerships" &&
      selectedDealerships.length === 0
    ) {
      setError("Select at least one dealership for dealership eligibility.")
      setBusy(false)
      return
    }

    try {
      let programId = id
      if (isNew) {
        const { data, error: insError } = await supabase
          .from("programs")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single()
        if (insError) throw insError
        programId = data.id
      } else {
        const { error: updError } = await supabase
          .from("programs")
          .update(payload)
          .eq("id", id)
        if (updError) throw updError
      }

      if (!programId) throw new Error("Missing program id")

      await supabase
        .from("program_dealerships")
        .delete()
        .eq("program_id", programId)

      if (eligibilityMode === "dealerships") {
        const { error: linkError } = await supabase
          .from("program_dealerships")
          .insert(
            selectedDealerships.map((dealership_id) => ({
              program_id: programId,
              dealership_id,
            })),
          )
        if (linkError) throw linkError
      }

      navigate("/admin/programs")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to="/admin/programs"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Programs admin
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>
            Set schedule, eligibility, and publication status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  const next = e.target.value
                  setTitle(next)
                  if (!slugTouched) setSlug(slugify(next))
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={6}
                value={descriptionMd}
                onChange={(e) => setDescriptionMd(e.target.value)}
                placeholder="Markdown-friendly text"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="starts_at">Starts</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ends_at">Ends (optional)</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ProgramStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Eligibility</Label>
                <Select
                  value={eligibilityMode}
                  onValueChange={(v) =>
                    setEligibilityMode(v as EligibilityMode)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELIGIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt === "open" ? "Any signed-in user" : "Dealerships"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {eligibilityMode === "dealerships" ? (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Eligible dealerships</p>
                {dealerships.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No dealerships in the database yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {dealerships.map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`dealership-${d.id}`}
                          checked={selectedDealerships.includes(d.id)}
                          onCheckedChange={(checked) =>
                            toggleDealership(d.id, checked === true)
                          }
                        />
                        <Label htmlFor={`dealership-${d.id}`}>{d.name}</Label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : isNew ? "Create program" : "Save changes"}
              </Button>
              <Link
                to="/admin/programs"
                className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-sm hover:bg-muted"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
