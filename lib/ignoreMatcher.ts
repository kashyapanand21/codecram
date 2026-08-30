import ignore, { type Ignore } from 'ignore';
import { DEFAULT_IGNORE_PATTERNS } from './defaultIgnore';

/**
 * Builds a matcher seeded with our sensible defaults, optionally layered
 * with the repo's own .gitignore content and any user-typed patterns.
 */
export function buildMatcher(extraPatterns: string[], gitignoreContent?: string): Ignore {
  const ig = ignore();
  ig.add(DEFAULT_IGNORE_PATTERNS);
  if (gitignoreContent) {
    ig.add(gitignoreContent.split('\n'));
  }
  if (extraPatterns.length) {
    ig.add(extraPatterns);
  }
  return ig;
}
