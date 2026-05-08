import { createHash, randomBytes } from "node:crypto"

export function createSessionToken() {
  return randomBytes(32).toString("hex")
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function hashIdentifier(value: string) {
  return sha256Hex(value.trim().toLowerCase())
}
