import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/domain/erro_regra_negocio.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../../../shared/widgets/shello_logo.dart';
import '../domain/validadores_auth.dart';
import 'sessao_providers.dart';

enum _Formulario { login, cadastro, recuperar }

/// Login, cadastro e recuperação de senha. A autenticação é simulada e local.
class TelaAutenticacao extends ConsumerStatefulWidget {
  const TelaAutenticacao({super.key});

  @override
  ConsumerState<TelaAutenticacao> createState() => _TelaAutenticacaoState();
}

class _TelaAutenticacaoState extends ConsumerState<TelaAutenticacao> {
  _Formulario _ativo = _Formulario.login;
  bool _carregando = false;
  bool _senhaVisivel = false;
  bool _confirmacaoVisivel = false;
  String? _erro;
  String? _aviso;

  final _email = TextEditingController();
  final _senha = TextEditingController();
  final _nome = TextEditingController();
  final _confirmacao = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _senha.dispose();
    _nome.dispose();
    _confirmacao.dispose();
    super.dispose();
  }

  void _trocar(_Formulario destino) {
    setState(() {
      _ativo = destino;
      _erro = null;
      _aviso = null;
    });
  }

  Future<void> _enviar() async {
    if (_carregando) return;
    final erro = switch (_ativo) {
      _Formulario.login => validarLogin(email: _email.text, senha: _senha.text),
      _Formulario.cadastro => validarCadastro(
        nome: _nome.text,
        email: _email.text,
        senha: _senha.text,
        confirmacao: _confirmacao.text,
      ),
      _Formulario.recuperar => validarRecuperacao(_email.text),
    };
    if (erro != null) {
      setState(() {
        _erro = erro;
        _aviso = null;
      });
      return;
    }

    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final sessao = ref.read(sessaoProvider.notifier);
      switch (_ativo) {
        case _Formulario.login:
          await sessao.entrar(_email.text.trim(), _senha.text);
        case _Formulario.cadastro:
          await sessao.registrar(
            nome: _nome.text.trim(),
            email: _email.text.trim(),
            senha: _senha.text,
          );
        case _Formulario.recuperar:
          setState(() {
            _aviso =
                'Se o e-mail estiver cadastrado, você receberá um link em breve. '
                'Nesta versão de demonstração nenhum e-mail é enviado.';
          });
      }
    } on ErroRegraNegocio catch (e) {
      if (mounted) setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, restricoes) => SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.lg),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: restricoes.maxHeight),
              child: IntrinsicHeight(
                child: Column(
                  children: [
                    const SizedBox(height: ShelloEspaco.xl),
                    const ShelloLogo(tamanho: 130, comBorda: true, borda: 3),
                    const SizedBox(height: ShelloEspaco.md),
                    Text(
                      'Shello',
                      style: TextStyle(
                        color: cores.textoP,
                        fontFamily: ShelloTipo.titulo,
                        fontSize: ShelloTipo.gigante,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: ShelloEspaco.xs),
                    Text(
                      'Seu companheiro pessoal de crescimento',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: cores.textoS,
                        fontStyle: FontStyle.italic,
                        fontSize: ShelloTipo.pequeno,
                      ),
                    ),
                    const SizedBox(height: ShelloEspaco.lg),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: KeyedSubtree(
                        key: ValueKey(_ativo),
                        child: _cartao(),
                      ),
                    ),
                    const Spacer(),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: ShelloEspaco.lg,
                      ),
                      child: Text(
                        'Shello • Seu crescimento começa aqui 🐢',
                        style: TextStyle(
                          color: cores.textoS.withValues(alpha: 0.7),
                          fontSize: ShelloTipo.minusculo,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _cartao() {
    final cores = context.cores;
    final (titulo, subtitulo, rotuloBotao) = switch (_ativo) {
      _Formulario.login => (
        'Bem-vindo de volta!',
        'Entre na sua conta para continuar',
        'Entrar',
      ),
      _Formulario.cadastro => (
        'Crie sua conta',
        'Comece sua jornada de crescimento',
        'Criar conta',
      ),
      _Formulario.recuperar => (
        'Recuperar acesso',
        'Enviaremos um link de redefinição para o seu e-mail',
        'Enviar link',
      ),
    };

    final campos = <Widget>[];
    if (_ativo == _Formulario.cadastro) {
      campos.add(
        ShelloCampo(
          chave: const Key('campo-nome'),
          controller: _nome,
          dica: 'Qual seu nome?',
          icone: Icons.person_outline,
          capitalizacao: TextCapitalization.words,
        ),
      );
    }
    campos.add(
      ShelloCampo(
        chave: const Key('campo-email'),
        controller: _email,
        dica: _ativo == _Formulario.recuperar ? 'E-mail cadastrado' : 'E-mail',
        icone: Icons.mail_outline,
        teclado: TextInputType.emailAddress,
      ),
    );
    if (_ativo == _Formulario.login || _ativo == _Formulario.cadastro) {
      campos.add(
        ShelloCampo(
          chave: const Key('campo-senha'),
          controller: _senha,
          dica: 'Senha',
          icone: Icons.lock_outline,
          senha: true,
          senhaVisivel: _senhaVisivel,
          aoAlternarSenha: () => setState(() => _senhaVisivel = !_senhaVisivel),
        ),
      );
    }
    if (_ativo == _Formulario.cadastro) {
      campos.add(
        ShelloCampo(
          chave: const Key('campo-confirmacao'),
          controller: _confirmacao,
          dica: 'Confirmar senha',
          icone: Icons.check_circle_outline,
          senha: true,
          senhaVisivel: _confirmacaoVisivel,
          aoAlternarSenha: () =>
              setState(() => _confirmacaoVisivel = !_confirmacaoVisivel),
        ),
      );
    }

    return ShelloCard(
      raio: ShelloForma.bordaGrande,
      padding: const EdgeInsets.all(ShelloEspaco.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            titulo,
            style: TextStyle(
              color: cores.textoP,
              fontSize: ShelloTipo.medio,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: ShelloEspaco.xs),
          Text(
            subtitulo,
            style: TextStyle(
              color: cores.textoS,
              fontSize: ShelloTipo.pequeno,
              height: 1.5,
            ),
          ),
          const SizedBox(height: ShelloEspaco.lg),
          for (final campo in campos)
            Padding(
              padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
              child: campo,
            ),
          if (_erro != null)
            Padding(
              padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
              child: Text(
                _erro!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: cores.erro,
                  fontSize: ShelloTipo.pequeno,
                ),
              ),
            ),
          if (_aviso != null)
            Padding(
              padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
              child: Text(
                _aviso!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                  height: 1.45,
                ),
              ),
            ),
          ShelloBotaoPrincipal(
            key: const Key('botao-principal-auth'),
            rotulo: rotuloBotao,
            carregando: _carregando,
            onPressed: _enviar,
          ),
          const SizedBox(height: ShelloEspaco.sm),
          _links(),
        ],
      ),
    );
  }

  Widget _links() {
    final cores = context.cores;
    final estilo = TextStyle(
      color: cores.marca,
      fontSize: ShelloTipo.pequeno,
      fontWeight: FontWeight.w500,
      decoration: TextDecoration.underline,
    );
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: ShelloEspaco.sm,
      children: switch (_ativo) {
        _Formulario.login => [
          _Link(
            rotulo: 'Criar conta',
            estilo: estilo,
            chave: const Key('alternar-cadastro'),
            aoTocar: () => _trocar(_Formulario.cadastro),
          ),
          Text('·', style: TextStyle(color: cores.textoS)),
          _Link(
            rotulo: 'Esqueci a senha',
            estilo: estilo,
            chave: const Key('alternar-recuperar'),
            aoTocar: () => _trocar(_Formulario.recuperar),
          ),
        ],
        _Formulario.cadastro => [
          _Link(
            rotulo: 'Já tenho conta',
            estilo: estilo,
            chave: const Key('alternar-login'),
            aoTocar: () => _trocar(_Formulario.login),
          ),
        ],
        _Formulario.recuperar => [
          _Link(
            rotulo: 'Voltar ao login',
            estilo: estilo,
            chave: const Key('alternar-login'),
            aoTocar: () => _trocar(_Formulario.login),
          ),
        ],
      },
    );
  }
}

class _Link extends StatelessWidget {
  const _Link({
    required this.rotulo,
    required this.estilo,
    required this.aoTocar,
    required this.chave,
  });

  final String rotulo;
  final TextStyle estilo;
  final VoidCallback aoTocar;
  final Key chave;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      key: chave,
      onTap: aoTocar,
      borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: ShelloEspaco.sm,
          vertical: ShelloEspaco.xs,
        ),
        child: Text(rotulo, style: estilo),
      ),
    );
  }
}
