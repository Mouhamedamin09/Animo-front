// Context/AnimeContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import { fetchTopCharacters, fetchAnimeById } from '../screens/api/AnimeDB'; // Adjust the path as needed
import { batchProcess } from '../utils/batchRequests'; // Ensure this path is correct
import { useUser } from '../Context/UserContext'; // Import useUser to access userId

// Define Base URLs
const AnimeContext = createContext();

export const AnimeProvider = ({ children }) => {
    const { userId, BASE_URL } = useUser(); // Access userId from UserContext

    const API_BASE_URL_1000 = `http://104.236.83.107:1000/api/v2/hianime`;
    const API_BASE_URL_3000 = `${BASE_URL}`;

    // -----------------------
    // State Definitions
    // -----------------------
    // All Animes
    const [allAnimes, setAllAnimes] = useState([]);
    const [allAnimeLoading, setAllAnimeLoading] = useState(false);
    const [allAnimeLoadingMore, setAllAnimeLoadingMore] = useState(false);
    const [allAnimeError, setAllAnimeError] = useState(null);
    const [allAnimePage, setAllAnimePage] = useState(1);
    const [allAnimeHasNextPage, setAllAnimeHasNextPage] = useState(true);

    // Last Updates
    const [lastUpdates, setLastUpdates] = useState([]);
    const [lastUpdatesLoading, setLastUpdatesLoading] = useState(false);
    const [lastUpdatesError, setLastUpdatesError] = useState(null);
    const [lastUpdatesRefreshing, setLastUpdatesRefreshing] = useState(false);

    // Top Rate Animes
    const [topRateAnimes, setTopRateAnimes] = useState([]);
    const [topRateLoading, setTopRateLoading] = useState(false);
    const [topRateLoadingMore, setTopRateLoadingMore] = useState(false);
    const [topRateError, setTopRateError] = useState(null);
    const [topRatePage, setTopRatePage] = useState(1);
    const [topRateHasNextPage, setTopRateHasNextPage] = useState(true);

    // Top Characters
    const [topCharacters, setTopCharacters] = useState([]);
    const [topCharactersLoading, setTopCharactersLoading] = useState(false);
    const [topCharactersLoadingMore, setTopCharactersLoadingMore] = useState(false);
    const [topCharactersError, setTopCharactersError] = useState(null);
    const [topCharactersPage, setTopCharactersPage] = useState(1);
    const [topCharactersHasNextPage, setTopCharactersHasNextPage] = useState(true);

    // Last Watch
    const [lastWatchAnimes, setLastWatchAnimes] = useState([]);
    const [lastWatchLoading, setLastWatchLoading] = useState(true);
    const [lastWatchError, setLastWatchError] = useState(null);
    const [lastWatchRefreshing, setLastWatchRefreshing] = useState(false);

    // -----------------------
    // Air Dates
    // -----------------------
    const [airDatesAnimes, setAirDatesAnimes] = useState([]);
    const [airDatesLoading, setAirDatesLoading] = useState(false);
    const [airDatesError, setAirDatesError] = useState(null);
    const [airDatesRefreshing, setAirDatesRefreshing] = useState(false);

    // -----------------------
    // Function to Fetch All Animes
    // -----------------------
    const fetchAllAnimes = async (pageNumber = 1) => {
        if (allAnimeLoading || allAnimeLoadingMore) return;

        if (pageNumber === 1) {
            setAllAnimeLoading(true);
        } else {
            setAllAnimeLoadingMore(true);
        }

        try {
            setAllAnimeError(null);
            const response = await axios.get(`https://aniwatch-api-production-528d.up.railway.app/api/v2/hianime/azlist/all`, {
                params: { page: pageNumber },
            });
            console.log(response.data);

            if (response.data.success) {
                const fetchedAnimes = response.data.data.animes;

                // Fetch details for each anime to get malId
                const detailedAnimes = await Promise.all(
                    fetchedAnimes.map(async (anime) => {
                        try {
                            const detailResponse = await axios.get(`${API_BASE_URL_1000}/anime/${anime.id}`);

                            if (detailResponse.data.success) {
                                const malId = detailResponse.data.data.anime.info.malId;
                                if (malId) {
                                    return { ...anime, malId };
                                }
                            }
                            return null;
                        } catch (err) {
                            console.error(`Error fetching details for anime ${anime.id}:`, err);
                            return null;
                        }
                    })
                );

                // Filter out animes without malId
                const validAnimes = detailedAnimes.filter((anime) => anime !== null);

                setAllAnimes((prevAnimes) =>
                    pageNumber === 1 ? validAnimes : [...prevAnimes, ...validAnimes]
                );
                setAllAnimePage(pageNumber);
                setAllAnimeHasNextPage(response.data.data.hasNextPage);
            } else {
                setAllAnimeError('Failed to fetch data.');
            }
        } catch (err) {
            console.error('Error fetching All Anime:', err);
            setAllAnimeError('An error occurred while fetching data.');
        } finally {
            if (pageNumber === 1) {
                setAllAnimeLoading(false);
            } else {
                setAllAnimeLoadingMore(false);
            }
        }
    };

    // -----------------------
    // Function to Fetch Last Updates
    // -----------------------
    const fetchLastUpdates = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setLastUpdatesRefreshing(true);
            } else {
                setLastUpdatesLoading(true);
            }
            setLastUpdatesError(null);
            const response = await axios.get(`${API_BASE_URL_1000}/category/recently-updated`);

            if (response.data.success) {
                setLastUpdates(response.data.data.animes);
            } else {
                setLastUpdatesError('Failed to fetch data.');
            }
        } catch (err) {
            console.error('Error fetching Last Updates:', err);
            setLastUpdatesError('An error occurred while fetching data.');
        } finally {
            if (isRefresh) {
                setLastUpdatesRefreshing(false);
            } else {
                setLastUpdatesLoading(false);
            }
        }
    };

    // -----------------------
    // Function to Fetch Top Rate Animes
    // -----------------------
    const fetchTopRate = async (pageNumber = 1) => {
        if (topRateLoading || topRateLoadingMore) return;

        if (pageNumber === 1) {
            setTopRateLoading(true);
        } else {
            setTopRateLoadingMore(true);
        }

        try {
            setTopRateError(null);
            const response = await axios.get(`${API_BASE_URL_1000}/category/most-popular`, {
                params: { page: pageNumber },
            });

            if (response.data.success) {
                const fetchedAnimes = response.data.data.animes;

                setTopRateAnimes((prevAnimes) =>
                    pageNumber === 1 ? fetchedAnimes : [...prevAnimes, ...fetchedAnimes]
                );
                setTopRatePage(pageNumber);
                setTopRateHasNextPage(response.data.data.hasNextPage);
            } else {
                setTopRateError('Failed to fetch data.');
            }
        } catch (err) {
            console.error('Error fetching Top Rate Animes:', err);
            setTopRateError('An error occurred while fetching data.');
        } finally {
            if (pageNumber === 1) {
                setTopRateLoading(false);
            } else {
                setTopRateLoadingMore(false);
            }
        }
    };

    // -----------------------
    // Function to Fetch Top Characters
    // -----------------------
    const fetchTopCharactersData = async (pageNumber = 1) => {
        if (topCharactersLoading || topCharactersLoadingMore) return;

        if (pageNumber === 1) {
            setTopCharactersLoading(true);
        } else {
            setTopCharactersLoadingMore(true);
        }

        try {
            setTopCharactersError(null);
            const data = await fetchTopCharacters(pageNumber);

            if (data && data.data && Array.isArray(data.data)) {
                if (data.data.length > 0) {
                    // Filter out duplicates based on mal_id
                    setTopCharacters((prevCharacters) => {
                        const newCharacters = data.data.filter(
                            (newItem) => !prevCharacters.some((existingItem) => existingItem.mal_id === newItem.mal_id)
                        );
                        return pageNumber === 1 ? newCharacters : [...prevCharacters, ...newCharacters];
                    });
                } else {
                    setTopCharactersHasNextPage(false); // No more data to load
                }
            } else {
                setTopCharactersError('Failed to fetch data.');
            }
        } catch (err) {
            console.error('Error fetching Top Characters:', err);
            setTopCharactersError('An error occurred while fetching data.');
        } finally {
            if (pageNumber === 1) {
                setTopCharactersLoading(false);
            } else {
                setTopCharactersLoadingMore(false);
            }
        }
    };

    // -----------------------
    // Function to Fetch Last Watch
    // -----------------------
    const fetchLastWatch = async () => {
        if (!userId) {
            setLastWatchAnimes([]);
            setLastWatchLoading(false);
            return;
        }

        try {
            setLastWatchLoading(true);
            setLastWatchError(null);

            const response = await axios.get(`${API_BASE_URL_3000}/last-watch`, {
                params: { userId },
            });

            if (response.data && response.data.animeIds) {
                let animeIds = response.data.animeIds;

                if (animeIds.length === 0) {
                    setLastWatchAnimes([]);
                    setLastWatchLoading(false);
                    return;
                }

                animeIds = animeIds.slice().reverse(); // Reverse to show last watched first

                // Define the processing function with retry logic
                const processFn = async (animeId, retries = 3) => {
                    try {
                        const res = await fetchAnimeById(animeId);
                        const animeData = res.data;

                        return {
                            mal_id: animeData.mal_id,
                            title: animeData.title || animeData.title_english || 'No Title',
                            images: animeData.images,
                        };
                    } catch (err) {
                        if (err.response && err.response.status === 429 && retries > 0) {
                            // Wait before retrying
                            await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds
                            return processFn(animeId, retries - 1);
                        } else {
                            console.error(`Error fetching details for anime ID ${animeId}:`, err);
                            return null;
                        }
                    }
                };

                // Use batchProcess to limit concurrent requests
                const detailedAnimes = await batchProcess(animeIds, processFn, 5); // 5 concurrent requests

                const filteredAnimes = detailedAnimes.filter(anime => anime !== null);
                setLastWatchAnimes(filteredAnimes);
            } else {
                setLastWatchError('Failed to fetch data.');
            }
        } catch (err) {
            console.error('Error fetching Last Watch:', err);
            setLastWatchError('An error occurred while fetching data.');
        } finally {
            setLastWatchLoading(false);
        }
    };

    // -----------------------
    // Function to Refresh Last Watch
    // -----------------------
    const onRefreshLastWatch = async () => {
        setLastWatchRefreshing(true);
        await fetchLastWatch();
        setLastWatchRefreshing(false);
    };

    // -----------------------
    // Function to Fetch Air Dates
    // -----------------------
    const fetchAirDates = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setAirDatesRefreshing(true);
            } else {
                setAirDatesLoading(true);
            }
            setAirDatesError(null);

            const todayDate = getTodayDate();

            // 1) Fetch the schedule for today
            const scheduleRes = await axios.get(
                `${API_BASE_URL_1000}/schedule`, // Adjust endpoint if different
                {
                    params: { date: todayDate },
                }
            );

            // Extract scheduledAnimes from the response
            const scheduleData = scheduleRes?.data?.data?.scheduledAnimes || [];

            if (scheduleData.length === 0) {
                setAirDatesAnimes([]);
                setAirDatesLoading(false);
                return;
            }

            // 2) Fetch details for each anime in the schedule
            const animeDetailsPromises = scheduleData.map(async (animeItem) => {
                try {
                    const detailsRes = await axios.get(
                        `${API_BASE_URL_1000}/anime/${animeItem.id}`
                    );
                    const animeInfo = detailsRes?.data?.data?.anime?.info || {};

                    return {
                        id: animeInfo.id || animeItem.id,
                        malId: animeInfo.malId || null,
                        name: animeInfo.name || animeItem.name,
                        poster: animeInfo.poster || null,
                        episode: animeItem.episode || 'N/A',
                        time: animeItem.time || 'N/A',
                    };
                } catch (detailErr) {
                    console.error(`Error fetching details for anime ID ${animeItem.id}:`, detailErr);
                    return {
                        id: animeItem.id,
                        malId: null,
                        name: animeItem.name,
                        poster: null,
                        episode: animeItem.episode || 'N/A',
                        time: animeItem.time || 'N/A',
                    };
                }
            });

            const fullAnimeData = await Promise.all(animeDetailsPromises);

            setAirDatesAnimes(fullAnimeData);
        } catch (err) {
            console.error('Error fetching air dates:', err);
            setAirDatesError('Failed to fetch air dates.');
        } finally {
            if (isRefresh) {
                setAirDatesRefreshing(false);
            } else {
                setAirDatesLoading(false);
            }
        }
    };

    // Helper function to get today's date in 'YYYY-MM-DD' format
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (`0${today.getMonth() + 1}`).slice(-2); // Months are zero-indexed
        const day = (`0${today.getDate()}`).slice(-2);
        return `${year}-${month}-${day}`;
    };

    // -----------------------
    // Shared Function: Handle Anime Press
    // -----------------------
    const handleAnimePress = async (animeId, navigation) => {
        try {
            const response = await axios.get(`${API_BASE_URL_1000}/anime/${animeId}`);

            if (response.data.success) {
                const malId = response.data.data.anime.info.malId;

                if (malId) {
                    navigation.push('Anime', { malId });
                } else {
                    Alert.alert('Error', 'malId not found for this anime.');
                }
            } else {
                Alert.alert('Error', 'Failed to fetch anime details.');
            }
        } catch (err) {
            console.error('Error fetching anime details:', err);
            Alert.alert('Error', 'An error occurred while fetching anime details.');
        }
    };

    // -----------------------
    // Effects: Automatically Fetch Data on Component Mount
    // -----------------------
    useEffect(() => {
        if (allAnimes.length === 0) {
            fetchAllAnimes();
        }
    }, []);

    useEffect(() => {
        if (lastUpdates.length === 0) {
            fetchLastUpdates();
        }
    }, []);

    useEffect(() => {
        if (topRateAnimes.length === 0) {
            fetchTopRate();
        }
    }, []);

    useEffect(() => {
        if (topCharacters.length === 0) {
            fetchTopCharactersData();
        }
    }, []);

    useEffect(() => {
        fetchLastWatch();
    }, [userId]);

    useEffect(() => {
        if (airDatesAnimes.length === 0) {
            fetchAirDates();
        }
    }, []);

    return (
        <AnimeContext.Provider
            value={{
                // -----------------------
                // All Animes
                // -----------------------
                allAnimes,
                fetchAllAnimes,
                allAnimeLoading,
                allAnimeLoadingMore,
                allAnimeError,
                allAnimePage,
                allAnimeHasNextPage,

                // -----------------------
                // Last Updates
                // -----------------------
                lastUpdates,
                fetchLastUpdates,
                lastUpdatesLoading,
                lastUpdatesError,
                lastUpdatesRefreshing,

                // -----------------------
                // Top Rate Animes
                // -----------------------
                topRateAnimes,
                fetchTopRate,
                topRateLoading,
                topRateLoadingMore,
                topRateError,
                topRatePage,
                topRateHasNextPage,

                // -----------------------
                // Top Characters
                // -----------------------
                topCharacters,
                fetchTopCharactersData,
                topCharactersLoading,
                topCharactersLoadingMore,
                topCharactersError,
                topCharactersPage,
                topCharactersHasNextPage,

                // -----------------------
                // Last Watch
                // -----------------------
                lastWatchAnimes,
                fetchLastWatch,
                lastWatchLoading,
                lastWatchError,
                lastWatchRefreshing,
                onRefreshLastWatch,

                // -----------------------
                // Air Dates
                // -----------------------
                airDatesAnimes,
                fetchAirDates,
                airDatesLoading,
                airDatesError,
                airDatesRefreshing,

                // -----------------------
                // Shared Function
                // -----------------------
                handleAnimePress,
            }}
        >
            {children}
        </AnimeContext.Provider>
    );
};

export const useAnime = () => useContext(AnimeContext);
