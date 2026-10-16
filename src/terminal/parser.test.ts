import { describe, expect, it } from 'vitest'

import { parseCommand } from './parser'

describe('parseCommand', () => {
  it('parses basic commands', () => {
    expect(parseCommand('help')).toEqual({ kind: 'command', name: 'help', args: [] })
    expect(parseCommand('about')).toEqual({ kind: 'command', name: 'about', args: [] })
    expect(parseCommand('experience')).toEqual({ kind: 'command', name: 'experience', args: [] })
    expect(parseCommand('projects')).toEqual({ kind: 'command', name: 'projects', args: [] })
    expect(parseCommand('skills')).toEqual({ kind: 'command', name: 'skills', args: [] })
    expect(parseCommand('contact')).toEqual({ kind: 'command', name: 'contact', args: [] })
    expect(parseCommand('all')).toEqual({ kind: 'command', name: 'all', args: [] })
    expect(parseCommand('theme')).toEqual({ kind: 'command', name: 'theme', args: [] })
    expect(parseCommand('mode')).toEqual({ kind: 'command', name: 'mode', args: [] })
    expect(parseCommand('lang')).toEqual({ kind: 'command', name: 'lang', args: [] })
    expect(parseCommand('clear')).toEqual({ kind: 'command', name: 'clear', args: [] })
  })

  it('treats work as projects alias', () => {
    expect(parseCommand('work')).toEqual({ kind: 'command', name: 'projects', args: [] })
  })

  it('recognises the settings aliases in both languages', () => {
    expect(parseCommand('tema')).toEqual({ kind: 'command', name: 'theme', args: [] })
    expect(parseCommand('modo')).toEqual({ kind: 'command', name: 'mode', args: [] })
    expect(parseCommand('appearance')).toEqual({ kind: 'command', name: 'mode', args: [] })
    expect(parseCommand('aparencia')).toEqual({ kind: 'command', name: 'mode', args: [] })
    expect(parseCommand('language')).toEqual({ kind: 'command', name: 'lang', args: [] })
    expect(parseCommand('idioma')).toEqual({ kind: 'command', name: 'lang', args: [] })
    expect(parseCommand('lingua')).toEqual({ kind: 'command', name: 'lang', args: [] })
  })

  it('keeps the argument of a settings command', () => {
    expect(parseCommand('theme paper')).toEqual({ kind: 'command', name: 'theme', args: ['paper'] })
  })

  it('treats home and tudo as the all alias', () => {
    expect(parseCommand('home')).toEqual({ kind: 'command', name: 'all', args: [] })
    expect(parseCommand('tudo')).toEqual({ kind: 'command', name: 'all', args: [] })
  })

  it('supports Portuguese aliases', () => {
    expect(parseCommand('ajuda')).toEqual({ kind: 'command', name: 'help', args: [] })
    expect(parseCommand('sobre')).toEqual({ kind: 'command', name: 'about', args: [] })
    expect(parseCommand('experiencia')).toEqual({ kind: 'command', name: 'experience', args: [] })
    expect(parseCommand('projetos')).toEqual({ kind: 'command', name: 'projects', args: [] })
    expect(parseCommand('habilidades')).toEqual({ kind: 'command', name: 'skills', args: [] })
    expect(parseCommand('contato')).toEqual({ kind: 'command', name: 'contact', args: [] })
    expect(parseCommand('limpar')).toEqual({ kind: 'command', name: 'clear', args: [] })
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(parseCommand('  ABOUT  ')).toEqual({ kind: 'command', name: 'about', args: [] })
    expect(parseCommand('Ajuda')).toEqual({ kind: 'command', name: 'help', args: [] })
  })

  it('returns empty for blank input', () => {
    expect(parseCommand('')).toEqual({ kind: 'empty' })
    expect(parseCommand('   ')).toEqual({ kind: 'empty' })
  })

  it('returns unknown for unrecognized commands', () => {
    expect(parseCommand('foobar')).toEqual({ kind: 'unknown', word: 'foobar' })
    expect(parseCommand('foo bar baz')).toEqual({ kind: 'unknown', word: 'foo' })
  })

  it('splits arguments after the command', () => {
    expect(parseCommand('projects all')).toEqual({
      kind: 'command',
      name: 'projects',
      args: ['all'],
    })
  })
})
