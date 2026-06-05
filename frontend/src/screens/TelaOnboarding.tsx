// TelaOnboarding.tsx
// Assistente de configuração inicial do Shello — 3 etapas em carrossel
// Coleta nome, estilo de vida e meta atual do usuário
// Usa StyleSheet.create, ShelloTema, Feather icons, Animated API e ShelloContext

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DadosFormulario {
  nome: string;
  estiloDeVida: string;
  metaAtual: string;
}

type PassoOnboarding = 0 | 1 | 2;

interface ConfiguracaoPasso {
  icone: keyof typeof Feather.glyphMap;
  titulo: string;
  descricao: string;
  placeholder: string;
  campo: keyof DadosFormulario;
  multiline: boolean;
}

// ─── Largura da tela para cálculo da animação ─────────────────────────────────

const { width: LARGURA_TELA } = Dimensions.get('window');

// ─── Configuração de cada passo ───────────────────────────────────────────────

const CONFIGURACAO_PASSOS: ConfiguracaoPasso[] = [
  {
    icone: 'user',
    titulo: 'Como prefere ser chamado?',
    descricao: 'Seu nome vai tornar a experiência mais pessoal e acolhedora.',
    placeholder: 'Ex: Ana, João, Duda...',
    campo: 'nome',
    multiline: false,
  },
  {
    icone: 'heart',
    titulo: 'Como descreveria seu estilo de vida?',
    descricao: 'Isso me ajuda a entender melhor como posso te apoiar no dia a dia.',
    placeholder: 'Ex: Trabalho muito, tenho pouco tempo para mim, estou em transição...',
    campo: 'estiloDeVida',
    multiline: true,
  },
  {
    icone: 'target',
    titulo: 'O que está tentando melhorar agora?',
    descricao: 'Sua meta principal vai guiar os nossos próximos passos juntos.',
    placeholder: 'Ex: Ter mais foco, dormir melhor, criar uma rotina saudável...',
    campo: 'metaAtual',
    multiline: true,
  },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function TelaOnboarding() {
  const { concluirOnboarding } = useShello();

  // Passo atual do onboarding
  const [passoAtual, setPassoAtual] = useState<PassoOnboarding>(0);

  // Dados coletados ao longo do onboarding
  const [dadosForm, setDadosForm] = useState<DadosFormulario>({
    nome: '',
    estiloDeVida: '',
    metaAtual: '',
  });

  // Estado de carregamento ao concluir
  const [carregando, setCarregando] = useState(false);

  // Referência do valor de translação X para a animação de slide
  const translacaoX = useRef(new Animated.Value(0)).current;

  // Animação de opacidade para fade nos cards
  const opacidade = useRef(new Animated.Value(1)).current;

  // ─── Funções de animação de transição ────────────────────────────────────

  const animarTransicao = useCallback(
    (direcao: 'proximo' | 'anterior', callback: () => void) => {
      const deslocamento = direcao === 'proximo' ? -LARGURA_TELA : LARGURA_TELA;

      // Fase 1: slide para fora + fade out
      Animated.parallel([
        Animated.timing(translacaoX, {
          toValue: deslocamento,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();

        // Reposiciona o slide do lado oposto antes de entrar
        translacaoX.setValue(-deslocamento);

        // Fase 2: slide para dentro + fade in
        Animated.parallel([
          Animated.timing(translacaoX, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(opacidade, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [translacaoX, opacidade]
  );

  // ─── Ação de avançar ─────────────────────────────────────────────────────

  const handleProximo = useCallback(async () => {
    if (carregando) return;

    if (passoAtual < 2) {
      // Valida campo obrigatório do passo 0 (nome)
      if (passoAtual === 0 && !dadosForm.nome.trim()) {
        // Permite avançar mesmo sem nome — usará "Você" como fallback
      }
      // Avança para o próximo passo com animação
      animarTransicao('proximo', () => {
        setPassoAtual((p) => (p + 1) as PassoOnboarding);
      });
    } else {
      // Último passo — conclui o onboarding
      setCarregando(true);

      // Simula persistência com pequeno delay para UX mais agradável
      await new Promise<void>((resolve) => setTimeout(resolve, 600));

      // Garante que nome nunca fique vazio
      const dadosFinais = {
        nome: dadosForm.nome.trim() || 'Você',
        estiloDeVida: dadosForm.estiloDeVida.trim() || 'Ainda descobrindo',
        metaAtual: dadosForm.metaAtual.trim() || 'Crescer cada dia mais',
      };

      await concluirOnboarding(dadosFinais);
      setCarregando(false);
      // O ShelloContext seta onboardingConcluido = true e o navigator reage automaticamente
    }
  }, [carregando, passoAtual, animarTransicao, concluirOnboarding, dadosForm]);


  // ─── Ação de voltar ──────────────────────────────────────────────────────

  const handleVoltar = useCallback(() => {
    if (passoAtual === 0 || carregando) return;

    animarTransicao('anterior', () => {
      setPassoAtual((p) => (p - 1) as PassoOnboarding);
    });
  }, [passoAtual, carregando, animarTransicao]);

  // ─── Atualiza um campo do formulário ─────────────────────────────────────

  const atualizarCampo = useCallback((campo: keyof DadosFormulario, valor: string) => {
    setDadosForm((anterior) => ({ ...anterior, [campo]: valor }));
  }, []);

  // ─── Renderização dos indicadores de progresso ────────────────────────────

  const renderIndicadores = () => (
    <View style={estilos.indicadoresContainer}>
      {([0, 1, 2] as PassoOnboarding[]).map((indice) => (
        <View
          key={indice}
          style={[
            estilos.indicadorBolinha,
            indice === passoAtual
              ? estilos.indicadorAtivo
              : estilos.indicadorInativo,
          ]}
        />
      ))}
    </View>
  );

  // ─── Renderização do conteúdo do passo atual ──────────────────────────────

  const renderPasso = () => {
    const config = CONFIGURACAO_PASSOS[passoAtual];
    const valorCampo = dadosForm[config.campo];

    return (
      <Animated.View
        style={[
          estilos.passoContainer,
          {
            opacity: opacidade,
            transform: [{ translateX: translacaoX }],
          },
        ]}
      >
        {/* Ícone decorativo do passo */}
        <View style={estilos.iconeContainer}>
          <View style={estilos.iconeCirculo}>
            <Feather name={config.icone} size={60} color={ShelloTema.cores.marca} />
          </View>
        </View>

        {/* Textos do passo */}
        <Text style={estilos.tituloPasso}>{config.titulo}</Text>
        <Text style={estilos.descricaoPasso}>{config.descricao}</Text>

        {/* Input do passo */}
        <View
          style={[
            estilos.inputWrapper,
            config.multiline ? estilos.inputWrapperMultiline : null,
          ]}
        >
          <TextInput
            style={[estilos.input, config.multiline ? estilos.inputMultiline : null]}
            placeholder={config.placeholder}
            placeholderTextColor={ShelloTema.cores.textoS}
            value={valorCampo}
            onChangeText={(v) => atualizarCampo(config.campo, v)}
            autoCapitalize={config.campo === 'nome' ? 'words' : 'sentences'}
            multiline={config.multiline}
            numberOfLines={config.multiline ? 4 : 1}
            textAlignVertical={config.multiline ? 'top' : 'center'}
            returnKeyType={config.multiline ? 'default' : 'next'}
          />
        </View>
      </Animated.View>
    );
  };

  // ─── Renderização dos botões de ação ─────────────────────────────────────

  const renderBotoes = () => (
    <View style={estilos.botoesContainer}>
      {/* Botão Voltar — discreto, invisível no passo 0 */}
      <TouchableOpacity
        style={[estilos.botaoVoltar, passoAtual === 0 ? estilos.botaoVoltarInvisivel : null]}
        onPress={handleVoltar}
        disabled={passoAtual === 0 || carregando}
        accessibilityLabel="Voltar ao passo anterior"
      >
        <Feather name="arrow-left" size={18} color={ShelloTema.cores.textoS} />
        <Text style={estilos.textoBotaoVoltar}>Voltar</Text>
      </TouchableOpacity>

      {/* Botão principal Próximo / Concluir */}
      <TouchableOpacity
        style={[estilos.botaoPrincipal, carregando ? estilos.botaoPrincipalCarregando : null]}
        onPress={handleProximo}
        activeOpacity={0.85}
        disabled={carregando}
        accessibilityLabel={passoAtual < 2 ? 'Avançar para o próximo passo' : 'Concluir configuração'}
      >
        {carregando ? (
          <View style={estilos.carregandoContainer}>
            <Text style={estilos.textoBotaoPrincipal}>Salvando...</Text>
          </View>
        ) : (
          <View style={estilos.botaoInterior}>
            <Text style={estilos.textoBotaoPrincipal}>
              {passoAtual < 2 ? 'Próximo' : 'Concluir'}
            </Text>
            <Feather
              name={passoAtual < 2 ? 'arrow-right' : 'check'}
              size={18}
              color={ShelloTema.cores.superficie}
              style={estilos.iconeBotao}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // ─── Render Principal ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <KeyboardAvoidingView
        style={estilos.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={estilos.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho com logo e título */}
          <View style={estilos.cabecalho}>
            <View style={estilos.logoMini}>
              <Feather name="home" size={28} color={ShelloTema.cores.superficie} />
            </View>
            <Text style={estilos.tituloCabecalho}>Shello</Text>
          </View>

          {/* Indicadores de progresso */}
          {renderIndicadores()}

          {/* Rótulo de etapa */}
          <Text style={estilos.rotuloEtapa}>
            Etapa {passoAtual + 1} de 3
          </Text>

          {/* Card com o conteúdo do passo */}
          <View style={estilos.cardPasso}>
            {renderPasso()}
          </View>

          {/* Botões de ação */}
          {renderBotoes()}

          {/* Nota de rodapé discreta */}
          <Text style={estilos.notaRodape}>
            Suas informações ficam salvas apenas no seu dispositivo 🔒
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Layout base
  areaSegura: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingBottom: ShelloTema.espacamento.xl,
  },

  // Cabeçalho
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ShelloTema.espacamento.lg,
    paddingBottom: ShelloTema.espacamento.md,
    gap: ShelloTema.espacamento.sm,
  },
  logoMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tituloCabecalho: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontFamily: ShelloTema.tipografia.titulo,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    letterSpacing: 1,
  },

  // Indicadores de progresso
  indicadoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.xs,
  },
  indicadorBolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  indicadorAtivo: {
    backgroundColor: ShelloTema.cores.marca,
    // Pequena escala visual para destacar o ativo
    width: 24,
    borderRadius: 5,
  },
  indicadorInativo: {
    backgroundColor: ShelloTema.cores.marcaClaro,
  },

  // Rótulo de etapa
  rotuloEtapa: {
    textAlign: 'center',
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    marginBottom: ShelloTema.espacamento.md,
    letterSpacing: 0.5,
  },

  // Card principal do passo
  cardPasso: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaGrande,
    padding: ShelloTema.espacamento.lg,
    marginBottom: ShelloTema.espacamento.lg,
    // Sombra suave do card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },

  // Container animado do passo
  passoContainer: {
    alignItems: 'center',
  },

  // Ícone do passo
  iconeContainer: {
    marginBottom: ShelloTema.espacamento.lg,
  },
  iconeCirculo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra colorida discreta
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },

  // Textos do passo
  tituloPasso: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    textAlign: 'center',
    marginBottom: ShelloTema.espacamento.sm,
    lineHeight: 28,
  },
  descricaoPasso: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    marginBottom: ShelloTema.espacamento.lg,
    lineHeight: ShelloTema.tipografia.alturaLinha,
    paddingHorizontal: ShelloTema.espacamento.sm,
  },

  // Input do passo
  inputWrapper: {
    width: '100%',
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPill,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
    paddingHorizontal: ShelloTema.espacamento.md,
    height: 52,
    justifyContent: 'center',
    // Sombra ultra-suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputWrapperMultiline: {
    height: 120,
    borderRadius: ShelloTema.forma.bordaMedia,
    paddingVertical: ShelloTema.espacamento.md,
    justifyContent: 'flex-start',
  },
  input: {
    fontSize: ShelloTema.tipografia.tamanhos.normal,
    color: ShelloTema.cores.textoP,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: 96,
    lineHeight: ShelloTema.tipografia.alturaLinha,
  },

  // Botões
  botoesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ShelloTema.espacamento.lg,
    gap: ShelloTema.espacamento.md,
  },
  botaoVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.xs,
    paddingVertical: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
    borderRadius: ShelloTema.forma.bordaPill,
    backgroundColor: 'transparent',
  },
  botaoVoltarInvisivel: {
    opacity: 0,
    pointerEvents: 'none',
  },
  textoBotaoVoltar: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.textoS,
    fontWeight: ShelloTema.tipografia.pesos.medio,
  },
  botaoPrincipal: {
    flex: 1,
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra colorida do botão
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  botaoPrincipalCarregando: {
    opacity: 0.8,
  },
  botaoInterior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
  },
  carregandoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoPrincipal: {
    color: ShelloTema.cores.superficie,
    fontSize: ShelloTema.tipografia.tamanhos.normal,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    letterSpacing: 0.5,
  },
  iconeBotao: {
    marginTop: 1,
  },

  // Nota de rodapé
  notaRodape: {
    textAlign: 'center',
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    opacity: 0.65,
    lineHeight: 18,
  },
});
