import type { Localized } from '../types'
import type { TechName } from './types'

/** A technology's official reference and a one-line bilingual description. */
export interface Technology {
  /** The technology's official site — where a `Tech:` tag points. */
  url: string
  /**
   * A short description, used as the tag's tooltip and accessible name, so the
   * visible label and what a screen reader hears come from the same record.
   */
  blurb: Localized<string>
}

/**
 * The single source of truth for every technology a card may name. Keyed by
 * `TechName`, so a name in the union with no entry here — or an entry for a name
 * that is not in the union — is a `tsc` error, never a blank tag at runtime.
 */
export const TECHNOLOGIES: Record<TechName, Technology> = {
  Go: {
    url: 'https://go.dev/',
    blurb: {
      en: 'A statically typed, compiled language for simple, reliable services.',
      'pt-BR': 'Uma linguagem compilada e estaticamente tipada para serviços simples e confiáveis.',
    },
  },
  TypeScript: {
    url: 'https://www.typescriptlang.org/',
    blurb: {
      en: 'JavaScript with static types, for safer application code.',
      'pt-BR': 'JavaScript com tipos estáticos, para um código de aplicação mais seguro.',
    },
  },
  Postgres: {
    url: 'https://www.postgresql.org/',
    blurb: {
      en: 'A powerful open-source relational database.',
      'pt-BR': 'Um banco de dados relacional open-source poderoso.',
    },
  },
  'Next.js': {
    url: 'https://nextjs.org/',
    blurb: {
      en: 'A React framework for production web apps.',
      'pt-BR': 'Um framework React para aplicações web em produção.',
    },
  },
  React: {
    url: 'https://react.dev/',
    blurb: {
      en: 'A library for building user interfaces from components.',
      'pt-BR': 'Uma biblioteca para construir interfaces de usuário com componentes.',
    },
  },
  Vite: {
    url: 'https://vite.dev/',
    blurb: {
      en: 'A fast build tool and dev server for the modern web.',
      'pt-BR': 'Uma ferramenta de build e servidor de desenvolvimento rápidos para a web moderna.',
    },
  },
  'GitHub Actions': {
    url: 'https://github.com/features/actions',
    blurb: {
      en: 'CI/CD automation that runs from your repository.',
      'pt-BR': 'Automação de CI/CD que roda a partir do seu repositório.',
    },
  },
  'GitHub Pages': {
    url: 'https://pages.github.com/',
    blurb: {
      en: 'Static site hosting straight from a repository.',
      'pt-BR': 'Hospedagem de sites estáticos direto de um repositório.',
    },
  },
  Unity: {
    url: 'https://unity.com/',
    blurb: {
      en: 'A cross-platform game engine and editor.',
      'pt-BR': 'Uma engine e editor de jogos multiplataforma.',
    },
  },
  'Game Maker': {
    url: 'https://gamemaker.io/',
    blurb: {
      en: 'A 2D game engine with its own scripting language.',
      'pt-BR': 'Uma engine de jogos 2D com linguagem de script própria.',
    },
  },
  'Pico-8': {
    url: 'https://www.lexaloffle.com/pico-8.php',
    blurb: {
      en: 'A fantasy console for small, hand-made games.',
      'pt-BR': 'Um console de fantasia para jogos pequenos e artesanais.',
    },
  },
  'C#': {
    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/',
    blurb: {
      en: 'A modern, object-oriented language for the .NET platform.',
      'pt-BR': 'Uma linguagem moderna e orientada a objetos para a plataforma .NET.',
    },
  },
  BepInEx: {
    url: 'https://github.com/BepInEx/BepInEx',
    blurb: {
      en: 'A plugin framework for Unity game mods.',
      'pt-BR': 'Um framework de plugins para mods de jogos Unity.',
    },
  },
  Python: {
    url: 'https://www.python.org/',
    blurb: {
      en: 'A readable, general-purpose scripting language.',
      'pt-BR': 'Uma linguagem de script legível e de propósito geral.',
    },
  },
  URP: {
    url: 'https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest',
    blurb: {
      en: "Unity's Universal Render Pipeline for scalable graphics.",
      'pt-BR': 'A Universal Render Pipeline da Unity para gráficos escaláveis.',
    },
  },
  HDRP: {
    url: 'https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@latest',
    blurb: {
      en: "Unity's High Definition Render Pipeline for high-fidelity visuals.",
      'pt-BR': 'A High Definition Render Pipeline da Unity para visuais de alta fidelidade.',
    },
  },
  REST: {
    url: 'https://restfulapi.net/',
    blurb: {
      en: 'An architectural style for web APIs.',
      'pt-BR': 'Um estilo arquitetural para APIs web.',
    },
  },
}
