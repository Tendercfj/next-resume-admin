import { getSql } from "@/lib/db"

export type ContactMessageStatus =
  | "new"
  | "read"
  | "replied"
  | "archived"
  | "spam"

export type ContactMessageRow = {
  id: string
  resume_id: string | null
  sender_name: string
  sender_email: string
  sender_company: string | null
  subject: string | null
  message: string
  source: string
  status: ContactMessageStatus
  ip_hash: string | null
  user_agent: string | null
  created_at: string | Date
  updated_at: string | Date
  resume_slug: string | null
  resume_title: string | null
}

const contactMessageSelect = `
  contact_messages.id,
  contact_messages.resume_id,
  contact_messages.sender_name,
  contact_messages.sender_email,
  contact_messages.sender_company,
  contact_messages.subject,
  contact_messages.message,
  contact_messages.source,
  contact_messages.status,
  contact_messages.ip_hash,
  contact_messages.user_agent,
  contact_messages.created_at,
  contact_messages.updated_at,
  resumes.slug AS resume_slug,
  resumes.title AS resume_title
`

export async function listContactMessages(): Promise<ContactMessageRow[]> {
  const sql = getSql()

  return (await sql.query(`
    SELECT ${contactMessageSelect}
    FROM contact_messages
    LEFT JOIN resumes ON resumes.id = contact_messages.resume_id
    ORDER BY
      CASE contact_messages.status
        WHEN 'new' THEN 0
        WHEN 'read' THEN 1
        WHEN 'replied' THEN 2
        WHEN 'archived' THEN 3
        WHEN 'spam' THEN 4
        ELSE 5
      END ASC,
      contact_messages.created_at DESC
  `)) as ContactMessageRow[]
}

export async function findContactMessageById(
  contactMessageId: string
): Promise<ContactMessageRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      SELECT ${contactMessageSelect}
      FROM contact_messages
      LEFT JOIN resumes ON resumes.id = contact_messages.resume_id
      WHERE contact_messages.id = $1
      LIMIT 1
    `,
    [contactMessageId]
  )) as ContactMessageRow[]

  return rows[0] ?? null
}

export async function updateContactMessageStatus(
  contactMessageId: string,
  status: ContactMessageStatus
): Promise<ContactMessageRow | null> {
  const sql = getSql()
  const rows = (await sql.query(
    `
      UPDATE contact_messages
      SET status = $2
      WHERE id = $1
      RETURNING id
    `,
    [contactMessageId, status]
  )) as Array<{ id: string }>

  if (!rows[0]) {
    return null
  }

  return findContactMessageById(rows[0].id)
}
