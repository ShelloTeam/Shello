import 'package:material_ui/material_ui.dart';

import '../../app/theme/shello_theme.dart';
import '../../app/theme/shello_tokens.dart';
import '../../features/chat/domain/motor_respostas.dart';
import 'shello_avatar.dart';

/// Card branco arredondado com sombra suave, base de quase toda a interface.
class ShelloCard extends StatelessWidget {
  const ShelloCard({
    super.key,
    required this.child,
    this.cor,
    this.raio = ShelloForma.bordaMedia,
    this.padding = const EdgeInsets.all(ShelloEspaco.md),
    this.borda,
    this.faixaEsquerda,
    this.sombra = true,
    this.onTap,
  });

  final Widget child;
  final Color? cor;
  final double raio;
  final EdgeInsetsGeometry padding;

  /// Contorno completo opcional.
  final BorderSide? borda;

  /// Faixa colorida na borda esquerda (usada para tarefas atrasadas).
  final BorderSide? faixaEsquerda;
  final bool sombra;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final decoracao = BoxDecoration(
      color: cor ?? cores.superficie,
      borderRadius: ShelloForma.raio(raio),
      boxShadow: sombra ? ShelloSombra.suave(cores.textoP) : null,
      border: borda == null
          ? null
          : Border.all(color: borda!.color, width: borda!.width),
    );
    final conteudo = Padding(padding: padding, child: child);
    final faixa = faixaEsquerda;
    final corpo = faixa == null
        ? DecoratedBox(decoration: decoracao, child: conteudo)
        : Stack(
            children: [
              Positioned.fill(child: DecoratedBox(decoration: decoracao)),
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: ShelloForma.raio(raio),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Container(width: faixa.width, color: faixa.color),
                  ),
                ),
              ),
              conteudo,
            ],
          );
    if (onTap == null) return corpo;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: ShelloForma.raio(raio),
        onTap: onTap,
        child: corpo,
      ),
    );
  }
}

/// Botão principal em formato de pílula, com estado de carregamento.
class ShelloBotaoPrincipal extends StatelessWidget {
  const ShelloBotaoPrincipal({
    super.key,
    required this.rotulo,
    this.onPressed,
    this.carregando = false,
    this.icone,
    this.altura = 52,
    this.expandido = true,
    this.compacto = false,
  });

  final String rotulo;
  final VoidCallback? onPressed;
  final bool carregando;
  final IconData? icone;
  final double altura;
  final bool expandido;

  /// Versão menor para barras de ação com dois botões lado a lado.
  final bool compacto;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final ativo = onPressed != null && !carregando;
    final botao = AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: ativo || carregando ? 1 : 0.55,
      child: Container(
        height: altura,
        padding: EdgeInsets.symmetric(
          horizontal: compacto ? ShelloEspaco.sm + 4 : ShelloEspaco.lg,
        ),
        decoration: BoxDecoration(
          color: cores.marca,
          borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
          boxShadow: [
            BoxShadow(
              color: cores.marca.withValues(alpha: 0.3),
              offset: const Offset(0, 4),
              blurRadius: 12,
            ),
          ],
        ),
        alignment: Alignment.center,
        child: carregando
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: cores.textoSobreMarca,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    rotulo,
                    style: TextStyle(
                      color: cores.textoSobreMarca,
                      fontSize: compacto
                          ? ShelloTipo.pequeno
                          : ShelloTipo.normal,
                      fontWeight: FontWeight.w700,
                      letterSpacing: compacto ? 0.2 : 0.5,
                    ),
                  ),
                  if (icone != null) ...[
                    SizedBox(
                      width: compacto ? ShelloEspaco.xs : ShelloEspaco.sm,
                    ),
                    Icon(
                      icone,
                      size: compacto ? 16 : 18,
                      color: cores.textoSobreMarca,
                    ),
                  ],
                ],
              ),
      ),
    );
    return Semantics(
      button: true,
      enabled: ativo,
      label: rotulo,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: ativo ? onPressed : null,
        child: expandido
            ? SizedBox(width: double.infinity, child: botao)
            : botao,
      ),
    );
  }
}

