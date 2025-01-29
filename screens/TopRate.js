// screens/TopRate.js

import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Image, 
    ActivityIndicator, 
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import Layout from '../Layouts/Layout';
import { useAnime } from '../Context/AnimeContext'; // Import AnimeContext
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const TopRate = () => {
    const {
        topRateAnimes,
        fetchTopRate,
        topRateLoading,
        topRateLoadingMore,
        topRateError,
        topRatePage,
        topRateHasNextPage,
        handleAnimePress,
    } = useAnime();

    const navigation = useNavigation();

    useEffect(() => {
        if (topRateAnimes.length === 0) {
            fetchTopRate(1);
        }
    }, []);

    // Handler for anime item press using context's handleAnimePress
    const onPressAnime = (animeId) => {
        handleAnimePress(animeId, navigation);
    };

    // Render each anime item
    const renderAnimeItem = ({ item }) => {
        return (
            <TouchableOpacity onPress={() => onPressAnime(item.id)} activeOpacity={0.7} style={styles.itemTouchable}>
                <View style={styles.item}>
                    <Image
                        source={{ uri: item.poster }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <Text style={styles.itemTitle}>
                        {item.name?.length > 14 ? `${item.name.slice(0, 14)}...` : item.name}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Render footer for FlatList (loading indicator for pagination)
    const renderFooter = () => {
        if (!topRateLoadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#5abf75" />
            </View>
        );
    };

    // Handle end reached for pagination
    const handleEndReached = () => {
        if (topRateHasNextPage && !topRateLoadingMore && !topRateLoading) {
            fetchTopRate(topRatePage + 1);
        }
    };

    // Retry fetching data
    const retryFetch = () => {
        fetchTopRate(1);
    };

    if (topRateLoading && topRatePage === 1) {
        return (
            <Layout>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#5abf75" />
                </View>
            </Layout>
        );
    }

    if (topRateError && topRatePage === 1) {
        return (
            <Layout>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{topRateError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            {topRateAnimes.length > 0 ? (
                <FlatList
                    data={topRateAnimes}
                    renderItem={renderAnimeItem}
                    keyExtractor={(item, index) => `${item.id}-${index}`} // Ensure unique keys
                    numColumns={2}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.columnWrapper} // Added for spacing
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            ) : (
                !topRateLoading && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No top-rated anime available.</Text>
                    </View>
                )
            )}
        </Layout>
    );
};

const styles = StyleSheet.create({
    grid: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16, // Space between rows
    },
    itemTouchable: {
        flex: 1,
        marginHorizontal: 8, // Horizontal spacing between items
    },
    item: {
        // Removed explicit width to allow flex: 1 to manage sizing
    },
    image: {
        borderRadius: 20,
        width: '100%',
        height: height * 0.3,
    },
    itemTitle: {
        color: '#a1a1aa',
        marginTop: 8,
        marginLeft: 4,
        fontSize: 16,
        fontWeight: '600',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#FF4D4D', // Red for errors
        marginBottom: 12,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#5abf75', // Green
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#FFFFFF', // White text
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
    },
    footer: {
        paddingVertical: 20,
    },
});

export default TopRate;
