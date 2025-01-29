import React, { useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated, // <-- Import Animated
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
// Adjust these to your preference
const SPACING = 12;
const ITEM_WIDTH = width * 0.65; 
const ITEM_SPACING = 10;

export default function TrendingAnime({ data }) {
  const navigation = useNavigation();

  // 1) Create an Animated.Value for scroll position
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleClick = (item) => {
    navigation.navigate('Anime', item);
  };

  if (!data || data.length === 0) {
    // Show loading state if data is not available
    return (
      <View style={{ marginBottom: 8, alignItems: 'center', height: height * 0.4 }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // 2) Use Animated.FlatList instead of FlatList
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: 'white', fontSize: 20, marginLeft: 12, marginBottom: 15 }}>
        Trending
      </Text>
      <Animated.FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        // 3) Animate the scroll event
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        // 4) Adjust the snap interval so items snap near the center
        snapToAlignment="start"
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        decelerationRate="fast"
        // 5) Ensure content is centered
        contentContainerStyle={{ paddingHorizontal: SPACING }}
        ItemSeparatorComponent={() => <View style={{ width: ITEM_SPACING }} />}
        renderItem={({ item, index }) => {
          return (
            <AnimeCard
              item={item}
              index={index}
              handleClick={() => handleClick(item)}
              scrollX={scrollX}
            />
          );
        }}
      />
    </View>
  );
}

const AnimeCard = ({ item, index, handleClick, scrollX }) => {
  // 6) Calculate the inputRange so we know when the card is in the center
  const inputRange = [
    (index - 1) * (ITEM_WIDTH + ITEM_SPACING),
    index * (ITEM_WIDTH + ITEM_SPACING),
    (index + 1) * (ITEM_WIDTH + ITEM_SPACING),
  ];

  // 7) Interpolate scale based on distance from center
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <TouchableWithoutFeedback onPress={handleClick}>
      <Animated.View
        style={{
          width: ITEM_WIDTH,
          height: height * 0.45,
          transform: [{ scale }],
        }}
      >
        <Image
          source={{ uri: item.images.jpg.large_image_url }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 10,
          }}
          resizeMode="cover"
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