/// Botão de contorno em pílula, para ações secundárias.
class ShelloBotaoSecundario extends StatelessWidget {
  const ShelloBotaoSecundario({
    super.key,
    required this.rotulo,
    this.onPressed,
    this.icone,
  });

  final String rotulo;
  final VoidCallback? onPressed;
  final IconData? icone;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Semantics(
      button: true,
      label: rotulo,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onPressed,
        child: Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.md),
          decoration: BoxDecoration(
            color: cores.fundo,
            borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
            border: Border.all(color: cores.marcaClaro, width: 1.5),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icone != null) ...[
                Icon(icone, size: 16, color: cores.textoS),
                const SizedBox(width: ShelloEspaco.xs),
              ],
              Text(
                rotulo,
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Campo de texto em pílula com ícone opcional e alternância de senha.
class ShelloCampo extends StatelessWidget {
  const ShelloCampo({
    super.key,
    required this.controller,
    required this.dica,
    this.icone,
    this.senha = false,
    this.senhaVisivel = false,
    this.aoAlternarSenha,
    this.teclado,
    this.capitalizacao = TextCapitalization.none,
    this.maximo,
    this.linhas = 1,
    this.altura = 52,
    this.aoMudar,
    this.acaoTeclado,
    this.aoEnviar,
    this.autofocus = false,
    this.chave,
  });

  final TextEditingController controller;
  final String dica;
  final IconData? icone;
  final bool senha;
  final bool senhaVisivel;
  final VoidCallback? aoAlternarSenha;
  final TextInputType? teclado;
  final TextCapitalization capitalizacao;
  final int? maximo;
  final int linhas;
  final double altura;
  final ValueChanged<String>? aoMudar;
  final TextInputAction? acaoTeclado;
  final ValueChanged<String>? aoEnviar;
  final bool autofocus;

  /// Chave aplicada ao campo de texto (usada em testes e na navegação).
  final Key? chave;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final multilinha = linhas > 1;
    return Container(
      constraints: BoxConstraints(minHeight: altura),
      padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.md),
      decoration: BoxDecoration(
        color: cores.fundo,
        borderRadius: ShelloForma.raio(
          multilinha ? ShelloForma.bordaMedia : ShelloForma.bordaPill,
        ),
        border: Border.all(color: cores.marcaClaro, width: 1.5),
      ),
      child: Row(
        crossAxisAlignment: multilinha
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.center,
        children: [
          if (icone != null) ...[
            Padding(
              padding: EdgeInsets.only(top: multilinha ? 14 : 0),
              child: Icon(icone, size: 18, color: cores.textoS),
            ),
            const SizedBox(width: ShelloEspaco.sm),
          ],
          Expanded(
            child: TextField(
              key: chave,
              controller: controller,
              autofocus: autofocus,
              obscureText: senha && !senhaVisivel,
              keyboardType:
                  teclado ?? (multilinha ? TextInputType.multiline : null),
              textCapitalization: capitalizacao,
              maxLength: maximo,
              maxLines: senha ? 1 : linhas,
              minLines: 1,
              textInputAction: acaoTeclado,
              onChanged: aoMudar,
              onSubmitted: aoEnviar,
              style: TextStyle(
                color: cores.textoP,
                fontSize: ShelloTipo.normal,
              ),
              decoration: InputDecoration(
                hintText: dica,
                hintStyle: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.normal,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isCollapsed: true,
                counterText: '',
                contentPadding: EdgeInsets.symmetric(
                  vertical: multilinha ? 14 : 15,
                ),
              ),
            ),
          ),
          if (senha)
            IconButton(
              tooltip: senhaVisivel ? 'Ocultar senha' : 'Mostrar senha',
              onPressed: aoAlternarSenha,
              icon: Icon(
                senhaVisivel
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                size: 18,
                color: cores.textoS,
              ),
            ),
        ],
      ),
    );
  }
}

/// Pílula de seleção (filtros, tipos de memória, períodos).
class ShelloChip extends StatelessWidget {
  const ShelloChip({
    super.key,
    required this.rotulo,
    required this.selecionado,
    required this.onTap,
    this.icone,
  });

