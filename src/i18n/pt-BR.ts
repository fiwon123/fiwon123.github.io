import type { Strings } from './en'

/**
 * Brazilian Portuguese. Typed as `Strings`, so every key in `en.ts` must
 * appear here (and nothing extra may).
 */
export const ptBR: Strings = {
  meta: {
    title: 'Felipe Inoue',
    description:
      'Felipe Inoue — engenheiro de backend e ferramentas para desenvolvedores. Vindo do desenvolvimento de jogos, hoje construo serviços, automações e as ferramentas do dia a dia dos times.',
  },
  nav: {
    about: 'Sobre',
    experience: 'Experiência',
    projects: 'Projetos',
    skills: 'Habilidades',
    contact: 'Contato',
  },
  hero: {
    greeting: 'Olá, eu sou Felipe Inoue',
    headline: 'Backend e ferramentas para desenvolvedores',
    stack: 'Go · Python · TypeScript · Docker',
  },
  sections: {
    about: 'Sobre',
    experience: 'Experiência',
    projects: 'Projetos',
    skills: 'Habilidades',
    contact: 'Contato',
  },
  labels: {
    company: 'Empresa',
    role: 'Cargo',
    tech: 'Tecnologias',
    description: 'Descrição',
    source: 'Fonte',
    link: 'Link',
    private: 'Privado',
  },
  theme: {
    label: 'Tema',
    modeLabel: 'Aparência',
    presets: { studio: 'Studio', paper: 'Paper', terminal: 'Terminal' },
    modes: { light: 'Claro', dark: 'Escuro', system: 'Sistema' },
  },
  language: {
    label: 'Idioma',
    en: 'English',
    'pt-BR': 'Português (Brasil)',
  },
  preferences: {
    label: 'Preferências',
  },
  terminal: {
    label: 'Terminal',
    hint: 'Digite um comando e pressione Enter. Tente `help`, `about`, `projects`, `skills` ou `contact`.',
    placeholder: 'digite um comando…',
    unknown: 'comando não encontrado',
    show: 'Mostrar terminal',
    hide: 'Ocultar terminal',
  },
  footer: {
    rights: 'Todos os direitos reservados.',
    builtWith: 'Feito do zero com React, TypeScript e Vite.',
    source: 'Código-fonte',
  },
  a11y: {
    skipToContent: 'Ir para o conteúdo',
  },
}
