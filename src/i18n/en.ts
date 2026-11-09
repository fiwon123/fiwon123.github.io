/**
 * English (United States) is the source of truth for every UI string. `Strings`
 * is derived from this object, and `pt-BR.ts` is typed against it — so a key
 * added here and not there fails `tsc`.
 */
export const enUS = {
  meta: {
    title: 'Felipe Inoue',
    description:
      'Felipe Inoue — backend software engineer working on APIs, platform, developer tools and AI automation. A games background, now building the services and tools teams run on.',
  },
  nav: {
    about: 'About',
    experience: 'Experience',
    projects: 'Projects',
    contact: 'Contact',
  },
  hero: {
    greeting: "Hi, I'm Felipe Inoue",
    headline:
      'Backend Software Engineer | API & Platform Engineer | Developer Tools | AI Automation',
    stack: 'Go · Python · TypeScript · Docker',
    avatarAlt: 'Portrait of Felipe Inoue',
  },
  sections: {
    // The section heading, not the nav label: `nav.about` stays short so the
    // header keeps its rhythm, while the heading can say what the section is.
    about: 'About me',
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
    stars: 'Stars',
    updated: 'Updated',
    games: 'Games',
    gamePage: 'Game page',
  },
  theme: {
    label: 'Theme',
    modeLabel: 'Appearance',
    presets: {
      studio: 'Studio',
      paper: 'Paper',
      terminal: 'Terminal',
      violet: 'Violet',
      ember: 'Ember',
    },
    modes: { light: 'Light', dark: 'Dark' },
  },
  language: {
    label: 'Language',
    'en-US': 'English',
    'pt-BR': 'Português (Brasil)',
  },
  preferences: {
    label: 'Preferences',
  },
  footer: {
    rights: 'All rights reserved.',
    builtWith: 'Built from scratch with React, TypeScript and Vite.',
    source: 'Source code',
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main',
    openImage: 'Open image',
    lightbox: 'Image viewer',
    close: 'Close',
    nextImage: 'Next image',
    previousImage: 'Previous image',
    playTrailer: 'Play trailer',
    backToTop: 'Back to top',
  },
}

export type Strings = typeof enUS
