import React from 'react';
import { View, Text, Image, Dimensions, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { TouchableOpacity, GestureHandlerRootView, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';

var { width, height } = Dimensions.get('window');

export default function GalerieList({ title, data, hideSeeAll }) {
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
            <TouchableWithoutFeedback key={index} onPress={() => { Linking.openURL(item.jpg.image_url); }}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.jpg ? item.jpg.image_url : null }}
                  style={styles.image}
                />
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
    color: '#5abf75', // text color
    fontSize: 18, // text-lg
  },
  scrollContainer: {
    paddingHorizontal: 15,
  },
  imageContainer: {
    marginRight: 16, // mr-4
  },
  image: {
    borderRadius: 8, // rounded corners
    width: width * 0.33,
    height: height * 0.22,
  },
});
