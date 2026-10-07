// Central guard for privileged mock actions on the admin pages.
// Server-side RBAC is authoritative (backend/middlewares/rbac.go);
// this keeps the UI honest so read-only roles don't see dead buttons succeed.
//
// Usage: guardAdminAction(user, label, action, payload, anyOfPermissions)
// - superadmin always passes (owns every permission)
// - other roles pass only if they hold one of anyOfPermissions (default: none)
export function guardAdminAction(user, label, action, payload, anyOf = []) {
  const role = user?.role
  const perms = user?.permissions || []
  const hasPerm = anyOf.length > 0 && anyOf.some((p) => perms.includes(p))

  if (role !== 'superadmin' && !hasPerm) {
    console.warn(`[RBAC] ${label}: "${action}" ditolak untuk role ${role}`)
    const need = anyOf.length > 0 ? ` (butuh: ${anyOf.join('/')})` : ''
    return {
      allowed: false,
      message: `Aksi "${action}" tidak diizinkan untuk role ${role}${need}.`,
    }
  }
  console.log(`[Superadmin ${label}] ${action}:`, payload)
  return { allowed: true }
}
