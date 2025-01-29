// SeasonsComponent.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchSeason } from './api/AnimeDB'; // Adjust import based on your API setup

const SeasonsComponent = () => {
  const [data, setData] = useState(null);
  const navigation = useNavigation();
  
  // Assuming you have a way to get userId, e.g., from context or props
  const userId = 'exampleUserId'; // Replace with actual userId retrieval

  // Function to handle fetching data for a specific year and season
  const fetchDataAndNavigate = async (year, season) => {
    try {
      const response = await fetchSeason(year, season); // Adjust based on your API function
      const fetchedData = response.data; // Assuming response contains data
      
      setData(fetchedData);

      // Prepare title, e.g., "Winter 2024"
      const title = `${season} ${year}`;

      // Navigate to 'SeeAll' screen with parameters
      navigation.push('SeeAll', { title, data: fetchedData, userId });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Please try again.');
    }
  };

  // Sample data for the last 10 years
  const seasonsList = [
    { year: 2024, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2023, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2022, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2021, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2020, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2019, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2018, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2017, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2016, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
    { year: 2015, seasons: ['Winter', 'Spring', 'Summer', 'Fall'] },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore More Seasons</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {seasonsList.map((item, index) => (
          <View key={index} style={styles.yearSection}>
            <Text style={styles.yearText}>{item.year}</Text>
            <View style={styles.seasonsContainer}>
              {item.seasons.map((season, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.seasonButton}
                  onPress={() => fetchDataAndNavigate(item.year, season.toLowerCase())}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seasonButtonText}>{season}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SeasonsComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5abf75',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  yearSection: {
    marginBottom: 20,
    backgroundColor: '#333333',
    padding: 18,
    borderRadius: 10,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Android shadow
    elevation: 5,
  },
  yearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  seasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  seasonButton: {
    backgroundColor: '#5abf75',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    width: '48%', // Two buttons fit in one row
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Android shadow
    elevation: 3,
  },
  seasonButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
