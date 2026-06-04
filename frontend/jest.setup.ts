// Setup global do ambiente de testes
// Mocka o AsyncStorage para rodar em ambiente Node.js (sem dispositivo real)

jest.mock('@react-native-async-storage/async-storage', () => {
  // Mock manual compatível com a versão 3.x do @react-native-async-storage
  let armazenamento: Record<string, string> = {};

  return {
    setItem: jest.fn((chave: string, valor: string) => {
      armazenamento[chave] = valor;
      return Promise.resolve();
    }),
    getItem: jest.fn((chave: string) => {
      return Promise.resolve(armazenamento[chave] ?? null);
    }),
    removeItem: jest.fn((chave: string) => {
      delete armazenamento[chave];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      armazenamento = {};
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(armazenamento));
    }),
    multiGet: jest.fn((chaves: string[]) => {
      return Promise.resolve(chaves.map((k) => [k, armazenamento[k] ?? null]));
    }),
    multiSet: jest.fn((pares: [string, string][]) => {
      pares.forEach(([k, v]) => { armazenamento[k] = v; });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((chaves: string[]) => {
      chaves.forEach((k) => delete armazenamento[k]);
      return Promise.resolve();
    }),
  };
});
