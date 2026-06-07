// Design Tokens do Shello — Sage Theme
// Todos os valores visuais do app devem referenciar este arquivo

export const ShelloTema = {
  // ─── Cores ────────────────────────────────────────────────────────────────
  cores: {
    /** Creme/Off-white suave — fundo geral do app */
    fundo: '#F7F6F0',
    /** Branco puro — cards, inputs e modais */
    superficie: '#FFFFFF',
    /** Verde floresta escuro — títulos e textos principais */
    textoP: '#2D3A32',
    /** Cinza neutro — legendas, placeholders e metadados */
    textoS: '#6C757D',
    /** Verde Sálvia oficial da tartaruga Shello */
    marca: '#5E836A',
    /** Verde clarinho — badges ativos (streaks) */
    marcaClaro: '#D6E2D8',
    /** Salmão/Terracota suave — CTAs secundários */
    terracota: '#EADCD6',
    /** Vermelho padrão — atrasos ou exclusões */
    erro: '#DC3545',
  },

  // ─── Tipografia ───────────────────────────────────────────────────────────
  tipografia: {
    /** Família serif para títulos e saudações */
    titulo: 'serif',
    /** Família sans-serif padrão para corpo de texto */
    corpo: 'Roboto',
    /** Tamanhos de fonte padronizados */
    tamanhos: {
      gigante: 32,
      grande: 28,
      medio: 20,
      normal: 16,
      pequeno: 14,
      minusculo: 12,
    },
    /** Pesos de fonte */
    pesos: {
      regular: '400' as const,
      medio: '500' as const,
      negrito: '700' as const,
    },
    /** Altura de linha padrão para conforto ocular */
    alturaLinha: 22,
  },

  // ─── Formas & Espaçamento ─────────────────────────────────────────────────
  forma: {
    /** Cards e botões principais */
    bordaGrande: 32,
    /** Cards intermediários e balões de chat */
    bordaMedia: 24,
    /** Micro-cards e badges */
    bordaPequena: 16,
    /** Botões pill e inputs */
    bordaPill: 50,
  },

  espacamento: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // ─── Sombras ──────────────────────────────────────────────────────────────
  sombra: {
    suave: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    media: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

export type ShelloTemaType = typeof ShelloTema;
