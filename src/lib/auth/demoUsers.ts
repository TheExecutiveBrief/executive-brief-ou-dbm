import { EditorialUser } from "./types";

export interface DemoUserRecord {
  user: EditorialUser;
  passwordHash: string; // Plain demonstration password for local zero-dependency testing
}

/**
 * Pre-configured Editorial Demo Accounts.
 * Active exclusively in Local Demonstration Mode when Supabase credentials are not configured.
 * Enables reviewers to test role-based publishing safeguards without creating external accounts.
 */
export const DEMO_USERS: Record<string, DemoUserRecord> = {
  "editor@oudbm.ac.in": {
    user: {
      id: "usr-demo-eic-01",
      email: "editor@oudbm.ac.in",
      fullName: "Dr. V. Sudha",
      role: "editor_in_chief",
      affiliation: "Head of Department & Editor-in-Chief, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
  "section.editor@oudbm.ac.in": {
    user: {
      id: "usr-demo-sec-02",
      email: "section.editor@oudbm.ac.in",
      fullName: "Prof. R. K. Sharma",
      role: "section_editor",
      affiliation: "Senior Faculty & Markets Section Editor, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
  "writer@oudbm.ac.in": {
    user: {
      id: "usr-demo-wri-03",
      email: "writer@oudbm.ac.in",
      fullName: "Rahul Verma",
      role: "staff_writer",
      affiliation: "MBA Class of 2025 · Student Contributor, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
};
