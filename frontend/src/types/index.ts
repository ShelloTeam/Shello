// Tipos globais do Shello v2
// Define as estruturas de dados utilizadas em todo o aplicativo

/** Representa uma entrada do diário do usuário */
export interface EntradaDiario {
  id: string;
  titulo: string;
  conteudo: string;
  dataCriacao: string; // ISO 8601
  adicionadaAoContexto: boolean;
}

/** Representa uma tarefa ou intenção do usuário */
export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  concluida: boolean;
  data?: string; // Data escolhida pelo usuário — ISO 8601
  dataCriacao: string;
}

/** Representa uma rotina diária criada pelo usuário */
export interface Rotina {
  id: string;
  titulo: string;
  atividades: string[];
  periodo: 'manha' | 'tarde' | 'noite';
}

/** Representa uma memória que a IA tem sobre o usuário */
export interface MemoriaIA {
  id: string;
  tipo: 'PREFERENCIA' | 'FATO' | 'OBJETIVO' | 'HABITO' | 'CONTEXTO' | 'RELACIONAMENTO';
  conteudo: string;
  dataCriacao: string;
}

/** Dados coletados no onboarding */
export interface DadosOnboarding {
  nome: string;
  estiloDeVida: string;
  metaAtual: string;
}

/** Mensagem de chat com a IA */
export interface MensagemChat {
  id: string;
  remetente: 'usuario' | 'ia';
  conteudo: string;
  horario: string; // ex: "10:30"
  expressao?: 'neutro' | 'duvidoso' | 'surpreso' | 'feliz'; // expressão do mascote
}

/** Estado de formalidade da IA */
export type NivelFormalidade = 'baixa' | 'media' | 'alta';

/** Expressões disponíveis do mascote Shello */
export type ExpressaoShello = 'neutro' | 'duvidoso' | 'surpreso' | 'feliz';
