"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth/session"

// ─── Logger ─────────────────────────────────────────────────────────────────
const LOG = "[users/actions]"
const log = (msg: string, data?: unknown) =>
  console.log(`${LOG} ${msg}`, data !== undefined ? data : "")
const logError = (msg: string, err?: unknown) =>
  console.error(`${LOG} ❌ ${msg}`, err !== undefined ? err : "")

export interface AppUser {
  id: string
  username: string
  display_name: string
  created_at: string
}

const MIN_PASSWORD_LENGTH = 8

export async function getUsers(): Promise<AppUser[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, created_at")
    .order("created_at", { ascending: true })

  if (error) {
    logError("getUsers falló", error)
    return []
  }
  return data ?? []
}

export async function createUser(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase()
  const displayName = String(formData.get("display_name") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!username || !displayName) {
    return { error: "El usuario y el nombre son requeridos" }
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return { error: "El usuario solo puede tener letras minúsculas, números, puntos, guiones y guion bajo" }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` }
  }

  const supabase = createAdminClient()
  const passwordHash = await bcrypt.hash(password, 12)

  const { error } = await supabase.from("users").insert({
    username,
    display_name: displayName,
    password_hash: passwordHash,
  })

  if (error) {
    logError("createUser falló", error)
    if (error.code === "23505") {
      return { error: "Ese usuario ya existe" }
    }
    return { error: "No se pudo crear el usuario" }
  }

  log("Usuario creado", { username })
  revalidatePath("/users")
  return { success: true }
}

export async function resetPassword(id: string, formData: FormData) {
  const password = String(formData.get("password") ?? "")
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` }
  }

  const supabase = createAdminClient()
  const passwordHash = await bcrypt.hash(password, 12)

  const { error } = await supabase.from("users").update({
    password_hash: passwordHash,
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  if (error) {
    logError("resetPassword falló", error)
    return { error: "No se pudo actualizar la contraseña" }
  }

  log("Contraseña actualizada", { id })
  revalidatePath("/users")
  return { success: true }
}

export async function deleteUser(id: string) {
  const currentUser = await getCurrentUser()
  if (currentUser?.userId === id) {
    return { error: "No puedes eliminar tu propio usuario mientras tienes sesión iniciada" }
  }

  const supabase = createAdminClient()

  const { count } = await supabase.from("users").select("id", { count: "exact", head: true })
  if ((count ?? 0) <= 1) {
    return { error: "Debe quedar al menos un usuario" }
  }

  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    logError("deleteUser falló", error)
    return { error: "No se pudo eliminar el usuario" }
  }

  log("Usuario eliminado", { id })
  revalidatePath("/users")
  return { success: true }
}
