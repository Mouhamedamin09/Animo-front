import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function AnimeListScreen({ route }) {
  const navigation = useNavigation();
  const { season, data, year } = route.params;

  return (
    <View style={styles.content}>
      <Text style={styles.seasonText}>{`${season} ${year}`}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.animeContainer}>
          {data.map((item, index) => {
            const animeTitle = item.title.length > 17 ? item.title.slice(0, 20) + "..." : item.title;
            return (
              <TouchableWithoutFeedback
                key={index}
                onPress={() => navigation.push("Anime", { mal_id: item.mal_id })}
              >
                <View style={styles.animeItem}>
                  <Image
                    source={{ uri: item.images.jpg.large_image_url }}
                    style={styles.animeImage}
                  />
                  <Text style={styles.animeTitle}>{animeTitle}</Text>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#262626',
  },
  seasonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  scrollContainer: {
    paddingHorizontal: 15,
  },
  animeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  animeItem: {
    marginBottom: 16, // Equivalent to mb-4
  },
  animeImage: {
    width: width * 0.44,
    height: height * 0.3,
  },
  animeTitle: {
    color: '#a1a1aa', // text-neutral-400
    marginLeft: 4, // ml-1
    marginTop: 4, // space between image and text
  },
});
