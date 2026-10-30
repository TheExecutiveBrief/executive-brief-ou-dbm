// ==============================================================================
// The Executive Brief by OU DBM - Role & Session Definitions
// Exactly Three Roles:
// 1. section_writer: Public student contributor (No login required)
// 2. editorial: Complete publication management
// 3. admin: Complete system management + all editorial powers
// ==============================================================================

export type EditorialRole =
  | "admin"
  | "editorial"
  | "section_writer"
  // Legacy aliases supported for compatibility
  | "administrator"
  | "editor_in_chief"
  | "section_editor"
  | "staff_writer"
  | "contributor"
  | "reader";

export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface EditorialUser {
  id: string;
  email: string;
  fullName: string;
  role: EditorialRole;
  approvalStatus?: AccountStatus;
  assignedSections?: string[];
  avatarUrl?: string;
  affiliation?: string;
  bio?: string;
  isSimulated?: boolean;
}

export interface EditorialSession {
  user: EditorialUser;
  token?: string;
  expiresAt: number;
}

/**
 * Editorial and Administrative permission assertions.
 * Enforces least-privilege role boundaries across the system.
 */
export const permissions = {
  isAdministrator: (role?: EditorialRole): boolean =>
    role === "admin" || role === "administrator",

  isEditorial: (role?: EditorialRole): boolean =>
    role === "editorial" ||
    role === "admin" ||
    role === "administrator" ||
    role === "editor_in_chief" ||
    role === "section_editor",

  // Legacy helper aliases mapped to core permission matrix
  isChiefEditor: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  isEditorialEditor: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  isSectionWriter: (role?: EditorialRole): boolean =>
    role === "section_writer" || role === "staff_writer" || role === "contributor",

  // Editorial authority
  canCreateDrafts: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  canPublish: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  canEditAnyArticle: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  canDeleteArticle: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  canManageAuthors: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  canManageIssues: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  canManageSubmissions: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  // Administrator-only capabilities
  canManageUsers: (role?: EditorialRole): boolean =>
    permissions.isAdministrator(role),

  canApproveAccounts: (role?: EditorialRole): boolean =>
    permissions.isAdministrator(role),

  canManageSettings: (role?: EditorialRole): boolean =>
    permissions.isAdministrator(role),

  canManageCategories: (role?: EditorialRole): boolean =>
    permissions.isAdministrator(role),

  canViewAuditLogs: (role?: EditorialRole): boolean =>
    permissions.isEditorial(role),

  getRoleLabel: (role: EditorialRole): string => {
    switch (role) {
      case "admin":
      case "administrator":
        return "Administrator";
      case "editorial":
      case "editor_in_chief":
      case "section_editor":
        return "Editorial";
      case "section_writer":
      case "staff_writer":
      case "contributor":
        return "Section Writer";
      default:
        return "Editorial Member";
    }
  },

  getRoleBadgeColor: (role: EditorialRole): string => {
    switch (role) {
      case "admin":
      case "administrator":
        return "bg-purple-900 text-paper-ivory border-purple-800";
      case "editorial":
      case "editor_in_chief":
      case "section_editor":
        return "bg-crimson text-paper-ivory border-crimson";
      case "section_writer":
      case "staff_writer":
      case "contributor":
        return "bg-forest text-paper-ivory border-forest";
      default:
        return "bg-paper-100 text-ink-600 border-editorial-border";
    }
  },
};
