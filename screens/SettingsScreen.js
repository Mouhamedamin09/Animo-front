// screens/SettingsScreen.js

import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    Modal,
    Pressable,
    TextInput
} from 'react-native';
import Layout from '../Layouts/Layout'; // Adjust the path as necessary
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure you have this library installed
import { useNavigation } from '@react-navigation/native'; // Import navigation if needed
import { useUser } from '../Context/UserContext'; // Import UserContext
import { themes } from './theme'; // Import themes

const SettingsScreen = () => {
    const navigation = useNavigation(); // Initialize navigation
    const { userId, setUserId, setAuthToken, BASE_URL } = useUser(); 
    const currentTheme = themes.dark; // Default to dark theme

    // State for About Modal
    const [modalVisible, setModalVisible] = useState(false);

    // State for Report Bug Modal
    const [bugModalVisible, setBugModalVisible] = useState(false);
    const [bugMessage, setBugMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Updated logout function to set userId and authToken to null
    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "OK", 
                    onPress: () => {
                        // Clear user ID and auth token to log out
                        setUserId(null);
                        setAuthToken(null);

                        // Navigate to Login screen or Home screen
                        navigation.replace('LoggedHome'); // Ensure 'LoggedHome' is your login screen

                        console.log("User logged out");
                    } 
                }
            ],
            { cancelable: false }
        );
    };

    // Handle Send Bug Report
    const handleSendBugReport = async () => {
        if (!bugMessage.trim()) {
            Alert.alert("Validation Error", "Please enter a message before sending.");
            return;
        }

        setIsSending(true);

        try {
            const response = await fetch(`${BASE_URL}/sendmail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: bugMessage }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Your message has been sent successfully.");
                setBugMessage('');
                setBugModalVisible(false);
            } else {
                Alert.alert("Error", data.error || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error sending bug report:", error);
            Alert.alert("Error", "Failed to send message. Please check your network and try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Layout>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.heading, { color: currentTheme.text }]}>Settings</Text>

                {/* About Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>About</Text>
                    <TouchableOpacity 
                        style={styles.aboutItem} 
                        onPress={() => setModalVisible(true)} // Open modal on press
                        accessibilityLabel="View About Information"
                    >
                        <View style={styles.aboutContent}>
                            <Icon 
                                name="information-circle-outline" 
                                size={24} 
                                color={currentTheme.iconColor} 
                                style={styles.icon}
                            />
                            <Text style={[styles.aboutText, { color: currentTheme.text }]}>About This App</Text>
                        </View>
                        <Icon 
                            name="chevron-forward" 
                            size={24} 
                            color={currentTheme.iconColor} 
                        />
                    </TouchableOpacity>
                </View>

                {/* App Info Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>App Info</Text>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: currentTheme.text }]}>Version</Text>
                        <Text style={[styles.infoValue, { color: currentTheme.text }]}>1.0.0</Text>
                    </View>
                </View>

                {/* Report a Bug Section */}
                <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                    <TouchableOpacity 
                        style={styles.reportBugItem} 
                        onPress={() => setBugModalVisible(true)} // Open bug report modal
                        accessibilityLabel="Report a Bug or Send Feedback"
                    >
                        <View style={styles.aboutContent}>
                            <Icon 
                                name="bug-outline" 
                                size={24} 
                                color={currentTheme.iconColor} 
                                style={styles.icon}
                            />
                            <Text style={[styles.aboutText, { color: currentTheme.text }]}>Report a Bug</Text>
                        </View>
                        <Icon 
                            name="chevron-forward" 
                            size={24} 
                            color={currentTheme.iconColor} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                {userId !== null && (
                    <View style={[styles.section, { backgroundColor: currentTheme.sectionBackground }]}>
                        <TouchableOpacity 
                            style={[styles.logoutButton, { backgroundColor: currentTheme.logoutBackground }]} 
                            onPress={handleLogout}
                            accessibilityLabel="Logout"
                        >
                            <View style={styles.logoutContent}>
                                <Icon 
                                    name="log-out-outline" 
                                    size={24} 
                                    color={currentTheme.logoutText} 
                                    style={styles.icon}
                                />
                                <Text style={[styles.logoutText, { color: currentTheme.logoutText }]}>Logout</Text>
                            </View>
                            <Icon 
                                name="chevron-forward" 
                                size={24} 
                                color={currentTheme.logoutText} 
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* About Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalView, { backgroundColor: currentTheme.sectionBackground }]}>
                            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>About Animo</Text>
                            <Text style={[styles.modalText, { color: currentTheme.text }]}>
                                Animo is an app for anime information and chatting with characters through AI. 
                                For streaming, we do not host any servers or content as we understand that streaming can be illegal. 
                                All streaming functionality relies on scraping from HiAnime and translating subtitles. 
                                User information is securely protected and all user data is kept confidential.
                            </Text>
                            <Pressable
                                style={[styles.closeButton, { backgroundColor: currentTheme.buttonBackground }]}
                                onPress={() => setModalVisible(!modalVisible)}
                                accessibilityLabel="Close About Modal"
                            >
                                <Text style={[styles.closeButtonText, { color: currentTheme.buttonText }]}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {/* Report Bug Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={bugModalVisible}
                    onRequestClose={() => {
                        setBugModalVisible(!bugModalVisible);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalView, { backgroundColor: currentTheme.sectionBackground }]}>
                            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Report a Bug</Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: currentTheme.inputBackground,
                                        color: currentTheme.text,
                                        borderColor: currentTheme.borderColor
                                    }
                                ]}
                                placeholder="Describe the issue..."
                                placeholderTextColor={currentTheme.placeholderText}
                                multiline
                                numberOfLines={4}
                                value={bugMessage}
                                onChangeText={setBugMessage}
                                accessibilityLabel="Bug Report Input"
                            />
                            {isSending ? (
                                <ActivityIndicator size="large" color={currentTheme.buttonBackground} />
                            ) : (
                                <View style={styles.modalButtons}>
                                    <Pressable
                                        style={[styles.sendButton, { backgroundColor: currentTheme.buttonBackground }]}
                                        onPress={handleSendBugReport}
                                        accessibilityLabel="Send Bug Report"
                                    >
                                        <Text style={[styles.sendButtonText, { color: currentTheme.buttonText }]}>Send</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.closeButton, { backgroundColor: currentTheme.buttonBackground }]}
                                        onPress={() => setBugModalVisible(!bugModalVisible)}
                                        accessibilityLabel="Close Bug Report Modal"
                                    >
                                        <Text style={[styles.closeButtonText, { color: currentTheme.buttonText }]}>Cancel</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </Layout>
    );

};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        marginBottom: 30,
        borderRadius: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    // Removed toggleContainer, toggleLabelContainer, toggleLabel, etc.

    icon: {
        width: 24,
        height: 24,
    },
    aboutItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    aboutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aboutText: {
        fontSize: 16,
        marginLeft: 10,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    infoLabel: {
        fontSize: 16,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Report Bug Section Styles
    reportBugItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    // Removed donorItem, donorName, donorAmount, shareButton, shareContent, shareText

    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        marginLeft: 10,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '85%',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    textInput: {
        width: '100%',
        height: 100,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    sendButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 10,
        alignItems: 'center',
    },
    sendButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginLeft: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
