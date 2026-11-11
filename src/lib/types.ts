export type ProgramStatus = "draft" | "published" | "closed"
export type EligibilityMode = "open" | "dealerships"
export type MembershipRole = "member" | "dealership_admin"

export type Dealership = {
  id: string
  name: string
  slug: string
}

export type Profile = {
  id: string
  display_name: string
  is_platform_admin: boolean
}

export type Program = {
  id: string
  title: string
  slug: string
  description_md: string
  starts_at: string
  ends_at: string | null
  location: string | null
  capacity: number | null
  status: ProgramStatus
  eligibility_mode: EligibilityMode
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ProgramRegistration = {
  id: string
  program_id: string
  user_id: string
  registered_at: string
}

export type RegistrationRosterRow = ProgramRegistration & {
  profile: Pick<Profile, "display_name"> | null
  dealerships: { name: string }[]
}
