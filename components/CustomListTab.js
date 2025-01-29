// components/CustomListTab.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useUser } from '../Context/UserContext'; // Example context to get userId
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const CustomListTab = ({ status }) => {
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  
  // Get userId from context or props
  const { userId } = useUser();

  // Calculate card width dynamically
  const cardWidth = (width - 32) / 2; // 16 padding * 2 and 8 margin * 2 per row

  useEffect(() => {
    fetchListData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId]);

  const fetchListData = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch the initial list data from your server
      const response = await axios.get(
        `https://animo-test-server-production.up.railway.app/getList?userId=${userId}&status=${status}`
      );

      if (response.data.success) {
        const originalData = response.data.data;

        // Fetch additional anime details from Jikan API
        const augmentedData = await Promise.all(
          originalData.map(async (item) => {
            if (item.animeId) {
              try {
                const animeResponse = await axios.get(
                  `https://api.jikan.moe/v4/anime/${item.animeId}`
                );

                if (animeResponse.data && animeResponse.data.data) {
                  const animeData = animeResponse.data.data;
                  return {
                    ...item,
                    malId: animeData.mal_id,
                    title: animeData.title || 'No Title',
                    imageUrl:
                      animeData.images?.jpg?.image_url ||
                      animeData.images?.webp?.image_url ||
                      null,
                  };
                } else {
                  // If Jikan API doesn't return data
                  return {
                    ...item,
                    title: 'Unknown Title',
                    imageUrl: null,
                  };
                }
              } catch (animeError) {
                console.error(
                  `Error fetching anime details for ID ${item.animeId}:`,
                  animeError
                );
                return {
                  ...item,
                  title: 'Unknown Title',
                  imageUrl: null,
                };
              }
            } else {
              // If no animeId is present
              return {
                ...item,
                title: 'No Anime ID',
                imageUrl: null,
              };
            }
          })
        );

        // Filter out items without malId if necessary
        const filteredData = augmentedData.filter(item => item.malId);

        setListData(filteredData);
      } else {
        setError('Failed to fetch list data.');
      }
    } catch (err) {
      console.error('Error fetching custom list:', err);
      setError('An error occurred while fetching list data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnimePress = (animeItem) => {
    if (animeItem) {
      navigation.push('Anime', { ...animeItem });
    } else {
      Alert.alert('Error', 'Anime data is unavailable.');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.cardContainer, { width: cardWidth }]}
        onPress={() => handleAnimePress(item)}
      >
        <View style={styles.card}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <Text style={styles.title}>
            {item.title.length > 14 ? `${item.title.slice(0, 14)}...` : item.title}
          </Text>
          
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#5abf75" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.footer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              fetchListData();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (listData.length === 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.emptyText}>No items found.</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.animeId ? item.animeId.toString() : `${item.title}-${item.status}`}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListFooterComponent={renderFooter}
        initialNumToRender={10}
        windowSize={21}
        columnWrapperStyle={styles.columnWrapper}
        style={styles.flatList}
      />
    </View>
  );
};

export default CustomListTab;

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures the container takes up the full screen
    backgroundColor: '#262626',
  },
  flatList: {
    flex: 1, // Makes FlatList occupy the available space
  },
  grid: {
    
    paddingTop: 10,
    paddingBottom: 0, // Removed paddingBottom to eliminate white space
  },
  columnWrapper: {
    justifyContent: 'space-between', // Distributes space between columns
  },
  cardContainer: {
    // Removed flex: 1 to prevent stretching
    margin: 8,
  },
  card: {
    backgroundColor: '#333333',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 10,
    // Adding shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Adding elevation for Android
    elevation: 5,
  },
  image: {
    width: '100%',
    height: height * 0.25,
  },
  placeholderImage: {
    width: '100%',
    height: height * 0.25,
    backgroundColor: '#555555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    marginTop: 8,
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  status: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    paddingVertical: 10, // Reduced padding to minimize white space
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5abf75',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 16,
    textAlign: 'center',
  },
});
