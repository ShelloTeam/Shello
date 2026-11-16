import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../shared/widgets/shello_avatar.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../../chat/domain/motor_respostas.dart';
import '../../preferencias/presentation/preferencias_providers.dart';
import '../domain/dados_onboarding.dart';

class _Passo {
  const _Passo({
    required this.expressao,
    required this.titulo,
    required this.descricao,
    required this.dica,
    this.multilinha = false,
  });

  final ExpressaoShello expressao;
  final String titulo;
  final String descricao;
  final String dica;
  final bool multilinha;
}

const List<_Passo> _passos = [
  _Passo(
    expressao: ExpressaoShello.feliz,
    titulo: 'Como prefere ser chamado?',
    descricao: 'Seu nome vai tornar a experiência mais pessoal e acolhedora.',
    dica: 'Ex: Ana, João, Duda...',
  ),
  _Passo(
    expressao: ExpressaoShello.neutro,
    titulo: 'Como descreveria seu estilo de vida?',
    descricao:
        'Isso me ajuda a entender melhor como posso te apoiar no dia a dia.',
    dica:
        'Ex: Trabalho muito, tenho pouco tempo para mim, estou em transição...',
    multilinha: true,
  ),
  _Passo(
    expressao: ExpressaoShello.duvidoso,
    titulo: 'O que está tentando melhorar agora?',
    descricao: 'Sua meta principal vai guiar os nossos próximos passos juntos.',
    dica: 'Ex: Ter mais foco, dormir melhor, criar uma rotina saudável...',
    multilinha: true,
  ),
];

/// Três etapas que coletam nome, estilo de vida e meta. Dados ficam no aparelho.
class TelaOnboarding extends ConsumerStatefulWidget {
  const TelaOnboarding({super.key});

  @override
  ConsumerState<TelaOnboarding> createState() => _TelaOnboardingState();
}

class _TelaOnboardingState extends ConsumerState<TelaOnboarding> {
  final _controles = List.generate(
    _passos.length,
    (_) => TextEditingController(),
  );
  final _pagina = PageController();
  int _indice = 0;
  bool _salvando = false;

  @override
  void dispose() {
    for (final c in _controles) {
      c.dispose();
    }
    _pagina.dispose();
    super.dispose();
  }

  Future<void> _avancar() async {
    if (_salvando) return;
    if (_indice < _passos.length - 1) {
      setState(() => _indice++);
      await _pagina.animateToPage(
        _indice,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
      );
      return;
    }
    setState(() => _salvando = true);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    await ref
        .read(preferenciasProvider.notifier)
        .concluirOnboarding(
          DadosOnboarding(
            nome: _controles[0].text,
            estiloDeVida: _controles[1].text,
            metaAtual: _controles[2].text,
          ),
        );
  }

  Future<void> _voltar() async {
    if (_indice == 0 || _salvando) return;
    setState(() => _indice--);
    await _pagina.animateToPage(
      _indice,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final ultimo = _indice == _passos.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.lg),
          child: Column(
            children: [
              const SizedBox(height: ShelloEspaco.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const ShelloAvatar(
                    expressao: ExpressaoShello.feliz,
                    tamanho: 40,
                  ),
                  const SizedBox(width: ShelloEspaco.sm),
                  Text(
                    'Shello',
                    style: TextStyle(
                      color: cores.textoP,
                      fontFamily: ShelloTipo.titulo,
                      fontSize: ShelloTipo.medio,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: ShelloEspaco.md),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < _passos.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: i == _indice ? 24 : 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: i == _indice ? cores.marca : cores.marcaClaro,
                        borderRadius: ShelloForma.raio(5),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: ShelloEspaco.sm),
              Text(
                'Etapa ${_indice + 1} de ${_passos.length}',
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.minusculo,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: ShelloEspaco.md),
              Expanded(
                child: ShelloCard(
                  raio: ShelloForma.bordaGrande,
                  padding: const EdgeInsets.all(ShelloEspaco.lg),
                  child: PageView.builder(
                    controller: _pagina,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _passos.length,
                    itemBuilder: (context, indice) => _conteudoPasso(indice),
                  ),
                ),
              ),
              const SizedBox(height: ShelloEspaco.lg),
              Row(
                children: [
                  if (_indice > 0) ...[
                    TextButton.icon(
                      onPressed: _voltar,
                      icon: Icon(
                        Icons.arrow_back,
                        size: 18,
                        color: cores.textoS,
                      ),
                      label: Text(
                        'Voltar',
                        style: TextStyle(
                          color: cores.textoS,
                          fontSize: ShelloTipo.pequeno,
                        ),
                      ),
                    ),
                    const SizedBox(width: ShelloEspaco.sm),
                  ],
                  Expanded(
                    child: ShelloBotaoPrincipal(
                      key: const Key('botao-proximo-onboarding'),
                      rotulo: _salvando
                          ? 'Salvando...'
                          : (ultimo ? 'Concluir' : 'Próximo'),
                      icone: ultimo ? Icons.check : Icons.arrow_forward,
                      carregando: _salvando,
                      onPressed: _avancar,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: ShelloEspaco.md),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.lock_outline,
                    size: 13,
                    color: cores.textoS.withValues(alpha: 0.65),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Suas informações ficam salvas apenas no seu dispositivo',
                    style: TextStyle(
                      color: cores.textoS.withValues(alpha: 0.65),
                      fontSize: ShelloTipo.minusculo,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: ShelloEspaco.md),
            ],
          ),
        ),
      ),
    );
  }

  Widget _conteudoPasso(int indice) {
    final cores = context.cores;
    final passo = _passos[indice];
    return LayoutBuilder(
      builder: (context, restricoes) => SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: restricoes.maxHeight),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ShelloAvatar(expressao: passo.expressao, tamanho: 112),
              const SizedBox(height: ShelloEspaco.lg),
              Text(
                passo.titulo,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: cores.textoP,
                  fontSize: ShelloTipo.medio,
                  fontWeight: FontWeight.w700,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: ShelloEspaco.sm),
              Text(
                passo.descricao,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: ShelloEspaco.lg),
              ShelloCampo(
                chave: indice == 0
                    ? const Key('campo-onboarding')
                    : Key('campo-onboarding-$indice'),
                controller: _controles[indice],
                dica: passo.dica,
                linhas: passo.multilinha ? 4 : 1,
                altura: passo.multilinha ? 120 : 52,
                capitalizacao: indice == 0
                    ? TextCapitalization.words
                    : TextCapitalization.sentences,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
