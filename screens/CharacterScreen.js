import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Animated,
    Image,
    StyleSheet,
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert, // Import Alert for displaying messages
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { HeartIcon as MiniHeartIcon } from 'react-native-heroicons/mini';
import GalerieList from '../components/GalerieList';
import VoiceActor from '../components/VoiceActor';
import Loading from './loading';
import { fetchCharacterById, fetchPictureById, fetchVoiceActorById } from './api/AnimeDB';
import { useUser } from '../Context/UserContext'; // Ensure this hook provides userId

const { width, height } = Dimensions.get('window');
const ios = Platform.OS === 'ios';

export default function CharacterScreen() {
    const { userId } = useUser(); // Extract userId from context
    const [heartScale] = useState(new Animated.Value(1));
    const [isFavourite, setIsFavourite] = useState(true);
    const navigation = useNavigation();
    const route = useRoute();
    const { character } = route.params;
    const [loading, setLoading] = useState(true);
    const [characterData, setCharacterData] = useState(null);
    const [characterPic, setCharacterPic] = useState(null);
    const [voiceActor, setVoiceActor] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const characterData = await fetchCharacterById(character.mal_id).then((res) => res.data);
                setCharacterData(characterData);

                const pictureData = await fetchPictureById(character.mal_id).then((res) => res.data);
                setCharacterPic(pictureData);

                const voiceActorData = await fetchVoiceActorById(character.mal_id).then((res) => res.data);
                setVoiceActor(voiceActorData);
            } catch (error) {
                console.error('Error fetching character data:', error);
                Alert.alert('Error', 'Failed to fetch character data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [character.mal_id]);

    const toggleFavorite = () => {
        Animated.sequence([
            Animated.timing(heartScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
            Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();
        setIsFavourite(!isFavourite);
    };

    const parseCharacterDetails = (about) => {
        const details = {
            age: 'Unknown',
            birthdate: 'Unknown',
            height: 'Unknown',
            weight: 'Unknown',
            gender: 'Female',
            biography: '',
        };

        if (about) {
            const ageMatch = about.match(/Age:\s*([^,\n]+)/);
            const birthdateMatch = about.match(/Birthday:\s*([^,\n]+)/);
            const heightMatch = about.match(/Height:\s*([^,\n]+)/);
            const weightMatch = about.match(/Weight:\s*([^,\n]+)/);

            if (ageMatch) details.age = ageMatch[1].trim();
            if (birthdateMatch) details.birthdate = birthdateMatch[1].trim();
            if (heightMatch) details.height = heightMatch[1].trim();
            if (weightMatch) details.weight = weightMatch[1].trim();
            details.biography = about;
        }

        return details;
    };

    const characterDetails = characterData ? parseCharacterDetails(characterData.about) : {};

    if (loading) {
        return <Loading />;
    }

    // Handler for Chat Button Press
    const handleChatPress = () => {
        if (!userId) {
            Alert.alert(
                'Authentication Required',
                'You need to log in to chat with this character.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => navigation.navigate('Login') },
                ],
                { cancelable: true }
            );
        } else {
            navigation.navigate('AIChat', { character: characterData });
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <SafeAreaView style={styles.safeAreaView}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeftIcon size={28} strokeWidth={2.5} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFavorite}>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <MiniHeartIcon size={35} color={isFavourite ? "#5abf75" : "white"} />
                    </Animated.View>
                </TouchableOpacity>
            </SafeAreaView>

            {characterData && (
                <View>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: characterData.images?.jpg?.image_url }}
                            style={styles.characterImage}
                        />
                    </View>
                    <View style={styles.detailsContainer}>
                        <Text style={styles.characterName}>{characterData.name}</Text>
                        <Text style={styles.characterLikes}>{characterData.favorites} ♡ liked this Character</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoLabel}>Gender</Text>
                            <Text style={styles.infoValue}>{characterDetails.gender}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoLabel}>Age</Text>
                            <Text style={styles.infoValue}>{characterDetails.age}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoLabel}>Height</Text>
                            <Text style={styles.infoValue}>{characterDetails.height}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoLabel}>Weight</Text>
                            <Text style={styles.infoValue}>{characterDetails.weight}</Text>
                        </View>
                    </View>
                    <View style={styles.biographyContainer}>
                        <Text style={styles.biographyTitle}>Biography</Text>
                        <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                            <Text style={styles.biographyText}>
                                {showAll
                                    ? characterDetails.biography
                                    : characterDetails.biography.length > 450
                                    ? `${characterDetails.biography.slice(0, 450)}...`
                                    : characterDetails.biography}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <GalerieList title="Galerie" data={characterPic} hideSeeAll={true} />
                    <VoiceActor title="Voice Actor" data={voiceActor} hideSeeAll={true} />

                    {/* Navigate to AI Chat Screen */}
                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={handleChatPress} // Updated onPress handler
                    >
                        <Text style={styles.chatButtonText}>Chat with {characterData.name}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    contentContainer: {
        paddingBottom: 20,
    },
    safeAreaView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    backButton: {
        borderRadius: 20,
        padding: 10,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    characterImage: {
        width: width * 0.6,
        height: height * 0.4,
        borderRadius: 10,
    },
    detailsContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    characterName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    characterLikes: {
        fontSize: 16,
        color: '#AAAAAA',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    infoBlock: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: 'white',
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 14,
        color: '#CCCCCC',
    },
    biographyContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    biographyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    biographyText: {
        fontSize: 14,
        color: '#CCCCCC',
        lineHeight: 20,
    },
    chatButton: {
        backgroundColor: '#5abf75',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        margin: 20,
    },
    chatButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
});
