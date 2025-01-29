// EnhancedProfileScreen.js

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Ensure Ionicons is imported
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit'; // Added PieChart import
import { useUser } from '../Context/UserContext'; // Adjust path if needed

const ios = Platform.OS === 'ios';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to generate random RoboHash avatar (optional)
const getRandomAvatar = () => {
  const randomSeed = Math.floor(Math.random() * 1000);
  return `https://robohash.org/${randomSeed}.png?set=set5`;
};

// Define status colors
const STATUS_COLORS = {
  completed: '#5abf75',       // Green
  watching: '#5b8ef5',        // Blue
  planToWatch: '#f5c25b',     // Yellow
  dropped: '#f55b5b',         // Red
  notInterested: '#bfbfbf',   // Grey
};

export default function EnhancedProfileScreen() {

  const { BASE_URL } = useUser(); // Provide userId from context
  // Navigation & route
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  // Banner height for parallax
  const BANNER_HEIGHT = 260;
  const scrollY = useRef(new Animated.Value(0)).current;

  // State for user data
  const [user, setUser] = useState({
    name: 'Animo User',
    handle: '@RC7558824',
    location: 'USA',
    birthDate: '2008 August 17',
    joinedDate: 'Joined in July 2023',
    avatarUri: getRandomAvatar(),
    stats: {
      completed: 1,
      watching: 2,
      planToWatch: 93,
      dropped: 1,
      notInterested: 0,
    },
    totalEpisodes: 0,
    coins: 80, // Added coins to user state
  });

  // State to manage loading while fetching avatar
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated values
  const bannerHeight = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT],
    outputRange: [BANNER_HEIGHT, 80],
    extrapolate: 'clamp',
  });

  const avatarSize = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [120, 60],
    extrapolate: 'clamp',
  });

  const avatarTop = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [BANNER_HEIGHT - 100, 20], // Pushed up by 10 pixels
    extrapolate: 'clamp',
  });

  const profileInfoTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  const profileInfoOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await Promise.all([fetchUserListFromBackend(), fetchUserDataFromBackend()]);
    setRefreshing(false); // Stop refreshing
    fetchTotalEpisodesFromBackend();
  };

  const fetchUserListFromBackend = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/userlist?userId=${userId}`
      );

      console.log('Server Response:', response.data); // Debugging

      if (response.status === 200) {
        const { statusCounts, animeList } = response.data;

        console.log('Status Counts:', statusCounts);
        console.log('Anime List:', animeList); // Debugging

        setUser((prevUser) => ({
          ...prevUser,
          stats: {
            ...prevUser.stats,
            ...statusCounts,
          },
          animeList: Array.isArray(animeList) ? animeList : [],
        }));
      } else {
        console.log('Failed to fetch user list:', response.data.error);
        Alert.alert('Error', 'Failed to fetch user list.');
      }
    } catch (error) {
      console.error(
        'Error fetching user list:',
        error.response?.data || error.message
      );
      Alert.alert('Error', 'An error occurred while fetching user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserListFromBackend();
    fetchTotalEpisodesFromBackend();
  }, []);

  const fetchTotalEpisodesFromBackend = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/countepisodes?userId=${userId}`
      );

      if (response.status === 200 && response.data.success) {
        const { totalEpisodes } = response.data.data;

        setUser((prevUser) => ({
          ...prevUser,
          totalEpisodes: totalEpisodes,
        }));
      } else {
        console.log('Failed to fetch total episodes:', response.data.message);
        Alert.alert('Error', 'Failed to fetch total episodes.');
      }
    } catch (error) {
      console.error(
        'Error fetching total episodes:',
        error.response?.data || error.message
      );
      Alert.alert('Error', 'An error occurred while fetching total episodes.');
    }
  };

  // Fetch user data without token
  const fetchUserDataFromBackend = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/data?userId=${userId}`
      );

      if (response.status === 200) {
        const { userData } = response.data;
        const formattedJoinedDate = userData.createdAt
          ? new Date(userData.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Unknown';

        setUser((prevUser) => ({
          ...prevUser,
          ...userData,
          name: userData.username || 'Unknown',
          avatarUri: userData.avatar,
          birthDate: userData.birthDate ? userData.birthDate.split('T')[0] : 'Unknown',
          location: userData.country || 'Unknown',
          joinedDate: `Joined in ${formattedJoinedDate || 'Unknown'}`,
          coins: userData.coins !== undefined ? userData.coins : prevUser.coins, // Update coins if available
        }));
      } else {
        console.log('Failed to fetch user data:', response.data.error);
        Alert.alert('Error', 'Failed to fetch user data.');
      }
    } catch (error) {
      console.error(
        'Error fetching user data:',
        error.response?.data || error.message
      );
      Alert.alert('Error', 'An error occurred while fetching user data.');
    } finally {
      setLoadingAvatar(false);
    }
  };

  useEffect(() => {
    fetchUserDataFromBackend();
  }, []);

  // Prepare chart data
  const chartData = [
    {
      name: 'Completed',
      population: user.stats.completed,
      color: STATUS_COLORS.completed,
      legendFontColor: '#FFFFFF',
      legendFontSize: 14,
    },
    {
      name: 'Watching',
      population: user.stats.watching,
      color: STATUS_COLORS.watching,
      legendFontColor: '#FFFFFF',
      legendFontSize: 14,
    },
    {
      name: 'Plan to Watch',
      population: user.stats.planToWatch,
      color: STATUS_COLORS.planToWatch,
      legendFontColor: '#FFFFFF',
      legendFontSize: 14,
    },
    {
      name: 'Dropped',
      population: user.stats.dropped,
      color: STATUS_COLORS.dropped,
      legendFontColor: '#FFFFFF',
      legendFontSize: 14,
    },
    {
      name: 'Not Interested',
      population: user.stats.notInterested,
      color: STATUS_COLORS.notInterested,
      legendFontColor: '#FFFFFF',
      legendFontSize: 14,
    },
  ];

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    useShadowColorFromDataset: false, // optional
  };

  return (
    <View style={styles.container}>
      
      <SafeAreaView style={styles.safeAreaAndroid}>
        <StatusBar barStyle="light-content" backgroundColor="#262626" />
       
        <View style={styles.header}>
          
          <TouchableOpacity
            onPress={() => {
              navigation.goBack(); // Use goBack for proper back navigation
            }}
            style={styles.backButton}
            activeOpacity={0.7} // Optional: Provides feedback on touch
            accessibilityLabel="Go Back"
            accessibilityHint="Navigates to the previous screen"
          >
            <Ionicons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>

          
          <Text style={styles.headerTitle}>
            <Text style={{ color: '#5abf75' }}>A</Text>nimo
          </Text>

          
          <TouchableOpacity
            style={styles.coinsContainer}
            onPress={() => navigation.navigate('AddCoins')} 
            activeOpacity={0.7}
            accessibilityLabel="Add Coins"
            accessibilityHint="Navigates to the Add Coins screen"
          >
            <Ionicons name="pricetag-outline" size={24} color="#5abf75" />
            <Text style={styles.coinsText}>{user.coins}</Text>
            
          </TouchableOpacity>
        </View>
      </SafeAreaView>

     
      <Animated.View style={[styles.bannerContainer, { height: bannerHeight }]}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1493150134366-cacb0bdc03eb?auto=format&fit=crop&w=1051&q=80',
          }}
          style={styles.bannerImage}
        />
        <LinearGradient
          colors={['rgba(38,38,38,0.15)', '#262626']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        
        <View style={{ marginTop: BANNER_HEIGHT }} />

       
        <Animated.View
          style={[
            styles.profileCard,
            {
              transform: [{ translateY: profileInfoTranslateY }],
              opacity: profileInfoOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#333333', '#2a2a2a']}
            style={styles.profileCardGradient}
          >
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileHandle}>{user.handle}</Text>
            <Text style={styles.profileLocation}>{user.location}</Text>
            <Text style={styles.profileDates}>
              Birth Date: {user.birthDate}
              {'\n'}
              {user.joinedDate}
            </Text>

            
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                navigation.navigate('EditProfile', { userId: userId })
              }
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#5abf75"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

      
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#333333', '#2a2a2a']}
            style={styles.statsCardGradient}
          >
            <Text style={styles.statsTitle}>My Stats</Text>
            
            {/* Existing Stats Rows */}
            <View style={styles.statsRow}>
              <View style={styles.statItemBox}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{user.stats.completed}</Text>
              </View>
              <View style={styles.statItemBox}>
                <Text style={styles.statLabel}>Watching</Text>
                <Text style={styles.statValue}>{user.stats.watching}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItemBox}>
                <Text style={styles.statLabel}>Plan to Watch</Text>
                <Text style={styles.statValue}>{user.stats.planToWatch}</Text>
              </View>
              <View style={styles.statItemBox}>
                <Text style={styles.statLabel}>Dropped</Text>
                <Text style={styles.statValue}>{user.stats.dropped}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItemBox}>
                <Text style={styles.statLabel}>Not Interested</Text>
                <Text style={styles.statValue}>
                  {user.stats.notInterested}
                </Text>
              </View>
              <View style={styles.statItemBox}>
                <Text style={styles.statLabel}>Total Eps</Text>
                <Text style={styles.statValue}>{user.totalEpisodes}</Text>
              </View>
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />

            {/* Pie Chart */}
            <View style={styles.pieChartContainer}>
              <PieChart
                data={chartData}
                width={SCREEN_WIDTH - 32} // Adjusted for padding/margin
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute // Display absolute numbers
              />
            </View>
          </LinearGradient>
        </View>

        
        {/* Achievements Section */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#333333', '#2a2a2a']}
            style={styles.sectionGradient}
          >
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.comingSoonContainer}>
              <Ionicons
                name="construct-outline"
                size={30}
                color="#5abf75"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </LinearGradient>
        </View>

       
        {/* Badges Section */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#333333', '#2a2a2a']}
            style={styles.sectionGradient}
          >
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.comingSoonContainer}>
              <Ionicons
                name="construct-outline"
                size={30}
                color="#5abf75"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </LinearGradient>
        </View>

        
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            top: avatarTop,
            left: SCREEN_WIDTH / 2 - 60, 
            opacity: avatarOpacity,
          },
        ]}
      >
        {loadingAvatar ? (
          <ActivityIndicator size="large" color="#5abf75" />
        ) : (
          <Animated.Image
            source={{ uri: user.avatarUri }}
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: Animated.divide(avatarSize, 2),
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
  },
  safeAreaIOS: {
    marginBottom: -2,
  },
  safeAreaAndroid: {
    marginBottom: 3,
  },
  header: {
    position: 'absolute', // Position the header absolutely
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensure it's on top of other components
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensures space between back button and title
    marginHorizontal: 16,
    paddingVertical: 10, // Adds vertical padding for better touch area
    backgroundColor: 'transparent', // Transparent background to see underlying banner
  },
  backButton: {
    padding: 10, // Ensure a larger touchable area
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Takes up remaining space to center the title
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsText: {
    color: '#5abf75',
    fontSize: 16,
    marginHorizontal: 4,
    fontWeight: '600',
  },
  addIcon: {
    marginLeft: 4,
  },
  bannerContainer: {
    position: 'absolute',
    width: '100%',
    overflow: 'hidden',
    zIndex: 1,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollView: {
    zIndex: 2,
  },
  scrollViewContent: {
    paddingBottom: 20,
    backgroundColor: '#262626',
  },
  avatarContainer: {
    position: 'absolute',
    zIndex: 5,
    // Removed 'left' and 'top' from here; handled in Animated.View
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#5abf75',
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileCardGradient: {
    padding: 16,
  },
  profileName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileHandle: {
    color: '#5abf75',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  profileLocation: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileDates: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: '#444444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#5abf75',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsCardGradient: {
    padding: 16,
  },
  statsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItemBox: {
    flex: 1,
    backgroundColor: '#444444',
    marginHorizontal: 4,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionGradient: {
    padding: 16,
    alignItems: 'center', // Center align the Coming Soon content
    justifyContent: 'center',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  // New styles for Coming Soon sections
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  comingSoonText: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: '600',
  },
  // Divider Style
  divider: {
    borderBottomColor: '#555555',
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  // Pie Chart Container
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
