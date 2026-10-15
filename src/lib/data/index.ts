import { ContentRepository } from "./repository";
import { LocalContentRepository } from "./localAdapter";
import { SupabaseContentRepository } from "./supabaseAdapter";

export * from "./repository";
export * from "./types";
export { LocalContentRepository } from "./localAdapter";
export { SupabaseContentRepository, SupabaseConfigurationError, SupabaseDatabaseError } from "./supabaseAdapter";

let repositoryInstance: ContentRepository | null = null;

/**
 * Returns the configured ContentRepository implementation.
 *
 * Mode Resolution:
 * - When CONTENT_SOURCE is explicitly set to 'supabase': instantiates SupabaseContentRepository.
 *   If credentials are missing or invalid, throws an explicit configuration/connection error.
 *   (Does NOT silently fall back to mock content when production database is configured).
 * - Otherwise (default in local dev and Milestone 4B): returns LocalContentRepository
 *   backed by src/data/mockArticles.ts.
 */
export function getContentRepository(): ContentRepository {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const source = process.env.CONTENT_SOURCE?.toLowerCase();

  if (source === "supabase") {
    // Explicitly selected Supabase. If unconfigured or misconfigured, fails loudly.
    repositoryInstance = new SupabaseContentRepository();
  } else {
    // Local development mode / Fallback source of truth
    repositoryInstance = new LocalContentRepository();
  }

  return repositoryInstance;
}

/**
 * Singleton repository instance for standard server-side rendering.
 */
export const contentRepository: ContentRepository = getContentRepository();
