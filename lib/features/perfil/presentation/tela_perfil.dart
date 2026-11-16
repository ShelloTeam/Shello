import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/domain/formalidade.dart';
import '../../../core/mocks/restauracao_demonstracao.dart';
import '../../../core/providers.dart';
import '../../../shared/widgets/shello_avatar.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../../../shared/widgets/shello_logo.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../../chat/domain/motor_respostas.dart';
import '../../chat/presentation/chat_providers.dart';
import '../../diario/presentation/diario_providers.dart';
import '../../preferencias/domain/preferencias_usuario.dart';
import '../../preferencias/presentation/preferencias_providers.dart';
import '../../tarefas/presentation/tarefas_providers.dart';
import 'cartao_memoria.dart';
import 'perfil_providers.dart';

/// Perfil: nome de referência, formalidade, tema, memórias, demonstração e conta.
class TelaPerfil extends ConsumerStatefulWidget {
  const TelaPerfil({super.key});

  @override
  ConsumerState<TelaPerfil> createState() => _TelaPerfilState();
}

class _TelaPerfilState extends ConsumerState<TelaPerfil> {
  final _nome = TextEditingController();
  bool _nomeInicializado = false;

  @override
  void dispose() {
    _nome.dispose();
    super.dispose();
  }

  Future<void> _salvarNome() async {
    final nome = _nome.text.trim();
    if (nome.isEmpty) return;
    await ref.read(preferenciasProvider.notifier).definirNomeReferencia(nome);
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (contexto) {
        final cores = contexto.cores;
        return Dialog(
          backgroundColor: cores.superficie,
          shape: RoundedRectangleBorder(
            borderRadius: ShelloForma.raio(ShelloForma.bordaMedia),
          ),
          child: Padding(
            padding: const EdgeInsets.all(ShelloEspaco.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const ShelloAvatar(
                  expressao: ExpressaoShello.feliz,
                  tamanho: 72,
                ),
                const SizedBox(height: ShelloEspaco.md),
                Text(
                  'Nome salvo!',
                  style: TextStyle(
                    color: cores.textoP,
                    fontFamily: ShelloTipo.titulo,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: ShelloEspaco.sm),
                Text.rich(
                  TextSpan(
                    style: TextStyle(
                      color: cores.textoS,
                      fontSize: 15,
                      height: 1.45,
                    ),
                    children: [
                      const TextSpan(text: 'O Shello vai te chamar de '),
                      TextSpan(
                        text: '"$nome"',
                        style: TextStyle(
                          color: cores.marca,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const TextSpan(text: ' agora. 🌿'),
                    ],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: ShelloEspaco.lg),
                ShelloBotaoPrincipal(
                  rotulo: 'Entendido',
                  onPressed: () => Navigator.of(contexto).pop(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _restaurarDemonstracao() async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Restaurar demonstração',
      mensagem:
          'Os diários, tarefas, rotinas, memórias e conversas voltam aos dados de exemplo. '
          'Suas alterações serão perdidas.',
      rotuloConfirmar: 'Restaurar',
      destrutivo: true,
    );
    if (!confirmado) return;
    await restaurarDemonstracao(
      store: ref.read(keyValueStoreProvider),
      relogio: ref.read(relogioProvider),
    );
    ref.invalidate(preferenciasProvider);
    ref.invalidate(entradasProvider);
    ref.invalidate(memoriasProvider);
    ref.invalidate(tarefasProvider);
    ref.invalidate(rotinasProvider);
    ref.invalidate(chatProvider);
    if (mounted) mostrarAviso(context, 'Dados de demonstração restaurados.');
  }

  Future<void> _sair() async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Sair da conta',
      mensagem: 'Deseja mesmo sair?\nVocê precisará fazer login novamente.',
      rotuloConfirmar: 'Sim, sair',
      rotuloCancelar: 'Cancelar',
      destrutivo: true,
    );
    if (confirmado) {
      await ref.read(sessaoProvider.notifier).sair();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final preferencias = ref.watch(preferenciasProvider);
    final sessao = ref.watch(sessaoProvider);
    final memorias = ref.watch(memoriasProvider);
    final rotinas = ref.watch(rotinasProvider);
    final nomeAtual = preferencias.nomeReferencia.isNotEmpty
        ? preferencias.nomeReferencia
        : (sessao?.nome ?? '');
    if (!_nomeInicializado && nomeAtual.isNotEmpty) {
      _nome.text = nomeAtual;
      _nomeInicializado = true;
    }

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            ShelloEspaco.lg,
            ShelloEspaco.lg,
            ShelloEspaco.lg,
            ShelloEspaco.xl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Column(
                children: [
                  ShelloLogo(tamanho: 88, comBorda: true, borda: 3),
                  const SizedBox(height: ShelloEspaco.md),
                  Text(
                    nomeAtual.isEmpty ? 'Meu Perfil' : nomeAtual,
                    style: TextStyle(
                      color: cores.textoP,
                      fontFamily: ShelloTipo.titulo,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: ShelloEspaco.xs),
                  Text(
                    'Meu Perfil & Contexto da IA',
                    style: TextStyle(
                      color: cores.textoS,
                      fontSize: ShelloTipo.pequeno,
                    ),
                  ),
                  const SizedBox(height: ShelloEspaco.lg),
                ],
              ),
              _Secao(
                titulo: 'Como o Shello te chama',
                descricao:
                    'Personalize o nome usado pelo Shello ao se dirigir a você',
                child: Row(
                  children: [
                    Expanded(
                      child: ShelloCampo(
                        chave: const Key('campo-nome-referencia'),
                        controller: _nome,
                        dica: 'Como o Shello deve te chamar?',
                        maximo: PreferenciasUsuario.limiteNomeReferencia,
                        altura: 46,
                        capitalizacao: TextCapitalization.words,
                        aoEnviar: (_) => _salvarNome(),
                      ),
                    ),
                    const SizedBox(width: ShelloEspaco.sm),
                    ShelloBotaoPrincipal(
                      key: const Key('botao-salvar-nome'),
                      rotulo: 'Salvar',
                      altura: 46,
                      expandido: false,
                      onPressed: _salvarNome,
                    ),
                  ],
                ),
              ),
              _Secao(
                titulo: 'Personalidade da IA',
                descricao: 'Escolha como o Shello deve se comunicar com você',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        for (final formalidade in Formalidade.values)
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                              ),
                              child: _OpcaoFormalidade(
                                chave: Key('formalidade-${formalidade.name}'),
                                rotulo: formalidade.rotulo,
                                selecionada:
                                    preferencias.formalidade == formalidade,
                                aoTocar: () => ref
                                    .read(preferenciasProvider.notifier)
                                    .definirFormalidade(formalidade),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: ShelloEspaco.md),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: ShelloEspaco.md,
                        vertical: ShelloEspaco.sm,
                      ),
                      decoration: BoxDecoration(
                        color: cores.fundo,
                        borderRadius: ShelloForma.raio(
                          ShelloForma.bordaPequena,
                        ),
                      ),
                      child: Text(
                        preferencias.formalidade.descricao,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: cores.textoS,
                          fontSize: ShelloTipo.pequeno,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              _Secao(
                titulo: 'Tema',
                descricao:
                    'Claro ou escuro, sincronizado com a sua preferência salva',
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        preferencias.tema == TemaApp.escuro
                            ? 'Modo escuro ativado'
                            : 'Modo claro',
                        style: TextStyle(
                          color: cores.textoP,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Switch(
                      key: const Key('alternar-tema'),
                      value: preferencias.tema == TemaApp.escuro,
                      activeThumbColor: cores.marca,
                      onChanged: (escuro) => ref
                          .read(preferenciasProvider.notifier)
                          .definirTema(escuro ? TemaApp.escuro : TemaApp.claro),
                    ),
                  ],
                ),
              ),
              _Secao(
                titulo: 'O que o Shello sabe sobre você',
                descricao:
                    '${memorias.length} ${memorias.length == 1 ? 'memória registrada' : 'memórias registradas'}',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (memorias.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: ShelloEspaco.md,
                        ),
                        child: Text(
                          'Nenhuma memória ainda. O Shello aprende sobre você conforme vocês conversam.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: cores.textoS,
                            fontSize: ShelloTipo.pequeno,
                            height: 1.45,
                          ),
                        ),
                      )
                    else
                      for (final memoria in memorias.take(5))
                        Padding(
                          padding: const EdgeInsets.only(
                            bottom: ShelloEspaco.sm,
                          ),
                          child: CartaoMemoria(memoria: memoria),
                        ),
                    if (memorias.length > 5 || memorias.isNotEmpty)
                      OutlinedButton(
                        key: const Key('botao-ver-memorias'),
                        onPressed: () => context.push(Rotas.memorias),
                        style: OutlinedButton.styleFrom(
                          shape: StadiumBorder(
                            side: BorderSide(
                              color: cores.marca.withValues(alpha: 0.3),
                            ),
                          ),
                          foregroundColor: cores.marca,
                        ),
                        child: Text('Ver todas as ${memorias.length} memórias'),
                      ),
                  ],
                ),
              ),
              _Secao(
                titulo: 'Rotinas',
                descricao:
                    '${rotinas.length} ${rotinas.length == 1 ? 'rotina criada' : 'rotinas criadas'}',
                child: OutlinedButton(
                  key: const Key('botao-gerenciar-rotinas'),
                  onPressed: () => context.go(Rotas.tarefas),
                  style: OutlinedButton.styleFrom(
                    shape: StadiumBorder(
                      side: BorderSide(
                        color: cores.marca.withValues(alpha: 0.3),
                      ),
                    ),
                    foregroundColor: cores.marca,
                  ),
                  child: const Text('Gerenciar rotinas em Tarefas'),
                ),
              ),
              if (sessao?.ehDemonstracao ?? false)
                _Secao(
                  titulo: 'Dados de demonstração',
                  descricao: 'Volte aos dados de exemplo para testar o aplicativo do zero.',
                  child: OutlinedButton.icon(
                    key: const Key('botao-restaurar-demo'),
                    onPressed: _restaurarDemonstracao,
                    icon: const Icon(Icons.restore, size: 18),
                    label: const Text('Restaurar demonstração'),
                    style: OutlinedButton.styleFrom(
                      shape: StadiumBorder(
                        side: BorderSide(
                          color: cores.marca.withValues(alpha: 0.3),
                        ),
                      ),
                      foregroundColor: cores.marca,
                    ),
                  ),
                ),
              _Secao(
                titulo: 'Conta',
                child: Column(
                  children: [
                    _LinhaConta(
                      icone: Icons.person_outline,
                      rotulo: 'Nome',
                      valor: nomeAtual.isEmpty ? '—' : nomeAtual,
                    ),
                    _LinhaConta(
                      icone: Icons.mail_outline,
                      rotulo: 'E-mail',
                      valor: sessao?.email ?? '—',
                    ),
                    const _LinhaConta(
                      icone: Icons.info_outline,
                      rotulo: 'Versão',
                      valor: 'v1.0.0 — Beta',
                    ),
                    const SizedBox(height: ShelloEspaco.sm),
                    GestureDetector(
                      key: const Key('botao-sair'),
                      onTap: _sair,
                      child: Container(
                        height: 50,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: cores.terracota,
                          borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.logout,
                              size: 18,
                              color: cores.terracotaTitulo,
                            ),
                            const SizedBox(width: ShelloEspaco.sm),
                            Text(
                              'Sair da conta',
                              style: TextStyle(
                                color: cores.terracotaTitulo,
                                fontSize: ShelloTipo.normal,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Secao extends StatelessWidget {
  const _Secao({required this.titulo, required this.child, this.descricao});

  final String titulo;
  final String? descricao;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
      child: ShelloCard(
        padding: const EdgeInsets.all(ShelloEspaco.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              titulo,
              style: TextStyle(
                color: cores.textoP,
                fontSize: ShelloTipo.medio - 2,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (descricao != null) ...[
              const SizedBox(height: 4),
              Text(
                descricao!,
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ],
            const SizedBox(height: ShelloEspaco.md),
            child,
          ],
        ),
      ),
    );
  }
}

class _OpcaoFormalidade extends StatelessWidget {
  const _OpcaoFormalidade({
    required this.chave,
    required this.rotulo,
    required this.selecionada,
    required this.aoTocar,
  });

  final Key chave;
  final String rotulo;
  final bool selecionada;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Semantics(
      button: true,
      selected: selecionada,
      label: 'Nível de formalidade: $rotulo',
      child: GestureDetector(
        key: chave,
        behavior: HitTestBehavior.opaque,
        onTap: aoTocar,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: ShelloEspaco.sm),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selecionada ? cores.marca : cores.superficie,
            borderRadius: ShelloForma.raio(50),
            border: Border.all(color: selecionada ? cores.marca : cores.textoS),
          ),
          child: Text(
            rotulo,
            style: TextStyle(
              color: selecionada ? cores.textoSobreMarca : cores.textoS,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

class _LinhaConta extends StatelessWidget {
  const _LinhaConta({
    required this.icone,
    required this.rotulo,
    required this.valor,
  });

  final IconData icone;
  final String rotulo;
  final String valor;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: cores.marcaClaro,
              shape: BoxShape.circle,
            ),
            child: Icon(icone, size: 18, color: cores.marca),
          ),
          const SizedBox(width: ShelloEspaco.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rotulo,
                  style: TextStyle(
                    color: cores.textoS,
                    fontSize: ShelloTipo.minusculo,
                  ),
                ),
                Text(
                  valor,
                  style: TextStyle(
                    color: cores.textoP,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
