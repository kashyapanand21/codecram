import { encode } from 'gpt-tokenizer';

export function countTokens(text: string): number {
  try {
    return encode(text).length;
  } catch {
    // Rough fallback if a file contains something the tokenizer chokes on.
    return Math.ceil(text.length / 4);
  }
}
