import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'ai-document-platform',
    name: 'AI Document Platform',
    description: {
      en: 'Upload documents, extract and chunk text, generate embeddings (OpenAI or local models), search semantically with pgvector, and ask questions grounded in your documents with source attribution.',
      'pt-BR':
        'Plataforma para enviar documentos, extrair e fragmentar texto, gerar embeddings (OpenAI ou modelos locais), buscar semanticamente com pgvector e fazer perguntas com cita\u00e7\u00f5es de origem.',
    },
    tech: ['TypeScript'],
    source: 'github',
    url: 'https://github.com/fiwon123/ai-document-platform',
    repo: 'fiwon123/ai-document-platform',
  },
  {
    id: 'ai-code-evaluation-platform',
    name: 'AI Code Evaluation Platform',
    description: {
      en: 'AI code evaluation platform validates AI models using problem prompts and user-created tests.',
      'pt-BR':
        'Plataforma de avalia\u00e7\u00e3o de c\u00f3digo com IA que valida modelos usando problemas e testes criados pelo usu\u00e1rio.',
    },
    tech: ['TypeScript'],
    source: 'github',
    url: 'https://github.com/fiwon123/ai-code-evaluation-platform',
    repo: 'fiwon123/ai-code-evaluation-platform',
  },
  {
    id: 'distributed-key-value-store',
    name: 'Distributed Key-Value Store',
    description: {
      en: 'A minimal, educational distributed key-value store, built from scratch in Go with a hand-rolled Raft consensus algorithm.',
      'pt-BR':
        'Um armazenamento chave-valor distribu\u00eddo minimalista e educacional, constru\u00eddo do zero em Go com o algoritmo de consenso Raft implementado \u00e0 m\u00e3o.',
    },
    tech: ['Go'],
    source: 'github',
    url: 'https://github.com/fiwon123/distributed-key-value-store',
    repo: 'fiwon123/distributed-key-value-store',
  },
  {
    id: 'distributed-task-queue',
    name: 'Distributed Task Queue',
    description: {
      en: 'A durable, PostgreSQL-backed distributed task queue in Go \u2014 educational, built from scratch.',
      'pt-BR':
        'Uma fila de tarefas distribu\u00edda, dur\u00e1vel e com PostgreSQL, constru\u00edda do zero em Go para fins educacionais.',
    },
    tech: ['Go'],
    source: 'github',
    url: 'https://github.com/fiwon123/distributed-task-queue',
    repo: 'fiwon123/distributed-task-queue',
  },
  {
    id: 'live-chat-server',
    name: 'Live Chat Server',
    description: {
      en: 'Real-time chat with a Rust backend and a React + TypeScript client. WebSockets, JWT auth, room-based access control, and message persistence in PostgreSQL.',
      'pt-BR':
        'Chat em tempo real com backend em Rust e cliente em React + TypeScript. WebSockets, autentica\u00e7\u00e3o JWT, controle de acesso por salas e persist\u00eancia de mensagens no PostgreSQL.',
    },
    tech: ['Rust', 'TypeScript', 'React', 'Postgres'],
    source: 'github',
    url: 'https://github.com/fiwon123/live-chat-server',
    repo: 'fiwon123/live-chat-server',
  },
  {
    id: 'realtime-leaderboard',
    name: 'Realtime Leaderboard',
    description: {
      en: "A real-time leaderboard service \u2014 submit score events, read a player's rank, and page through the top of the board.",
      'pt-BR':
        'Servi\u00e7o de placar em tempo real \u2014 permite enviar pontua\u00e7\u00f5es, consultar o rank de um jogador e paginar o top do placar.',
    },
    tech: ['Rust', 'Postgres'],
    source: 'github',
    url: 'https://github.com/fiwon123/realtime-leaderboard',
    repo: 'fiwon123/realtime-leaderboard',
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
    collection: {
      url: 'https://itch.io/c/1112919/my-game-jams',
      label: {
        en: 'My game jams',
        'pt-BR': 'Meus game jams',
      },
    },
  },
]
