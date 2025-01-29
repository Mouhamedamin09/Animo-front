import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    StatusBar,
    Platform,
    TouchableOpacity,
    ScrollView,
    Image,
    BackHandler,
    Alert,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../Context/UserContext';
import axios from 'axios';

// Import custom components
import TrendingAnime from '../components/trendingAnime';
import AnimeList from '../components/AnimeList';
import Loading from './loading';
import NewEpisodes from '../components/NewEpisodes';

// Import API functions
import { fetchTrendingAnimes, fetchUpcomingAnimes, fetchTopAnimes, fetchRecommendation } from './api/AnimeDB';

// Import Layout
import Layout from '../Layouts/Layout'; // Adjust the path as necessary

const ios = Platform.OS === 'ios';
const { width, height } = Dimensions.get('window');

export default function LoggedHomeScreen() { 
    const navigation = useNavigation();
    const route = useRoute();
    const { userName, userId, setUserId, setUserName, avatar, setAvatar } = useUser();

    const [Trending, setTrending] = useState([]);
    const [upComing, setUpcoming] = useState([]);
    const [TopRated, setTopRated] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newEpisodes, setNewEpisodes] = useState([]);

    // Fetch and set user information from route params
    useEffect(() => {
        const { userName: routeUserName, userId: routeUserId } = route.params || {};
        if (routeUserId) {
            setUserId(routeUserId);
        }
        if (routeUserName) {
            setUserName(routeUserName);
        }
        // Check if avatar is not set or is the default avatar
    }, [route.params]);

    // Fetch anime data on component mount
    useEffect(() => {
        fetchAllAnimeData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllAnimeData();
        setRefreshing(false);
    };

    // Helper function to wait for a specified duration
    const wait = (timeout) => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    };

    // Retry logic with exponential backoff
    const fetchWithRetry = async (fetchFunction, maxRetries = 5, delay = 1000) => {
        let attempts = 0;
        while (attempts < maxRetries) {
            try {
                const response = await fetchFunction();
                return response;
            } catch (error) {
                attempts += 1;
                if (attempts >= maxRetries) {
                    throw error;
                }
                // Optional: Check if error is retryable (e.g., 429 status code)
                if (error.response && error.response.status !== 429) {
                    // If it's not a rate limit error, don't retry
                    throw error;
                }
                // Wait before retrying
                await wait(delay * attempts); // Exponential backoff
            }
        }
    };

    // Function to fetch all anime lists sequentially with retries
    const fetchAllAnimeData = async () => {
        setLoading(true);
        try {
            // Fetch Trending Animes
            const trendingData = await fetchWithRetry(fetchTrendingAnimes);
            if (trendingData && trendingData.data) setTrending(trendingData.data);

            // Fetch Upcoming Animes
            const upcomingData = await fetchWithRetry(fetchUpcomingAnimes);
            if (upcomingData && upcomingData.data) setUpcoming(upcomingData.data);

            // Fetch Top Rated Animes
            const topRatedData = await fetchWithRetry(fetchTopAnimes);
            if (topRatedData && topRatedData.data) setTopRated(topRatedData.data);

            // Fetch Recommendations
            const recommendationData = await fetchWithRetry(fetchRecommendation);
            if (recommendationData && recommendationData.data) setRecommendations(recommendationData.data);

        } catch (error) {
            console.error('Error fetching anime data:', error);
            Alert.alert('Error', 'Failed to fetch some or all anime data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Android back button to confirm exit
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                Alert.alert('Exit App', 'Are you sure you want to exit?', [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Yes',
                        onPress: () => BackHandler.exitApp(),
                    },
                ]);
                return true; // Prevent default back action
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [])
    );

    // Function to update user avatar in backend
    // (Assuming you have implementation here)

    return (
        <Layout>
            {loading ? (
                <Loading />
            ) : (
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    
                    {/* Trending Anime Section */}
                    <TrendingAnime data={Trending} />

                    
                    {/* Recommendations Anime Section */}
                    <AnimeList title="Recommendations" data={recommendations} />

                    {/* Upcoming Anime Section */}
                    <AnimeList title="Upcoming" data={upComing} />

                    {/* Top Rated Anime Section */}
                    <AnimeList title="Top Rated" data={TopRated} />

                </ScrollView>
            )}
        </Layout>
    );
}

// Stylesheet
const styles = StyleSheet.create({
    scrollViewContent: {
        paddingBottom: 20,
    },
});
