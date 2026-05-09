import { getSql } from "@/lib/db"

export type ResumeRow = {
  id: string
  slug: string
  locale: string
  title: string
  owner_name: string
  headline: string | null
  summary: string | null
  avatar_url: string | null
  location: string | null
  email: string | null
  phone: string | null
  website_url: string | null
  github_url: string | null
  linkedin_url: string | null
  is_published: boolean
  created_at: string | Date
  updated_at: string | Date
}

export type ResumeWriteInput = {
  slug: string
  locale: string
  title: string
  ownerName: string
  headline: string | null
  summary: string | null
  avatarUrl: string | null
  location: string | null
  email: string | null
  phone: string | null
  websiteUrl: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  isPublished: boolean
}

const resumeSelect = `
  id,
  slug,
  locale,
  title,
  owner_name,
  headline,
  summary,
  avatar_url,
  location,
  email,
  phone,
  website_url,
  github_url,
  linkedin_url,
  is_published,
  created_at,
  updated_at
`

export async function listResumes(): Promise<ResumeRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${resumeSelect}
    FROM resumes
    ORDER BY is_published DESC, updated_at DESC, created_at DESC
  `)) as ResumeRow[]
}

export async function findResumeById(
  resumeId: string
): Promise<ResumeRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${resumeSelect}
      FROM resumes
      WHERE id = $1
      LIMIT 1
    `,
    [resumeId]
  )) as ResumeRow[]

  return rows[0] ?? null
}

export async function createResume(
  input: ResumeWriteInput
): Promise<ResumeRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO resumes (
        slug,
        locale,
        title,
        owner_name,
        headline,
        summary,
        avatar_url,
        location,
        email,
        phone,
        website_url,
        github_url,
        linkedin_url,
        is_published
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING ${resumeSelect}
    `,
    [
      input.slug,
      input.locale,
      input.title,
      input.ownerName,
      input.headline,
      input.summary,
      input.avatarUrl,
      input.location,
      input.email,
      input.phone,
      input.websiteUrl,
      input.githubUrl,
      input.linkedinUrl,
      input.isPublished,
    ]
  )) as ResumeRow[]

  return rows[0]
}

export async function updateResume(
  resumeId: string,
  input: ResumeWriteInput
): Promise<ResumeRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE resumes
      SET
        slug = $2,
        locale = $3,
        title = $4,
        owner_name = $5,
        headline = $6,
        summary = $7,
        avatar_url = $8,
        location = $9,
        email = $10,
        phone = $11,
        website_url = $12,
        github_url = $13,
        linkedin_url = $14,
        is_published = $15
      WHERE id = $1
      RETURNING ${resumeSelect}
    `,
    [
      resumeId,
      input.slug,
      input.locale,
      input.title,
      input.ownerName,
      input.headline,
      input.summary,
      input.avatarUrl,
      input.location,
      input.email,
      input.phone,
      input.websiteUrl,
      input.githubUrl,
      input.linkedinUrl,
      input.isPublished,
    ]
  )) as ResumeRow[]

  return rows[0] ?? null
}

export async function deleteResume(
  resumeId: string
): Promise<ResumeRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM resumes
      WHERE id = $1
      RETURNING ${resumeSelect}
    `,
    [resumeId]
  )) as ResumeRow[]

  return rows[0] ?? null
}
