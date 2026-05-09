import { getSql } from "@/lib/db"

export type SkillGroupRow = {
  id: string
  resume_id: string
  name: string
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

export type SkillGroupWriteInput = {
  resumeId: string
  name: string
  description: string | null
  sortOrder: number
  isVisible: boolean
}

const skillGroupSelect = `
  skill_groups.id,
  skill_groups.resume_id,
  skill_groups.name,
  skill_groups.description,
  skill_groups.sort_order,
  skill_groups.is_visible,
  skill_groups.created_at,
  skill_groups.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title,
  resumes.owner_name AS resume_owner_name,
  resumes.is_published AS resume_is_published
`

export async function listSkillGroups(): Promise<SkillGroupRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${skillGroupSelect}
    FROM skill_groups
    INNER JOIN resumes ON resumes.id = skill_groups.resume_id
    ORDER BY
      resumes.is_published DESC,
      resumes.updated_at DESC,
      skill_groups.sort_order ASC,
      skill_groups.created_at ASC
  `)) as SkillGroupRow[]
}

export async function findSkillGroupById(
  groupId: string
): Promise<SkillGroupRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${skillGroupSelect}
      FROM skill_groups
      INNER JOIN resumes ON resumes.id = skill_groups.resume_id
      WHERE skill_groups.id = $1
      LIMIT 1
    `,
    [groupId]
  )) as SkillGroupRow[]

  return rows[0] ?? null
}

export async function createSkillGroup(
  input: SkillGroupWriteInput
): Promise<SkillGroupRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO skill_groups (
        resume_id,
        name,
        description,
        sort_order,
        is_visible
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      input.resumeId,
      input.name,
      input.description,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findSkillGroupById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created skill group could not be loaded")
  }

  return row
}

export async function updateSkillGroup(
  groupId: string,
  input: SkillGroupWriteInput
): Promise<SkillGroupRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE skill_groups
      SET
        resume_id = $2,
        name = $3,
        description = $4,
        sort_order = $5,
        is_visible = $6
      WHERE id = $1
      RETURNING id
    `,
    [
      groupId,
      input.resumeId,
      input.name,
      input.description,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findSkillGroupById(rows[0].id)
}

export async function deleteSkillGroup(
  groupId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM skill_groups
      WHERE id = $1
      RETURNING id
    `,
    [groupId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
