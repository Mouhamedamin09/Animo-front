// TopCharacters.js
import React, { useEffect ,useState} from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator, 
    Dimensions,
    ScrollView,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Layout from '../Layouts/Layout'; // Adjust the path based on your project structure
import { useAnime } from '../Context/AnimeContext'; // Adjust the path based on your project structure

const { width } = Dimensions.get('window');

const TopCharacters = () => {
    const navigation = useNavigation();
    const {
        topCharacters,
        fetchTopCharactersData,
        topCharactersLoading,
        topCharactersLoadingMore,
        topCharactersError,
        topCharactersPage,
        topCharactersHasNextPage,
    } = useAnime();

    // Animation value for card fade-in
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (topCharacters.length > 0) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }
    }, [topCharacters, fadeAnim]);

    const loadMoreCharacters = () => {
        if (!topCharactersLoadingMore && topCharactersHasNextPage) {
            fetchTopCharactersData(topCharactersPage + 1);
        }
    };

    const renderFooter = () => {
        if (!topCharactersLoadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="large" color="#5abf75" />
            </View>
        ); 
    };

    const getBadge = (rank) => {
        switch(rank) {
            case 1:
                return { color: '#FFD700', icon: 'star' }; // Gold
            case 2:
                return { color: '#C0C0C0', icon: 'star-outline' }; // Silver
            case 3:
                return { color: '#CD7F32', icon: 'star-half' }; // Bronze
            default:
                return null;
        }
    };

    const renderTopThree = () => {
        const topThree = topCharacters.slice(0, 3);
        return (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.topThreeContainer}
                contentContainerStyle={{ paddingHorizontal: 10 }}
            >
                {topThree.map((item, index) => {
                    const badge = getBadge(index + 1);
                    return (
                        <TouchableOpacity 
                            key={`header-${item.mal_id}`} // Prefix the key to ensure uniqueness
                            style={styles.topCard}
                            onPress={() => navigation.navigate('Character', { character: item })} // Navigate to CharacterScreen
                            activeOpacity={0.8}
                        >
                            <View style={[styles.badge, { backgroundColor: badge.color }]}>
                                <Icon name={badge.icon} size={16} color="#ffffff" />
                                <Text style={styles.badgeText}>{index + 1}</Text>
                            </View>
                            <Image 
                                source={{ uri: item.images?.jpg?.image_url || '' }} 
                                style={styles.topAvatar} 
                                resizeMode="cover"
                                onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
                            />
                            <Text style={styles.topName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.topFavoritesContainer}>
                                <Icon name="heart" size={14} color="#ff6b6b" />
                                <Text style={styles.topFavoritesText}>{item.favorites}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate('Character', { character: item })} // Navigate to CharacterScreen
                activeOpacity={0.8}
            >
                <Image 
                    source={{ uri: item.images?.jpg?.image_url || '' }} 
                    style={styles.avatar} 
                    resizeMode="cover"
                    onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.favoritesContainer}>
                        <Icon name="heart" size={16} color="#ff6b6b" />
                        <Text style={styles.favoritesText}>{item.favorites}</Text>
                    </View>
                </View>
                <Icon name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
        );
    };

    const keyExtractor = (item) => item.mal_id.toString();

    const ListHeaderComponent = () => {
        if (topCharacters.length > 0) {
            return renderTopThree();
        }
        return null;
    };

    if (topCharactersLoading && topCharactersPage === 1) {
        return (
            <Layout>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#5abf75" />
                </View>
            </Layout>
        );
    }

    if (topCharactersError) {
        return (
            <Layout>
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={50} color="#ff6b6b" />
                    <Text style={styles.errorText}>{topCharactersError}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => fetchTopCharactersData(1)}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <Animated.FlatList
                data={topCharacters.slice(3)} // Exclude the first three characters
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.list}
                onEndReached={loadMoreCharacters}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="sad-outline" size={50} color="#b0b0b0" />
                        <Text style={styles.emptyText}>No characters found.</Text>
                    </View>
                }
                style={{ opacity: fadeAnim }}
            />
        </Layout>
    );
};

const styles = StyleSheet.create({
    list: {
        padding: 10,
    },
    topThreeContainer: {
        marginVertical: 10,
    },
    topCard: {
        width: width * 0.6,
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 15,
        marginRight: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6.27,
        elevation: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 10,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: 'bold',
    },
    topAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#3a3a3a',
        marginBottom: 10,
    },
    topName: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 10,
        textAlign: 'center',
    },
    topFavoritesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    topFavoritesText: {
        color: '#ff6b6b',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        padding: 15,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4.65,
        elevation: 7,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3a3a3a',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    name: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    favoritesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    favoritesText: {
        color: '#ff6b6b',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: '600',
    },
    footer: {
        paddingVertical: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        color: '#b0b0b0',
        fontSize: 16,
        marginTop: 10,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#1e1e1e',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 16,
        marginVertical: 10,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#5abf75',
        borderRadius: 10,
        marginTop: 10,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TopCharacters;
