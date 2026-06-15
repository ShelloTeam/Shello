// TelaEntradaDiario.tsx — Bloco de notas para escrever/editar uma entrada do diário
// Abre quando o usuário toca em "Nova Entrada" ou em uma entrada existente.
// Botões no topo: [Finalizar entrada] e [+ Contexto Shello]

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import type { DiarioStackParamList } from '../navigation/NavegacaoDiario';
import type { EntradaDiario } from '../types';
import DialogShello from '../components/DialogShello';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<DiarioStackParamList, 'EntradaDiario'>;

// ─── TelaEntradaDiario ────────────────────────────────────────────────────────

export default function TelaEntradaDiario({ route, navigation }: Props): React.JSX.Element {
  const { entrada, nova } = route.params ?? {};
  const { adicionarEntrada, atualizarEntrada, marcarEntradaComoContexto, removerEntrada } = useShello();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [texto, setTexto] = useState(entrada?.conteudo ?? '');
  const [salvando, setSalvando] = useState(false);
  const [adicionandoContexto, setAdicionandoContexto] = useState(false);
  const [modalContexto, setModalContexto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [idEntradaSalva, setIdEntradaSalva] = useState<string | null>(entrada?.id ?? null);

  const inputRef = useRef<TextInput>(null);
  const animacaoContexto = useRef(new Animated.Value(0)).current;
  const animacaoRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerModal = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref para guardar a Promise pendente de criação da entrada
  // Evita que adicionarAoContexto + finalizarEntrada criem duas entradas no banco
  const criandoEntradaRef = useRef<Promise<EntradaDiario> | null>(null);

  // Cleanup de animações e timers ao desmontar
  useEffect(() => {
    return () => {
      animacaoRef.current?.stop();
      if (timerModal.current) clearTimeout(timerModal.current);
    };
  }, []);

  // Foca automaticamente ao abrir nova entrada
  useEffect(() => {
    if (nova) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [nova]);

  // ── Gera título a partir das primeiras 40 chars do conteúdo ───────────────
  function gerarTitulo(conteudo: string): string {
    return conteudo.slice(0, 40) + (conteudo.length > 40 ? '...' : '');
  }

  // ── Ação: Finalizar entrada ───────────────────────────────────────────────
  const finalizarEntrada = useCallback(async () => {
    const conteudoTrimado = texto.trim();
    if (!conteudoTrimado) {
      navigation.goBack();
      return;
    }

    setSalvando(true);
    try {
      const titulo = gerarTitulo(conteudoTrimado);
      if (idEntradaSalva) {
        await atualizarEntrada(idEntradaSalva, titulo, conteudoTrimado);
      } else if (criandoEntradaRef.current) {
        // Criação já em andamento por adicionarAoContexto — aguarda a mesma Promise
        const entradaCriada = await criandoEntradaRef.current;
        setIdEntradaSalva(entradaCriada.id);
        await atualizarEntrada(entradaCriada.id, titulo, conteudoTrimado);
      } else {
        const promise = adicionarEntrada(titulo, conteudoTrimado);
        criandoEntradaRef.current = promise;
        const novaEntrada = await promise;
        setIdEntradaSalva(novaEntrada.id);
      }
      navigation.goBack();
    } catch (e) {
      console.error('Erro ao salvar entrada:', e);
    } finally {
      criandoEntradaRef.current = null;
      setSalvando(false);
    }
  }, [texto, idEntradaSalva, adicionarEntrada, atualizarEntrada, navigation]);

  // ── Ação: Adicionar contexto ao Shello ───────────────────────────────────
  const adicionarAoContexto = useCallback(async () => {
    const conteudoTrimado = texto.trim();
    if (!conteudoTrimado) return;

    setAdicionandoContexto(true);
    try {
      let idParaContexto = idEntradaSalva;
      if (!idParaContexto) {
        // Se finalizarEntrada já iniciou a criação, reutiliza a mesma Promise
        if (!criandoEntradaRef.current) {
          criandoEntradaRef.current = adicionarEntrada(gerarTitulo(conteudoTrimado), conteudoTrimado);
        }
        const novaEntrada = await criandoEntradaRef.current;
        setIdEntradaSalva(novaEntrada.id);
        idParaContexto = novaEntrada.id;
      }
      await marcarEntradaComoContexto(idParaContexto!, conteudoTrimado);

      animacaoRef.current = Animated.sequence([
        Animated.timing(animacaoContexto, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(animacaoContexto, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
      animacaoRef.current.start();

      setModalContexto(true);
      if (timerModal.current) clearTimeout(timerModal.current);
      timerModal.current = setTimeout(() => setModalContexto(false), 2500);
    } catch (e: any) {
      console.error(
        'Erro ao adicionar contexto:',
        JSON.stringify(e?.response?.data ?? e, null, 2)
      );
    } finally {
      // Só limpa a ref se foi este callback que iniciou a criação
      // (finalizarEntrada pode precisar da ref ainda)
      setAdicionandoContexto(false);
    }
  }, [texto, idEntradaSalva, adicionarEntrada, marcarEntradaComoContexto, animacaoContexto]);

  const deletarEntrada = useCallback(async () => {
    if (idEntradaSalva) {
      setSalvando(true);
      try {
        await removerEntrada(idEntradaSalva);
        navigation.goBack();
      } catch (e) {
        console.error('Erro ao excluir entrada:', e);
      } finally {
        setSalvando(false);
      }
    }
  }, [idEntradaSalva, removerEntrada, navigation]);

  const totalChars = texto.length;
  const tituloTela = entrada ? 'Editar entrada' : 'Nova entrada';

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <KeyboardAvoidingView
        style={estilos.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Barra superior ────────────────────────────────────────────── */}
        <View style={estilos.barraSuperior}>
          <TouchableOpacity
            style={estilos.botaoVoltar}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={22} color={ShelloTema.cores.textoP} />
          </TouchableOpacity>
          <Text style={estilos.tituloTela}>{tituloTela}</Text>
          {idEntradaSalva ? (
            <TouchableOpacity
              style={estilos.botaoExcluirHeader}
              onPress={() => setModalExcluir(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Excluir entrada"
              accessibilityRole="button"
            >
              <Feather name="trash-2" size={22} color={ShelloTema.cores.erro} />
            </TouchableOpacity>
          ) : (
            <View style={estilos.espacadorDireita} />
          )}
        </View>

        {/* ── Barra de ações ────────────────────────────────────────────── */}
        <View style={estilos.barraAcoes}>
          <TouchableOpacity
            style={[estilos.botaoContexto, adicionandoContexto && estilos.botaoDesabilitado]}
            onPress={adicionarAoContexto}
            disabled={adicionandoContexto || !texto.trim()}
            activeOpacity={0.8}
            accessibilityLabel="Adicionar ao contexto do Shello"
            accessibilityRole="button"
          >
            <Feather
              name={adicionandoContexto ? 'loader' : 'cpu'}
              size={15}
              color={ShelloTema.cores.marca}
            />
            <Text style={estilos.botaoContextoTexto}>
              {adicionandoContexto ? '  Adicionando...' : '  + Contexto Shello'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.botaoFinalizar, salvando && estilos.botaoDesabilitado]}
            onPress={finalizarEntrada}
            disabled={salvando}
            activeOpacity={0.8}
            accessibilityLabel="Finalizar e salvar entrada"
            accessibilityRole="button"
          >
            <Feather name={salvando ? 'loader' : 'check'} size={15} color="#FFF" />
            <Text style={estilos.botaoFinalizarTexto}>
              {salvando ? '  Salvando...' : '  Finalizar entrada'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Área de escrita ───────────────────────────────────────────── */}
        <ScrollView
          style={estilos.scrollArea}
          contentContainerStyle={estilos.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={estilos.dataDecorative}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          <TextInput
            ref={inputRef}
            style={estilos.inputTexto}
            value={texto}
            onChangeText={setTexto}
            placeholder="Comece a escrever sua reflexão de hoje..."
            placeholderTextColor={ShelloTema.cores.textoS}
            multiline
            textAlignVertical="top"
            autoCorrect
            spellCheck
          />
        </ScrollView>

        {/* ── Rodapé com contagem ───────────────────────────────────────── */}
        <View style={estilos.rodape}>
          <Text style={estilos.contadorChars}>
            {totalChars} {totalChars === 1 ? 'caractere' : 'caracteres'}
          </Text>
          {totalChars > 100 && (
            <View style={estilos.badgeShelloLendo}>
              <Feather name="eye" size={11} color={ShelloTema.cores.marca} />
              <Text style={estilos.badgeShelloLendoTexto}>{'  '}Shello vai analisar</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Modal toast: contexto adicionado ─────────────────────────── */}
      <Modal
        visible={modalContexto}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalToast}>
            <Feather name="cpu" size={20} color={ShelloTema.cores.marca} />
            <Text style={estilos.modalToastTexto}>{'  '}Adicionado ao contexto do Shello!</Text>
          </View>
        </View>
      </Modal>

      {/* ── Dialog de exclusão ───────────────────────────────────────── */}
      <DialogShello
        visible={modalExcluir}
        onClose={() => setModalExcluir(false)}
        title="Excluir Entrada"
        message="Tem certeza que deseja apagar esta reflexão? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={deletarEntrada}
        isDestructive
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: ShelloTema.cores.fundo },
  tela: { flex: 1 },

  // Barra superior
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
    borderBottomWidth: 1,
    borderBottomColor: ShelloTema.cores.marcaClaro,
    backgroundColor: ShelloTema.cores.fundo,
  },
  botaoVoltar: { padding: ShelloTema.espacamento.xs },
  tituloTela: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: ShelloTema.cores.textoS,
    letterSpacing: 0.3,
  },
  espacadorDireita: { width: 30 },
  botaoExcluirHeader: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Barra de ações
  barraAcoes: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
    backgroundColor: ShelloTema.cores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: ShelloTema.cores.marcaClaro,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  botaoContexto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
  },
  botaoContextoTexto: { fontSize: 13, fontWeight: '600', color: ShelloTema.cores.marca },
  botaoFinalizar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  botaoFinalizarTexto: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  botaoDesabilitado: { opacity: 0.6 },

  // Área de escrita
  scrollArea: { flex: 1 },
  scrollContent: {
    padding: ShelloTema.espacamento.lg,
    paddingTop: ShelloTema.espacamento.xl,
    flexGrow: 1,
  },
  dataDecorative: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    fontStyle: 'italic',
    marginBottom: ShelloTema.espacamento.lg,
    textTransform: 'capitalize',
  },
  inputTexto: {
    flex: 1,
    fontSize: 17,
    color: ShelloTema.cores.textoP,
    lineHeight: 28,
    fontFamily: ShelloTema.tipografia.titulo,
    minHeight: 300,
    textAlignVertical: 'top',
  },

  // Rodapé
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingVertical: ShelloTema.espacamento.sm,
    borderTopWidth: 1,
    borderTopColor: ShelloTema.cores.marcaClaro,
    backgroundColor: ShelloTema.cores.fundo,
  },
  contadorChars: { fontSize: 12, color: ShelloTema.cores.textoS },
  badgeShelloLendo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.sm,
    paddingVertical: 3,
  },
  badgeShelloLendoTexto: { fontSize: 11, color: ShelloTema.cores.marca, fontWeight: '600' },

  // Modal toast
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
  },
  modalToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.textoP,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingVertical: ShelloTema.espacamento.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalToastTexto: { fontSize: 14, color: '#FFF', fontWeight: '600' },
});
