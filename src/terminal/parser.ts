export const COMMAND_NAMES = ['help', 'about', 'projects', 'skills', 'contact', 'clear'] as const

export type CommandName = (typeof COMMAND_NAMES)[number]

/** English and Brazilian-Portuguese words that map to each command. */
const ALIASES: Record<string, CommandName> = {
  help: 'help',
  ajuda: 'help',
  about: 'about',
  sobre: 'about',
  work: 'projects',
  projects: 'projects',
  projetos: 'projects',
  skills: 'skills',
  habilidades: 'skills',
  contact: 'contact',
  contato: 'contact',
  clear: 'clear',
  limpar: 'clear',
}

export type ParsedCommand =
  | { kind: 'empty' }
  | { kind: 'command'; name: CommandName; args: string[] }
  | { kind: 'unknown'; word: string }

export function parseCommand(line: string): ParsedCommand {
  const trimmed = line.trim()
  if (!trimmed) return { kind: 'empty' }

  const [word, ...args] = trimmed.split(/\s+/)
  const name = ALIASES[word.toLowerCase()]
  if (!name) return { kind: 'unknown', word }

  return { kind: 'command', name, args }
}
