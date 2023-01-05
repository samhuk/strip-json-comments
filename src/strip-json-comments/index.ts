/* eslint-disable no-continue */
import { StripJsonCommentsOptions } from './types'

const singleComment = Symbol('singleComment') as any
const multiComment = Symbol('multiComment') as any

const stripWithoutWhitespace = () => ''

const stripWithWhitespace = (string: string, start?: number, end?: number) => (
  string.slice(start, end).replace(/\S/g, ' ')
)

const isEscaped = (jsonString: string, quotePosition: number) => {
  let index = quotePosition - 1
  let backslashCount = 0

  while (jsonString[index] === '\\') {
    index -= 1
    backslashCount += 1
  }

  return Boolean(backslashCount % 2)
}

/**
 * Strip comments from JSON. Lets you use comments in your JSON files!
 *
 * It will replace single-line comments `//` and multi-line comments `/**\/` with whitespace.
 * This allows JSON error positions to remain as close as possible to the original source.
 *
 * @param jsonString - Accepts a string with JSON.
 * @returns A JSON string without comments.
 *
 * @example
 * ```
 * import stripJsonComments from 'strip-json-comments';
 *
 * const json = `{
 *  // Rainbows
 *  "unicorn": "cake"
 * }`;
 *
 * JSON.parse(stripJsonComments(json));
 * //=> {unicorn: 'cake'}
 * ```
*/
export const stripJsonComments = (jsonString: string, options?: StripJsonCommentsOptions): string => {
  if (typeof jsonString !== 'string')
    throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``)

  const whitespace = options?.whitespace ?? true
  const trailingCommas = options?.trailingCommas ?? true

  const strip = whitespace ? stripWithWhitespace : stripWithoutWhitespace

  let isInsideString = false
  let isInsideComment = false
  let offset = 0
  let buffer = ''
  let result = ''
  let commaIndex = -1

  for (let index = 0; index < jsonString.length; index += 1) {
    const currentCharacter = jsonString[index]
    const nextCharacter = jsonString[index + 1]

    if (!isInsideComment && currentCharacter === '"') {
      // Enter or exit string
      const escaped = isEscaped(jsonString, index)
      if (!escaped)
        isInsideString = !isInsideString
    }

    if (isInsideString)
      continue

    if (!isInsideComment && currentCharacter + nextCharacter === '//') {
      // Enter single-line comment
      buffer += jsonString.slice(offset, index)
      offset = index
      isInsideComment = singleComment
      index += 1
    }
    else if (isInsideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
      // Exit single-line comment via \r\n
      index += 1
      isInsideComment = false
      buffer += strip(jsonString, offset, index)
      offset = index
      continue
    }
    else if (isInsideComment === singleComment && currentCharacter === '\n') {
      // Exit single-line comment via \n
      isInsideComment = false
      buffer += strip(jsonString, offset, index)
      offset = index
    }
    else if (!isInsideComment && currentCharacter + nextCharacter === '/*') {
      // Enter multiline comment
      buffer += jsonString.slice(offset, index)
      offset = index
      isInsideComment = multiComment
      index += 1
      continue
    }
    else if (isInsideComment === multiComment && currentCharacter + nextCharacter === '*/') {
      // Exit multiline comment
      index += 1
      isInsideComment = false
      buffer += strip(jsonString, offset, index + 1)
      offset = index + 1
      continue
    }
    else if (trailingCommas && !isInsideComment) {
      if (commaIndex !== -1) {
        if (currentCharacter === '}' || currentCharacter === ']') {
          // Strip trailing comma
          buffer += jsonString.slice(offset, index)
          result += strip(buffer, 0, 1) + buffer.slice(1)
          buffer = ''
          offset = index
          commaIndex = -1
        }
        else if (currentCharacter !== ' ' && currentCharacter !== '\t' && currentCharacter !== '\r' && currentCharacter !== '\n') {
          // Hit non-whitespace following a comma; comma is not trailing
          buffer += jsonString.slice(offset, index)
          offset = index
          commaIndex = -1
        }
      }
      else if (currentCharacter === ',') {
        // Flush buffer prior to this point, and save new comma index
        result += buffer + jsonString.slice(offset, index)
        buffer = ''
        offset = index
        commaIndex = index
      }
    }
  }

  return result + buffer + (isInsideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset))
}
