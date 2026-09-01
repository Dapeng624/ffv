const COOKIE_NAME = "yingzo_guest";
const GUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type GuestWorkspace = { id: string; isNew: boolean; secure: boolean };

export function getGuestWorkspace(request: Request): GuestWorkspace {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const secure = new URL(request.url).protocol === "https:";
  if (value && GUEST_ID_PATTERN.test(value)) return { id: value, isNew: false, secure };
  return { id: crypto.randomUUID(), isNew: true, secure };
}

export function attachGuestCookie(response: Response, guest: GuestWorkspace): Response {
  if (!guest.isNew) return response;
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${guest.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${guest.secure ? "; Secure" : ""}`,
  );
  return response;
}
