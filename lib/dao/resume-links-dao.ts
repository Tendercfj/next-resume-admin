import { getSql } from "@/lib/db"

export type ResumeLinkRow = {
  id: string
  resume_id: string
  label: string
  url: string
  icon: string | null
  sort_order: number
  is_visible: boolean
  created_at: string | Date
  updated_at: string | Date
  resume_slug: string
  resume_title: string
  resume_owner_name: string
  resume_is_published: boolean
}

export type ResumeLinkWriteInput = {
  resumeId: string
  label: string
  url: string
  icon: string | null
  sortOrder: number
  isVisible: boolean
}

const resumeLinkSelect = `
  resume_links.id,
  resume_links.resume_id,
  resume_links.label,
  resume_links.url,
  resume_links.icon,
  resume_links.sort_order,
  resume_links.is_visible,
  resume_links.created_at,
  resume_links.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title,
  resumes.owner_name AS resume_owner_name,
  resumes.is_published AS resume_is_published
`

export async function listResumeLinks(): Promise<ResumeLinkRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${resumeLinkSelect}
    FROM resume_links
    INNER JOIN resumes ON resumes.id = resume_links.resume_id
    ORDER BY
      resumes.is_published DESC,
      resumes.updated_at DESC,
      resume_links.sort_order ASC,
      resume_links.created_at ASC
  `)) as ResumeLinkRow[]
}

export async function findResumeLinkById(
  linkId: string
): Promise<ResumeLinkRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${resumeLinkSelect}
      FROM resume_links
      INNER JOIN resumes ON resumes.id = resume_links.resume_id
      WHERE resume_links.id = $1
      LIMIT 1
    `,
    [linkId]
  )) as ResumeLinkRow[]

  return rows[0] ?? null
}

export async function createResumeLink(
  input: ResumeLinkWriteInput
): Promise<ResumeLinkRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO resume_links (
        resume_id,
        label,
        url,
        icon,
        sort_order,
        is_visible
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      input.resumeId,
      input.label,
      input.url,
      input.icon,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findResumeLinkById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created resume link could not be loaded")
  }

  return row
}

export async function updateResumeLink(
  linkId: string,
  input: ResumeLinkWriteInput
): Promise<ResumeLinkRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE resume_links
      SET
        resume_id = $2,
        label = $3,
        url = $4,
        icon = $5,
        sort_order = $6,
        is_visible = $7
      WHERE id = $1
      RETURNING id
    `,
    [
      linkId,
      input.resumeId,
      input.label,
      input.url,
      input.icon,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findResumeLinkById(rows[0].id)
}

export async function deleteResumeLink(
  linkId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM resume_links
      WHERE id = $1
      RETURNING id
    `,
    [linkId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
