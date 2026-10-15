import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'eznit',
    name: 'Eznit',
    description: {
      en: 'An internal file manager that helps developers store and reuse relevant files across projects.',
      'pt-BR':
        'Um gerenciador de arquivos interno que ajuda desenvolvedores a armazenar e reutilizar arquivos entre projetos.',
    },
    tech: ['Go'],
    source: 'github',
    url: 'https://github.com/fiwon123/eznit',
  },
  {
    id: 'cthrone',
    name: 'Cthrone',
    description: {
      en: 'An internal messaging tool for device-to-device communication over WebSocket or NATS.',
      'pt-BR':
        'Uma ferramenta interna de mensagens para comunicação entre dispositivos via WebSocket ou NATS.',
    },
    tech: ['Go'],
    source: 'github',
    url: 'https://github.com/fiwon123/cthrone',
  },
  {
    id: 'crower',
    name: 'Crower',
    description: {
      en: 'An internal command tool to create and run repeatable command workflows.',
      'pt-BR':
        'Uma ferramenta interna de comandos para criar e executar fluxos de comandos repetíveis.',
    },
    tech: ['Go'],
    source: 'github',
    url: 'https://github.com/fiwon123/crower',
  },
  {
    id: 'evolve-box',
    name: 'Evolve Box',
    description: {
      en: 'A small 2D life simulation built as a distributed system over WebSocket.',
      'pt-BR':
        'Uma pequena simulação de vida 2D construída como sistema distribuído sobre WebSocket.',
    },
    tech: ['Go', 'TypeScript', 'Postgres', 'Next.js', 'React'],
    source: 'private',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: {
      en: 'This site — a bilingual single-page portfolio with themes, built from scratch.',
      'pt-BR': 'Este site — um portfólio de página única, bilíngue e com temas, feito do zero.',
    },
    tech: ['TypeScript', 'React', 'Vite', 'GitHub Actions', 'GitHub Pages'],
    source: 'github',
    url: 'https://github.com/fiwon123/fiwon123.github.io',
  },
  {
    id: 'games',
    name: 'Games',
    description: {
      en: 'A handful of game jam entries and small experiments.',
      'pt-BR': 'Alguns jogos de game jam e pequenos experimentos.',
    },
    tech: ['Unity', 'Game Maker', 'Pico-8'],
    source: 'itch-io',
    url: 'https://fiwon123.itch.io/',
    gallery: Array.from({ length: 12 }, (_, i) => `/gallery/${i + 1}.png`),
  },
]
