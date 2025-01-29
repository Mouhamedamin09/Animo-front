import React from 'react';
import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import { TouchableOpacity, GestureHandlerRootView, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function AnimeList({ title, data, hideSeeAll, userId }) {
  const navigation = useNavigation();

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={() => !hideSeeAll && navigation.push('SeeAll', { title, data, userId })}>
            {!hideSeeAll && (
              <Text style={styles.seeAll}>See All</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {data.slice(0, 10).map((item, index) => {
            const isEntry = !!item.entry;
            const displayItem = isEntry ? item.entry[0] : item;

            return (
              <TouchableWithoutFeedback
                key={index}
                onPress={() => {
                  navigation.push('Anime', { ...displayItem, userId });
                }}
              >
                <View style={styles.itemContainer}>
                  <Image
                    source={{ uri: displayItem.images ? displayItem.images.jpg.large_image_url : null }}
                    style={styles.image}
                  />
                  <Text style={styles.itemTitle}>
                    {displayItem.title?.length > 14
                      ? displayItem.title.slice(0, 14) + '...'
                      : displayItem.title}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    spaceY: 16,
  },
  header: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10,
  },
  seeAll: {
    color: '#5abf75',
    fontSize: 18,
    marginBottom: 10,
  },
  scrollContainer: {
    paddingHorizontal: 15,
  },
  itemContainer: {
    spaceY: 4,
    marginRight: 16,
  },
  image: {
    borderRadius: 10,
    width: width * 0.39,
    height: height * 0.32,
  },
  itemTitle: {
    color: '#d1d1d1', // Neutral gray color
    marginLeft: 4,
    marginTop: 8,
  },
});
