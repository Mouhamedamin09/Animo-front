// App.js

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AppNavigation from '../../navigation/AppNavigation';
import { UserProvider } from '../../Context/UserContext'; // Import UserProvider
import { AnimeProvider } from '../../Context/AnimeContext'; // Import AnimeProvider


export default function HomeScreen() {

  
  return (
    <UserProvider>
      <AnimeProvider>
        <AppNavigation />
      </AnimeProvider>
    </UserProvider>
  );
}


