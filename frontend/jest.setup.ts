// Setup global do ambiente de testes
// Mocka o AsyncStorage v1.x para rodar em ambiente Node.js (sem dispositivo real)
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
