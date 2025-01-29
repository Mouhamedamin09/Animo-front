import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Layout from '../Layouts/Layout';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AnimeListScreen from './SeasonsListScreen';
import { fetchSeason, fetchUpcomingSeason } from './api/AnimeDB';
import SeasonsComponent from './seasonsComponent';

const Tab = createMaterialTopTabNavigator();

export default function SeasonsScreen() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const getSeasons = async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      let seasonYear = currentYear;
      let seasonName = '';

      if (currentMonth >= 1 && currentMonth <= 3) {
        seasonName = 'winter';
      } else if (currentMonth >= 4 && currentMonth <= 6) {
        seasonName = 'spring';
      } else if (currentMonth >= 7 && currentMonth <= 9) {
        seasonName = 'summer';
      } else if (currentMonth >= 10 && currentMonth <= 12) {
        seasonName = 'fall';
      }

      if (currentMonth === 1) {
        seasonYear -= 1; // Winter season is in the previous year
      }

      setLoading(true);
      try {
        const currentSeasonData = await fetchSeason(seasonYear, seasonName).then((res) => res.data);

        let previousSeasonYear = seasonYear;
        let previousSeasonName = '';

        switch (seasonName) {
          case 'winter':
            previousSeasonName = 'fall';
            previousSeasonYear = currentMonth === 1 ? seasonYear - 1 : seasonYear;
            break;
          case 'spring':
            previousSeasonName = 'winter';
            break;
          case 'summer':
            previousSeasonName = 'spring';
            break;
          case 'fall':
            previousSeasonName = 'summer';
            break;
          default:
            break;
        }

        let nextSeasonYear = seasonYear;
        let nextSeasonName = '';

        switch (seasonName) {
          case 'winter':
            nextSeasonName = 'spring';
            break;
          case 'spring':
            nextSeasonName = 'summer';
            break;
          case 'summer':
            nextSeasonName = 'fall';
            break;
          case 'fall':
            nextSeasonName = 'winter';
            nextSeasonYear = seasonYear + 1;
            break;
          default:
            break;
        }

        if (currentMonth === 1 && seasonName === 'winter') {
          nextSeasonYear += 1;
        }

        const nextSeasonData = await fetchUpcomingSeason().then((res) => res.data);
        const previousSeasonData = await fetchSeason(previousSeasonYear, previousSeasonName).then((res) => res.data);

        setData({
          currentSeason: currentSeasonData,
          previousSeason: previousSeasonData,
          nextSeason: nextSeasonData,
          seasonName: seasonName,
          previousSeasonName: previousSeasonName,
          nextSeasonName: nextSeasonName,
          year: seasonYear,
          Pyear: previousSeasonYear,
          Nyear: nextSeasonYear,
        });
      } catch (error) {
        console.error('Error fetching character data:', error);
      } finally {
        setLoading(false);
      }
    };

    getSeasons();
  }, []);

  if (loading || data === null) {
    return (
      <Layout>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#5abf75" />
        <Text style={styles.loaderText}>Loading Seasons...</Text>
      </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
      <Tab.Navigator
  initialRouteName="Current Season"
  screenOptions={{
    tabBarActiveTintColor: '#5abf75', // Color for active tab text
    tabBarInactiveTintColor: '#cccccc', // Color for inactive tab text
    tabBarLabelStyle: { 
      fontSize: 14, // Adjust font size for better readability
      fontWeight: 'bold', 
      textTransform: 'capitalize' // Ensures proper capitalization
    },
    tabBarStyle: { backgroundColor: '#262626' }, // Background color of the tab bar
    tabBarIndicatorStyle: { 
      backgroundColor: '#5abf75', 
      height: 3 
    }, // Style for the indicator under the active tab
  }}
>
  <Tab.Screen
    name="Previous Season"
    component={AnimeListScreen}
    initialParams={{
      season: data.previousSeasonName,
      data: data.previousSeason,
      year: data.Pyear,
    }}
  />
  <Tab.Screen
    name="Current Season"
    component={AnimeListScreen}
    initialParams={{
      season: data.seasonName,
      data: data.currentSeason,
      year: data.year,
    }}
  />
  <Tab.Screen
    name="Next Season"
    component={AnimeListScreen}
    initialParams={{
      season: data.nextSeasonName,
      data: data.nextSeason,
      year: data.Nyear,
    }}
  />
  <Tab.Screen
    name="Other Seasons"
    component={SeasonsComponent}
    initialParams={{}}
  />
</Tab.Navigator>

      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loaderText: {
    marginTop: 10,
    color: '#5abf75', // Vibrant orange
    fontSize: 16,
  },
});
