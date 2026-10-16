import type { ExperienceEntry } from './types'

export const experience: ExperienceEntry[] = [
  {
    id: 'little-leo-games',
    company: 'Little Leo Games',
    logo: '/companies/little_leo_games.jpg',
    role: { en: 'Unity Developer', 'pt-BR': 'Desenvolvedor Unity' },
    period: { en: 'Oct. 2022 – Jul. 2024', 'pt-BR': 'Out. 2022 – Jul. 2024' },
    summary: {
      en: 'Indie team behind **Astrea: Six-Sided Oracles** — gameplay systems, platform releases, and post-launch support.',
      'pt-BR':
        'Time indie por trás de **Astrea: Six-Sided Oracles** — sistemas de gameplay, lançamentos em plataformas e suporte pós-lançamento.',
    },
    highlights: {
      en: [
        'Ported the game to {xbox}',
        'Built UI systems and the {steam} integration',
        'Fixed gameplay and production bugs across development and release',
        'Worked with players to identify issues and ship better fixes',
        'Planned and coordinated delivery with the team through launch',
        'Supported Steam modding with BepInEx and wrote Python scripts for mod workflows',
        'Shipped to {gog} and {epic}',
      ],
      'pt-BR': [
        'Port do jogo para {xbox}',
        'Construção de sistemas de UI e da integração com a {steam}',
        'Correção de bugs de gameplay durante desenvolvimento e pós-lançamento',
        'Contato com jogadores para identificar problemas e melhorar as correções',
        'Planejamento e coordenação das entregas com o time até o lançamento',
        'Suporte a mods na Steam com BepInEx e scripts em Python para o fluxo de mods',
        'Lançamento em {gog} e {epic}',
      ],
    },
    platforms: [
      { name: 'steam', url: 'https://store.steampowered.com/app/1755830/Astrea_SixSided_Oracles/' },
      {
        name: 'xbox',
        url: 'https://www.xbox.com/en-US/games/store/astrea-six-sided-oracles/9PB4BBK7C5J9',
      },
      { name: 'gog', url: 'https://www.gog.com/en/game/astrea_sixsided_oracles' },
      { name: 'epic', url: 'https://store.epicgames.com/p/astrea-six-sided-oracles-33c949' },
    ],
    gallery: ['/projects/astrea.jpg'],
    tech: ['Unity', 'C#', 'BepInEx', 'Python'],
  },
  {
    id: 'vr-monkey',
    company: 'VR Monkey',
    logo: '/companies/vr_monkey.jpg',
    role: { en: 'Unity Developer (VR)', 'pt-BR': 'Desenvolvedor Unity (VR)' },
    period: { en: 'Nov. 2020 – Apr. 2023', 'pt-BR': 'Nov. 2020 – Abr. 2023' },
    summary: {
      en: 'Porting and tools developer for VR titles — cross-platform compatibility, build pipelines, and internal tooling.',
      'pt-BR':
        'Desenvolvedor de porting e ferramentas para títulos VR — compatibilidade entre plataformas, pipelines de build e ferramentas internas.',
    },
    highlights: {
      en: [
        'Ported VR games to {sony} PSVR / PSVR2 and other headsets',
        'Built internal tools that sped up build and platform-switching workflows',
        'Worked with shaders and rendering pipelines (URP / HDRP)',
        'Optimised performance and memory across VR projects',
        'Maintained production codebases and documented systems and troubleshooting',
        'Git workflows (TortoiseGit, Git Bash, SourceTree); tasks in Trello and HacknPlan',
      ],
      'pt-BR': [
        'Port de jogos VR para {sony} PSVR / PSVR2 e outros dispositivos',
        'Desenvolvimento de ferramentas internas para acelerar builds e troca de plataforma',
        'Trabalho com shaders e pipelines de renderização (URP / HDRP)',
        'Otimização de performance e memória em projetos VR',
        'Manutenção de código em produção e documentação de sistemas e troubleshooting',
        'Fluxos com Git (TortoiseGit, Git Bash, SourceTree); tarefas no Trello e HacknPlan',
      ],
    },
    games: [
      {
        name: 'Nock',
        site: 'https://nock.game/',
        trailer: 'https://www.youtube.com/watch?v=IRILqp3Og9k',
        image: '/projects/nock.jpg',
      },
      {
        name: 'Virtuoso',
        site: 'https://virtuoso-vr.com/',
        trailer: 'https://www.youtube.com/watch?v=KspO4huy7ek',
        image: '/projects/virtuoso.jpg',
      },
      {
        name: 'Museum Multiverse',
        site: 'https://hessvacio.com/pages/museummultiverse.html',
        trailer: 'https://www.youtube.com/watch?v=MF46EPlngic',
        image: '/projects/museum_multiverse.jpg',
      },
      {
        name: 'Windlands 2',
        site: 'https://www.psytecgames.com/press/windlands2-presskit',
        trailer: 'https://www.youtube.com/watch?v=308qTj-oEJg',
        image: '/projects/windlands2.jpg',
      },
      {
        name: 'Yuki',
        site: 'https://yukivrgame.com/',
        trailer: 'https://www.youtube.com/watch?v=M1Bo_CRD1zU',
        image: '/projects/yuki.jpg',
      },
      {
        name: 'Gadgeteer',
        site: 'https://metanautlabs.com/projects/gadgeteer/',
        trailer: 'https://www.youtube.com/watch?v=c3LJWGcCqD4',
        image: '/projects/gadgeteer.jpg',
      },
    ],
    tech: ['Unity', 'C#', 'URP', 'HDRP'],
  },
  {
    id: 'ilex-games',
    company: 'Ilex Games',
    logo: '/companies/ilex_games.jpg',
    role: { en: 'Unity Developer', 'pt-BR': 'Desenvolvedor Unity' },
    period: { en: 'Jun. 2020 – Aug. 2020', 'pt-BR': 'Jun. 2020 – Ago. 2020' },
    summary: {
      en: 'Mobile game support and optimisation — bug fixing, performance, and automation.',
      'pt-BR': 'Suporte e otimização de jogos mobile — correções, performance e automação.',
    },
    highlights: {
      en: [
        'Fixed issues and improved performance in a Unity mobile game',
        'Prepared and adapted builds for mobile platforms',
        'Standardised UI and gameplay behaviour across systems',
        'Wrote a Python script to extract and format game dialogue for the dialogue system',
        'Applied project rules and logic to keep development consistent',
      ],
      'pt-BR': [
        'Correção de bugs e melhoria de performance em um jogo mobile em Unity',
        'Preparação e exportação de builds para plataformas mobile',
        'Padronização de UI e comportamentos de gameplay entre sistemas',
        'Script em Python para extrair e formatar diálogos para o sistema de diálogo',
        'Aplicação das regras e da lógica do projeto para manter a consistência',
      ],
    },
    tech: ['Unity', 'C#', 'Python'],
  },
  {
    id: 'unicamp-larcom',
    company: 'Unicamp LARCOM',
    logo: '/companies/unicamp.jpg',
    role: { en: 'Unity Developer (VR)', 'pt-BR': 'Desenvolvedor Unity (VR)' },
    period: { en: 'Oct. 2019 – May. 2020', 'pt-BR': 'Out. 2019 – Mai. 2020' },
    summary: {
      en: '3D VR educational game — gameplay systems and backend integration.',
      'pt-BR': 'Jogo educacional 3D em VR — sistemas de gameplay e integração com backend.',
    },
    highlights: {
      en: [
        'Developed VR interaction features',
        'Exported builds to WebGL and mobile',
        'Integrated REST APIs for data exchange with server systems',
        'Worked in C# on core game programming logic',
      ],
      'pt-BR': [
        'Desenvolvimento de funcionalidades de interação em VR',
        'Exportação de builds para WebGL e mobile',
        'Integração de APIs REST para troca de dados com sistemas de servidor',
        'Trabalho em C# na lógica central de programação do jogo',
      ],
    },
    tech: ['Unity', 'C#', 'REST'],
  },
]
