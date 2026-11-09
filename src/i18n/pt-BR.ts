import type { Strings } from './en'

/**
 * Brazilian Portuguese. Typed as `Strings`, so every key in `en.ts` must
 * appear here (and nothing extra may).
 */
export const ptBR: Strings = {
  meta: {
    title: 'Felipe Inoue',
    description:
      'Felipe Inoue — engenheiro de software backend, com foco em APIs, plataforma, ferramentas para desenvolvedores e automação com IA. Vindo do desenvolvimento de jogos, hoje construo os serviços e as ferramentas do dia a dia dos times.',
  },
  nav: {
    about: 'Sobre',
    experience: 'Experiência',
    projects: 'Projetos',
    contact: 'Contato',
  },
  hero: {
    greeting: 'Olá, eu sou Felipe Inoue',
    headline:
      'Engenheiro de Software Backend | Engenheiro de APIs e Plataforma | Ferramentas para Desenvolvedores | Automação com IA',
    stack: 'Go · Python · TypeScript · Docker',
    avatarAlt: 'Retrato de Felipe Inoue',
  },
  sections: {
    // The section heading, not the nav label — see the note in `en.ts`.
    about: 'Sobre mim',
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
    stars: 'Estrelas',
    updated: 'Atualizado',
    games: 'Jogos',
    gamePage: 'Página do jogo',
  },
  theme: {
    label: 'Tema',
    modeLabel: 'Aparência',
    presets: {
      studio: 'Studio',
      paper: 'Paper',
      terminal: 'Terminal',
      violet: 'Violeta',
      ember: 'Brasa',
    },
    modes: { light: 'Claro', dark: 'Escuro' },
  },
  language: {
    label: 'Idioma',
    'en-US': 'English',
    'pt-BR': 'Português (Brasil)',
  },
  preferences: {
    label: 'Preferências',
  },
  footer: {
    rights: 'Todos os direitos reservados.',
    builtWith: 'Feito do zero com React, TypeScript e Vite.',
    source: 'Código-fonte',
  },
  a11y: {
    skipToContent: 'Pular para o conteúdo',
    mainNav: 'Principal',
    openImage: 'Abrir imagem',
    lightbox: 'Visualizador de imagens',
    close: 'Fechar',
    nextImage: 'Próxima imagem',
    previousImage: 'Imagem anterior',
    playTrailer: 'Reproduzir trailer',
    backToTop: 'Voltar ao topo',
  },
}
