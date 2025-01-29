import React from 'react';
import { View, Text, Image, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { TouchableOpacity, GestureHandlerRootView, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

var { width, height } = Dimensions.get('window');

export default function VoiceActor({ title, data, hideSeeAll }) {
  const navigation = useNavigation();

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5abf75" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity>
            {!hideSeeAll && <Text style={styles.seeAll}>See All</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {data.slice(0, 10).map((item, index) => (
            <TouchableWithoutFeedback
              key={index}
              onPress={() => navigation.push('VoiceActor', { actorId: item.person.mal_id })}
            >
              <View style={styles.actorContainer}>
                <Image
                  source={{ uri: item.person.images ? item.person.images.jpg.image_url : null }}
                  style={styles.actorImage}
                />
                <Text style={styles.actorName}>
                  {item.person.name?.length > 14 ? item.person.name.slice(0, 14) + '...' : item.person.name}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          ))}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    marginBottom: 32, // mb-8
  },
  header: {
    marginHorizontal: 16, // mx-4
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white', // text-white
    fontSize: 24, // text-xl
  },
  seeAll: {
    color: '#5abf75', // See All text color
    fontSize: 18, // text-lg
  },
  scrollContainer: {
    paddingHorizontal: 15,
  },
  actorContainer: {
    marginRight: 16, // mr-4
  },
  actorImage: {
    borderRadius: 24, // rounded-3xl
    width: width * 0.33,
    height: height * 0.22,
  },
  actorName: {
    color: '#d1d1d1', // text-neutral-300
    marginLeft: 4, // ml-1
    marginTop: 8, // mt-2
    fontSize: 14,
  },
});
