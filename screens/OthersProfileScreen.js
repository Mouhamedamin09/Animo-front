// OtherProfile.js

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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit'; // Import PieChart
import { useUser } from '../Context/UserContext'; // Import useUser for current user info

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

// Chart configuration
const chartConfig = {
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  strokeWidth: 2, // Optional, default is 3
  useShadowColorFromDataset: false, // Optional
};

export default function OtherProfileScreen() {
  // Navigation & route
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {}; // The profile's userId

  // Access current user from context
  const { currentUserId, BASE_URL } = useUser(); // Adjust based on your context

  // Banner height for parallax
  const BANNER_HEIGHT = 260;
  const scrollY = useRef(new Animated.Value(0)).current;

  // State for user data
  const [user, setUser] = useState({
    name: 'Unknown',
    handle: '@UnknownUser',
    location: 'Unknown',
    birthDate: 'Unknown',
    joinedDate: 'Unknown',
    avatarUri: getRandomAvatar(),
    stats: {
      completed: 0,
      watching: 0,
      planToWatch: 0,
      dropped: 0,
      notInterested: 0,
    },
    totalEpisodes: 0,
    animeList: [], // Assuming animeList is fetched
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
    outputRange: [BANNER_HEIGHT - 90, 30],
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
  };

  // Fetch user list from the backend
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
  }, []);

  // Fetch user data
  const fetchUserDataFromBackend = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/data?userId=${userId}`,
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
          avatarUri: userData.avatar || getRandomAvatar(),
          birthDate: userData.birthDate || 'Unknown',
          location: userData.country || 'Unknown',
          joinedDate: `Joined in ${formattedJoinedDate || 'Unknown'}`,
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

  return (
    <View style={styles.container}>
      {/* SafeArea */}
      <SafeAreaView style={ios ? styles.safeAreaIOS : styles.safeAreaAndroid}>
        <StatusBar barStyle="light-content" backgroundColor="#262626" />
        {/* Updated Header */}
        <View style={styles.header}>
          {/* Go Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('LoggedHome'); // Fallback navigation
              }
            }}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityHint="Navigates to the previous screen"
          >
            <Ionicons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>

          {/* Header Title */}
          <Text style={styles.headerTitle}>
            <Text style={{ color: '#5abf75' }}>A</Text>nimo
          </Text>

          {/* Header Right Placeholder or Action */}
          {userId !== currentUserId ? (
            <View style={styles.headerRightPlaceholder}>
             
              
            </View>
          ) : (
            <View style={styles.headerRightPlaceholder} />
          )}
        </View>
      </SafeAreaView>

      {/* Parallax Banner */}
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

      {/* Scrollable Content */}
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
        {/* Spacer */}
        <View style={{ marginTop: BANNER_HEIGHT }} />

        {/* Profile Info Card */}
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

            {/* Action Button (e.g., Follow) */}
            {userId !== currentUserId && (
              <View style={styles.buttonContainer}>
                
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#333333', '#2a2a2a']}
            style={styles.statsCardGradient}
          >
            <Text style={styles.statsTitle}>Stats</Text>
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

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Floating Avatar */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensures space between back button and title
    marginHorizontal: 16,
    paddingVertical: 10, // Adds vertical padding for better touch area
  },
  backButton: {
    // Optional: Add additional styling if needed
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Takes up remaining space to center the title
  },
  headerRightPlaceholder: {
    width: 30, // Same width as the follow button to balance the header
    alignItems: 'flex-end',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButtonText: {
    color: '#5abf75',
    fontSize: 14,
    fontWeight: '600',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followButtonText: {
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementIcon: {
    marginRight: 10,
  },
  achievementTitle: {
    color: 'white',
    fontSize: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444444',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeTitle: {
    color: 'white',
    fontSize: 14,
  },
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
  divider: {
    borderBottomColor: '#555555',
    borderBottomWidth: 1,
    marginVertical: 16,
    width: '100%',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
