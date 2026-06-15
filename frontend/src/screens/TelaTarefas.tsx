// TelaTarefas.tsx — Tela "Sua Jornada" do Shello
// Redesenhada conforme ui_ux.md §6 e feedbacks do usuário:
// Título serifado, pills brancas, checkbox animado, badge de atraso com borda
// lateral vermelha, cards de rotina, modal de criação com campo de data.

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
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
import { Tarefa, Rotina } from '../types';
import DialogShello from '../components/DialogShello';

// ─── Paleta extra ──────────────────────────────────────────────────────────────
const COR_ROTINA_MANHA = '#EEF4F0';    // verde-creme para rotina manhã
const COR_ROTINA_TARDE = '#EADCD6';    // salmão/terracota para rotina tarde
const COR_ROTINA_NOITE = '#E8E4F0';    // lavanda suave para rotina noite

// ─── Utilitário: verifica se uma tarefa está atrasada ─────────────────────────

function parseDateLocal(iso: string): Date {
  // "2026-06-09" → new Date(2026, 5, 9) — evita conversão UTC→local que adianta 1 dia em UTC-3
  const [year, month, day] = iso.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

function estaAtrasada(tarefa: Tarefa): boolean {
  if (!tarefa.data || tarefa.concluida) return false;
  const vencimento = parseDateLocal(tarefa.data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return vencimento < hoje;
}

// ─── Utilitário: formata data para exibição ────────────────────────────────────

function formatarData(iso: string): string {
  try {
    return parseDateLocal(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

// ─── Mapa de ícone por período de rotina ──────────────────────────────────────

function iconeRotina(periodo: Rotina['periodo']): keyof typeof Feather.glyphMap {
  switch (periodo) {
    case 'manha': return 'sunrise';
    case 'tarde':  return 'sun';
    case 'noite':  return 'moon';
    default:       return 'star';
  }
}

function corFundoRotina(periodo: Rotina['periodo']): string {
  switch (periodo) {
    case 'manha': return COR_ROTINA_MANHA;
    case 'tarde':  return COR_ROTINA_TARDE;
    case 'noite':  return COR_ROTINA_NOITE;
    default:       return ShelloTema.cores.marcaClaro;
  }
}



// ─── Componente: ItemTarefa ────────────────────────────────────────────────────

interface ItemTarefaProps {
  tarefa: Tarefa;
  onAlternar: (id: string) => void;
  onExcluir: (id: string) => void;
}

function ItemTarefa({ tarefa, onAlternar, onExcluir }: ItemTarefaProps): React.JSX.Element {
  const opacidade = useRef(new Animated.Value(tarefa.concluida ? 0.5 : 1)).current;
  const escala    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue:         tarefa.concluida ? 0.5 : 1,
      duration:        300,
      useNativeDriver: true,
    }).start();
  }, [tarefa.concluida, opacidade]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.85, duration: 80,  useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1,    duration: 130, useNativeDriver: true }),
    ]).start(() => onAlternar(tarefa.id));
  }, [escala, onAlternar, tarefa.id]);

  const atrasada = estaAtrasada(tarefa);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={() => onExcluir(tarefa.id)}
      delayLongPress={600}
    >
      <Animated.View
        style={[
          estilos.cardTarefa,
          atrasada && estilos.cardTarefaAtrasada,
          { opacity: opacidade },
        ]}
      >
        {/* Checkbox circular com micro-pulso */}
        <Animated.View style={{ transform: [{ scale: escala }] }}>
          <TouchableOpacity
            onPress={handlePress}
            style={[estilos.checkbox, tarefa.concluida && estilos.checkboxConcluido]}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: tarefa.concluida }}
          >
            {tarefa.concluida && (
              <Feather name="check" size={13} color={ShelloTema.cores.superficie} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Conteúdo */}
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

          {tarefa.descricao ? (
            <Text
              style={[
                estilos.tarefaDescricao,
                tarefa.concluida && estilos.tarefaDescricaoConcluida,
              ]}
              numberOfLines={2}
            >
              {tarefa.descricao}
            </Text>
          ) : null}

          <View style={estilos.tarefaRodape}>
            {atrasada && (
              <View style={estilos.badgeAtrasada}>
                <Feather name="alert-circle" size={11} color={ShelloTema.cores.erro} />
                <Text style={estilos.badgeAtrasadaTexto}>Atrasada</Text>
              </View>
            )}

            {tarefa.data && !atrasada && !tarefa.concluida && (
              <View style={estilos.badgeData}>
                <Feather name="calendar" size={11} color={ShelloTema.cores.marca} />
                <Text style={estilos.badgeDataTexto}>{formatarData(tarefa.data)}</Text>
              </View>
            )}

            {tarefa.concluida && (
              <View style={estilos.badgeConcluida}>
                <Feather name="check-circle" size={11} color={ShelloTema.cores.marca} />
                <Text style={estilos.badgeConcluidaTexto}>Concluída</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Componente: ModalNovaTarefa ───────────────────────────────────────────────

interface ModalNovaTarefaProps {
  visivel:    boolean;
  onFechar:   () => void;
  onAdicionar: (titulo: string, descricao?: string, data?: string) => void;
}

const formatarDataInput = (texto: string) => {
  // Remove tudo que não for número
  const numeros = texto.replace(/\D/g, '');

  let formatado = numeros;

  if (numeros.length > 2) {
    formatado = `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  if (numeros.length > 4) {
    formatado = `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
  }

  return formatado;
};

function ModalNovaTarefa({
  visivel,
  onFechar,
  onAdicionar,
}: ModalNovaTarefaProps): React.JSX.Element {
  const [titulo,    setTitulo]    = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataTexto, setDataTexto] = useState('');
  const [erroData,  setErroData]  = useState('');

  // Converte dd/mm/aaaa → ISO 8601 (AAAA-MM-DD)
  function validarDataBR(texto: string): {
    dataISO?: string;
    erro?: string;
  } {
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
      return { erro: 'Use o formato DD/MM/AAAA' };
    }

    const [, diaStr, mesStr, anoStr] = match;

    const dia = Number(diaStr);
    const mes = Number(mesStr);
    const ano = Number(anoStr);

    if (mes < 1 || mes > 12) {
      return { erro: 'Mês inválido' };
    }

    if (dia < 1 || dia > 31) {
      return { erro: 'Dia inválido' };
    }

    const data = new Date(ano, mes - 1, dia);

    const dataValida =
      data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia;

    if (!dataValida) {
      return { erro: 'Data inexistente' };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (data < hoje) {
      return {
        erro: 'Não é possível criar tarefas para datas passadas',
      };
    }

    const limiteFuturo = new Date();
    limiteFuturo.setHours(0, 0, 0, 0);
    limiteFuturo.setFullYear(limiteFuturo.getFullYear() + 150);

    if (data > limiteFuturo) {
      return {
        erro: 'A data está muito distante no futuro',
      };
    }

    return {
      dataISO: `${anoStr}-${mesStr}-${diaStr}`,
    };
  }

  const handleFechar = useCallback(() => {
    setTitulo('');
    setDescricao('');
    setDataTexto('');
    setErroData('');
    onFechar();
  }, [onFechar]);

  const handleAdicionar = useCallback(() => {
    const tituloTrimado = titulo.trim();

    if (!tituloTrimado) return;

    let dataISO: string | undefined;

    if (dataTexto.trim()) {
      const resultado = validarDataBR(dataTexto.trim());

      if (resultado.erro) {
        setErroData(resultado.erro);
        return;
      }

      dataISO = resultado.dataISO;
    }

    const descTrimada = descricao.trim() ? descricao.trim() : undefined;
    onAdicionar(tituloTrimado, descTrimada, dataISO);

    setTitulo('');
    setDescricao('');
    setDataTexto('');
    setErroData('');
    onFechar();
  }, [titulo, descricao, dataTexto, onAdicionar, onFechar]);

  const podeCriar = titulo.trim().length > 0;

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
        {/* Fundo escurecido — toque fecha */}
        <TouchableOpacity
          style={estilos.modalFundo}
          activeOpacity={1}
          onPress={handleFechar}
        />

        <View style={estilos.modalConteudo}>
          {/* Alça decorativa */}
          <View style={estilos.modalAlca} />

          <Text style={estilos.modalTitulo}>Nova Intenção</Text>
          <Text style={estilos.modalSubtitulo}>
            Qual tarefa ou ritual você quer adicionar à sua jornada?
          </Text>

          {/* Campo: Título */}
          <Text style={estilos.modalLabel}>Título</Text>
          <TextInput
            style={estilos.modalInput}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Meditar por 10 minutos..."
            placeholderTextColor={ShelloTema.cores.textoS}
            autoFocus
            returnKeyType="next"
            maxLength={100}
          />

          {/* Campo: Descrição */}
          <Text style={estilos.modalLabel}>
            Descrição <Text style={estilos.modalLabelOpcional}>(opcional)</Text>
          </Text>
          <TextInput
            style={[estilos.modalInput, { minHeight: 60 }]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Adicione detalhes sobre sua tarefa..."
            placeholderTextColor={ShelloTema.cores.textoS}
            multiline
            maxLength={250}
          />

          {/* Campo: Data opcional */}
          <Text style={estilos.modalLabel}>
            Data <Text style={estilos.modalLabelOpcional}>(opcional)</Text>
          </Text>
          <TextInput
            style={[estilos.modalInput, erroData ? estilos.modalInputErro : null]}
            value={dataTexto}
            onChangeText={(texto) => {
              setDataTexto(formatarDataInput(texto));
              setErroData('');
            }}
            placeholder="dd/mm/aaaa"
            placeholderTextColor={ShelloTema.cores.textoS}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleAdicionar}
            maxLength={10}
          />
          {erroData ? (
            <Text style={estilos.modalErroTexto}>{erroData}</Text>
          ) : null}

          {/* Botões */}
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
                !podeCriar && estilos.botaoAdicionarModalDesabilitado,
              ]}
              onPress={handleAdicionar}
              activeOpacity={0.85}
              disabled={!podeCriar}
            >
              <Feather name="plus" size={16} color={ShelloTema.cores.superficie} />
              <Text style={estilos.botaoAdicionarModalTexto}>Criar Tarefa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Componente: CardRotina ────────────────────────────────────────────────────

interface CardRotinaProps {
  rotina: Rotina;
  onExcluir?: (id: string) => void;
}

function CardRotina({ rotina, onExcluir }: CardRotinaProps): React.JSX.Element {
  const icone    = iconeRotina(rotina.periodo);
  const corFundo = corFundoRotina(rotina.periodo);

  return (
    <View style={[estilos.cardRotina, { backgroundColor: corFundo }]}>
      {/* Cabeçalho: ícone em círculo branco + título */}
      <View style={estilos.cardRotinaCabecalho}>
        <View style={estilos.cardRotinaIconeWrapper}>
          <Feather name={icone} size={20} color={ShelloTema.cores.marca} />
        </View>
        <Text style={estilos.cardRotinaTitulo}>{rotina.titulo}</Text>
        {onExcluir && !rotina.id.startsWith('padrao-') && (
          <TouchableOpacity
            testID={`delete-routine-${rotina.id}`}
            onPress={() => onExcluir(rotina.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={16} color={ShelloTema.cores.textoS} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista bulleted de atividades */}
      <View style={estilos.cardRotinaLista}>
        {rotina.atividades.map((atividade, indice) => (
          <View key={indice} style={estilos.cardRotinaAtividadeRow}>
            <View style={estilos.bullet} />
            <Text style={estilos.cardRotinaAtividade}>
              {atividade.startsWith('•') ? atividade.slice(1).trim() : atividade}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Componente: ProgressoPill ─────────────────────────────────────────────────

interface ProgressoPillProps {
  concluidas: number;
  total:      number;
}

function ProgressoPill({ concluidas, total }: ProgressoPillProps): React.JSX.Element | null {
  if (total === 0) return null;
  const percentual = Math.round((concluidas / total) * 100);
  return (
    <View style={estilos.progressoPill}>
      <Feather name="check-circle" size={12} color={ShelloTema.cores.marca} />
      <Text style={estilos.progressoTexto}>
        {concluidas}/{total} concluídas · {percentual}%
      </Text>
    </View>
  );
}

// ─── Componente: EstadoVazio ───────────────────────────────────────────────────

function EstadoVazio(): React.JSX.Element {
  return (
    <View style={estilos.estadoVazio}>
      <View style={estilos.estadoVazioIconeWrapper}>
        <Feather name="check-circle" size={48} color={ShelloTema.cores.marca} />
      </View>
      <Text style={estilos.estadoVazioTitulo}>Nenhuma tarefa ainda</Text>
      <Text style={estilos.estadoVazioTexto}>
        Adicione sua primeira intenção!{'\n'}Toque no{' '}
        <Text style={estilos.estadoVazioDestaque}>+</Text> acima para começar.
      </Text>
    </View>
  );
}

function EstadoVazioRotinas(): React.JSX.Element {
  return (
    <View style={estilos.estadoVazio} testID="empty-routines-cta">
      <View style={estilos.estadoVazioIconeWrapper}>
        <Feather name="calendar" size={48} color={ShelloTema.cores.marca} />
      </View>
      <Text style={estilos.estadoVazioTitulo}>Nenhuma rotina personalizada</Text>
      <Text style={estilos.estadoVazioTexto}>
        Crie sua primeira rotina diária no painel do Shello!
      </Text>
    </View>
  );
}

// ─── Tela Principal: TelaTarefas ───────────────────────────────────────────────

export default function TelaTarefas(): React.JSX.Element {
  const { tarefas, rotinas, adicionarTarefa, alternarTarefa, removerTarefa, removerRotina } = useShello();
  const [modalVisivel, setModalVisivel] = useState(false);
  const [tarefaExcluir, setTarefaExcluir] = useState<string | null>(null);
  const [rotinaExcluir, setRotinaExcluir] = useState<string | null>(null);



  // Separação pendentes / concluídas
  const tarefasPendentes  = useMemo(() => tarefas.filter((t) => !t.concluida), [tarefas]);
  const tarefasConcluidas = useMemo(() => tarefas.filter((t) => t.concluida),  [tarefas]);

  const handleAdicionarTarefa = useCallback(
    async (titulo: string, descricao?: string, data?: string) => {
      await adicionarTarefa(titulo, descricao, data);
    },
    [adicionarTarefa]
  );

  const handleAlternarTarefa = useCallback(
    async (id: string) => {
      await alternarTarefa(id);
    },
    [alternarTarefa]
  );

  const handleExcluirTarefa = useCallback(async () => {
    if (tarefaExcluir) {
      try {
        await removerTarefa(tarefaExcluir);
      } catch (e) {
        console.error('Erro ao excluir tarefa:', e);
      } finally {
        setTarefaExcluir(null);
      }
    }
  }, [tarefaExcluir, removerTarefa]);

  const handleExcluirRotina = useCallback(async () => {
    if (rotinaExcluir) {
      try {
        await removerRotina(rotinaExcluir);
      } catch (e) {
        console.error('Erro ao excluir rotina:', e);
      } finally {
        setRotinaExcluir(null);
      }
    }
  }, [rotinaExcluir, removerRotina]);

  return (
    <SafeAreaView style={estilos.safeArea}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cabeçalho serifado ─────────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.tituloPrincipal}>Sua Jornada</Text>
          <Text style={estilos.subtituloPrincipal}>
            Organize suas intenções e rituais diários
          </Text>

          {tarefas.length > 0 && (
            <View style={estilos.progressoWrapper}>
              <ProgressoPill
                concluidas={tarefasConcluidas.length}
                total={tarefas.length}
              />
            </View>
          )}
        </View>

        {/* ── Seção: Foco de Hoje ────────────────────────────────────────── */}
        <View style={estilos.secao}>
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Foco de Hoje</Text>

            {/* Botão circular '+' em terracota claro conforme spec */}
            <TouchableOpacity
              style={estilos.botaoAdicionar}
              onPress={() => setModalVisivel(true)}
              activeOpacity={0.8}
              accessibilityLabel="Adicionar nova tarefa"
              accessibilityRole="button"
            >
              <Feather name="plus" size={20} color={ShelloTema.cores.pessegoDark} />
            </TouchableOpacity>
          </View>

          {/* Estado vazio ou lista */}
          {tarefas.length === 0 ? (
            <EstadoVazio />
          ) : (
            <View style={estilos.listaTarefas}>
              {/* Pendentes primeiro */}
              {tarefasPendentes.map((tarefa) => (
                <ItemTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  onAlternar={handleAlternarTarefa}
                  onExcluir={setTarefaExcluir}
                />
              ))}

              {/* Separador visual entre pendentes e concluídas */}
              {tarefasConcluidas.length > 0 && tarefasPendentes.length > 0 && (
                <View style={estilos.divisorConcluidas}>
                  <View style={estilos.divisorLinha} />
                  <Text style={estilos.divisorTexto}>Concluídas</Text>
                  <View style={estilos.divisorLinha} />
                </View>
              )}

              {/* Apenas concluídas — sem separador se não há pendentes */}
              {tarefasConcluidas.length > 0 && tarefasPendentes.length === 0 && (
                <View style={estilos.secaoConcluidasHeader}>
                  <Feather name="check-circle" size={14} color={ShelloTema.cores.marca} />
                  <Text style={estilos.secaoConcluidasTexto}>
                    Tudo concluído hoje 🎉
                  </Text>
                </View>
              )}

              {/* Concluídas */}
              {tarefasConcluidas.map((tarefa) => (
                <ItemTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  onAlternar={handleAlternarTarefa}
                  onExcluir={setTarefaExcluir}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Seção: Rotinas Diárias ─────────────────────────────────────── */}
        <View style={estilos.secao}>
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Rotinas Diárias</Text>
            <View style={estilos.rotinaBadge}>
              <Text style={estilos.rotinaBadgeTexto}>{rotinas.length}</Text>
            </View>
          </View>

          <View style={estilos.listaRotinas}>
            {rotinas.length === 0 ? (
              <EstadoVazioRotinas />
            ) : (
              rotinas.map((rotina) => (
                <CardRotina key={rotina.id} rotina={rotina} onExcluir={setRotinaExcluir} />
              ))
            )}
          </View>
        </View>

        {/* Espaço final */}
        <View style={estilos.espacoFinal} />
      </ScrollView>

      {/* ── Modal de nova tarefa ──────────────────────────────────────────── */}
      <ModalNovaTarefa
        visivel={modalVisivel}
        onFechar={() => setModalVisivel(false)}
        onAdicionar={handleAdicionarTarefa}
      />

      {/* ── Dialog de exclusão ───────────────────────────────────────── */}
      <DialogShello
        visible={tarefaExcluir !== null}
        onClose={() => setTarefaExcluir(null)}
        title="Excluir Tarefa"
        message="Deseja mesmo remover esta tarefa de sua jornada?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleExcluirTarefa}
        isDestructive
      />

      {/* ── Dialog de exclusão de rotina ───────────────────────────────── */}
      <DialogShello
        visible={rotinaExcluir !== null}
        onClose={() => setRotinaExcluir(null)}
        title="Excluir Rotina"
        message="Deseja mesmo remover esta rotina de sua jornada?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleExcluirRotina}
        isDestructive
      />
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // ── Estrutura base ──────────────────────────────────────────────────────────
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

  // ── Cabeçalho ───────────────────────────────────────────────────────────────
  cabecalho: {
    paddingTop: ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.md,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
    letterSpacing: 0.2,
  },
  subtituloPrincipal: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    lineHeight: 20,
    marginBottom: ShelloTema.espacamento.md,
  },
  progressoWrapper: {
    flexDirection: 'row',
  },

  // Pill de progresso
  progressoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.xs,
    gap: ShelloTema.espacamento.xs,
    alignSelf: 'flex-start',
  },
  progressoTexto: {
    fontSize: 12,
    color: ShelloTema.cores.marca,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Seções ──────────────────────────────────────────────────────────────────
  secao: {
    marginTop: ShelloTema.espacamento.lg,
    marginBottom: ShelloTema.espacamento.sm,
  },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ShelloTema.espacamento.md,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    letterSpacing: 0.15,
  },

  // Botão circular '+' — fundo terracota claro (#F2D4C8) conforme spec
  botaoAdicionar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ShelloTema.cores.pessego,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C08070',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  // Badge de contagem de rotinas
  rotinaBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rotinaBadgeTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: ShelloTema.cores.marca,
  },

  // ── Lista de tarefas ────────────────────────────────────────────────────────
  listaTarefas: {
    gap: ShelloTema.espacamento.sm,
  },

  // Divisor entre pendentes e concluídas
  divisorConcluidas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    marginVertical: ShelloTema.espacamento.xs,
  },
  divisorLinha: {
    flex: 1,
    height: 1,
    backgroundColor: ShelloTema.cores.marcaClaro,
  },
  divisorTexto: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    fontWeight: '500',
  },

  // Header "Tudo concluído hoje 🎉"
  secaoConcluidasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.xs,
    marginBottom: ShelloTema.espacamento.xs,
  },
  secaoConcluidasTexto: {
    fontSize: 13,
    color: ShelloTema.cores.marca,
    fontWeight: '600',
  },

  // ── Card de tarefa (pill branca arredondada — borderRadius 24) ──────────────
  cardTarefa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia, // 24
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  // Borda lateral esquerda vermelha para tarefas atrasadas
  cardTarefaAtrasada: {
    borderLeftWidth: 4,
    borderLeftColor: ShelloTema.cores.erro,
  },

  // ── Checkbox circular ────────────────────────────────────────────────────────
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
    backgroundColor: ShelloTema.cores.superficie,
  },
  checkboxConcluido: {
    backgroundColor: ShelloTema.cores.marca,
    borderColor:     ShelloTema.cores.marca,
  },

  // ── Conteúdo da tarefa ───────────────────────────────────────────────────────
  tarefaConteudo: {
    flex: 1,
  },
  tarefaTitulo: {
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
    fontWeight: '500',
  },
  tarefaTituloConcluida: {
    color: ShelloTema.cores.textoS,
    textDecorationLine: 'line-through',
  },
  tarefaDescricao: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    lineHeight: 18,
    marginTop: 2,
  },
  tarefaDescricaoConcluida: {
    color: '#A5B0A9',
    textDecorationLine: 'line-through',
  },
  tarefaRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  // Badge: atrasada
  badgeAtrasada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FDE8E8',
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeAtrasadaTexto: {
    fontSize: 11,
    color: ShelloTema.cores.erro,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Badge: data futura
  badgeData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeDataTexto: {
    fontSize: 11,
    color: ShelloTema.cores.marca,
    fontWeight: '500',
  },

  // Badge: concluída
  badgeConcluida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeConcluidaTexto: {
    fontSize: 11,
    color: ShelloTema.cores.marca,
    fontWeight: '500',
  },

  // ── Estado vazio ─────────────────────────────────────────────────────────────
  estadoVazio: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  estadoVazioIconeWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  estadoVazioTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
  },
  estadoVazioTexto: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 22,
  },
  estadoVazioDestaque: {
    color: ShelloTema.cores.marca,
    fontWeight: '700',
    fontSize: 16,
  },

  // ── Lista de rotinas ──────────────────────────────────────────────────────────
  listaRotinas: {
    gap: ShelloTema.espacamento.md,
  },

  // ── Card de rotina ────────────────────────────────────────────────────────────
  cardRotina: {
    borderRadius: 20,
    padding: ShelloTema.espacamento.lg,
  },
  cardRotinaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  cardRotinaIconeWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ShelloTema.cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRotinaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    flex: 1,
    letterSpacing: 0.15,
  },
  cardRotinaLista: {
    gap: ShelloTema.espacamento.sm,
  },
  cardRotinaAtividadeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ShelloTema.espacamento.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ShelloTema.cores.marca,
    marginTop: 8,
    flexShrink: 0,
  },
  cardRotinaAtividade: {
    flex: 1,
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
  },

  // ── Modal de nova tarefa ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  modalConteudo: {
    backgroundColor: ShelloTema.cores.superficie,
    borderTopLeftRadius:  ShelloTema.forma.bordaGrande,
    borderTopRightRadius: ShelloTema.forma.bordaGrande,
    padding:       ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.xxl,
  },
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
    fontFamily: 'serif',
    fontWeight: '700',
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
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
  },
  modalLabelOpcional: {
    fontSize: 12,
    fontWeight: '400',
    color: ShelloTema.cores.textoS,
  },
  modalInput: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius:    ShelloTema.forma.bordaPequena,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical:   ShelloTema.espacamento.md,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.md,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
    lineHeight: 22,
  },
  modalInputErro: {
    borderColor: ShelloTema.cores.erro,
  },
  modalErroTexto: {
    fontSize: 12,
    color: ShelloTema.cores.erro,
    marginTop: -ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.sm,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    marginTop: ShelloTema.espacamento.sm,
  },
  botaoCancelarModal: {
    flex: 1,
    paddingVertical: ShelloTema.espacamento.md,
    borderRadius:    ShelloTema.forma.bordaMedia,
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
    borderRadius:    ShelloTema.forma.bordaMedia,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.marca,
    gap: ShelloTema.espacamento.sm,
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

  // ── Espaço final ──────────────────────────────────────────────────────────────
  espacoFinal: {
    height: ShelloTema.espacamento.xxl,
  },
});
