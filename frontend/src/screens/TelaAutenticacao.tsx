// TelaAutenticacao.tsx
// Tela de autenticação do Shello — Login, Cadastro e Recuperação de Senha
// Usa StyleSheet.create, ShelloTema, Feather icons e ShelloContext

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { login, register } from '../services/authService';
import api from '../services/api';

// Logo do mascote Shello
const LOGO_SHELLO = require('../../assets/logoshello.jpeg');

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormularioAtivo = 'login' | 'cadastro' | 'recuperar';

interface CamposLogin {
  email: string;
  senha: string;
}

interface CamposCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

interface CamposRecuperar {
  email: string;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

interface TelaAutenticacaoProps {
  navigation: { navigate: (rota: string) => void };
}

export default function TelaAutenticacao({ navigation }: TelaAutenticacaoProps) {
  const { definirUsuario, recarregarDados } = useShello();

  // Estado do formulário ativo
  const [formularioAtivo, setFormularioAtivo] = useState<FormularioAtivo>('login');

  // Campos do Login
  const [camposLogin, setCamposLogin] = useState<CamposLogin>({
    email: '',
    senha: '',
  });

  // Campos do Cadastro
  const [camposCadastro, setCamposCadastro] = useState<CamposCadastro>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  // Campos de Recuperação
  const [camposRecuperar, setCamposRecuperar] = useState<CamposRecuperar>({
    email: '',
  });

  // Estado de visibilidade de senha
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);

  const opacidadeAnimada = useRef(new Animated.Value(1)).current;

  // ─── Funções de Navegação entre Formulários ───────────────────────────────

