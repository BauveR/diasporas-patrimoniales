import { describe, it, expect } from 'vitest'
import { toCsv, toTsv } from './csv'

describe('toCsv', () => {
  it('separa filas y columnas con CRLF/coma', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('a,b\r\nc,d')
  })

  it('escapa campos con comas, comillas o saltos de línea', () => {
    expect(toCsv([['hola, mundo', 'con "comillas"', 'con\nsalto']]))
      .toBe('"hola, mundo","con ""comillas""","con\nsalto"')
  })

  it('neutraliza un campo que empieza con = anteponiendo una comilla', () => {
    expect(toCsv([['=HYPERLINK("http://evil.com","click")']]))
      .toBe('"\'=HYPERLINK(""http://evil.com"",""click"")"')
  })

  it('neutraliza campos que empiezan con +, - o @', () => {
    expect(toCsv([['+1234', '-1234', '@mention']]))
      .toBe("'+1234,'-1234,'@mention")
  })

  it('no altera un campo que no empieza con un carácter de fórmula', () => {
    expect(toCsv([['Ana López']])).toBe('Ana López')
  })
})

describe('toTsv', () => {
  it('separa filas y columnas con salto de línea/tab', () => {
    expect(toTsv([['a', 'b'], ['c', 'd']])).toBe('a\tb\nc\td')
  })

  it('neutraliza un campo que empieza con = anteponiendo una comilla', () => {
    expect(toTsv([['=cmd|somecommand']])).toBe("'=cmd|somecommand")
  })
})