  final String rotulo;
  final bool selecionado;
  final VoidCallback onTap;
  final IconData? icone;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final cor = selecionado ? cores.marca : cores.superficie;
    final texto = selecionado ? cores.textoSobreMarca : cores.textoS;
    return Semantics(
      button: true,
      selected: selecionado,
      label: rotulo,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: cor,
            borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
            border: Border.all(
              color: selecionado ? cores.marca : cores.marcaClaro,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icone != null) ...[
                Icon(icone, size: 14, color: texto),
                const SizedBox(width: ShelloEspaco.xs),
              ],
              Text(
                rotulo,
                style: TextStyle(
                  color: texto,
                  fontSize: ShelloTipo.minusculo,
                  fontWeight: selecionado ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Estado vazio com o mascote na expressão do momento, texto e ação opcional.
class EstadoVazio extends StatelessWidget {
  const EstadoVazio({
    super.key,
    required this.expressao,
    required this.titulo,
    required this.mensagem,
    this.rotuloAcao,
    this.aoAcao,
    this.iconeAcao,
  });

  final ExpressaoShello expressao;
  final String titulo;
  final String mensagem;
  final String? rotuloAcao;
  final VoidCallback? aoAcao;
  final IconData? iconeAcao;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: ShelloEspaco.xl,
        horizontal: ShelloEspaco.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ShelloAvatar(expressao: expressao, tamanho: 96),
          const SizedBox(height: ShelloEspaco.md),
          Text(
            titulo,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: cores.textoP,
              fontFamily: ShelloTipo.titulo,
              fontSize: ShelloTipo.medio,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: ShelloEspaco.sm),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 280),
            child: Text(
              mensagem,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: cores.textoS,
                fontSize: ShelloTipo.pequeno,
                height: 1.5,
              ),
            ),
          ),
          if (rotuloAcao != null && aoAcao != null) ...[
            const SizedBox(height: ShelloEspaco.md),
            ShelloBotaoPrincipal(
              rotulo: rotuloAcao!,
              onPressed: aoAcao,
              icone: iconeAcao,
              expandido: false,
            ),
          ],
        ],
      ),
    );
  }
}

/// Título de seção em caixa-alta discreta, como na versão original.
class TituloSecao extends StatelessWidget {
  const TituloSecao(this.texto, {super.key});

  final String texto;

  @override
  Widget build(BuildContext context) {
    return Text(
      texto.toUpperCase(),
      style: TextStyle(
        color: context.cores.textoS,
        fontSize: ShelloTipo.pequeno,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.5,
      ),
    );
  }
}

/// Exibe um aviso curto e padronizado (sucesso ou erro).
void mostrarAviso(BuildContext context, String mensagem) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  messenger
    ?..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(content: Text(mensagem), duration: const Duration(seconds: 3)),
    );
}

/// Diálogo de confirmação com estilo Shello. Retorna `true` somente ao confirmar.
Future<bool> confirmarAcao(
  BuildContext context, {
  required String titulo,
  required String mensagem,
  String rotuloConfirmar = 'Confirmar',
  String rotuloCancelar = 'Cancelar',
  bool destrutivo = false,
}) async {
  final resultado = await showDialog<bool>(
    context: context,
    builder: (contexto) {
      final cores = contexto.cores;
      final corBotao = destrutivo ? cores.erro : cores.marca;
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
              ShelloAvatar(
                expressao: destrutivo
                    ? ExpressaoShello.duvidoso
                    : ExpressaoShello.neutro,
                tamanho: 64,
              ),
              const SizedBox(height: ShelloEspaco.md),
              Text(
                titulo,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: cores.textoP,
                  fontFamily: ShelloTipo.titulo,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: ShelloEspaco.xs),
              Text(
                mensagem,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.pequeno,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: ShelloEspaco.lg),
              Row(
                children: [
                  Expanded(
                    child: ShelloBotaoSecundario(
                      rotulo: rotuloCancelar,
                      onPressed: () => Navigator.of(contexto).pop(false),
                    ),
                  ),
                  const SizedBox(width: ShelloEspaco.sm),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => Navigator.of(contexto).pop(true),
                      child: Container(
                        height: 48,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: corBotao,
                          borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
                        ),
                        child: Text(
                          rotuloConfirmar,
                          style: TextStyle(
                            color: cores.textoSobreMarca,
                            fontSize: ShelloTipo.pequeno,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
  return resultado ?? false;
}
