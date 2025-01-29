// AnimeScreen.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Linking,
  AppState // Imported AppState
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';

import {
  ChevronLeftIcon,
  StarIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'react-native-heroicons/outline';

import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Loading from './loading';
import { fetchAnimeById, fetchAnimeCharecters } from './api/AnimeDB';
import Cast from '../components/cast';
import { useUser } from '../Context/UserContext';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const topMargin = isIOS ? 20 : 25;

// ----------------------------------
//  LIST-STATUS OPTIONS
// ----------------------------------
const STATUS_OPTIONS = [
  { label: 'Want to Watch', value: 'want_to_watch' },
  { label: 'Watching Now', value: 'watching_now' },
  { label: 'Done Watching', value: 'done_watching' },
  { label: 'Complete it Later', value: 'complete_later' },
  { label: "I Don't Want to Complete It", value: 'dont_want' }
];

// ----------------------------------
//  ICON MAPPING FOR LIST-STATUS
// ----------------------------------
const STATUS_ICON_MAPPING = {
  want_to_watch: <EyeIcon size={20} color="#ffffff" />,
  watching_now: <BookmarkIcon size={20} color="#ffffff" />,
  done_watching: <CheckCircleIcon size={20} color="#ffffff" />,
  complete_later: <ClockIcon size={20} color="#ffffff" />,
  dont_want: <XCircleIcon size={20} color="#ffffff" />
};

export default function AnimeScreen() {
  const { params: item } = useRoute();
  const navigation = useNavigation();
  const { userId, BASE_URL } = useUser();

  const LOCAL_SERVER_BASE_URL = BASE_URL;

  // -------------------------------
  //         STATE
  // -------------------------------
  const [animeDetails, setAnimeDetails] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(false);

  const [relatedSeasons, setRelatedSeasons] = useState([]);

  const [activeTab, setActiveTab] = useState('Description');
  const [showAll, setShowAll] = useState(false);

  // "My List"
  const [myListStatus, setMyListStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Watched-episodes map
  const [watchedEpisodesMap, setWatchedEpisodesMap] = useState({});

  // Local server episodes
  const [localEpisodes, setLocalEpisodes] = useState([]);
  const [slugFetching, setSlugFetching] = useState(false);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);

  // Subtitle selection
  const [isSubtitleModalVisible, setIsSubtitleModalVisible] = useState(false);
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [currentHlsSource, setCurrentHlsSource] = useState(null);

  // Episode order preference
  const [episodesOrder, setEpisodesOrder] = useState('asc');

  // **New State for Refreshing**
  const [isRefreshing, setIsRefreshing] = useState(false);

  const heartScale = new Animated.Value(1); // optional "comment" button scale

  // Derive MAL ID from route param
  const currentMalId = item?.mal_id ?? item?.malId;

  // Keys for local storage
  const animeIdKey = String(currentMalId || 'invalid');
  const EPISODES_KEY = `EPISODES_${animeIdKey}`;

  // -------------------------------
  //    NEW STATE VARIABLES
  // -------------------------------
  const [adShownMap, setAdShownMap] = useState({}); // Removed previous adShownMap logic

  // Pending episode to watch after returning from ad
  const [pendingEpisode, setPendingEpisode] = useState(null);

  // -------------------------------
  //    FOCUS => FETCH
  // -------------------------------
  useFocusEffect(
    useCallback(() => {
      if (currentMalId) {
        fetchData(currentMalId);
      } else {
        setLoading(false);
        console.log('No valid MAL ID found, cannot fetch data.');
      }
    }, [currentMalId])
  );

  // Once animeDetails is available, try to fetch local episodes by English title
  useEffect(() => {
    const titleToUse = animeDetails?.title_english || animeDetails?.title;
    if (titleToUse) {
      fetchLocalEpisodes(titleToUse);
    }
  }, [animeDetails]);

  // Load myList status & watched episodes once
  useEffect(() => {
    fetchMyListStatus();
    fetchUserWatchedEpisodes();
    loadAdShownMap(); // Load Ad Shown Map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever animeDetails changes, fetch related seasons
  useEffect(() => {
    if (animeDetails?.mal_id) {
      fetchRelatedSeasons(animeDetails.mal_id);
    }
  }, [animeDetails]);

  // -------------------------------
  //    LOAD AD SHOWN MAP FROM STORAGE
  // -------------------------------
  const loadAdShownMap = async () => {
    try {
      const storedMap = await AsyncStorage.getItem('AD_SHOWN_MAP');
      if (storedMap) {
        setAdShownMap(JSON.parse(storedMap));
      }
    } catch (error) {
      console.error('Error loading AD_SHOWN_MAP from AsyncStorage:', error);
    }
  };

  // -------------------------------
  //    FETCH FUNCTIONS
  // -------------------------------
  // -----------------------------------------------------------
  // 1) FETCH ANIME DETAILS
  // -----------------------------------------------------------
  const fetchData = async (malId) => {
    setLoading(true);
    setRetry(false);
    try {
      console.log('Fetching data for MAL ID:', malId);

      // If we already have the anime data from route param, use that:
      const displayItem =
        item?.approved && item?.mal_id === malId
          ? item
          : // otherwise fetch from Jikan
            await fetchAnimeById(malId).then((res) => res.data);

      setAnimeDetails(displayItem);

      // fetch cast
      const characterData = await fetchAnimeCharecters(displayItem.mal_id);
      if (characterData && characterData.data) {
        setCast(characterData.data);
      }
    } catch (error) {
      if (error?.response && [404, 429].includes(error.response.status)) {
        // do nothing or minimal logging
      } else {
        console.error('Error fetching anime data:', error);
        Alert.alert('Error', 'Failed to fetch anime details. Please try again.');
      }
      setRetry(true);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 1.1) FETCH RELATED SEASONS
  // -----------------------------------------------------------
  const fetchRelatedSeasons = async (malId) => {
    try {
      const response = await axios.get(
        `https://api.jikan.moe/v4/anime/${malId}/relations`
      );
      if (!response.data || !response.data.data) {
        setRelatedSeasons([]);
        return;
      }

      // Flatten all relations
      const allRelations = response.data.data.flatMap((rel) => rel.entry);

      // Filter out duplicates + the current anime
      const uniqueRelations = allRelations.filter(
        (entry, index, self) =>
          index === self.findIndex((t) => t.mal_id === entry.mal_id) &&
          entry.mal_id !== malId
      );

      // We'll fetch each anime detail in small chunks
      const chunkSize = 3;
      let allFetchedResults = [];

      for (let i = 0; i < uniqueRelations.length; i += chunkSize) {
        const chunk = uniqueRelations.slice(i, i + chunkSize);

        const chunkPromises = chunk.map((anime) =>
          axios
            .get(`https://api.jikan.moe/v4/anime/${anime.mal_id}`)
            .then((res) => res.data.data)
            .catch((err) => {
              if (err?.response && [404, 429].includes(err.response.status)) {
                return null;
              }
              console.error(
                `Error fetching details for mal_id ${anime.mal_id}:`,
                err
              );
              return null;
            })
        );

        const chunkResults = await Promise.all(chunkPromises);
        allFetchedResults = allFetchedResults.concat(
          chunkResults.filter((r) => r !== null)
        );
      }

      const relatedSeasonsData = allFetchedResults.map((item) => ({
        mal_id: item.mal_id,
        title: item.title,
        image_url: item.images?.jpg?.image_url || ''
      }));

      setRelatedSeasons(relatedSeasonsData);
    } catch (error) {
      if (error?.response && [404, 429].includes(error.response.status)) {
        // ignore
      } else {
        console.error('Error fetching related seasons:', error);
      }
    }
  };

  // -----------------------------------------------------------
  // 2) FETCH EPISODES FROM LOCAL SERVER
  // -----------------------------------------------------------
  const fetchLocalEpisodes = async (animeTitle, forceFetch = false) => {
    if (!currentMalId) return;
    setIsEpisodesLoading(true);
    try {
      if (!forceFetch) {
        // Check local cache first
        const cachedEpisodes = await AsyncStorage.getItem(EPISODES_KEY);
        if (cachedEpisodes) {
          console.log('Loading episodes from cache');
          setLocalEpisodes(JSON.parse(cachedEpisodes));
          setIsEpisodesLoading(false);
          return;
        }
      }

      // If forceFetch is true or cache is empty, fetch from server
      console.log('Fetching episodes from local server');
      setSlugFetching(true);

      const response = await axios.get(
        `${LOCAL_SERVER_BASE_URL}/fetchEpisodes?name=${encodeURIComponent(
          animeTitle
        )}&mal_id=${currentMalId}`
      );

      if (response.data?.success) {
        const episodesData = response.data.data.episodes || [];
        setLocalEpisodes(episodesData);

        // Save to AsyncStorage
        await AsyncStorage.setItem(EPISODES_KEY, JSON.stringify(episodesData));
      } else {
        console.warn('Local server returned success=false for /fetchEpisodes');
      }
    } catch (error) {
      if (error?.response && [404, 429].includes(error.response.status)) {
        // silent
      } else {
        console.error('Error fetching local episodes:', error);
      }
    } finally {
      setSlugFetching(false);
      setIsEpisodesLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 3) LOAD & SAVE WATCHED EPISODES (LOCAL)
  // -----------------------------------------------------------
  const saveWatchedEpisodesMap = async (updatedMap) => {
    try {
      await AsyncStorage.setItem('ANIME_WATCHED_MAP', JSON.stringify(updatedMap));
    } catch (err) {
      console.error('Failed to save watched episodes map:', err);
    }
  };

  const getLocalWatchedSet = () => {
    return new Set(watchedEpisodesMap[animeIdKey] || []);
  };

  // -----------------------------------------------------------
  // 4) FETCH USER’S WATCHED EPISODES (SERVER)
  // -----------------------------------------------------------
  const fetchUserWatchedEpisodes = async () => {
    if (!userId) return; // skip if not logged in
    try {
      const response = await axios.get(
        `${LOCAL_SERVER_BASE_URL}/data?userId=${userId}`
      );
      const { userData } = response.data;
      if (userData?.watchedEpisodes) {
        /**
         * userData.watchedEpisodes = [
         *   { animeId: '12345', episodes: [1,2,3] },
         *   { animeId: '67890', episodes: [1,2] }
         * ]
         */
        const serverMap = {};
        userData.watchedEpisodes.forEach((entry) => {
          serverMap[entry.animeId] = entry.episodes || [];
        });

        // Merge server data with local
        setWatchedEpisodesMap((prevMap) => {
          const merged = { ...prevMap };
          Object.keys(serverMap).forEach((id) => {
            const serverEpisodes = new Set(serverMap[id]);
            const localEpisodes = new Set(merged[id] || []);
            const combined = new Set([...serverEpisodes, ...localEpisodes]);
            merged[id] = Array.from(combined);
          });
          saveWatchedEpisodesMap(merged);
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to fetch user’s watched episodes:', err);
    }
  };

  // -----------------------------------------------------------
  // 5) HANDLE EPISODE CLICK => GET STREAM => MARK AS WATCHED
  // -----------------------------------------------------------
  const handleEpisodePress = async (episodeItem) => {
    setPendingEpisode(episodeItem); // Set the episode to watch after ad

    const adUrl =
      'https://www.profitablecpmrate.com/pv11sw1v0?key=13a9d5897dc1f7220100cde4e99635a4';

    // Attempt to open the ad URL in the external browser
    const canOpen = await Linking.canOpenURL(adUrl);
    if (canOpen) {
      try {
        await Linking.openURL(adUrl);
      } catch (error) {
        console.error('Failed to open ad URL:', error);
        Alert.alert('Error', 'Failed to open the ad. Please try again.');
        setPendingEpisode(null); // Reset pending episode
        return;
      }
    } else {
      Alert.alert('Error', 'Cannot open the ad link.');
      setPendingEpisode(null); // Reset pending episode
      return;
    }
  };

  // -----------------------------------------------------------
  // 6) PROCEED TO OPEN EPISODE AFTER AD
  // -----------------------------------------------------------
  const proceedToOpenEpisode = async (episodeItem) => {
    const { number: episodeNumber, episodeId } = episodeItem;
    setIsEpisodeLoading(true);

    try {
      // (a) If user is logged in, update “watched” on server
      if (userId) {
        await axios.post(`${LOCAL_SERVER_BASE_URL}/watched`, {
          userId,
          animeId: currentMalId,
          episodeNumber
        });
      }

      // (b) Update local watched map
      setWatchedEpisodesMap((prevMap) => {
        const updated = { ...prevMap };
        const currentList = new Set(updated[animeIdKey] || []);
        currentList.add(episodeNumber);
        updated[animeIdKey] = Array.from(currentList);
        saveWatchedEpisodesMap(updated);
        return updated;
      });

      // (c) fetch servers (streams & subtitles) from local
      const serverRes = await axios.get(
        `${LOCAL_SERVER_BASE_URL}/fetchEpisode?episodeId=${encodeURIComponent(
          episodeId
        )}`
      );
      if (!serverRes.data?.success) {
        Alert.alert(
          'Error',
          serverRes.data.message || 'Failed to fetch servers for this episode.'
        );
        setIsEpisodeLoading(false);
        return;
      }

      const serversData = serverRes.data.data;
      // We now extract intro/outro from serversData
      const { intro, outro } = serversData;
      const hlsSource = serversData.sources[0]?.url;
      if (!hlsSource) {
        Alert.alert('Error', 'No HLS source found.');
        setIsEpisodeLoading(false);
        return;
      }

      // Extract subtitle tracks
      const captionTracks = serversData.tracks.filter(
        (track) => track.kind === 'captions'
      );

      if (captionTracks.length === 0) {
        // No subtitles => open immediately
        openVideoWithStreamScreen(hlsSource, null, intro, outro);
      } else if (captionTracks.length === 1) {
        // Single subtitle => open directly
        openVideoWithStreamScreen(
          hlsSource,
          captionTracks[0].file,
          intro,
          outro
        );
      } else {
        // Show subtitle selection
        setAvailableSubtitles(
          captionTracks.map((track, index) => ({
            id: index.toString(),
            label: track.label,
            file: track.file
          }))
        );
        setCurrentHlsSource(hlsSource);
        // Store intro/outro so we can use them after user picks a subtitle
        setSelectedSubtitle({ intro, outro });
        setIsSubtitleModalVisible(true);
      }
    } catch (err) {
      if (err?.response && [404, 429].includes(err.response.status)) {
        // silent
      } else {
        console.error('Error in proceedToOpenEpisode:', err);
        Alert.alert('Error', 'Failed to fetch episode sources.');
      }
    } finally {
      setIsEpisodeLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 7) OPEN VIDEO + SUBTITLES + INTRO/OUTRO IN STREAM SCREEN
  // -----------------------------------------------------------
  const openVideoWithStreamScreen = (videoUrl, subtitleUrl, intro, outro) => {
    try {
      if (!videoUrl) {
        Alert.alert('Error', 'Video URL is missing.');
        return;
      }
      navigation.navigate('Stream', {
        videoUrl,
        subtitleUrl,
        intro,
        outro
      });
    } catch (err) {
      console.error('Error navigating to StreamScreen:', err);
      Alert.alert('Error', 'Failed to navigate to the video player.');
    }
  };

  // -----------------------------------------------------------
  // 8) MY LIST LOGIC
  // -----------------------------------------------------------
  const fetchMyListStatus = async () => {
    if (!currentMalId) return;
    try {
      const res = await axios.get(`${LOCAL_SERVER_BASE_URL}/list`, {
        params: {
          userId,
          animeId: currentMalId
        }
      });
      if (res.status === 200 && res.data?.animeStatus) {
        setMyListStatus(res.data.animeStatus.status || null);
      }
    } catch (error) {
      console.error('Error fetching My List status:', error);
    }
  };

  const updateMyListStatus = async (status) => {
    try {
      const res = await axios.post(
        `${LOCAL_SERVER_BASE_URL}/list`,
        {
          userId,
          animeId: currentMalId,
          status
        }
      );
      if (res.status === 200) {
        setMyListStatus(status);
      }
    } catch (error) {
      console.error('Error updating My List status:', error);
    }
  };

  const handleStatusSelection = (status) => {
    updateMyListStatus(status);
    setIsModalVisible(false);
  };

  const getMyListLabel = () => {
    const statusOption = STATUS_OPTIONS.find(
      (option) => option.value === myListStatus
    );
    return statusOption ? statusOption.label : 'Add to My List';
  };

  const getStatusColor = () => {
    switch (myListStatus) {
      case 'want_to_watch':
        return '#fbc02d';
      case 'watching_now':
        return '#42a5f5';
      case 'done_watching':
        return '#66bb6a';
      case 'complete_later':
        return '#ab47bc';
      case 'dont_want':
        return '#ef5350';
      default:
        return '#ffffff';
    }
  };

  // -----------------------------------------------------------
  // 9) HANDLE APP STATE CHANGE
  // -----------------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [pendingEpisode]);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active' && pendingEpisode) {
      // User has returned to the app after viewing the ad
      proceedToOpenEpisode(pendingEpisode);
      setPendingEpisode(null); // Reset pending episode
    }
  };

  // ----------------------------------
  // Render Episode
  // ----------------------------------
  const renderEpisodeItem = ({ item }) => {
    const episodeNumber = item.number;
    const isCompleted = getLocalWatchedSet().has(episodeNumber);

    return (
      <TouchableOpacity
        style={[
          styles.episodeCard,
          isCompleted && styles.episodeCardCompleted
        ]}
        onPress={() => handleEpisodePress(item)}
        disabled={isEpisodeLoading}
      >
        <View style={styles.episodeInfo}>
          <EyeIcon
            size={24}
            color={isCompleted ? '#4caf50' : '#ffffff'}
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              styles.episodeText,
              isCompleted && styles.episodeTextCompleted
            ]}
          >
            Episode {episodeNumber} {item.isFiller ? '(Filler)' : ''}
          </Text>
        </View>
        <View style={styles.playIconContainer}>
          <PlayIcon size={20} color="#ffffff" />
        </View>
      </TouchableOpacity>
    );
  };

  // ----------------------------------
  // Header
  // ----------------------------------
  const renderHeader = () => (
    <>
      {/* Top Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: AnimeProp.background }}
          style={{ width, height: height * 0.55 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(23,23,23,0.8)', 'rgba(23,23,23,1)']}
          style={{
            width,
            height: height * 0.4,
            position: 'absolute',
            bottom: 0
          }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        {/* Top row (Back + Comments) */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeftIcon size={28} strokeWidth={2.5} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.commentButton}
            onPress={() =>
              navigation.navigate('comments', {
                animeId: AnimeProp?.Airing?.Time || '',
                title: AnimeProp?.name || ''
              })
            }
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <ChatBubbleLeftIcon size={35} color="#ffffff" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{AnimeProp.name}</Text>

          {/* My List Button */}
          <View style={styles.myListContainer}>
            <TouchableOpacity
              onPress={() => {
                if (!userId) {
                  Alert.alert(
                    'Login Required',
                    'Please log in to add anime to your list.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Login', onPress: () => navigation.navigate('Login') }
                    ]
                  );
                } else {
                  setIsModalVisible(true);
                }
              }}
              style={[
                styles.myListButton,
                myListStatus && { backgroundColor: getStatusColor() }
              ]}
            >
              {myListStatus ? (
                STATUS_ICON_MAPPING[myListStatus] || (
                  <PlusIcon size={20} color="#ffffff" />
                )
              ) : (
                <PlusIcon size={20} color="#000000" />
              )}
              <Text
                style={[
                  styles.myListText,
                  myListStatus && { color: '#ffffff' }
                ]}
              >
                {myListStatus ? getMyListLabel() : 'Add to My List'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subInfoText}>
            {AnimeProp.Airing.status} • {AnimeProp.Airing.Time} •{' '}
            {AnimeProp.ep} episodes
          </Text>
          <View style={styles.genresContainer}>
            {AnimeProp.genres.map((genre, idx) => (
              <View key={idx} style={styles.genreBadge}>
                <Text style={styles.genreText}>{genre.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.scoreDurationContainer}>
            <StarIcon size={22} color="#FFD700" />
            <Text style={styles.scoreText}>
              {score == null ? '?' : score} ({scored_by} ratings)
            </Text>
          </View>
          <View style={styles.scoreDurationContainer}>
            <ClockIcon size={22} color="#90ee90" />
            <Text style={styles.durationText}>
              {AnimeProp.duration || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Description' && styles.activeTab
            ]}
            onPress={() => setActiveTab('Description')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Description' && styles.activeTabText
              ]}
            >
              Description
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Watch' && styles.activeTab
            ]}
            onPress={() => setActiveTab('Watch')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Watch' && styles.activeTabText
              ]}
            >
              Watch
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>

  );

  // ----------------------------------
  // Description tab
  // ----------------------------------
  const renderDescriptionTab = () => (
    <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
      {/* Synopsis */}
      <TouchableOpacity onPress={() => setShowAll(!showAll)}>
        <Text style={styles.synopsisText}>
          {showAll
            ? AnimeProp.story
            : AnimeProp.story?.length > 450
            ? AnimeProp.story.slice(0, 450) + '...'
            : AnimeProp.story}
        </Text>
        {AnimeProp.story?.length > 450 && (
          <Text style={styles.showMoreText}>
            {showAll ? 'Show Less' : 'Show More'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Trailer */}
      {trailer?.embed_url ? (
        <View style={styles.trailerContainer}>
          <Text style={styles.sectionTitle}>Trailer</Text>
          <WebView
            source={{ uri: trailer.embed_url }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      ) : null}

      {/* Cast */}
      <Cast cast={cast} navigation={navigation} />

      {/* Related Seasons */}
      <View style={styles.seasonsContainer}>
        <Text style={styles.seasonsTitle}>Related</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonsScroll}
        >
          {relatedSeasons.length === 0 ? (
            <Text style={{ color: 'white', marginLeft: 16 }}>
              No related seasons found.
            </Text>
          ) : (
            relatedSeasons.map((season) => (
              <TouchableOpacity
                key={season.mal_id}
                style={styles.seasonsItem}
                onPress={() =>
                  navigation.push('Anime', { malId: season.mal_id })
                }
              >
                <Image
                  style={styles.seasonsImage}
                  source={{ uri: season.image_url }}
                />
                <Text style={styles.seasonsName}>
                  {season.title.length < 15
                    ? season.title
                    : season.title.slice(0, 15) + '...'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );

  // ----------------------------------
  // Watch tab
  // ----------------------------------
  const renderWatchTab = () => {
    const sortedEpisodes =
      episodesOrder === 'asc' ? localEpisodes : [...localEpisodes].reverse();

    // **Refresh Handler**
    const onRefresh = async () => {
      if (isRefreshing) return; // Prevent multiple refreshes
      setIsRefreshing(true);
      const titleToUse = animeDetails?.title_english || animeDetails?.title;
      if (titleToUse) {
        await fetchLocalEpisodes(titleToUse, true); // Force fetch from server
      }
      setIsRefreshing(false);
    };

    return (
      <View style={styles.watchTabContainer}>
        <FlatList
          data={sortedEpisodes}
          keyExtractor={(ep) => ep.number.toString()}
          renderItem={renderEpisodeItem}
          contentContainerStyle={styles.episodesList}
          showsVerticalScrollIndicator={false}
          // **Implementing Pull-to-Refresh**
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <>
              {/* Reuse the same header above the episodes */}
              {renderHeader()}

              {/* Episode Order Toggle */}
              <View style={styles.episodeOrderContainer}>
                <Text style={styles.episodeOrderLabel}>Episode Order:</Text>
                <TouchableOpacity
                  style={[
                    styles.episodeOrderButton,
                    episodesOrder === 'asc' && styles.episodeOrderButtonActive
                  ]}
                  onPress={() => setEpisodesOrder('asc')}
                >
                  <Text
                    style={[
                      styles.episodeOrderButtonText,
                      episodesOrder === 'asc' &&
                        styles.episodeOrderButtonTextActive
                    ]}
                  >
                    Asc
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.episodeOrderButton,
                    episodesOrder === 'desc' &&
                      styles.episodeOrderButtonActive
                  ]}
                  onPress={() => setEpisodesOrder('desc')}
                >
                  <Text
                    style={[
                      styles.episodeOrderButtonText,
                      episodesOrder === 'desc' &&
                        styles.episodeOrderButtonTextActive
                    ]}
                  >
                    Desc
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
        />

        {/* Watch-tab loader overlay */}
        {isEpisodesLoading && (
          <View style={styles.watchLoaderOverlay}>
            <ActivityIndicator size="large" color="#5abf75" />
            <Text style={styles.loadingText}>Loading episodes...</Text>
          </View>
        )}
      </View>
    );
  };

  // ----------------------------------
  // Subtitle Selection Modal
  // ----------------------------------
  const renderSubtitleSelectionModal = () => (
    <Modal
      visible={isSubtitleModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsSubtitleModalVisible(false)}
    >
      <TouchableWithoutFeedback
        onPress={() => setIsSubtitleModalVisible(false)}
      >
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.subtitleModalContainer}>
        <View style={styles.subtitleModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Subtitle Language</Text>
            <TouchableOpacity
              onPress={() => setIsSubtitleModalVisible(false)}
            >
              <XMarkIcon size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableSubtitles}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.statusOption}
                onPress={() => {
                  if (currentHlsSource) {
                    // If we stored "intro"/"outro" in selectedSubtitle, pass them
                    openVideoWithStreamScreen(
                      currentHlsSource,
                      item.file,
                      selectedSubtitle?.intro || null,
                      selectedSubtitle?.outro || null
                    );
                    setIsSubtitleModalVisible(false);
                  } else {
                    Alert.alert('Error', 'Streaming source is not available.');
                  }
                }}
              >
                <Text style={styles.statusText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(option) => option.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  // ----------------------------------
  // My List Status Modal
  // ----------------------------------
  const renderMyListModal = () => (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <XMarkIcon size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={STATUS_OPTIONS}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.statusOption}
                onPress={() => handleStatusSelection(item.value)}
              >
                <Text style={styles.statusText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(option) => option.value}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  // ----------------------------------
  // MAIN RENDER
  // ----------------------------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {retry ? (
          <TouchableOpacity
            onPress={() => currentMalId && fetchData(currentMalId)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : (
          <Loading />
        )}
      </View>
    );
  }

  if (!animeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Anime details not available. Check connection or MAL ID.
        </Text>
      </View>
    );
  }

  const {
    title_english,
    images,
    aired,
    duration,
    genres = [],
    episodes,
    synopsis,
    trailer,
    score,
    scored_by
  } = animeDetails;

  const AnimeProp = {
    name: title_english || animeDetails?.title,
    background: images?.jpg?.large_image_url,
    Airing: {
      status: aired ? 'Aired' : 'Not released',
      Time: aired?.from?.slice(0, 4) || ''
    },
    duration,
    genres,
    ep: episodes || 0,
    story: synopsis
  };

  const currentAnimeWatchedSet = getLocalWatchedSet();

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171717" />
      <SafeAreaView style={styles.container}>
        {activeTab === 'Description' ? (
          <ScrollView style={styles.backgroundDark}>
            {renderHeader()}
            {renderDescriptionTab()}
          </ScrollView>
        ) : (
          renderWatchTab()
        )}

        {/* Subtitle Selection Modal */}
        {renderSubtitleSelectionModal()}

        {/* Loading Overlay when user selects an episode */}
        {isEpisodeLoading && (
          <View style={styles.episodeLoadingOverlay}>
            <ActivityIndicator size="large" color="#5abf75" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* My List Status Modal */}
        {renderMyListModal()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ----------------------------------
// STYLES
// ----------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  backgroundDark: {
    backgroundColor: '#171717'
  },
  loadingContainer: {
    position: 'absolute',
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center'
  },
  retryButton: {
    padding: 15,
    backgroundColor: '#5abf75',
    borderRadius: 30
  },
  retryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center'
  },

  // Header
  topRow: {
    position: 'absolute',
    zIndex: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    top: topMargin
  },
  backButton: {
    borderRadius: 25,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  commentButton: {
    borderRadius: 25,
    padding: 6,
    backgroundColor: '#5abf75',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },

  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 10
  },
  titleContainer: {
    marginTop: -height * 0.09,
    marginBottom: 20
  },
  titleText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5
  },

  // My List
  myListContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  myListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  myListText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000000'
  },

  subInfoText: {
    color: '#b0b0b0',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10
  },
  genresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  genreBadge: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    marginVertical: 3
  },
  genreText: {
    color: '#b0b0b0',
    fontSize: 14,
    fontWeight: '600'
  },
  scoreDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 5
  },
  durationText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 5
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  tabButton: {
    marginHorizontal: 20,
    paddingBottom: 5
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5abf75'
  },
  tabText: {
    color: '#ffffff',
    fontSize: 18
  },
  activeTabText: {
    opacity: 1
  },

  // Description
  synopsisText: {
    color: '#b0b0b0',
    fontSize: 16,
    lineHeight: 22
  },
  showMoreText: {
    color: '#5abf75',
    marginTop: 5,
    fontSize: 16,
    fontWeight: '600'
  },
  trailerContainer: {
    marginTop: 20
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10
  },
  webView: {
    width: '100%',
    height: 200,
    borderRadius: 10
  },

  // Related Seasons
  seasonsContainer: {
    marginVertical: 24
  },
  seasonsTitle: {
    color: 'white',
    fontSize: 18,
    marginHorizontal: 16,
    marginBottom: 20
  },
  seasonsScroll: {
    paddingHorizontal: 15
  },
  seasonsItem: {
    marginRight: 16,
    alignItems: 'center'
  },
  seasonsImage: {
    borderRadius: 16,
    height: 128,
    width: 112
  },
  seasonsName: {
    color: '#a0a0a0',
    fontSize: 12,
    margin: 4,
    textAlign: 'center',
    width: 112
  },

  // Watch tab
  watchTabContainer: {
    flex: 1,
    backgroundColor: '#171717',
    position: 'relative'
  },
  episodesList: {
    paddingBottom: 20,
    backgroundColor: '#171717'
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 10
  },
  episodeCardCompleted: {
    backgroundColor: '#3a3a3a'
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  episodeText: {
    color: '#ffffff',
    fontSize: 16
  },
  episodeTextCompleted: {
    color: '#4caf50',
    textDecorationLine: 'line-through'
  },
  playIconContainer: {
    backgroundColor: '#5abf75',
    borderRadius: 20,
    padding: 5
  },

  // Episode Order Toggle
  episodeOrderContainer: {
    marginBottom: 20,
    backgroundColor: '#171717',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20
  },
  episodeOrderLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: 8
  },
  episodeOrderButton: {
    borderWidth: 1,
    borderColor: '#5abf75',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4
  },
  episodeOrderButtonText: {
    color: '#ffffff',
    fontSize: 14
  },
  episodeOrderButtonActive: {
    backgroundColor: '#5abf75'
  },
  episodeOrderButtonTextActive: {
    color: '#000000'
  },

  // Overlays
  watchLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  episodeLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  loadingText: {
    color: '#5abf75',
    marginTop: 10,
    fontSize: 16
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    position: 'absolute',
    top: height / 4,
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 5
  },
  modalContent: {},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000'
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 10
  },
  statusText: {
    fontSize: 16,
    color: '#000000'
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0'
  },
  subtitleModalContainer: {
    position: 'absolute',
    top: height * 0.25, // Adjust to center the modal
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    maxHeight: height * 0.5
  },
  subtitleModalContent: {},

  // Ad Modal Styles - Removed as per new implementation
});
