// Navegação por Abas — NavegacaoAbas.tsx
// Configura o BottomTabNavigator principal do Shello com 5 abas

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text, Animated } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Feather } from "@expo/vector-icons";
import { ShelloTema } from "../styles/tema";

// Telas das abas
import HomeScreen from "../screens/HomeScreen";
import NavegacaoDiario from "./NavegacaoDiario";
import TelaChat from "../screens/TelaChat";
import TelaTarefas from "../screens/TelaTarefas";
import TelaPerfil from "../screens/TelaPerfil";

const Tab = createMaterialTopTabNavigator();

// ─── Botão central customizado do Chat ────────────────────────────────────
interface BotaoChatProps {
  children: React.ReactNode;
  onPress?: () => void;
  focused: boolean;
}

function BotaoChat({ children, onPress, focused }: BotaoChatProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={estilos.botaoChat}
      accessibilityLabel="Abrir chat com Shello"
      accessibilityRole="button"
    >
      <View
        style={[
          estilos.botaoChatInterno,
          {
            backgroundColor: focused
              ? ShelloTema.cores.marca
              : ShelloTema.cores.marcaClaro,
          },
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
}

// ─── Custom Tab Bar ────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={estilos.barraAbas}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icones: Record<string, keyof typeof Feather.glyphMap> = {
          HomeTab: "home",
          DiarioTab: "book-open",
          ChatTab: "zap",
          TarefasTab: "check-square",
          PerfilTab: "user",
        };
        const nomeIcone = icones[route.name] || "circle";

        if (route.name === "ChatTab") {
          return (
            <BotaoChat key={route.key} onPress={onPress} focused={isFocused}>
              <Image
                source={require("../../assets/logoshello.jpeg")}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                resizeMode="cover"
              />
            </BotaoChat>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={estilos.abaComum}
            activeOpacity={0.7}
          >
            <View
              style={[
                estilos.iconeWrapper,
                isFocused && estilos.iconeWrapperAtivo,
              ]}
            >
              <Feather
                name={nomeIcone}
                size={22}
                color={isFocused ? ShelloTema.cores.marca : ShelloTema.cores.textoS}
              />
            </View>
            <Text
              style={[
                estilos.rotuloAba,
                isFocused && estilos.rotuloAbaAtivo,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Navegador de Abas ─────────────────────────────────────────────────────
export default function NavegacaoAbas() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true, // Ativa o "arrastar para o lado"
        lazy: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Início" }}
      />
      <Tab.Screen
        name="DiarioTab"
        component={NavegacaoDiario}
        options={{ tabBarLabel: "Diário" }}
      />
      <Tab.Screen
        name="ChatTab"
        component={TelaChat}
        options={{ tabBarLabel: "Shello" }}
      />
      <Tab.Screen
        name="TarefasTab"
        component={TelaTarefas}
        options={{ tabBarLabel: "Tarefas" }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={TelaPerfil}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  barraAbas: {
    backgroundColor: ShelloTema.cores.superficie,
    flexDirection: 'row',
    height: 78,
    paddingBottom: 16, // Espaço para Home Indicator do iOS
    paddingTop: 8,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  abaComum: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconeWrapperAtivo: {
    backgroundColor: `${ShelloTema.cores.marca}1A`, // 10% opacidade da cor principal
  },
  rotuloAba: {
    fontSize: 10,
    fontFamily: ShelloTema.tipografia.corpo,
    color: ShelloTema.cores.textoS,
  },
  rotuloAbaAtivo: {
    color: ShelloTema.cores.marca,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
  },
  botaoChat: {
    top: -24,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  botaoChatInterno: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
