import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';

export default function Cast({ cast, navigation }) {
    const characterName = "Moriarty James";

    // Sort the cast by favorites score in descending order

    // Filter out main characters
    const mainCharacters = cast.filter(person => person.role === "Main").slice(0, 20);

    // Filter out supporting characters
    const supportingCharacters = cast
        .filter(person => person.role === "Supporting")
        .sort((a, b) => b.favorites - a.favorites)
        .slice(0, 3);

    // Combine main and supporting characters
    const characters = [...mainCharacters, ...supportingCharacters];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Top Cast</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {
                    characters.map((person, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.characterContainer}
                            onPress={() => { navigation.push('Character', person); }}
                        >
                            <Image
                                style={styles.characterImage}
                                source={{ uri: person.character.images?.jpg.image_url }}
                            />
                            <Text style={styles.characterName}>
                                {person.character ? (person.character.name.length < 15 ? person.character.name : person.character.name.slice(0, 15) + "...") : ""}
                            </Text>
                        </TouchableOpacity>
                    ))
                }
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 24, // my-6 in Tailwind
    },
    title: {
        color: 'white', // text-white
        fontSize: 18, // text-lg
        marginHorizontal: 16, // mx-4
        marginBottom: 20, // mb-5
    },
    scrollContainer: {
        paddingHorizontal: 15,
    },
    characterContainer: {
        marginRight: 16, // mr-4
        alignItems: 'center', // items-center
    },
    characterImage: {
        borderRadius: 16, // rounded-2xl
        height: 128, // h-32
        width: 112, // w-28
    },
    characterName: {
        color: '#a1a1aa', // text-neutral-400
        fontSize: 12, // text-xs
        margin: 4, // m-1
        textAlign: 'center',
    },
});
