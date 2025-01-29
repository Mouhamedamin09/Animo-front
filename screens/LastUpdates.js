// screens/LastUpdates.js

import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    ActivityIndicator, 
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import Layout from '../Layouts/Layout';
import { useAnime } from '../Context/AnimeContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LastUpdates = () => {
    const {
        lastUpdates,
        fetchLastUpdates,
        lastUpdatesLoading,
        lastUpdatesError,
        lastUpdatesRefreshing,
        handleAnimePress,
    } = useAnime();

    const navigation = useNavigation();

    useEffect(() => {
        // Fetch last updates only if not already fetched
        if (lastUpdates.length === 0) {
            fetchLastUpdates();
        }
    }, []);

    const onRefresh = () => {
        fetchLastUpdates(true);
    };

    const renderAnimeItem = (item) => {
        return (
            <TouchableWithoutFeedback onPress={() => handleAnimePress(item.id, navigation)}>
                <View style={styles.item}>
                    <Image
                        source={{ uri: item.poster }}
                        style={styles.image}
                    />
                    <Text style={styles.itemTitle}>
                        {item.name?.length > 14 ? `${item.name.slice(0, 14)}...` : item.name}
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    if (lastUpdatesLoading && lastUpdates.length === 0) {
        return (
            <Layout>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#5abf75" />
                </View>
            </Layout>
        );
    }

    if (lastUpdatesError && lastUpdates.length === 0) {
        return (
            <Layout>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{lastUpdatesError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchLastUpdates()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            {lastUpdates.length > 0 ? (
                <ScrollView
                    contentContainerStyle={styles.grid}
                    refreshControl={
                        <RefreshControl
                            refreshing={lastUpdatesRefreshing}
                            onRefresh={onRefresh}
                            colors={['#5abf75']} // Android
                            tintColor="#5abf75" // iOS
                        />
                    }
                >
                    {lastUpdates.map((item, index) => (
                        <View key={item.id || index} style={styles.itemContainer}>
                            {renderAnimeItem(item)}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No updates available.</Text>
                </View>
            )}
        </Layout>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    itemContainer: {
        width: width * 0.44,
        marginBottom: 24,
    },
    item: {
        // Optional: Add any additional styling if needed
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
});

export default LastUpdates;
