// components/TypingIndicator.js

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    };

    const loop = Animated.loop(
      Animated.stagger(150, [
        animate(dot1),
        animate(dot2),
        animate(dot3),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5abf75',
    marginHorizontal: 4,
  },
});

export default TypingIndicator;
