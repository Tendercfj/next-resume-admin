import { getSql } from "@/lib/db"

export type ProjectRow = {
  id: string
  resume_id: string
  slug: string
  name: string
  role: string | null
  description: string | null
  tech_stack: string[]
  highlights: string[]
  project_url: string | null
  source_url: string | null
  start_date: string | Date | null
  end_date: string | Date | null
  is_featured: boolean
  sort_order: number
  is_visible: boolean
  created_at: string | Date
  updated_at: string | Date
  resume_slug: string
  resume_title: string
  resume_owner_name: string
  resume_is_published: boolean
}

export type ProjectWriteInput = {
  resumeId: string
  slug: string
  name: string
  role: string | null
  description: string | null
  techStack: string[]
  highlights: string[]
  projectUrl: string | null
  sourceUrl: string | null
  startDate: string | null
  endDate: string | null
  isFeatured: boolean
  sortOrder: number
  isVisible: boolean
}

const projectSelect = `
  projects.id,
  projects.resume_id,
  projects.slug,
  projects.name,
  projects.role,
  projects.description,
  projects.tech_stack,
  projects.highlights,
  projects.project_url,
  projects.source_url,
  projects.start_date,
  projects.end_date,
  projects.is_featured,
  projects.sort_order,
  projects.is_visible,
  projects.created_at,
  projects.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title,
  resumes.owner_name AS resume_owner_name,
  resumes.is_published AS resume_is_published
`

export async function listProjects(): Promise<ProjectRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${projectSelect}
    FROM projects
    INNER JOIN resumes ON resumes.id = projects.resume_id
    ORDER BY
      resumes.is_published DESC,
      resumes.updated_at DESC,
      projects.is_featured DESC,
      projects.sort_order ASC,
      projects.start_date DESC NULLS LAST,
      projects.created_at DESC
  `)) as ProjectRow[]
}

export async function findProjectById(projectId: string): Promise<ProjectRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${projectSelect}
      FROM projects
      INNER JOIN resumes ON resumes.id = projects.resume_id
      WHERE projects.id = $1
      LIMIT 1
    `,
    [projectId]
  )) as ProjectRow[]

  return rows[0] ?? null
}

export async function createProject(input: ProjectWriteInput): Promise<ProjectRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO projects (
        resume_id,
        slug,
        name,
        role,
        description,
        tech_stack,
        highlights,
        project_url,
        source_url,
        start_date,
        end_date,
        is_featured,
        sort_order,
        is_visible
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING id
    `,
    [
      input.resumeId,
      input.slug,
      input.name,
      input.role,
      input.description,
      input.techStack,
      input.highlights,
      input.projectUrl,
      input.sourceUrl,
      input.startDate,
      input.endDate,
      input.isFeatured,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findProjectById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created project could not be loaded")
  }

  return row
}

export async function updateProject(
  projectId: string,
  input: ProjectWriteInput
): Promise<ProjectRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE projects
      SET
        resume_id = $2,
        slug = $3,
        name = $4,
        role = $5,
        description = $6,
        tech_stack = $7,
        highlights = $8,
        project_url = $9,
        source_url = $10,
        start_date = $11,
        end_date = $12,
        is_featured = $13,
        sort_order = $14,
        is_visible = $15
      WHERE id = $1
      RETURNING id
    `,
    [
      projectId,
      input.resumeId,
      input.slug,
      input.name,
      input.role,
      input.description,
      input.techStack,
      input.highlights,
      input.projectUrl,
      input.sourceUrl,
      input.startDate,
      input.endDate,
      input.isFeatured,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findProjectById(rows[0].id)
}

export async function deleteProject(
  projectId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM projects
      WHERE id = $1
      RETURNING id
    `,
    [projectId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
