// NavegacaoDiario.tsx
// Stack Navigator aninhado na aba do Diário
// Gerencia: lista de entradas → bloco de notas de cada entrada

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaDiario from '../screens/TelaDiario';
import TelaEntradaDiario from '../screens/TelaEntradaDiario';
import { EntradaDiario } from '../types';

// ─── Tipos de rotas do Diário ─────────────────────────────────────────────
export type DiarioStackParamList = {
  ListaEntradas: undefined;
  EntradaDiario: { entrada?: EntradaDiario; nova?: boolean };
};

const Stack = createNativeStackNavigator<DiarioStackParamList>();

export default function NavegacaoDiario() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ListaEntradas" component={TelaDiario} />
      <Stack.Screen
        name="EntradaDiario"
        component={TelaEntradaDiario}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
