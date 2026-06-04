// TelaTarefas.tsx — Tela de gerenciamento de tarefas e rotinas diárias do Shello
// Inclui lista de tarefas com checkbox animado, modal de criação e cards de rotina

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { Tarefa } from '../types';

// ─── Utilitário: verifica se uma tarefa está atrasada ────────────────────────

function estaAtrasada(tarefa: Tarefa): boolean {
  if (!tarefa.dataVencimento || tarefa.concluida) return false;
  const vencimento = new Date(tarefa.dataVencimento);
  const agora = new Date();
  return vencimento < agora;
}

// ─── Componente: ItemTarefa (com animação de conclusão) ──────────────────────

interface ItemTarefaProps {
  tarefa: Tarefa;
  onAlternar: (id: string) => void;
}

function ItemTarefa({ tarefa, onAlternar }: ItemTarefaProps): React.JSX.Element {
  // Animação de opacidade ao concluir a tarefa
  const opacidade = useRef(new Animated.Value(tarefa.concluida ? 0.4 : 1)).current;

  // Atualiza a animação sempre que o estado 'concluida' muda
  useEffect(() => {
    Animated.timing(opacidade, {
      toValue: tarefa.concluida ? 0.4 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tarefa.concluida, opacidade]);

  const atrasada = estaAtrasada(tarefa);

  return (
    <Animated.View
      style={[
        estilos.cardTarefa,
        // Borda esquerda vermelha para tarefas atrasadas
        atrasada && estilos.cardTarefaAtrasada,
        { opacity: opacidade },
      ]}
    >
      {/* Checkbox circular esquerdo */}
      <TouchableOpacity
        onPress={() => onAlternar(tarefa.id)}
        style={[
          estilos.checkbox,
          tarefa.concluida && estilos.checkboxConcluido,
        ]}
        activeOpacity={0.7}
      >
        {tarefa.concluida && (
          <Feather name="check" size={14} color={ShelloTema.cores.superficie} />
        )}
      </TouchableOpacity>

      {/* Texto e metadados da tarefa */}
      <View style={estilos.tarefaConteudo}>
        <Text
          style={[
            estilos.tarefaTitulo,
            tarefa.concluida && estilos.tarefaTituloConcluida,
          ]}
          numberOfLines={2}
        >
          {tarefa.titulo}
        </Text>
        {atrasada && (
          <View style={estilos.badgeAtrasada}>
            <Feather name="clock" size={11} color={ShelloTema.cores.erro} />
            <Text style={estilos.badgeAtrasadaTexto}>Atrasada</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Componente: ModalNovaTarefa ─────────────────────────────────────────────

interface ModalNovaTarefaProps {
  visivel: boolean;
  onFechar: () => void;
  onAdicionar: (titulo: string) => void;
}

function ModalNovaTarefa({
  visivel,
  onFechar,
  onAdicionar,
}: ModalNovaTarefaProps): React.JSX.Element {
  const [titulo, setTitulo] = useState('');

  // Limpa o campo ao fechar o modal
  const handleFechar = useCallback(() => {
    setTitulo('');
    onFechar();
  }, [onFechar]);

  const handleAdicionar = useCallback(() => {
    const tituloTrimado = titulo.trim();
    if (!tituloTrimado) return;
    onAdicionar(tituloTrimado);
    setTitulo('');
    onFechar();
  }, [titulo, onAdicionar, onFechar]);

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      transparent
      onRequestClose={handleFechar}
    >
      <KeyboardAvoidingView
        style={estilos.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Toque fora fecha o modal */}
        <TouchableOpacity
          style={estilos.modalFundo}
          activeOpacity={1}
          onPress={handleFechar}
        />
        <View style={estilos.modalConteudo}>
          {/* Alça de arrasto (decorativa) */}
          <View style={estilos.modalAlca} />

          <Text style={estilos.modalTitulo}>Nova Intenção</Text>
          <Text style={estilos.modalSubtitulo}>
            Qual tarefa ou ritual você quer adicionar à sua jornada?
          </Text>

          {/* Campo de texto para título */}
          <TextInput
            style={estilos.modalInput}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Meditar por 10 minutos..."
            placeholderTextColor={ShelloTema.cores.textoS}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdicionar}
            maxLength={100}
          />

          {/* Botões de ação */}
          <View style={estilos.modalBotoes}>
            <TouchableOpacity
              style={estilos.botaoCancelarModal}
              onPress={handleFechar}
              activeOpacity={0.8}
            >
              <Text style={estilos.botaoCancelarModalTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                estilos.botaoAdicionarModal,
                !titulo.trim() && estilos.botaoAdicionarModalDesabilitado,
              ]}
              onPress={handleAdicionar}
              activeOpacity={0.85}
              disabled={!titulo.trim()}
            >
              <Feather
                name="plus"
                size={16}
                color={ShelloTema.cores.superficie}
              />
              <Text style={estilos.botaoAdicionarModalTexto}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Componente: CardRotina ───────────────────────────────────────────────────

interface CardRotinaProps {
  corFundo: string;
  icone: keyof typeof Feather.glyphMap;
  titulo: string;
  atividades: string[];
}

function CardRotina({
  corFundo,
  icone,
  titulo,
  atividades,
}: CardRotinaProps): React.JSX.Element {
  return (
    <View style={[estilos.cardRotina, { backgroundColor: corFundo }]}>
      {/* Ícone e título em linha */}
      <View style={estilos.cardRotinaCabecalho}>
        <View style={estilos.cardRotinaIconeWrapper}>
          <Feather name={icone} size={22} color={ShelloTema.cores.marca} />
        </View>
        <Text style={estilos.cardRotinaTitulo}>{titulo}</Text>
      </View>
      {/* Lista de atividades */}
      <View style={estilos.cardRotinaLista}>
        {atividades.map((atividade, indice) => (
          <Text key={indice} style={estilos.cardRotinaAtividade}>
            {atividade}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Tela Principal: TelaTarefas ─────────────────────────────────────────────

export default function TelaTarefas(): React.JSX.Element {
  const { tarefas, adicionarTarefa, alternarTarefa } = useShello();
  const [modalVisivel, setModalVisivel] = useState(false);

  // ── Adiciona nova tarefa via modal ────────────────────────────────────────
  const handleAdicionarTarefa = useCallback(
    async (titulo: string) => {
      await adicionarTarefa(titulo);
    },
    [adicionarTarefa]
  );

  // ── Alterna status de conclusão ───────────────────────────────────────────
  const handleAlternarTarefa = useCallback(
    async (id: string) => {
      await alternarTarefa(id);
    },
    [alternarTarefa]
  );

  return (
    <SafeAreaView style={estilos.safeArea}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho da tela ──────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.tituloPrincipal}>Sua Jornada</Text>
          <Text style={estilos.subtituloPrincipal}>
            Organize suas intenções e rituais diários
          </Text>
        </View>

        {/* ── Seção: Foco de Hoje ─────────────────────────────────────── */}
        <View style={estilos.secao}>
          {/* Cabeçalho da seção com botão de adicionar */}
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Foco de Hoje</Text>
            <TouchableOpacity
              style={estilos.botaoAdicionar}
              onPress={() => setModalVisivel(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={20} color={ShelloTema.cores.marca} />
            </TouchableOpacity>
          </View>

          {/* Lista de tarefas ou estado vazio */}
          {tarefas.length === 0 ? (
            <View style={estilos.estadoVazio}>
              <Text style={estilos.estadoVazioTexto}>
                Nenhuma tarefa ainda. Adicione sua primeira intenção! 🌱
              </Text>
            </View>
          ) : (
            <View style={estilos.listaTarefas}>
              {tarefas.map((tarefa) => (
                <ItemTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  onAlternar={handleAlternarTarefa}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Seção: Rotinas Diárias ──────────────────────────────────── */}
        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Rotinas Diárias</Text>
          <View style={estilos.listaRotinas}>
            {/* Rotina da manhã — fundo verde suave */}
            <CardRotina
              corFundo="#EEF4F0"
              icone="sun"
              titulo="Rotina da Manhã"
              atividades={[
                '• Acordar às 7h',
                '• Meditação de 10min',
                '• Escrever no diário',
              ]}
            />
            {/* Rotina do meio-dia — fundo terracota */}
            <CardRotina
              corFundo={ShelloTema.cores.terracota}
              icone="coffee"
              titulo="Recarga do Meio-dia"
              atividades={[
                '• Pausa ativa de 5min',
                '• Beber água',
                '• Revisão das tarefas',
              ]}
            />
          </View>
        </View>

        {/* Espaço extra no final do scroll */}
        <View style={estilos.espacoFinal} />
      </ScrollView>

      {/* ── Modal de nova tarefa ─────────────────────────────────────── */}
      <ModalNovaTarefa
        visivel={modalVisivel}
        onFechar={() => setModalVisivel(false)}
        onAdicionar={handleAdicionarTarefa}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // ── Estrutura base ────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ShelloTema.espacamento.lg,
  },

  // ── Cabeçalho da tela ─────────────────────────────────────────────────────
  cabecalho: {
    paddingTop: ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.lg,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
    letterSpacing: 0.3,
  },
  subtituloPrincipal: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    lineHeight: 20,
  },

  // ── Seções ────────────────────────────────────────────────────────────────
  secao: {
    marginBottom: ShelloTema.espacamento.xl,
  },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ShelloTema.espacamento.md,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ShelloTema.cores.textoP,
    letterSpacing: 0.2,
  },
  // Botão circular '+' com fundo terracota
  botaoAdicionar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ShelloTema.cores.terracota,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Lista de tarefas ──────────────────────────────────────────────────────
  listaTarefas: {
    gap: ShelloTema.espacamento.sm,
  },

  // ── Card de tarefa individual ─────────────────────────────────────────────
  cardTarefa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.md,
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  // Indicador de atraso: borda esquerda vermelha
  cardTarefaAtrasada: {
    borderLeftWidth: 4,
    borderLeftColor: ShelloTema.cores.erro,
  },

  // ── Checkbox circular ─────────────────────────────────────────────────────
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
    flexShrink: 0,
  },
  checkboxConcluido: {
    backgroundColor: ShelloTema.cores.marca,
    borderColor: ShelloTema.cores.marca,
  },

  // ── Conteúdo textual da tarefa ────────────────────────────────────────────
  tarefaConteudo: {
    flex: 1,
  },
  tarefaTitulo: {
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    lineHeight: 21,
    fontWeight: '500',
  },
  tarefaTituloConcluida: {
    color: ShelloTema.cores.textoS,
    textDecorationLine: 'line-through',
  },

  // ── Badge de tarefa atrasada ──────────────────────────────────────────────
  badgeAtrasada: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ShelloTema.espacamento.xs,
    gap: 3,
  },
  badgeAtrasadaTexto: {
    fontSize: 11,
    color: ShelloTema.cores.erro,
    fontWeight: '600',
  },

  // ── Estado vazio da lista ─────────────────────────────────────────────────
  estadoVazio: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.xl,
    alignItems: 'center',
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  estadoVazioTexto: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Lista de rotinas ──────────────────────────────────────────────────────
  listaRotinas: {
    gap: ShelloTema.espacamento.md,
    marginTop: ShelloTema.espacamento.md,
  },

  // ── Card de rotina ────────────────────────────────────────────────────────
  cardRotina: {
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.xl,
  },
  cardRotinaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  // Círculo branco 44px com ícone
  cardRotinaIconeWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ShelloTema.cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
    // Sombra leve no ícone
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRotinaTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ShelloTema.cores.textoP,
    flex: 1,
    letterSpacing: 0.2,
  },
  cardRotinaLista: {
    gap: ShelloTema.espacamento.sm,
  },
  cardRotinaAtividade: {
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    lineHeight: 21,
  },

  // ── Modal de nova tarefa ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalConteudo: {
    backgroundColor: ShelloTema.cores.superficie,
    borderTopLeftRadius: ShelloTema.forma.bordaGrande,
    borderTopRightRadius: ShelloTema.forma.bordaGrande,
    padding: ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.xxl,
  },
  // Alça decorativa do modal
  modalAlca: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignSelf: 'center',
    marginBottom: ShelloTema.espacamento.lg,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
    letterSpacing: 0.2,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    marginBottom: ShelloTema.espacamento.lg,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPequena,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.md,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.lg,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
    lineHeight: 22,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
  },
  botaoCancelarModal: {
    flex: 1,
    paddingVertical: ShelloTema.espacamento.md,
    borderRadius: ShelloTema.forma.bordaMedia,
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.fundo,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
  },
  botaoCancelarModalTexto: {
    fontSize: 15,
    color: ShelloTema.cores.textoS,
    fontWeight: '600',
  },
  botaoAdicionarModal: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: ShelloTema.espacamento.md,
    borderRadius: ShelloTema.forma.bordaMedia,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.marca,
    gap: ShelloTema.espacamento.sm,
    // Sombra do botão principal
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  botaoAdicionarModalDesabilitado: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    shadowOpacity: 0,
    elevation: 0,
  },
  botaoAdicionarModalTexto: {
    fontSize: 15,
    color: ShelloTema.cores.superficie,
    fontWeight: '700',
  },

  // ── Espaço final do scroll ────────────────────────────────────────────────
  espacoFinal: {
    height: ShelloTema.espacamento.xl,
  },
});
