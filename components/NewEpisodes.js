import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NewEpisodes = ({ title, data }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Section Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Episodes List */}
            <FlatList
                data={data}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate('QualitySelection', {
                                animeSlug: item.id, // Pass the 'id' as 'animeSlug'
                                episodeNumber: item.episodeNumber, // Pass the episode number
                            })
                        }
                    >
                        {/* Episode Image */}
                        <Image source={{ uri: item.image }} style={styles.image} />

                        {/* Episode Details */}
                        <View style={styles.details}>
                            {/* Episode Number */}
                            <Text style={styles.episodeNumber}>Ep {item.episodeNumber}</Text>

                            {/* Anime Title */}
                            <Text style={styles.episodeTitle} numberOfLines={1}>
                                {item.title}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        backgroundColor: '#262626', // App background color
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        color: '#FFFFFF', // White color for the title
        marginHorizontal: 15,
        marginBottom: 20,
    },
    card: {
        width: 140,
        marginHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#2A2A2A', // Match the app's background color
        overflow: 'hidden',
        elevation: 5, // For Android shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    details: {
        padding: 10,
        alignItems: 'center',
    },
    episodeNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700', // Gold color for the episode number
        marginBottom: 4,
    },
    episodeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF', // White color for the anime name
        textAlign: 'center',
    },
});

export default NewEpisodes;
