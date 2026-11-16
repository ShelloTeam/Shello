import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/utils/texto.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/memoria.dart';
import 'cartao_memoria.dart';
import 'perfil_providers.dart';

const List<TipoMemoria> _tiposNovaMemoria = [
  TipoMemoria.fato,
  TipoMemoria.preferencia,
  TipoMemoria.objetivo,
  TipoMemoria.habito,
  TipoMemoria.relacionamento,
  TipoMemoria.contexto,
];

/// Lista completa das memórias, com busca e criação de novas memórias.
class TelaMemorias extends ConsumerStatefulWidget {
  const TelaMemorias({super.key});

  @override
  ConsumerState<TelaMemorias> createState() => _TelaMemoriasState();
}

class _TelaMemoriasState extends ConsumerState<TelaMemorias> {
  final _busca = TextEditingController();
  final _nova = TextEditingController();
  TipoMemoria _tipo = TipoMemoria.fato;
  bool _salvando = false;

  @override
  void dispose() {
    _busca.dispose();
    _nova.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    final conteudo = _nova.text.trim();
    if (conteudo.isEmpty || _salvando) return;
    setState(() => _salvando = true);
    try {
      await ref
          .read(memoriasProvider.notifier)
          .adicionar(conteudo: conteudo, tipo: _tipo);
      _nova.clear();
      setState(() => _tipo = TipoMemoria.fato);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final memorias = ref.watch(memoriasProvider);
    final termo = normalizarTexto(_busca.text);
    final filtradas = memorias.where((m) {
      if (termo.isEmpty) return true;
      return normalizarTexto(m.conteudo).contains(termo) ||
          normalizarTexto(m.tipo.rotulo).contains(termo);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: cores.superficie,
        elevation: 0,
        leading: IconButton(
          tooltip: 'Fechar',
          icon: Icon(Icons.close, color: cores.textoP),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go(Rotas.perfil),
        ),
        title: Text(
          'Memórias',
          style: TextStyle(
            color: cores.textoP,
            fontFamily: ShelloTipo.titulo,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.all(ShelloEspaco.lg),
          children: [
            Text(
              '${memorias.length} ${memorias.length == 1 ? 'memória registrada' : 'memórias registradas'}',
              style: TextStyle(color: cores.textoS, fontSize: 13),
            ),
            const SizedBox(height: ShelloEspaco.md),
            Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.md),
              decoration: BoxDecoration(
                color: cores.superficie,
                borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
                border: Border.all(
                  color: cores.marcaClaro.withValues(alpha: 0.6),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.search, size: 16, color: cores.textoS),
                  const SizedBox(width: ShelloEspaco.sm),
                  Expanded(
                    child: TextField(
                      key: const Key('campo-busca-memoria'),
                      controller: _busca,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: 'Buscar memória...',
                        hintStyle: TextStyle(color: cores.textoS, fontSize: 14),
                        border: InputBorder.none,
                        isCollapsed: true,
                      ),
                      style: TextStyle(color: cores.textoP, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: ShelloEspaco.md),
            ShelloCard(
              raio: ShelloForma.bordaMedia,
              padding: const EdgeInsets.all(ShelloEspaco.md),
              cor: cores.fundo,
              borda: BorderSide(color: cores.marcaClaro),
              sombra: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Adicionar novo contexto',
                    style: TextStyle(
                      color: cores.marca,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: ShelloEspaco.sm),
                  ShelloCampo(
                    chave: const Key('campo-nova-memoria'),
                    controller: _nova,
                    dica: 'Ex: Quero aprender francês...',
                    linhas: 3,
                    altura: 72,
                    maximo: 250,
                    aoMudar: (_) => setState(() {}),
                  ),
                  const SizedBox(height: ShelloEspaco.sm),
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        for (final tipo in _tiposNovaMemoria)
                          Padding(
                            padding: const EdgeInsets.only(
                              right: ShelloEspaco.xs,
                            ),
                            child: Center(
                              child: ShelloChip(
                                key: Key('tipo-${tipo.name.toUpperCase()}'),
                                rotulo: tipo.rotulo,
                                selecionado: _tipo == tipo,
                                onTap: () => setState(() => _tipo = tipo),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (_nova.text.trim().isNotEmpty) ...[
                    const SizedBox(height: ShelloEspaco.sm),
                    ShelloBotaoPrincipal(
                      key: const Key('botao-salvar-memoria'),
                      rotulo: _salvando ? 'Salvando...' : 'Salvar Memória',
                      altura: 42,
                      carregando: _salvando,
                      onPressed: _salvando ? null : _salvar,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: ShelloEspaco.md),
            if (filtradas.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: ShelloEspaco.xl),
                child: Text(
                  _busca.text.isEmpty
                      ? 'Sem memórias ainda.'
                      : 'Nenhuma memória encontrada.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: cores.textoS),
                ),
              )
            else
              for (final memoria in filtradas)
                Padding(
                  padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
                  child: CartaoMemoria(memoria: memoria),
                ),
          ],
        ),
      ),
    );
  }
}
