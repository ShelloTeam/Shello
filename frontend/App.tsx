import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShelloProvider } from './src/contexts/ShelloContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <ShelloProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </ShelloProvider>
    </SafeAreaProvider>
  );
}
