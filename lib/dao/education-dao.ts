import { getSql } from "@/lib/db"

export type EducationRow = {
  id: string
  resume_id: string
  school: string
  degree: string | null
  major: string | null
  location: string | null
  start_date: string | Date | null
  end_date: string | Date | null
  description: string | null
  sort_order: number
  is_visible: boolean
  created_at: string | Date
  updated_at: string | Date
  resume_slug: string
  resume_title: string
  resume_owner_name: string
  resume_is_published: boolean
}

export type EducationWriteInput = {
  resumeId: string
  school: string
  degree: string | null
  major: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  description: string | null
  sortOrder: number
  isVisible: boolean
}

const educationSelect = `
  education.id,
  education.resume_id,
  education.school,
  education.degree,
  education.major,
  education.location,
  education.start_date,
  education.end_date,
  education.description,
  education.sort_order,
  education.is_visible,
  education.created_at,
  education.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title,
  resumes.owner_name AS resume_owner_name,
  resumes.is_published AS resume_is_published
`

export async function listEducation(): Promise<EducationRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${educationSelect}
    FROM education
    INNER JOIN resumes ON resumes.id = education.resume_id
    ORDER BY
      resumes.is_published DESC,
      resumes.updated_at DESC,
      education.sort_order ASC,
      education.start_date DESC NULLS LAST,
      education.created_at DESC
  `)) as EducationRow[]
}

export async function findEducationById(educationId: string): Promise<EducationRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${educationSelect}
      FROM education
      INNER JOIN resumes ON resumes.id = education.resume_id
      WHERE education.id = $1
      LIMIT 1
    `,
    [educationId]
  )) as EducationRow[]

  return rows[0] ?? null
}

export async function createEducationRecord(
  input: EducationWriteInput
): Promise<EducationRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO education (
        resume_id,
        school,
        degree,
        major,
        location,
        start_date,
        end_date,
        description,
        sort_order,
        is_visible
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `,
    [
      input.resumeId,
      input.school,
      input.degree,
      input.major,
      input.location,
      input.startDate,
      input.endDate,
      input.description,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findEducationById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created education record could not be loaded")
  }

  return row
}

export async function updateEducationRecord(
  educationId: string,
  input: EducationWriteInput
): Promise<EducationRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE education
      SET
        resume_id = $2,
        school = $3,
        degree = $4,
        major = $5,
        location = $6,
        start_date = $7,
        end_date = $8,
        description = $9,
        sort_order = $10,
        is_visible = $11
      WHERE id = $1
      RETURNING id
    `,
    [
      educationId,
      input.resumeId,
      input.school,
      input.degree,
      input.major,
      input.location,
      input.startDate,
      input.endDate,
      input.description,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findEducationById(rows[0].id)
}

export async function deleteEducationRecord(
  educationId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM education
      WHERE id = $1
      RETURNING id
    `,
    [educationId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
