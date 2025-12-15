// Server-only utilities (NOT server actions - these cannot be called from client components)

/**
 * Get the authentication token from cookies (server-side)
 */
export async function getServerToken(): Promise<string | undefined> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}