  const trocarFormulario = useCallback(
    (destino: FormularioAtivo) => {
      // Anima saída do formulário atual
      Animated.timing(opacidadeAnimada, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setFormularioAtivo(destino);
        // Anima entrada do novo formulário
        Animated.timing(opacidadeAnimada, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    },
    [opacidadeAnimada]
  );

  // ─── Ação principal do botão ──────────────────────────────────────────────

  const handleAcaoPrincipal = useCallback(async () => {
    if (carregando) return;
    setCarregando(true);
    setErroMensagem(null);

    try {
      if (formularioAtivo === 'login') {
        const user = await login(camposLogin.email, camposLogin.senha);
        definirUsuario(user.nome, false);
        await recarregarDados();

      } else if (formularioAtivo === 'cadastro') {
        if (camposCadastro.senha !== camposCadastro.confirmarSenha) {
          setErroMensagem('As senhas não coincidem.');
          return;
        }
        const user = await register(camposCadastro.nome, camposCadastro.email, camposCadastro.senha);
        definirUsuario(user.nome, false);
        navigation.navigate('Onboarding');

      } else if (formularioAtivo === 'recuperar') {
        await api.post('/api/v1/auth/password-reset/request', { email: camposRecuperar.email });
        setErroMensagem('Se o e-mail estiver cadastrado, você receberá um link em breve.');
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      let mensagem = 'Ocorreu um erro. Tente novamente.';

      if (typeof detail === 'string') {
        mensagem = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const erro = detail[0];

        if (erro.loc?.includes('email')) {
          mensagem = 'Digite um e-mail válido.';
        } else if (erro.loc?.includes('password') || erro.loc?.includes('senha')) {
          mensagem = 'Senha inválida.';
        } else {
          mensagem = erro.msg ?? mensagem;
        }
      }

      setErroMensagem(mensagem);
    } finally {
      setCarregando(false);
    }
  }, [carregando, formularioAtivo, camposLogin, camposCadastro, camposRecuperar, navigation, definirUsuario, recarregarDados]);


  // ─── Renderização da Logo ─────────────────────────────────────────────────

  const renderLogo = () => (
    <View style={estilos.logoContainer}>
      {/* Logo oficial do mascote Shello */}
      <Image
        source={LOGO_SHELLO}
        style={estilos.logoImagem}
        resizeMode="cover"
        accessibilityLabel="Logo do Shello"
      />
    </View>
  );

  // ─── Renderização do cabeçalho ────────────────────────────────────────────

  const renderCabecalho = () => (
    <View style={estilos.cabecalho}>
      {renderLogo()}
      <Text style={estilos.titulo}>Shello</Text>
      <Text style={estilos.subtitulo}>Seu companheiro pessoal de crescimento</Text>
    </View>
  );

  // ─── Componente de Input Reutilizável ─────────────────────────────────────

  const renderInput = (
    placeholder: string,
    valor: string,
    aoMudar: (texto: string) => void,
    opcoes?: {
      icone?: keyof typeof Feather.glyphMap;
      senha?: boolean;
      senhaVisivel?: boolean;
      aoAlternarSenha?: () => void;
      autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
    }
  ) => (
    <View style={estilos.inputWrapper}>
      {opcoes?.icone && (
        <Feather
          name={opcoes.icone}
          size={18}
          color={ShelloTema.cores.textoS}
          style={estilos.inputIcone}
        />
      )}
      <TextInput
        style={[estilos.input, opcoes?.icone ? estilos.inputComIcone : null]}
        placeholder={placeholder}
        placeholderTextColor={ShelloTema.cores.textoS}
        value={valor}
        onChangeText={aoMudar}
        secureTextEntry={opcoes?.senha && !opcoes?.senhaVisivel}
        autoCapitalize={opcoes?.autoCapitalize ?? 'none'}
        keyboardType={opcoes?.keyboardType ?? 'default'}
      />
      {opcoes?.senha && (
        <TouchableOpacity
          onPress={opcoes.aoAlternarSenha}
          style={estilos.botaoOlho}
          accessibilityLabel={opcoes.senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <Feather
            name={opcoes.senhaVisivel ? 'eye-off' : 'eye'}
            size={18}
            color={ShelloTema.cores.textoS}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Formulário de Login ──────────────────────────────────────────────────

  const renderFormularioLogin = () => (
    <View style={estilos.formulario}>
      <Text style={estilos.tituloFormulario}>Bem-vindo de volta!</Text>
      <Text style={estilos.subtituloFormulario}>Entre na sua conta para continuar</Text>

      {renderInput('E-mail', camposLogin.email, (v) => setCamposLogin((p) => ({ ...p, email: v })), {
        icone: 'mail',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      })}

      {renderInput('Senha', camposLogin.senha, (v) => setCamposLogin((p) => ({ ...p, senha: v })), {
        icone: 'lock',
        senha: true,
        senhaVisivel: senhaVisivel,
        aoAlternarSenha: () => setSenhaVisivel((v) => !v),
      })}

      {erroMensagem ? <Text style={estilos.textoErro}>{erroMensagem}</Text> : null}

      <TouchableOpacity
        style={estilos.botaoPrincipal}
        onPress={handleAcaoPrincipal}
        activeOpacity={0.85}
        disabled={carregando}
        accessibilityLabel="Entrar na conta"
      >
        {carregando ? (
          <ActivityIndicator color={ShelloTema.cores.superficie} size="small" />
        ) : (
          <Text style={estilos.textoBotaoPrincipal}>Entrar</Text>
        )}
      </TouchableOpacity>

      <View style={estilos.linksContainer}>
        <TouchableOpacity
          onPress={() => trocarFormulario('cadastro')}
          accessibilityLabel="Criar uma nova conta"
        >
          <Text style={estilos.link}>Criar conta</Text>
        </TouchableOpacity>

        <View style={estilos.separadorLink} />

        <TouchableOpacity
          onPress={() => trocarFormulario('recuperar')}
          accessibilityLabel="Recuperar senha"
        >
          <Text style={estilos.link}>Esqueci a senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Formulário de Cadastro ───────────────────────────────────────────────

  const renderFormularioCadastro = () => (
    <View style={estilos.formulario}>
      <Text style={estilos.tituloFormulario}>Crie sua conta</Text>
      <Text style={estilos.subtituloFormulario}>Comece sua jornada de crescimento</Text>

      {renderInput(
        'Qual seu nome?',
        camposCadastro.nome,
        (v) => setCamposCadastro((p) => ({ ...p, nome: v })),
        { icone: 'user', autoCapitalize: 'words' }
      )}

      {renderInput(
        'E-mail',
        camposCadastro.email,
        (v) => setCamposCadastro((p) => ({ ...p, email: v })),
        { icone: 'mail', keyboardType: 'email-address', autoCapitalize: 'none' }
      )}

      {renderInput(
        'Senha',
        camposCadastro.senha,
        (v) => setCamposCadastro((p) => ({ ...p, senha: v })),
        {
          icone: 'lock',
          senha: true,
          senhaVisivel: senhaVisivel,
          aoAlternarSenha: () => setSenhaVisivel((v) => !v),
        }
      )}

      {renderInput(
        'Confirmar senha',
        camposCadastro.confirmarSenha,
        (v) => setCamposCadastro((p) => ({ ...p, confirmarSenha: v })),
        {
          icone: 'check-circle',
          senha: true,
          senhaVisivel: confirmarSenhaVisivel,
          aoAlternarSenha: () => setConfirmarSenhaVisivel((v) => !v),
        }
      )}

      {erroMensagem ? <Text style={estilos.textoErro}>{erroMensagem}</Text> : null}

      <TouchableOpacity
        style={estilos.botaoPrincipal}
        onPress={handleAcaoPrincipal}
        activeOpacity={0.85}
        disabled={carregando}
        accessibilityLabel="Criar conta"
      >
        {carregando ? (
          <ActivityIndicator color={ShelloTema.cores.superficie} size="small" />
        ) : (
          <Text style={estilos.textoBotaoPrincipal}>Criar conta</Text>
        )}
      </TouchableOpacity>

      <View style={estilos.linksContainer}>
        <TouchableOpacity
          onPress={() => trocarFormulario('login')}
          accessibilityLabel="Voltar ao login"
        >
          <Text style={estilos.link}>Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Formulário de Recuperação de Senha ──────────────────────────────────

  const renderFormularioRecuperar = () => (
    <View style={estilos.formulario}>
      <Text style={estilos.tituloFormulario}>Recuperar acesso</Text>
      <Text style={estilos.subtituloFormulario}>
        Enviaremos um link de redefinição para o seu e-mail
      </Text>

      {renderInput(
        'E-mail cadastrado',
        camposRecuperar.email,
        (v) => setCamposRecuperar({ email: v }),
        { icone: 'mail', keyboardType: 'email-address', autoCapitalize: 'none' }
      )}

      <TouchableOpacity
        style={estilos.botaoPrincipal}
        onPress={handleAcaoPrincipal}
        activeOpacity={0.85}
        disabled={carregando}
        accessibilityLabel="Enviar link de recuperação"
      >
        {carregando ? (
          <ActivityIndicator color={ShelloTema.cores.superficie} size="small" />
        ) : (
          <Text style={estilos.textoBotaoPrincipal}>Enviar link</Text>
        )}
      </TouchableOpacity>

      <View style={estilos.linksContainer}>
        <TouchableOpacity
          onPress={() => trocarFormulario('login')}
          accessibilityLabel="Voltar ao login"
        >
          <Text style={estilos.link}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Seleção do formulário ativo ──────────────────────────────────────────

  const renderFormularioAtivo = () => {
    switch (formularioAtivo) {
      case 'login':
        return renderFormularioLogin();
      case 'cadastro':
        return renderFormularioCadastro();
      case 'recuperar':
        return renderFormularioRecuperar();
    }
  };

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
          {renderCabecalho()}

          {/* Contêiner animado para transição entre formulários */}
          <Animated.View style={[estilos.formularioContainer, { opacity: opacidadeAnimada }]}>
            {renderFormularioAtivo()}
          </Animated.View>

          {/* Rodapé com assinatura */}
          <View style={estilos.rodape}>
            <Text style={estilos.textoRodape}>Shello • Seu crescimento começa aqui 🐢</Text>
          </View>
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

  // Cabeçalho e logo
  cabecalho: {
    alignItems: 'center',
    paddingTop: ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.lg,
  },
  logoContainer: {
    marginBottom: ShelloTema.espacamento.md,
    alignItems: 'center',
  },
  logoImagem: {
    width: 130,
    height: 130,
    borderRadius: 65,
    // Borda suave ao redor da logo circular
    borderWidth: 3,
    borderColor: ShelloTema.cores.marcaClaro,
    // Sombra suave
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
  titulo: {
    fontSize: 32,
    fontFamily: ShelloTema.tipografia.titulo,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    letterSpacing: 1.5,
    marginBottom: ShelloTema.espacamento.xs,
  },
  subtitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.textoS,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: ShelloTema.tipografia.alturaLinha,
  },

  // Container do formulário animado
  formularioContainer: {
    flex: 1,
  },

  // Formulário geral
  formulario: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaGrande,
    padding: ShelloTema.espacamento.lg,
    // Sombra suave do card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: ShelloTema.espacamento.md,
  },
  tituloFormulario: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
  },
  subtituloFormulario: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.textoS,
    marginBottom: ShelloTema.espacamento.lg,
    lineHeight: ShelloTema.tipografia.alturaLinha,
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPill,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
    marginBottom: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.md,
    height: 52,
    // Sombra ultra-suave nos inputs
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcone: {
    marginRight: ShelloTema.espacamento.sm,
  },
  input: {
    flex: 1,
    fontSize: ShelloTema.tipografia.tamanhos.normal,
    color: ShelloTema.cores.textoP,
    paddingVertical: 0,
  },
  inputComIcone: {
    paddingLeft: ShelloTema.espacamento.xs,
  },
  botaoOlho: {
    padding: ShelloTema.espacamento.xs,
    marginLeft: ShelloTema.espacamento.xs,
  },

  // Botão principal
  botaoPrincipal: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.md,
    // Sombra colorida do botão
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  textoBotaoPrincipal: {
    color: ShelloTema.cores.superficie,
    fontSize: ShelloTema.tipografia.tamanhos.normal,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    letterSpacing: 0.5,
  },

  // Links de alternância
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    paddingTop: ShelloTema.espacamento.xs,
  },
  link: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.marca,
    fontWeight: ShelloTema.tipografia.pesos.medio,
    textDecorationLine: 'underline',
  },
  separadorLink: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ShelloTema.cores.textoS,
    opacity: 0.4,
  },

  textoErro: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.erro,
    marginBottom: ShelloTema.espacamento.sm,
    textAlign: 'center',
  },

  rodape: {
    alignItems: 'center',
    paddingTop: ShelloTema.espacamento.lg,
  },
  textoRodape: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    opacity: 0.7,
  },
});
