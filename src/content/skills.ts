import type { SkillGroup } from './types'

export const skills: SkillGroup[] = [
  {
    id: 'languages',
    label: { en: 'Languages', 'pt-BR': 'Linguagens' },
    items: [
      {
        name: 'Go',
        url: 'https://go.dev/',
        blurb: {
          en: 'Backend services and CLIs, with goroutines and channels for concurrency.',
          'pt-BR': 'Serviços de backend e CLIs, com goroutines e canais para concorrência.',
        },
      },
      {
        name: 'Python',
        url: 'https://www.python.org/',
        blurb: {
          en: 'Scripting, automation and data tooling.',
          'pt-BR': 'Scripts, automação e ferramentas de dados.',
        },
      },
      {
        name: 'TypeScript',
        url: 'https://www.typescriptlang.org/',
        blurb: {
          en: "Typed JavaScript — the language behind this site's front end.",
          'pt-BR': 'JavaScript tipado — a linguagem por trás do front-end deste site.',
        },
      },
      {
        name: 'C#',
        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/',
        blurb: {
          en: 'Strongly typed language for .NET services and Unity.',
          'pt-BR': 'Linguagem fortemente tipada para serviços .NET e Unity.',
        },
      },
      {
        name: 'SQL',
        url: 'https://en.wikipedia.org/wiki/SQL',
        blurb: {
          en: 'Relational queries, schema design and migrations.',
          'pt-BR': 'Consultas relacionais, modelagem de esquema e migrações.',
        },
      },
    ],
  },
  {
    id: 'data',
    label: { en: 'Data & messaging', 'pt-BR': 'Dados e mensageria' },
    items: [
      {
        name: 'Postgres',
        url: 'https://www.postgresql.org/',
        blurb: {
          en: 'Primary relational store: schema, indexes and migrations.',
          'pt-BR': 'Banco relacional principal: esquema, índices e migrações.',
        },
      },
      {
        name: 'Redis',
        url: 'https://redis.io/',
        blurb: {
          en: 'Caching, rate limiting and lightweight queues.',
          'pt-BR': 'Cache, limitação de taxa e filas leves.',
        },
      },
      {
        name: 'NATS',
        url: 'https://nats.io/',
        blurb: {
          en: 'Publish/subscribe messaging between services.',
          'pt-BR': 'Mensageria publish/subscribe entre serviços.',
        },
      },
      {
        name: 'WebSocket',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
        blurb: {
          en: 'Realtime, bidirectional channels for live sessions.',
          'pt-BR': 'Canais bidirecionais em tempo real para sessões ao vivo.',
        },
      },
    ],
  },
  {
    id: 'tooling',
    label: { en: 'Tooling & infra', 'pt-BR': 'Ferramentas e infra' },
    items: [
      {
        name: 'Git',
        url: 'https://git-scm.com/',
        blurb: {
          en: 'Version control, branching and history hygiene.',
          'pt-BR': 'Controle de versão, ramificação e histórico limpo.',
        },
      },
      {
        name: 'Docker',
        url: 'https://www.docker.com/',
        blurb: {
          en: 'Reproducible images and local development containers.',
          'pt-BR': 'Imagens reproduzíveis e contêineres de desenvolvimento local.',
        },
      },
      {
        name: 'GitHub Actions',
        url: 'https://github.com/features/actions',
        blurb: {
          en: 'CI/CD: tests, checks and deploys on every change.',
          'pt-BR': 'CI/CD: testes, verificações e deploys a cada mudança.',
        },
      },
      {
        name: 'Nginx',
        url: 'https://nginx.org/',
        blurb: {
          en: 'Reverse proxy, TLS and static file serving.',
          'pt-BR': 'Proxy reverso, TLS e entrega de arquivos estáticos.',
        },
      },
      {
        name: 'GNU Make',
        url: 'https://www.gnu.org/software/make/',
        blurb: {
          en: "The task runner behind this repo's `make` targets.",
          'pt-BR': 'O executor de tarefas por trás dos alvos `make` deste repositório.',
        },
      },
      {
        name: 'Linux',
        url: 'https://www.kernel.org/',
        blurb: {
          en: 'Daily driver and the target for everything I ship.',
          'pt-BR': 'Sistema do dia a dia e alvo de tudo o que entrego.',
        },
      },
    ],
  },
  {
    id: 'game-dev',
    label: { en: 'Game development', 'pt-BR': 'Desenvolvimento de jogos' },
    items: [
      {
        name: 'Unity',
        url: 'https://unity.com/',
        blurb: {
          en: 'Shipped titles: gameplay, tools and editor extensions.',
          'pt-BR': 'Jogos publicados: gameplay, ferramentas e extensões de editor.',
        },
      },
      {
        name: 'C#',
        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/',
        blurb: {
          en: 'Gameplay and tooling code across Unity projects.',
          'pt-BR': 'Código de gameplay e ferramentas nos projetos Unity.',
        },
      },
      {
        name: 'URP / HDRP',
        url: 'https://unity.com/srp',
        blurb: {
          en: 'Scriptable Render Pipelines tuned for each target.',
          'pt-BR': 'Scriptable Render Pipelines ajustados para cada plataforma.',
        },
      },
      {
        name: 'BepInEx modding',
        url: 'https://github.com/BepInEx/BepInEx',
        blurb: {
          en: 'Plugin and patch development for Unity games.',
          'pt-BR': 'Desenvolvimento de plugins e patches para jogos Unity.',
        },
      },
    ],
  },
]
