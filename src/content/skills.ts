import type { SkillGroup } from './types'

export const skills: SkillGroup[] = [
  {
    id: 'languages',
    label: { en: 'Languages', 'pt-BR': 'Linguagens' },
    items: ['Go', 'Python', 'TypeScript', 'C#', 'SQL'],
  },
  {
    id: 'data',
    label: { en: 'Data & messaging', 'pt-BR': 'Dados e mensageria' },
    items: ['Postgres', 'Redis', 'NATS', 'WebSocket'],
  },
  {
    id: 'tooling',
    label: { en: 'Tooling & infra', 'pt-BR': 'Ferramentas e infra' },
    items: ['Git', 'Docker', 'GitHub Actions', 'Nginx', 'GNU Make', 'Linux'],
  },
  {
    id: 'game-dev',
    label: { en: 'Game development', 'pt-BR': 'Desenvolvimento de jogos' },
    items: ['Unity', 'C#', 'URP / HDRP', 'BepInEx modding'],
  },
]
