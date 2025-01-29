import React from 'react';
import { View, Text, Image, ScrollView, Dimensions, StyleSheet, TouchableOpacity ,TouchableWithoutFeedback} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

const { width, height } = Dimensions.get('window');

export default function SeeAllScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { title, data } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeftIcon size={28} strokeWidth={2.5} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {data.map((item, index) => {
          const isEntry = !!item.entry;
          const displayItem = isEntry ? item.entry[0] : item;

          return (
            <TouchableWithoutFeedback key={index} onPress={() => navigation.push('Anime', displayItem)}>
              <View style={styles.item}>
                <Image
                  source={{ uri: displayItem.images ? displayItem.images.jpg.large_image_url : null }}
                  style={styles.image}
                />
                <Text style={styles.itemTitle}>
                  {displayItem.title?.length > 14 ? displayItem.title.slice(0, 14) + '...' : displayItem.title}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#262626',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  backButton: {
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10, // Adjust this value as needed to position the title properly
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  item: {
    marginBottom: 24,
    width: width * 0.44,
  },
  image: {
    borderRadius: 20,
    width: '100%',
    height: height * 0.3,
  },
  itemTitle: {
    color: '#a1a1aa',
    marginTop: 8,
    marginLeft: 4,
  },
});
