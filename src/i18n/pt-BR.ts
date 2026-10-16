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
    avatarAlt: 'Retrato de Felipe Inoue',
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
    stars: 'Estrelas',
    updated: 'Atualizado',
    games: 'Jogos',
    gamePage: 'Página do jogo',
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
    show: 'Mostrar terminal',
    hide: 'Ocultar terminal',
    hint: 'Digite um comando e pressione Enter. Tente `about`, `experience`, `projects`, `skills`, `contact` ou `all`.',
    placeholder: 'digite um comando…',
    prompt: 'visitante@portfolio ~ $',
    welcome: 'Bem-vindo. Digite `help` para listar os comandos.',
    unknown: 'comando não encontrado',
    helpTitle: 'Comandos disponíveis',
    all: 'Todas as seções',
    commands: {
      help: 'Lista os comandos disponíveis',
      about: 'Quem sou eu e o que faço',
      experience: 'Onde eu trabalhei',
      projects: 'Ferramentas e projetos',
      skills: 'Linguagens, dados e ferramentas',
      contact: 'Como falar comigo',
      all: 'Mostrar todas as seções',
      theme: 'Escolhe o tema de cores',
      mode: 'Escolhe claro, escuro ou sistema',
      lang: 'Escolhe o idioma',
      clear: 'Limpa a saída',
    },
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
