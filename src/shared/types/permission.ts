/**
 * Permission System Types
 *
 * Mirrors backend model/permission.go.
 * Uses BigInt for permission bitmask to preserve precision up to bit 30.
 * JSON serialization uses string (JSON does not support bigint natively).
 */

// 权限位掩码（与后端 model/permission.go 同步）
export const Permission = {
  ManageServer: 1n << 0n,
  ManageRoles: 1n << 1n,
  ManageChannels: 1n << 2n,
  KickMembers: 1n << 3n,
  BanMembers: 1n << 4n,
  InviteMembers: 1n << 5n,
  ChangeNickname: 1n << 6n,
  ManageNicknames: 1n << 7n,
  ViewChannel: 1n << 8n,
  SendMessages: 1n << 9n,
  ManageMessages: 1n << 10n,
  EmbedLinks: 1n << 11n,
  AttachFiles: 1n << 12n,
  ReadHistory: 1n << 13n,
  MentionEveryone: 1n << 14n,
  AddReactions: 1n << 15n,
  ConnectVoice: 1n << 16n,
  Speak: 1n << 17n,
  MuteMembers: 1n << 18n,
  DeafenMembers: 1n << 19n,
  MoveMembers: 1n << 20n,
  ScreenShare: 1n << 21n,
  PrioritySpeaker: 1n << 22n,
  Administrator: 1n << 30n,
} as const

export type PermissionKey = keyof typeof Permission

/** All permission bits below Administrator (bits 0-29). */
export const ALL_PERMISSIONS = (1n << 30n) - 1n

/** Owner gets all permissions plus the Administrator bit. */
export const DEFAULT_OWNER_PERMISSIONS = ALL_PERMISSIONS | Permission.Administrator

/**
 * Check if a permission bitmask grants a specific permission.
 * Administrator bit grants all permissions.
 */
export function hasPermission(perms: bigint, perm: bigint): boolean {
  if ((perms & Permission.Administrator) !== 0n) return true
  return (perms & perm) !== 0n
}

/**
 * Merge multiple role permissions via bitwise OR.
 */
export function mergePermissions(rolePerms: bigint[]): bigint {
  return rolePerms.reduce((acc, p) => acc | p, 0n)
}

/**
 * Check if the bitmask includes the Administrator bit.
 */
export function isAdministrator(perms: bigint): boolean {
  return (perms & Permission.Administrator) !== 0n
}

/**
 * Convert a permission bitmask to its JSON-serializable string form.
 */
export function permissionsToString(perms: bigint): string {
  return perms.toString()
}

/**
 * Parse a permission string (from JSON) back to bigint.
 */
export function parsePermissions(permsString: string): bigint {
  return BigInt(permsString)
}
