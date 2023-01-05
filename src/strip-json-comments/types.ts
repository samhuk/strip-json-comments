export type StripJsonCommentsOptions = {
  /**
   * Replace comments and trailing commas with whitespace instead of stripping them entirely.
   *
   * @default true
   */
  whitespace?: boolean
  /**
   * Strip trailing commas in addition to comments.
   *
   * @default true
   */
  trailingCommas?: boolean
}
