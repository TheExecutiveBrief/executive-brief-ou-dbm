
export type EditorialRole =
  | "administrator"
  | "editor_in_chief"
  | "section_editor"
  | "section_writer"
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
 * Editorial permissions.
 *
 * Workflow:
 * Section Writer -> Editorial Editor -> Chief Editor -> Published
 *
 * Administrator and Editor-in-Chief have equal article-workflow
 * authority. Administrator also manages users and system settings.
 */
export const permissions = {
  isAdministrator: (role?: EditorialRole): boolean =>
    role === "administrator",

  // Chief Editor and Administrator have full editorial authority.
  isChiefEditor: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" || role === "administrator",

  // Section Editors conduct reviews; Chief Editor and Administrator
  // can also perform editorial review actions.
  isEditorialEditor: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" ||
    role === "section_editor" ||
    role === "administrator",

  // Section Writers, Staff Writers, and Contributors.
  isSectionWriter: (role?: EditorialRole): boolean =>
    role === "section_writer" ||
    role === "staff_writer" ||
    role === "contributor",

  // Roles permitted to create drafts.
  canCreateDrafts: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" ||
    role === "administrator" ||
    role === "section_editor" ||
    role === "section_writer" ||
    role === "staff_writer" ||
    role === "contributor",

  // Only Chief Editor and Administrator can publish.
  canPublish: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" || role === "administrator",

  // Editors can edit articles across sections.
  canEditAnyArticle: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" ||
    role === "administrator" ||
    role === "section_editor",

  // Chief Editor and Administrator can delete or unpublish articles.
  canDeleteArticle: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" || role === "administrator",

  // Only Administrator manages user accounts and role assignments.
  canManageUsers: (role?: EditorialRole): boolean =>
    role === "administrator",

  canApproveAccounts: (role?: EditorialRole): boolean =>
    role === "administrator",

  canManageSettings: (role?: EditorialRole): boolean =>
    role === "administrator",

  getRoleLabel: (role: EditorialRole): string => {
    switch (role) {
      case "administrator":
        return "Administrator";
      case "editor_in_chief":
        return "Chief Editor";
      case "section_editor":
        return "Editorial Editor";
      case "section_writer":
        return "Section Writer";
      case "staff_writer":
        return "Staff Writer";
      case "contributor":
        return "Section Writer";
      case "reader":
        return "Reader";
      default:
        return "Editorial Member";
    }
  },

  getRoleBadgeColor: (role: EditorialRole): string => {
    switch (role) {
      case "administrator":
        return "bg-purple-900 text-paper-ivory border-purple-800";

      case "editor_in_chief":
        return "bg-crimson text-paper-ivory border-crimson";

      case "section_editor":
        return "bg-brass text-paper-ivory border-brass";

      case "section_writer":
        return "bg-forest text-paper-ivory border-forest";

      case "staff_writer":
        return "bg-blue-800 text-white border-blue-800";

      case "contributor":
        return "bg-teal-800 text-white border-teal-800";

      default:
        return "bg-paper-100 text-ink-600 border-editorial-border";
    }
  },
};
