// Tipos globais do Shello
// Define as estruturas de dados utilizadas em todo o aplicativo

/** Representa uma nota do diário do usuário */
export interface NotaDiario {
  id: string;
  conteudo: string;
  dataCriacao: string; // ISO 8601
}

/** Representa uma tarefa ou intenção do usuário */
export interface Tarefa {
  id: string;
  titulo: string;
  concluida: boolean;
  dataVencimento?: string; // ISO 8601, opcional
  dataCriacao: string;
}

/** Representa uma rotina diária */
export interface Rotina {
  id: string;
  titulo: string;
  atividades: string[];
  periodo: 'manha' | 'tarde' | 'noite';
}

/** Representa uma memória que a IA tem sobre o usuário */
export interface MemoriaIA {
  id: string;
  tipo: 'PREFERENCIA' | 'FATO' | 'OBJETIVO';
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
  tarefaSugerida?: string; // título de tarefa sugerida pela IA
}

/** Estado de formalidade da IA */
export type NivelFormalidade = 'baixa' | 'media' | 'alta';
