import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  Platform,
  ScrollView,
  SafeAreaView,
  Animated,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert, // Optional: For confirmation dialogs
} from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { HeartIcon as MiniHeartIcon } from 'react-native-heroicons/mini';
import Loading from './loading';
import { fetchPersonById } from './api/AnimeDB';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");
const ios = Platform.OS === "ios";

export default function VoiceActorScreen() {
  const [heartScale] = useState(new Animated.Value(1));
  const [isFavourite, setIsFavourite] = useState(true);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [voiceActorData, setVoiceActorData] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const route = useRoute();
  const { actorId } = route.params;

  useEffect(() => {
    const getVoiceActorData = async () => {
      setLoading(true);
      try {
        const data = await fetchPersonById(actorId).then(res => res.data);
        setVoiceActorData(data);
        console.log(actorId);
      } catch (error) {
        console.error('Error fetching voice actor data:', error);
      } finally {
        setLoading(false);
      }
    };

    getVoiceActorData();
  }, [actorId]);

  const toggleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    setIsFavourite(!isFavourite);
  };

  const getDetail = (detail) => detail || 'Unknown';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <SafeAreaView style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeftIcon size={28} strokeWidth={2.5} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <MiniHeartIcon size={35} color={isFavourite ? "#5abf75" : "white"} />
          </Animated.View>
        </TouchableOpacity>
      </SafeAreaView>

      {loading ? (
        <Loading />
      ) : (
        voiceActorData && (
          <View style={styles.contentContainer}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: voiceActorData.images.jpg.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.nameText}>{voiceActorData.name}</Text>
              <Text style={styles.favoritesText}>{voiceActorData.favorites} ♡ liked this Voice Actor</Text>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Name</Text>
                <Text style={styles.infoDetail}>{getDetail(voiceActorData.given_name)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>F-Name</Text>
                <Text style={styles.infoDetail}>{getDetail(voiceActorData.family_name)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Birthday</Text>
                <Text style={styles.infoDetail}>{voiceActorData.birthday ? voiceActorData.birthday.slice(0, 10) : 'Unknown'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Website</Text>
                <Text style={styles.infoDetail}>{voiceActorData.website_url ? 'Available' : 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.biographyContainer}>
              <Text style={styles.biographyTitle}>Biography</Text>
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text style={styles.biographyText}>
                  {voiceActorData.about
                    ? (showAll
                      ? voiceActorData.about
                      : voiceActorData.about.length > 450
                        ? `${voiceActorData.about.slice(0, 450)}...`
                        : voiceActorData.about)
                    : 'No biography provided'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
  },
  backButton: {
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageWrapper: {
    borderRadius: 100, // Make the container circular
    overflow: 'hidden',
    height: 256, // Equivalent to h-64 (64 * 4 = 256)
    width: 256,  // Equivalent to w-64
    borderWidth: 2,
    borderColor: '#4A4A4A', // Equivalent to border-neutral-500
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: height * 0.43, // 0.43 * height
    width: width * 0.74,   // 0.74 * width
  },
  nameContainer: {
    marginTop: 24, // Equivalent to mt-6 (6 * 4 = 24)
    alignItems: 'center',
  },
  nameText: {
    fontSize: 24, // Equivalent to text-3xl
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  favoritesText: {
    fontSize: 16, // Equivalent to text-base
    color: '#A3A3A3', // Equivalent to text-neutral-500
    textAlign: 'center',
    marginTop: 4,
  },
  infoContainer: {
    marginTop: 24, // Equivalent to mt-6
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4A4A4A', // Equivalent to bg-neutral-700
    borderRadius: 9999, // Equivalent to rounded-full
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12, // Equivalent to mx-3
    borderWidth: 2,
    borderColor: '#A3A3A3', // Equivalent to border-neutral-400
  },
  infoItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 2,
    borderRightColor: '#A3A3A3', // Equivalent to border-r-neutral-400
  },
  infoTitle: {
    color: 'white',
    fontWeight: '600', // Equivalent to font-semibold
    fontSize: 16, // Equivalent to text-white font-semibold
    marginBottom: 2,
  },
  infoDetail: {
    color: '#D1D5DB', // Equivalent to text-neutral-300
    fontSize: 12, // Equivalent to text-sm
    textAlign: 'center',
  },
  biographyContainer: {
    marginTop: 24, // Equivalent to my-6
    marginHorizontal: 16, // Equivalent to mx-4
    width: '100%',
    space: 8, // Equivalent to space-y-2 (handled by marginBottom in text)
  },
  biographyTitle: {
    color: 'white',
    fontSize: 18, // Equivalent to text-lg
    marginBottom: 8,
  },
  biographyText: {
    color: '#9CA3AF', // Equivalent to text-neutral-400
    letterSpacing: 0.5, // Equivalent to tracking-wide
    fontSize: 14,
    lineHeight: 20,
  },
});
