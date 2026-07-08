import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "session"
// Sesión de muy larga duración: el equipo debe permanecer conectado
// siempre, sin cierres por inactividad ni por tiempo.
const SESSION_DURATION = "3650d"

export interface SessionPayload {
  userId: string
  username: string
  displayName: string
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("Falta SESSION_SECRET — requerida para firmar la sesión de login.")
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") return null
    return {
      userId: payload.userId,
      username: payload.username,
      displayName: typeof payload.displayName === "string" ? payload.displayName : payload.username,
    }
  } catch {
    return null
  }
}

// ─── Helper para Server Components / Server Actions ─────────────────────────
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}
