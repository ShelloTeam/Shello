import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/domain/erro_regra_negocio.dart';
import '../../../core/providers.dart';
import '../../../core/utils/datas.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/rotina.dart';
import '../domain/tarefa.dart';
import 'tarefas_providers.dart';

/// Abre a folha de criação (quando [tarefa] é nula) ou de edição de uma tarefa.
Future<void> abrirFormularioTarefa(BuildContext context, {Tarefa? tarefa}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (contexto) =>
        _FolhaComTeclado(child: _FormularioTarefa(tarefa: tarefa)),
  );
}

/// Abre a folha de criação ou edição de uma rotina.
Future<void> abrirFormularioRotina(BuildContext context, {Rotina? rotina}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (contexto) =>
        _FolhaComTeclado(child: _FormularioRotina(rotina: rotina)),
  );
}

class _FolhaComTeclado extends StatelessWidget {
  const _FolhaComTeclado({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        decoration: BoxDecoration(
          color: cores.superficie,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(ShelloForma.bordaGrande),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(
          ShelloEspaco.xl,
          ShelloEspaco.md,
          ShelloEspaco.xl,
          ShelloEspaco.xl,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: ShelloEspaco.lg),
                  decoration: BoxDecoration(
                    color: cores.marcaClaro,
                    borderRadius: ShelloForma.raio(2),
                  ),
                ),
              ),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _FormularioTarefa extends ConsumerStatefulWidget {
  const _FormularioTarefa({this.tarefa});

  final Tarefa? tarefa;

  @override
  ConsumerState<_FormularioTarefa> createState() => _FormularioTarefaState();
}

class _FormularioTarefaState extends ConsumerState<_FormularioTarefa> {
  late final TextEditingController _titulo;
  late final TextEditingController _descricao;
  DateTime? _data;
  String? _erro;

  bool get _editando => widget.tarefa != null;

  @override
  void initState() {
    super.initState();
    final tarefa = widget.tarefa;
    _titulo = TextEditingController(text: tarefa?.titulo ?? '');
    _descricao = TextEditingController(text: tarefa?.descricao ?? '');
    _data = tarefa?.dataVencimento;
  }

  @override
  void dispose() {
    _titulo.dispose();
    _descricao.dispose();
    super.dispose();
  }

  Future<void> _escolherData() async {
    final hoje = inicioDoDia(ref.read(relogioProvider)());
    final escolhida = await showDatePicker(
      context: context,
      locale: const Locale('pt', 'BR'),
      initialDate: _data ?? hoje,
      firstDate: _editando ? DateTime(2000) : hoje,
      lastDate: DateTime(hoje.year + 150),
      helpText: 'Data de vencimento',
      cancelText: 'Cancelar',
      confirmText: 'OK',
    );
    if (escolhida != null) setState(() => _data = escolhida);
  }

  Future<void> _salvar() async {
    final titulo = _titulo.text.trim();
    if (titulo.isEmpty) {
      setState(() => _erro = 'Dê um título para a tarefa.');
      return;
    }
    final descricao = _descricao.text.trim();
    final dataChave = _data == null ? null : chaveDia(_data!);
    final controller = ref.read(tarefasProvider.notifier);
    try {
      if (_editando) {
        await controller.editar(
          widget.tarefa!.id,
          titulo: titulo,
          descricao: descricao,
          data: dataChave,
          limparData: dataChave == null,
        );
      } else {
        await controller.adicionar(
          titulo: titulo,
          descricao: descricao,
          data: dataChave,
        );
      }
      if (mounted) Navigator.of(context).pop();
    } on ErroRegraNegocio catch (erro) {
      if (mounted) setState(() => _erro = erro.mensagem);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final dataTexto = _data == null
        ? 'Sem data'
        : DateFormat('dd/MM/yyyy').format(_data!);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _editando ? 'Editar intenção' : 'Nova Intenção',
          style: TextStyle(
            color: cores.textoP,
            fontFamily: ShelloTipo.titulo,
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: ShelloEspaco.xs),
        Text(
          'Qual tarefa ou ritual você quer adicionar à sua jornada?',
          style: TextStyle(
            color: cores.textoS,
            fontSize: ShelloTipo.pequeno,
            height: 1.45,
          ),
        ),
        const SizedBox(height: ShelloEspaco.lg),
        _Rotulo('Título'),
        ShelloCampo(
          chave: const Key('modal-campo-titulo'),
          controller: _titulo,
          dica: 'Ex: Meditar por 10 minutos...',
          maximo: 100,
          capitalizacao: TextCapitalization.sentences,
          autofocus: !_editando,
          aoMudar: (_) => setState(() => _erro = null),
        ),
        const SizedBox(height: ShelloEspaco.md),
        _Rotulo('Descrição', opcional: true),
        ShelloCampo(
          chave: const Key('modal-campo-descricao'),
          controller: _descricao,
          dica: 'Adicione detalhes sobre sua tarefa...',
          linhas: 3,
          altura: 80,
          maximo: 250,
          capitalizacao: TextCapitalization.sentences,
        ),
        const SizedBox(height: ShelloEspaco.md),
        _Rotulo('Data', opcional: true),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                key: const Key('modal-campo-data'),
                onTap: _escolherData,
                child: Container(
                  height: 52,
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShelloEspaco.md,
                  ),
                  alignment: Alignment.centerLeft,
                  decoration: BoxDecoration(
                    color: cores.fundo,
                    borderRadius: ShelloForma.raio(ShelloForma.bordaPequena),
                    border: Border.all(color: cores.marcaClaro, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: cores.marca,
                      ),
                      const SizedBox(width: ShelloEspaco.sm),
                      Text(
                        dataTexto,
                        style: TextStyle(
                          color: _data == null ? cores.textoS : cores.textoP,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_data != null)
              IconButton(
                key: const Key('limpar-data'),
                tooltip: 'Remover data',
                onPressed: () => setState(() => _data = null),
                icon: Icon(Icons.close, color: cores.textoS),
              ),
          ],
        ),
        if (_erro != null)
          Padding(
            padding: const EdgeInsets.only(top: ShelloEspaco.sm),
            child: Text(
              _erro!,
              style: TextStyle(
                color: cores.erro,
                fontSize: ShelloTipo.minusculo,
              ),
            ),
          ),
        const SizedBox(height: ShelloEspaco.lg),
        Row(
          children: [
            Expanded(
              child: ShelloBotaoSecundario(
                rotulo: 'Cancelar',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            const SizedBox(width: ShelloEspaco.sm),
            Expanded(
              flex: 2,
              child: ShelloBotaoPrincipal(
                key: Key(
                  _editando
                      ? 'modal-botao-salvar-tarefa'
                      : 'modal-botao-criar-tarefa',
                ),
                rotulo: _editando ? 'Salvar' : 'Criar Tarefa',
                icone: _editando ? null : Icons.add,
                onPressed: _titulo.text.trim().isEmpty ? null : _salvar,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _FormularioRotina extends ConsumerStatefulWidget {
  const _FormularioRotina({this.rotina});

  final Rotina? rotina;

  @override
  ConsumerState<_FormularioRotina> createState() => _FormularioRotinaState();
}

class _FormularioRotinaState extends ConsumerState<_FormularioRotina> {
  late final TextEditingController _titulo;
  late final TextEditingController _atividades;
  late PeriodoRotina _periodo;
  String? _erro;

  bool get _editando => widget.rotina != null;

  @override
  void initState() {
    super.initState();
    final rotina = widget.rotina;
    _titulo = TextEditingController(text: rotina?.titulo ?? '');
    _atividades = TextEditingController(
      text: rotina?.atividades.join('\n') ?? '',
    );
    _periodo = rotina?.periodo ?? PeriodoRotina.manha;
  }

  @override
  void dispose() {
    _titulo.dispose();
    _atividades.dispose();
    super.dispose();
  }

  List<String> get _listaAtividades => _atividades.text
      .split('\n')
      .map((linha) => linha.trim())
      .where((linha) => linha.isNotEmpty)
      .toList();

  Future<void> _salvar() async {
    final controller = ref.read(rotinasProvider.notifier);
    try {
      if (_editando) {
        await controller.editar(
          widget.rotina!.id,
          titulo: _titulo.text,
          atividades: _listaAtividades,
          periodo: _periodo,
        );
      } else {
        await controller.adicionar(
          titulo: _titulo.text,
          atividades: _listaAtividades,
          periodo: _periodo,
        );
      }
      if (mounted) Navigator.of(context).pop();
    } on ErroRegraNegocio catch (erro) {
      if (mounted) setState(() => _erro = erro.mensagem);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final podeSalvar =
        _titulo.text.trim().isNotEmpty && _listaAtividades.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _editando ? 'Editar rotina' : 'Nova Rotina',
          style: TextStyle(
            color: cores.textoP,
            fontFamily: ShelloTipo.titulo,
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: ShelloEspaco.xs),
        Text(
          'Quais rituais você quer agrupar?',
          style: TextStyle(color: cores.textoS, fontSize: ShelloTipo.pequeno),
        ),
        const SizedBox(height: ShelloEspaco.lg),
        _Rotulo('Título da Rotina'),
        ShelloCampo(
          chave: const Key('modal-campo-rotina-titulo'),
          controller: _titulo,
          dica: 'Ex: Rotina Matinal...',
          maximo: 100,
          capitalizacao: TextCapitalization.sentences,
          aoMudar: (_) => setState(() => _erro = null),
        ),
        const SizedBox(height: ShelloEspaco.md),
        _Rotulo('Período'),
        Row(
          children: [
            for (final periodo in PeriodoRotina.values)
              Padding(
                padding: const EdgeInsets.only(right: ShelloEspaco.sm),
                child: ShelloChip(
                  key: Key('periodo-${periodo.name}'),
                  rotulo: periodo.rotulo,
                  selecionado: _periodo == periodo,
                  onTap: () => setState(() => _periodo = periodo),
                ),
              ),
          ],
        ),
        const SizedBox(height: ShelloEspaco.md),
        _Rotulo('Atividades (uma por linha)'),
        ShelloCampo(
          chave: const Key('modal-campo-atividades'),
          controller: _atividades,
          dica: 'Ex:\nBeber água\nMeditar 10 min\nLer 5 páginas',
          linhas: 4,
          altura: 110,
          aoMudar: (_) => setState(() {}),
        ),
        if (_erro != null)
          Padding(
            padding: const EdgeInsets.only(top: ShelloEspaco.sm),
            child: Text(
              _erro!,
              style: TextStyle(
                color: cores.erro,
                fontSize: ShelloTipo.minusculo,
              ),
            ),
          ),
        const SizedBox(height: ShelloEspaco.lg),
        Row(
          children: [
            Expanded(
              child: ShelloBotaoSecundario(
                rotulo: 'Cancelar',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            const SizedBox(width: ShelloEspaco.sm),
            Expanded(
              flex: 2,
              child: ShelloBotaoPrincipal(
                key: Key(
                  _editando
                      ? 'modal-botao-salvar-rotina'
                      : 'modal-botao-criar-rotina',
                ),
                rotulo: _editando ? 'Salvar' : 'Criar Rotina',
                icone: _editando ? null : Icons.add,
                onPressed: podeSalvar ? _salvar : null,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Rotulo extends StatelessWidget {
  const _Rotulo(this.texto, {this.opcional = false});

  final String texto;
  final bool opcional;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.only(bottom: ShelloEspaco.xs),
      child: Text.rich(
        TextSpan(
          text: texto,
          style: TextStyle(
            color: cores.textoP,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          children: [
            if (opcional)
              TextSpan(
                text: ' (opcional)',
                style: TextStyle(
                  color: cores.textoS,
                  fontSize: ShelloTipo.minusculo,
                  fontWeight: FontWeight.w400,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
