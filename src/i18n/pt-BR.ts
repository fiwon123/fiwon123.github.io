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
    site: 'Site',
    trailer: 'Trailer',
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
    hint: 'Digite um comando e pressione Enter. Tente `help`, `about`, `experience`, `projects`, `skills` ou `contact`.',
    placeholder: 'digite um comando…',
    prompt: 'visitante@felipeinoue ~ $',
    welcome: 'Bem-vindo. Digite `help` para listar os comandos.',
    unknown: 'comando não encontrado',
    helpTitle: 'Comandos disponíveis',
    commands: {
      help: 'Lista os comandos disponíveis',
      about: 'Quem sou eu e o que faço',
      experience: 'Onde eu trabalhei',
      projects: 'Ferramentas e projetos',
      skills: 'Linguagens, dados e ferramentas',
      contact: 'Como falar comigo',
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
    backToTop: 'Voltar ao topo',
  },
}
