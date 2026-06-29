import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import IntroScreen from './src/features/splash/IntroScreen';
import HubScreen from './src/features/hub/HubScreen';
import EditorScreen from './src/features/editor/EditorScreen';
import CatalogScreen from './src/features/catalog/CatalogScreen';
import ModelDetailScreen from './src/features/catalog/ModelDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Intro"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#000000' }
          }}
        >
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen 
            name="Hub" 
            component={HubScreen} 
            options={{
              transitionSpec: {
                open: {
                  animation: 'timing',
                  config: { duration: 600 },
                },
                close: {
                  animation: 'timing',
                  config: { duration: 600 },
                },
              },
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
            }}
          />
          <Stack.Screen name="Editor" component={EditorScreen} />
          <Stack.Screen name="Catalog" component={CatalogScreen} />
          <Stack.Screen name="ModelDetail" component={ModelDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
