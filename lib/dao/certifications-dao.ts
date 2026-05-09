import { getSql } from "@/lib/db"

export type CertificationRow = {
  id: string
  resume_id: string
  title: string
  issuer: string | null
  issued_on: string | Date | null
  credential_url: string | null
  sort_order: number
  is_visible: boolean
  created_at: string | Date
  updated_at: string | Date
  resume_slug: string
  resume_title: string
  resume_owner_name: string
  resume_is_published: boolean
}

export type CertificationWriteInput = {
  resumeId: string
  title: string
  issuer: string | null
  issuedOn: string | null
  credentialUrl: string | null
  sortOrder: number
  isVisible: boolean
}

const certificationSelect = `
  certifications.id,
  certifications.resume_id,
  certifications.title,
  certifications.issuer,
  certifications.issued_on,
  certifications.credential_url,
  certifications.sort_order,
  certifications.is_visible,
  certifications.created_at,
  certifications.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title,
  resumes.owner_name AS resume_owner_name,
  resumes.is_published AS resume_is_published
`

export async function listCertifications(): Promise<CertificationRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${certificationSelect}
    FROM certifications
    INNER JOIN resumes ON resumes.id = certifications.resume_id
    ORDER BY
      resumes.is_published DESC,
      resumes.updated_at DESC,
      certifications.sort_order ASC,
      certifications.issued_on DESC NULLS LAST,
      certifications.created_at DESC
  `)) as CertificationRow[]
}

export async function findCertificationById(
  certificationId: string
): Promise<CertificationRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${certificationSelect}
      FROM certifications
      INNER JOIN resumes ON resumes.id = certifications.resume_id
      WHERE certifications.id = $1
      LIMIT 1
    `,
    [certificationId]
  )) as CertificationRow[]

  return rows[0] ?? null
}

export async function createCertificationRecord(
  input: CertificationWriteInput
): Promise<CertificationRow> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      INSERT INTO certifications (
        resume_id,
        title,
        issuer,
        issued_on,
        credential_url,
        sort_order,
        is_visible
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      input.resumeId,
      input.title,
      input.issuer,
      input.issuedOn,
      input.credentialUrl,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  const row = await findCertificationById(rows[0]?.id ?? "")

  if (!row) {
    throw new Error("Created certification record could not be loaded")
  }

  return row
}

export async function updateCertificationRecord(
  certificationId: string,
  input: CertificationWriteInput
): Promise<CertificationRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE certifications
      SET
        resume_id = $2,
        title = $3,
        issuer = $4,
        issued_on = $5,
        credential_url = $6,
        sort_order = $7,
        is_visible = $8
      WHERE id = $1
      RETURNING id
    `,
    [
      certificationId,
      input.resumeId,
      input.title,
      input.issuer,
      input.issuedOn,
      input.credentialUrl,
      input.sortOrder,
      input.isVisible,
    ]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findCertificationById(rows[0].id)
}

export async function deleteCertificationRecord(
  certificationId: string
): Promise<{ id: string } | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      DELETE FROM certifications
      WHERE id = $1
      RETURNING id
    `,
    [certificationId]
  )) as Array<{ id: string }>

  return rows[0] ?? null
}
