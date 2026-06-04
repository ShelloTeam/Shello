// Navegação por Abas — NavegacaoAbas.tsx
// Configura o BottomTabNavigator principal do Shello com 5 abas

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';

// Telas das abas
import HomeScreen from '../screens/HomeScreen';
import TelaDiario from '../screens/TelaDiario';
import TelaChat from '../screens/TelaChat';
import TelaTarefas from '../screens/TelaTarefas';
import TelaPerfil from '../screens/TelaPerfil';

const Tab = createBottomTabNavigator();

// ─── Botão central customizado do Chat ────────────────────────────────────
interface BotaoChatProps {
  children: React.ReactNode;
  onPress?: () => void;
}

function BotaoChat({ children, onPress }: BotaoChatProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={estilos.botaoChat}
      accessibilityLabel="Abrir chat com Shello"
      accessibilityRole="button"
    >
      <View style={estilos.botaoChatInterno}>{children}</View>
    </TouchableOpacity>
  );
}

// ─── Navegador de Abas ─────────────────────────────────────────────────────
export default function NavegacaoAbas() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ShelloTema.cores.marca,
        tabBarInactiveTintColor: ShelloTema.cores.textoS,
        tabBarStyle: estilos.barraAbas,
        tabBarLabelStyle: estilos.rotuloAba,
        tabBarIcon: ({ color, focused }) => {
          const tamanho = 22;

          const icones: Record<string, keyof typeof Feather.glyphMap> = {
            HomeTab: 'home',
            DiarioTab: 'book-open',
            ChatTab: 'zap',
            TarefasTab: 'check-square',
            PerfilTab: 'user',
          };

          const nomeIcone = icones[route.name] ?? 'circle';

          if (route.name === 'ChatTab') {
            return (
              <Feather
                name="zap"
                size={tamanho}
                color={focused ? '#FFFFFF' : '#FFFFFF'}
              />
            );
          }

          return (
            <Feather
              name={nomeIcone}
              size={tamanho}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="DiarioTab"
        component={TelaDiario}
        options={{ tabBarLabel: 'Diário' }}
      />
      <Tab.Screen
        name="ChatTab"
        component={TelaChat}
        options={{
          tabBarLabel: 'Shello',
          tabBarButton: (props) => (
            <BotaoChat onPress={props.onPress as () => void}>
              <Feather name="zap" size={26} color="#FFFFFF" />
            </BotaoChat>
          ),
        }}
      />
      <Tab.Screen
        name="TarefasTab"
        component={TelaTarefas}
        options={{ tabBarLabel: 'Tarefas' }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={TelaPerfil}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  barraAbas: {
    backgroundColor: ShelloTema.cores.superficie,
    borderTopWidth: 0,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    // Sombra sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  rotuloAba: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  botaoChat: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoChatInterno: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ShelloTema.cores.marca,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra do botão central
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
