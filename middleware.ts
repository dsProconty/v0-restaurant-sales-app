import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Rutas/prefijos que no requieren sesión iniciada
const PUBLIC_PREFIXES = [
  "/api/whatsapp",   // webhook de Twilio — no lo llama un usuario logueado
]

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("session")?.value
  const key = getSecretKey()
  if (!token || !key) return false
  try {
    await jwtVerify(token, key)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const authenticated = await isAuthenticated(request)

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos de Next y los íconos/manifest
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-light-32x32.png|icon-dark-32x32.png|apple-icon.png).*)",
  ],
}
