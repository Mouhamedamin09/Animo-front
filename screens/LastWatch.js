// screens/LastWatch.js

import React, { useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    ActivityIndicator, 
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
    FlatList,
    RefreshControl,
} from 'react-native';
import Layout from '../Layouts/Layout';
import { useAnime } from '../Context/AnimeContext'; // Import useAnime
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LastWatch = () => {
    const navigation = useNavigation();
    const {
        lastWatchAnimes,
        lastWatchLoading,
        lastWatchError,
        lastWatchRefreshing,
        onRefreshLastWatch,
    } = useAnime();

    const renderAnimeItem = useCallback(({ item }) => {
        return (
            <TouchableWithoutFeedback
                key={item.mal_id}
                onPress={() => navigation.push('Anime', { malId: item.mal_id })}
            >
                <View style={styles.item}>
                    <Image
                        source={{ uri: item.images?.jpg?.large_image_url || item.images?.webp?.image_url || null }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <Text style={styles.itemTitle}>
                        {item.title?.length > 14 ? `${item.title.slice(0, 14)}...` : item.title}
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        );
    }, [navigation]);

    const keyExtractor = useCallback((item) => item.mal_id.toString(), []);

    if (lastWatchLoading) {
        return (
            <Layout>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#5abf75" />
                </View>
            </Layout>
        );
    }

    if (lastWatchError) {
        return (
            <Layout>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{lastWatchError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={onRefreshLastWatch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            {lastWatchAnimes.length > 0 ? (
                <FlatList
                    data={lastWatchAnimes}
                    renderItem={renderAnimeItem}
                    keyExtractor={keyExtractor}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={lastWatchRefreshing}
                            onRefresh={onRefreshLastWatch}
                            colors={['#5abf75']}
                            tintColor="#5abf75"
                        />
                    }
                    // Optional: Improve performance by avoiding re-rendering
                    removeClippedSubviews
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={21}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        You haven't watched any anime yet.
                    </Text>
                </View>
            )}
        </Layout>
    );
};

const styles = StyleSheet.create({
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
        color: '#FF4D4D',
        marginBottom: 12,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#5abf75',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#FFFFFF',
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
        color: '#666666',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    item: {
        width: (width - 48) / 2, // Adjusted for padding and spacing
    },
    image: {
        borderRadius: 20,
        width: '100%',
        height: height * 0.3,
        backgroundColor: '#ccc', // Placeholder color while image loads
    },
    itemTitle: {
        color: '#a1a1aa',
        marginTop: 8,
        marginLeft: 4,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LastWatch;
