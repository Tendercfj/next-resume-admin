import { getSql } from "@/lib/db"

export type WorkEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance"

export type WorkExperienceRow = {
  id: string
  resume_id: string
  company: string
  role: string
  location: string | null
  employment_type: WorkEmploymentType | null
  start_date: string | Date | null
  end_date: string | Date | null
  is_current: boolean
  summary: string | null
  highlights: string[]
  sort_order: number
  is_visible: boolean
  created_at: string | Date
  updated_at: string | Date
  resume_slug: string
  resume_title: string
  resume_owner_name: string
  resume_is_published: boolean
}

export type WorkExperienceWriteInput = {
  resumeId: string
  company: string
  role: string
  location: string | null
  employmentType: WorkEmploymentType | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  summary: string | null
  highlights: string[]
  sortOrder: number
  isVisible: boolean
}

const workExperienceSelect = `
  work_experiences.id,
  work_experiences.resume_id,
  work_experiences.company,
  work_experiences.role,
  work_experiences.location,
  work_experiences.employment_type,
  work_experiences.start_date,
  work_experiences.end_date,
  work_experiences.is_current,
  work_experiences.summary,
  work_experiences.highlights,
  work_experiences.sort_order,
  work_experiences.is_visible,
  work_experiences.created_at,
  work_experiences.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title,
  resumes.owner_name AS resume_owner_name,
  resumes.is_published AS resume_is_published
`

export async function listWorkExperiences(): Promise<WorkExperienceRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${workExperienceSelect}
    FROM work_experiences
    INNER JOIN resumes ON resumes.id = work_experiences.resume_id
    ORDER BY
      resumes.is_published DESC,
      resumes.updated_at DESC,
      work_experiences.sort_order ASC,
      work_experiences.start_date DESC NULLS LAST,
      work_experiences.created_at DESC
  `)) as WorkExperienceRow[]
}

export async function findWorkExperienceById(
  workExperienceId: string
): Promise<WorkExperienceRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${workExperienceSelect}
      FROM work_experiences
      INNER JOIN resumes ON resumes.id = work_experiences.resume_id
      WHERE work_experiences.id = $1
      LIMIT 1
    `,
    [workExperienceId]
  )) as WorkExperienceRow[]

  return rows[0] ?? null
}

export async function createWorkExperience(
  input: WorkExperienceWriteInput
): Promise<WorkExperienceRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO work_experiences (
        resume_id,
        company,
        role,
        location,
        employment_type,
        start_date,
        end_date,
        is_current,
        summary,
        highlights,
        sort_order,
        is_visible
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `,
    [
      input.resumeId,
      input.company,
      input.role,
      input.location,
      input.employmentType,
      input.startDate,
      input.endDate,
      input.isCurrent,
      input.summary,
      input.highlights,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findWorkExperienceById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created work experience could not be loaded")
  }

  return row
}

export async function updateWorkExperience(
  workExperienceId: string,
  input: WorkExperienceWriteInput
): Promise<WorkExperienceRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE work_experiences
      SET
        resume_id = $2,
        company = $3,
        role = $4,
        location = $5,
        employment_type = $6,
        start_date = $7,
        end_date = $8,
        is_current = $9,
        summary = $10,
        highlights = $11,
        sort_order = $12,
        is_visible = $13
      WHERE id = $1
      RETURNING id
    `,
    [
      workExperienceId,
      input.resumeId,
      input.company,
      input.role,
      input.location,
      input.employmentType,
      input.startDate,
      input.endDate,
      input.isCurrent,
      input.summary,
      input.highlights,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findWorkExperienceById(rows[0].id)
}

export async function deleteWorkExperience(
  workExperienceId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM work_experiences
      WHERE id = $1
      RETURNING id
    `,
    [workExperienceId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
