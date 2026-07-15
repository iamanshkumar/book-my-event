export function getRole(
  roleOrHeaders?: string | null | Headers | { get(name: string): string | null }
): string | null {
  if (!roleOrHeaders) return null;
  if (typeof roleOrHeaders === 'string') return roleOrHeaders;
  if (typeof roleOrHeaders.get === 'function') {
    return roleOrHeaders.get('x-user-role');
  }
  return null;
}

export function isGuest(
  roleOrHeaders?: string | null | Headers | { get(name: string): string | null }
): boolean {
  const role = getRole(roleOrHeaders);
  return !role;
}

export function isAdmin(
  roleOrHeaders?: string | null | Headers | { get(name: string): string | null }
): boolean {
  return getRole(roleOrHeaders) === 'ADMIN';
}

export function isOrganizer(
  roleOrHeaders?: string | null | Headers | { get(name: string): string | null }
): boolean {
  return getRole(roleOrHeaders) === 'ORGANIZER';
}

export function isAttendee(
  roleOrHeaders?: string | null | Headers | { get(name: string): string | null }
): boolean {
  return getRole(roleOrHeaders) === 'CUSTOMER';
}
