import { getSql } from "@/lib/db"

export type SkillItemRow = {
  id: string
  group_id: string
  name: string
  level: "familiar" | "proficient" | "expert" | null
  keywords: string[]
  sort_order: number
  is_visible: boolean
  created_at: string | Date
  updated_at: string | Date
  group_name: string
  resume_id: string
  resume_slug: string
  resume_title: string
}

export type SkillItemWriteInput = {
  groupId: string
  name: string
  level: "familiar" | "proficient" | "expert" | null
  keywords: string[]
  sortOrder: number
  isVisible: boolean
}

const skillItemSelect = `
  skill_items.id,
  skill_items.group_id,
  skill_items.name,
  skill_items.level,
  skill_items.keywords,
  skill_items.sort_order,
  skill_items.is_visible,
  skill_items.created_at,
  skill_items.updated_at,
  skill_groups.name AS group_name,
  skill_groups.resume_id,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title
`

export async function listSkillItemsByGroupIds(
  groupIds: string[]
): Promise<SkillItemRow[]> {
  if (groupIds.length === 0) {
    return []
  }

  const sql = getSql()

  return (await sql.query(
    `
      SELECT ${skillItemSelect}
      FROM skill_items
      INNER JOIN skill_groups ON skill_groups.id = skill_items.group_id
      INNER JOIN resumes ON resumes.id = skill_groups.resume_id
      WHERE skill_items.group_id = ANY($1::uuid[])
      ORDER BY
        skill_items.sort_order ASC,
        skill_items.created_at ASC
    `,
    [groupIds]
  )) as SkillItemRow[]
}

export async function findSkillItemById(
  itemId: string
): Promise<SkillItemRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${skillItemSelect}
      FROM skill_items
      INNER JOIN skill_groups ON skill_groups.id = skill_items.group_id
      INNER JOIN resumes ON resumes.id = skill_groups.resume_id
      WHERE skill_items.id = $1
      LIMIT 1
    `,
    [itemId]
  )) as SkillItemRow[]

  return rows[0] ?? null
}

export async function createSkillItem(
  input: SkillItemWriteInput
): Promise<SkillItemRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO skill_items (
        group_id,
        name,
        level,
        keywords,
        sort_order,
        is_visible
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      input.groupId,
      input.name,
      input.level,
      input.keywords,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findSkillItemById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created skill item could not be loaded")
  }

  return row
}

export async function updateSkillItem(
  itemId: string,
  input: SkillItemWriteInput
): Promise<SkillItemRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE skill_items
      SET
        group_id = $2,
        name = $3,
        level = $4,
        keywords = $5,
        sort_order = $6,
        is_visible = $7
      WHERE id = $1
      RETURNING id
    `,
    [
      itemId,
      input.groupId,
      input.name,
      input.level,
      input.keywords,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findSkillItemById(rows[0].id)
}

export async function deleteSkillItem(
  itemId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM skill_items
      WHERE id = $1
      RETURNING id
    `,
    [itemId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
