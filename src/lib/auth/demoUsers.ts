import { EditorialUser } from "./types";

export interface DemoUserRecord {
  user: EditorialUser;
  passwordHash: string; // Plain demonstration password for local zero-dependency testing
}

/**
 * Pre-configured Editorial Demo Accounts covering all 4 tiers of the editorial hierarchy:
 * 1. Administrator (System & user management, role assignments, audit oversight)
 * 2. Chief Editor (Final queue review, live publication, return for revision)
 * 3. Editorial Editor (Editorial review queue, return for revision, forward to Chief)
 * 4. Section Writer (Draft creation, revision editing, submission to Editorial queue)
 * 5. Pending Applicant (Simulates a newly registered applicant awaiting approval)
 */
export const DEMO_USERS: Record<string, DemoUserRecord> = {
  "admin@oudbm.ac.in": {
    user: {
      id: "usr-demo-adm-00",
      email: "admin@oudbm.ac.in",
      fullName: "Admin Controller",
      role: "administrator",
      approvalStatus: "approved",
      affiliation: "Administrative Board, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
  "chief@oudbm.ac.in": {
    user: {
      id: "usr-demo-eic-01",
      email: "chief@oudbm.ac.in",
      fullName: "Dr. V. Sudha",
      role: "editor_in_chief",
      approvalStatus: "approved",
      affiliation: "Head of Department & Chief Editor, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
  "editor@oudbm.ac.in": {
    user: {
      id: "usr-demo-eic-01",
      email: "editor@oudbm.ac.in",
      fullName: "Dr. V. Sudha",
      role: "editor_in_chief",
      approvalStatus: "approved",
      affiliation: "Head of Department & Chief Editor, OU DBM",
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
      approvalStatus: "approved",
      affiliation: "Senior Faculty & Editorial Editor, OU DBM",
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
      role: "section_writer",
      approvalStatus: "approved",
      assignedSections: ["special-report", "business"],
      affiliation: "MBA Class of 2025 · Section Writer, OU DBM",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
  "pending.writer@oudbm.ac.in": {
    user: {
      id: "usr-demo-pen-04",
      email: "pending.writer@oudbm.ac.in",
      fullName: "Priya Nair",
      role: "section_writer",
      approvalStatus: "pending",
      affiliation: "MBA Class of 2026 · Applicant",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      isSimulated: true,
    },
    passwordHash: "ExecutiveBrief2026!",
  },
};
