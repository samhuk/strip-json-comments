import { stripJsonComments } from '.'
import { StripJsonCommentsOptions } from './types'

describe('strip-json-comments', () => {
  describe('stripJsonComments', () => {
    const fn = stripJsonComments

    test('replace comments with whitespace', () => {
      expect(fn('//comment\n{"a":"b"}')).toBe('         \n{"a":"b"}')
      expect(fn('/*//comment*/{"a":"b"}')).toBe('             {"a":"b"}')
      expect(fn('{"a":"b"//comment\n}')).toBe('{"a":"b"         \n}')
      expect(fn('{"a":"b"/*comment*/}')).toBe('{"a":"b"           }')
      expect(fn('{"a"/*\n\n\ncomment\r\n*/:"b"}')).toBe('{"a"  \n\n\n       \r\n  :"b"}')
      expect(fn('/*!\n * comment\n */\n{"a":"b"}')).toBe('   \n          \n   \n{"a":"b"}')
      expect(fn('{/*comment*/"a":"b"}')).toBe('{           "a":"b"}')
    })

    test('remove comments', () => {
      const options: StripJsonCommentsOptions = { whitespace: false }

      expect(fn('//comment\n{"a":"b"}', options)).toBe('\n{"a":"b"}')
      expect(fn('/*//comment*/{"a":"b"}', options)).toBe('{"a":"b"}')
      expect(fn('{"a":"b"//comment\n}', options)).toBe('{"a":"b"\n}')
      expect(fn('{"a":"b"/*comment*/}', options)).toBe('{"a":"b"}')
      expect(fn('{"a"/*\n\n\ncomment\r\n*/:"b"}', options)).toBe('{"a":"b"}')
      expect(fn('/*!\n * comment\n */\n{"a":"b"}', options)).toBe('\n{"a":"b"}')
      expect(fn('{/*comment*/"a":"b"}', options)).toBe('{"a":"b"}')
    })

    test('doesn\'t strip comments inside strings', () => {
      expect(fn('{"a":"b//c"}')).toBe('{"a":"b//c"}')
      expect(fn('{"a":"b/*c*/"}')).toBe('{"a":"b/*c*/"}')
      expect(fn('{"/*a":"b"}')).toBe('{"/*a":"b"}')
      expect(fn('{"\\"/*a":"b"}')).toBe('{"\\"/*a":"b"}')
    })

    test('consider escaped slashes when checking for escaped string quote', () => {
      expect(fn('{"\\\\":"https://foobar.com"}')).toBe('{"\\\\":"https://foobar.com"}')
      expect(fn('{"foo\\"":"https://foobar.com"}')).toBe('{"foo\\"":"https://foobar.com"}')
    })

    test('line endings - no comments', () => {
      expect(fn('{"a":"b"\n}')).toBe('{"a":"b"\n}')
      expect(fn('{"a":"b"\r\n}')).toBe('{"a":"b"\r\n}')
    })

    test('line endings - single line comment', () => {
      expect(fn('{"a":"b"//c\n}')).toBe('{"a":"b"   \n}')
      expect(fn('{"a":"b"//c\r\n}')).toBe('{"a":"b"   \r\n}')
    })

    test('line endings - single line block comment', () => {
      expect(fn('{"a":"b"/*c*/\n}')).toBe('{"a":"b"     \n}')
      expect(fn('{"a":"b"/*c*/\r\n}')).toBe('{"a":"b"     \r\n}')
    })

    test('line endings - multi line block comment', () => {
      expect(fn('{"a":"b",/*c\nc2*/"x":"y"\n}')).toBe('{"a":"b",   \n    "x":"y"\n}')
      expect(fn('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}')).toBe('{"a":"b",   \r\n    "x":"y"\r\n}')
    })

    test('line endings - works at EOF', () => {
      const options = { whitespace: false }
      expect(fn('{\r\n\t"a":"b"\r\n} //EOF')).toBe('{\r\n\t"a":"b"\r\n}      ')
      expect(fn('{\r\n\t"a":"b"\r\n} //EOF', options)).toBe('{\r\n\t"a":"b"\r\n} ')
    })

    test('handles weird escaping', () => {
      expect(fn(String.raw`{"x":"x \"sed -e \\\"s/^.\\\\{46\\\\}T//\\\" -e \\\"s/#033/\\\\x1b/g\\\"\""}`)).toBe(String.raw`{"x":"x \"sed -e \\\"s/^.\\\\{46\\\\}T//\\\" -e \\\"s/#033/\\\\x1b/g\\\"\""}`)
    })

    test('strips trailing commas', () => {
      expect(fn('{"x":true,}', { trailingCommas: true })).toBe('{"x":true }')
      expect(fn('{"x":true,}', { trailingCommas: true, whitespace: false })).toBe('{"x":true}')
      expect(fn('{"x":true,\n  }', { trailingCommas: true })).toBe('{"x":true \n  }')
      expect(fn('[true, false,]', { trailingCommas: true })).toBe('[true, false ]')
      expect(fn('[true, false,]', { trailingCommas: true, whitespace: false })).toBe('[true, false]')
      expect(fn('{\n  "array": [\n    true,\n    false,\n  ],\n}', { trailingCommas: true, whitespace: false }))
        .toBe('{\n  "array": [\n    true,\n    false\n  ]\n}')
      expect(fn('{\n  "array": [\n    true,\n    false /* comment */ ,\n /*comment*/ ],\n}', { trailingCommas: true, whitespace: false }))
        .toBe('{\n  "array": [\n    true,\n    false  \n  ]\n}')
    })

    test.failing('handles malformed block comments', () => {
      expect(fn('[] */')).toBe('[] */')
      expect(fn('[] /*')).toBe('[] /*') // Fails
    })
  })
})
