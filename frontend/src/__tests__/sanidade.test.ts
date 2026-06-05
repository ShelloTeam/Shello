// Teste de sanidade — garante que o ambiente Jest está funcionando corretamente
describe('Sanidade do ambiente de testes', () => {
  it('deve executar um teste simples com sucesso', () => {
    expect(1 + 1).toBe(2);
  });

  it('deve suportar asserções de string', () => {
    const saudacao = 'Olá, Shello!';
    expect(saudacao).toContain('Shello');
  });

  it('deve suportar asserções de array', () => {
    const itens = ['diário', 'tarefas', 'perfil'];
    expect(itens).toHaveLength(3);
    expect(itens).toContain('diário');
  });
});
