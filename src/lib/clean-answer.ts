/**
 * Strip RFP-specific artifacts from answers before saving to the library.
 * Removes citation markers [1], [2], section references, etc.
 */
export function cleanAnswerForLibrary(text: string): string {
  return (
    text
      // Remove citation markers like [1], [2], [3]
      .replace(/\[\d+\]/g, "")
      // Remove section references like "Per section 5.2," or "As noted in 3.1.2,"
      .replace(/(?:per|as noted in|see|refer to|in|under)\s+(?:section|item|requirement|clause)\s+[\d.]+[,;:]?\s*/gi, "")
      // Remove standalone section numbers at start of sentences like "5.2: " or "3.1.2 - "
      .replace(/^\d+(?:\.\d+)+[:\-–—\s]+/gm, "")
      // Remove "Source: ..." attribution lines
      .replace(/\(Source:.*?\)/g, "")
      // Clean up double spaces
      .replace(/\s{2,}/g, " ")
      // Clean up leading/trailing whitespace per line
      .replace(/^\s+|\s+$/gm, "")
      // Remove empty lines left behind
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
