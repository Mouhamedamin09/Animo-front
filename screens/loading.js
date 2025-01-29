import React from 'react';
import { View, Text, Dimensions, StyleSheet, Image } from 'react-native';
import * as Progress from 'react-native-progress';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Loading() {
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#262626', '#1f1f1f']}
        style={styles.gradient}
      />

      {/* Logo or Decorative Image */}
      <Image
        source={{ uri: 'https://robohash.org/loading?set=set5' }}
        style={styles.logo}
      />

      {/* Progress Indicator */}
      <Progress.CircleSnail
        thickness={10}
        size={100}
        color={['#5abf75', '#6be38c', '#52a85a']}
        duration={800}
        style={styles.progressIndicator}
      />

      {/* Loading Text */}
      <Text style={styles.loadingText}>Loading your experience...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#262626',
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 40,
  },
  progressIndicator: {
    marginBottom: 20,
  },
  loadingText: {
    color: '#5abf75',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
