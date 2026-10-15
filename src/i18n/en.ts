/**
 * English is the source of truth for every UI string. `Strings` is derived
 * from this object, and `pt-BR.ts` is typed against it — so a key added here
 * and not there fails `tsc`.
 */
export const en = {
  meta: {
    title: 'Felipe Inoue',
    description:
      'Felipe Inoue — backend and developer-tooling engineer. A games background, now building services, automation and the tools teams run on.',
  },
  nav: {
    about: 'About',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    contact: 'Contact',
  },
  hero: {
    greeting: "Hi, I'm Felipe Inoue",
    headline: 'Backend & developer tooling',
    stack: 'Go · Python · TypeScript · Docker',
  },
  sections: {
    about: 'About',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    contact: 'Contact',
  },
  labels: {
    company: 'Company',
    role: 'Role',
    tech: 'Tech',
    description: 'Description',
    source: 'Source',
    link: 'Link',
    private: 'Private',
  },
  theme: {
    label: 'Theme',
    modeLabel: 'Appearance',
    presets: { studio: 'Studio', paper: 'Paper', terminal: 'Terminal' },
    modes: { light: 'Light', dark: 'Dark', system: 'System' },
  },
  language: {
    label: 'Language',
    en: 'English',
    'pt-BR': 'Português (Brasil)',
  },
  preferences: {
    label: 'Preferences',
  },
  terminal: {
    label: 'Terminal',
    hint: 'Type a command and press Enter. Try `help`, `about`, `projects`, `skills` or `contact`.',
    placeholder: 'type a command…',
    unknown: 'command not found',
    show: 'Show terminal',
    hide: 'Hide terminal',
  },
  footer: {
    rights: 'All rights reserved.',
    builtWith: 'Built from scratch with React, TypeScript and Vite.',
    source: 'Source code',
  },
  a11y: {
    skipToContent: 'Skip to content',
  },
}

export type Strings = typeof en
