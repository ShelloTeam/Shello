// Roteamento Principal — index.tsx
// Decide qual fluxo renderizar com base no estado de autenticação e onboarding

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useShello } from '../contexts/ShelloContext';
import NavegacaoAbas from './NavegacaoAbas';
import TelaAutenticacao from '../screens/TelaAutenticacao';
import TelaOnboarding from '../screens/TelaOnboarding';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ShelloTema } from '../styles/tema';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { onboardingConcluido, carregando } = useShello();

  // Tela de carregamento enquanto busca dados do AsyncStorage
  if (carregando) {
    return (
      <View style={estilos.carregando}>
        <ActivityIndicator size="large" color={ShelloTema.cores.marca} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!onboardingConcluido ? (
        // Fluxo pré-hub: autenticação → onboarding
        <>
          <Stack.Screen name="Autenticacao" component={TelaAutenticacao} />
          <Stack.Screen name="Onboarding" component={TelaOnboarding} />
        </>
      ) : (
        // Hub principal: navegação por abas
        <Stack.Screen name="Hub" component={NavegacaoAbas} />
      )}
    </Stack.Navigator>
  );
}

const estilos = StyleSheet.create({
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.fundo,
  },
});
