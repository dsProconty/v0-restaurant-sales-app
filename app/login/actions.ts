"use server"

import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[login/actions]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

export interface LoginState {
  error?: string
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!username || !password) {
    return { error: "Ingresa tu usuario y contraseña" }
  }

  try {
    const supabase = createAdminClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash, display_name")
      .eq("username", username)
      .maybeSingle()

    if (error) {
      logError("Query falló", error)
      return { error: "Error del servidor, intenta de nuevo" }
    }

    if (!user) {
      log("Intento fallido — usuario no existe", { username })
      return { error: "Usuario o contraseña incorrectos" }
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      log("Intento fallido — contraseña incorrecta", { username })
      return { error: "Usuario o contraseña incorrectos" }
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    log("Login OK", { username })
  } catch (err) {
    logError("Error no controlado", err)
    return { error: "Error del servidor, intenta de nuevo" }
  }

  redirect("/")
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}
