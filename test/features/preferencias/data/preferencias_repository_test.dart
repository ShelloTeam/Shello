import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/core/domain/formalidade.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/onboarding/domain/dados_onboarding.dart';
import 'package:shello/features/preferencias/data/preferencias_repository.dart';
import 'package:shello/features/preferencias/domain/preferencias_usuario.dart';

void main() {
  late MemoriaKeyValueStore store;
  late PreferenciasRepository prefs;

  setUp(() {
    store = MemoriaKeyValueStore();
    prefs = PreferenciasRepository(store: store);
  });

  test(
    'sem nada salvo usa formalidade média, tema claro e onboarding pendente',
    () {
      final p = prefs.ler();
      expect(p.formalidade, Formalidade.media);
      expect(p.tema, TemaApp.claro);
      expect(p.onboardingConcluido, isFalse);
      expect(p.nomeReferencia, '');
    },
  );

  test(
    'alterar formalidade e tema persiste e sobrevive à reabertura',
    () async {
      await prefs.definirFormalidade(Formalidade.alta);
      await prefs.definirTema(TemaApp.escuro);
      final reaberto = PreferenciasRepository(store: store).ler();
      expect(reaberto.formalidade, Formalidade.alta);
      expect(reaberto.tema, TemaApp.escuro);
    },
  );

  test(
    'nome de referência aceita até 30 caracteres e remove espaços',
    () async {
      await prefs.definirNomeReferencia('  Ana  ');
      expect(prefs.ler().nomeReferencia, 'Ana');
    },
  );

  test('nome de referência com mais de 30 caracteres é recusado', () async {
    expect(
      () => prefs.definirNomeReferencia('x' * 31),
      throwsA(isA<ErroRegraNegocio>()),
    );
  });

  test('concluir o onboarding grava nome, marca como concluído e usa padrões para campos vazios', () async {
    await prefs.concluirOnboarding(
      const DadosOnboarding(nome: '', estiloDeVida: '', metaAtual: ''),
    );
    final p = prefs.ler();
    expect(p.onboardingConcluido, isTrue);
    expect(p.nomeReferencia, 'Você');
    expect(p.onboarding!.estiloDeVida, 'Ainda descobrindo');
    expect(p.onboarding!.metaAtual, 'Crescer cada dia mais');
  });

  test('dados do onboarding preenchidos são preservados', () async {
    await prefs.concluirOnboarding(
      const DadosOnboarding(
        nome: 'Duda',
        estiloDeVida: 'Corrida',
        metaAtual: 'Dormir melhor',
      ),
    );
    expect(prefs.ler().nomeReferencia, 'Duda');
    expect(prefs.ler().onboarding!.metaAtual, 'Dormir melhor');
  });
}
