import 'package:flutter_test/flutter_test.dart';
import 'package:shello/core/domain/erro_regra_negocio.dart';
import 'package:shello/core/storage/memoria_key_value_store.dart';
import 'package:shello/features/autenticacao/data/autenticacao_repository.dart';

void main() {
  final agora = DateTime(2026, 6, 10, 9);
  late MemoriaKeyValueStore store;
  late AutenticacaoRepository auth;

  setUp(() {
    store = MemoriaKeyValueStore();
    auth = AutenticacaoRepository(store: store, relogio: () => agora);
  });

  test('sem sessão salva o usuário não está autenticado', () {
    expect(auth.sessaoAtual(), isNull);
  });

  test('registrar cria a conta e já inicia a sessão', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    final sessao = auth.sessaoAtual();
    expect(sessao, isNotNull);
    expect(sessao!.nome, 'Bia');
    expect(sessao.email, 'bia@exemplo.com');
  });

  test('sair encerra a sessão', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    await auth.sair();
    expect(auth.sessaoAtual(), isNull);
  });

  test('entrar com a senha correta restaura a sessão', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    await auth.sair();
    final sessao = await auth.entrar(
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    expect(sessao.nome, 'Bia');
    expect(auth.sessaoAtual()?.email, 'bia@exemplo.com');
  });

  test('entrar com senha errada é recusado com mensagem genérica', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    await auth.sair();
    expect(
      () => auth.entrar(email: 'bia@exemplo.com', senha: 'Errada@123'),
      throwsA(
        isA<ErroRegraNegocio>().having(
          (e) => e.mensagem,
          'mensagem',
          'E-mail ou senha incorretos.',
        ),
      ),
    );
  });

  test('e-mail já cadastrado não pode ser registrado de novo', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    expect(
      () => auth.registrar(
        nome: 'Outra',
        email: 'BIA@exemplo.com',
        senha: 'Senha@123',
      ),
      throwsA(isA<ErroRegraNegocio>()),
    );
  });

  test('a senha nunca é gravada em texto puro', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    expect(store.ler('shello.contas'), isNot(contains('Senha@123')));
  });

  test('a conta sobrevive à reabertura do aplicativo', () async {
    await auth.registrar(
      nome: 'Bia',
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    await auth.sair();
    final reaberto = AutenticacaoRepository(store: store, relogio: () => agora);
    final sessao = await reaberto.entrar(
      email: 'bia@exemplo.com',
      senha: 'Senha@123',
    );
    expect(sessao.nome, 'Bia');
  });

  test('garantir a conta demo devolve o mesmo id e não abre sessão', () async {
    final id = await auth.garantirContaDemonstracao();
    expect(auth.sessaoAtual(), isNull);
    expect(await auth.garantirContaDemonstracao(), id);
  });

  test(
    'conta de demonstração é criada uma única vez e pode ser usada',
    () async {
      await auth.garantirContaDemonstracao();
      await auth.garantirContaDemonstracao();
      final sessao = await auth.entrar(
        email: 'demo@exemplo.com',
        senha: 'Demo@1234',
      );
      expect(sessao.nome, 'Ana');
      expect(auth.quantidadeDeContas(), 1);
    },
  );
}
