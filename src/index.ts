/**
 * This file defines the public API of the package. Everything here will be available from
 * the top-level package name when importing as an npm package.
 *
 * E.g. `import { createPackageName, PackageNameOptions } from 'parse-json`
 */
import { stripJsonComments } from './strip-json-comments'

export * from './types'

export default stripJsonComments
