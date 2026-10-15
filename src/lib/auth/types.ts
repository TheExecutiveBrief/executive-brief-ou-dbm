export type EditorialRole =
  | "editor_in_chief"
  | "section_editor"
  | "staff_writer"
  | "contributor"
  | "reader";

export interface EditorialUser {
  id: string;
  email: string;
  fullName: string;
  role: EditorialRole;
  avatarUrl?: string;
  affiliation?: string;
  isSimulated?: boolean;
}

export interface EditorialSession {
  user: EditorialUser;
  token?: string;
  expiresAt: number;
}

/**
 * Editorial Permission Safeguards
 * Used for UI indicators and client validation.
 * Crucially, server-side actions and PostgreSQL RLS enforce these boundaries at the database level.
 */
export const permissions = {
  canPublish: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" || role === "section_editor",

  canEditAnyArticle: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" || role === "section_editor",

  canDeleteArticle: (role?: EditorialRole): boolean =>
    role === "editor_in_chief" || role === "section_editor",

  canManageSettings: (role?: EditorialRole): boolean =>
    role === "editor_in_chief",

  getRoleLabel: (role: EditorialRole): string => {
    switch (role) {
      case "editor_in_chief":
        return "Editor-in-Chief";
      case "section_editor":
        return "Section Editor";
      case "staff_writer":
        return "Staff Writer";
      case "contributor":
        return "Student Contributor";
      case "reader":
        return "Reader";
      default:
        return "Editorial Member";
    }
  },

  getRoleBadgeColor: (role: EditorialRole): string => {
    switch (role) {
      case "editor_in_chief":
        return "bg-crimson text-paper-ivory border-crimson";
      case "section_editor":
        return "bg-brass text-paper-ivory border-brass";
      case "staff_writer":
        return "bg-ink-800 text-paper-ivory border-ink-800";
      case "contributor":
        return "bg-paper-200 text-ink-800 border-editorial-border";
      default:
        return "bg-paper-100 text-ink-600 border-editorial-border";
    }
  },
};
