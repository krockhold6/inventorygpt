export function formatProgramWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt)
  const fmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
  if (!endsAt) {
    return fmt.format(start)
  }
  const end = new Date(endsAt)
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
