// screens/AirDates.js

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../Context/UserContext';
import Layout from '../Layouts/Layout';
import { useAnime } from '../Context/AnimeContext';

const AirDates = () => {
  const navigation = useNavigation();
  const { theme } = useUser(); // Retrieve theme from context

  // Access Air Dates data and functions from AnimeContext
  const {
    airDatesAnimes,
    fetchAirDates,
    airDatesLoading,
    airDatesError,
    airDatesRefreshing,
    handleAnimePress,
  } = useAnime();

  useEffect(() => {
    if (airDatesAnimes.length === 0) {
      fetchAirDates();
    }
  }, []);

  const onRefresh = async () => {
    await fetchAirDates(true); // Pass true to indicate a refresh action
  };

  if (airDatesLoading && !airDatesRefreshing) {
    return (
      <Layout>
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#5abf75" />
        </View>
      </Layout>
    );
  }

  if (airDatesError) {
    return (
      <Layout>
        <View style={[styles.center, { flex: 1 }]}>
          <Text style={{ color: 'red' }}>{airDatesError}</Text>
          <TouchableOpacity onPress={() => fetchAirDates()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View
        style={[
          styles.container,
          { backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF' },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={airDatesRefreshing}
              onRefresh={onRefresh}
              colors={['#5abf75']}
              tintColor="#5abf75"
            />
          }
        >
          {airDatesAnimes.length === 0 ? (
            <View style={styles.center}>
              <Text
                style={[
                  styles.noAnimesText,
                  { color: theme === 'dark' ? '#ccc' : '#555' },
                ]}
              >
                No animes scheduled for today.
              </Text>
            </View>
          ) : (
            airDatesAnimes.map((anime) => (
              <TouchableOpacity
                key={anime.id}
                style={styles.animeItem}
                onPress={() => handleAnimePress(anime.id, navigation)}
              >
                {/* Poster */}
                {anime.poster ? (
                  <Image
                    source={{ uri: anime.poster }}
                    style={styles.poster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.poster, styles.posterPlaceholder]}>
                    <Text style={{ color: '#aaa' }}>No Image</Text>
                  </View>
                )}

                {/* Info */}
                <View style={styles.infoContainer}>
                  <Text
                    style={[
                      styles.animeTitle,
                      { color: theme === 'dark' ? '#fff' : '#000' },
                    ]}
                  >
                    {anime.name}
                  </Text>
                  <Text
                    style={[
                      styles.episodeText,
                      { color: theme === 'dark' ? '#ccc' : '#555' },
                    ]}
                  >
                    Episode: {anime.episode}
                  </Text>
                  <Text
                    style={[
                      styles.timeText,
                      { color: theme === 'dark' ? '#ccc' : '#555' },
                    ]}
                  >
                    Air Time: {anime.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Layout>
  );
};

export default AirDates;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    padding: 10,
  },
  animeItem: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: 'rgba(90, 191, 117, 0.1)', // Light green tint
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: 100,
    height: 140,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  animeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  episodeText: {
    fontSize: 14,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
  },
  noAnimesText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#5abf75',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
