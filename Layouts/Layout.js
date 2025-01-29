// components/Layout.js

import React, { useState, useEffect } from 'react';
import { 
    SafeAreaView, 
    View, 
    TouchableOpacity, 
    Text, 
    Image, 
    Platform, 
    StatusBar, 
    StyleSheet, 
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { useUser } from '../Context/UserContext';
import axios from 'axios';

// Import local images


const Layout = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [activeScreen, setActiveScreen] = useState('LoggedHome');
    const navigation = useNavigation();
    const route = useRoute();
    const isFocused = useIsFocused();
    const { userId, theme, authToken, BASE_URL } = useUser(); // Assuming you have authToken in your context

    // New state for fetched user data
    const [fetchedUserName, setFetchedUserName] = useState('');
    const [fetchedAvatar, setFetchedAvatar] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data from /data endpoint
    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching user data...' + userId);
            const response = await axios.get(`${BASE_URL}/data?userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`, // If you use auth tokens
                },
            });

            const { userData } = response.data;
            setFetchedUserName(userData.username);
            setFetchedAvatar(userData.avatar);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load user data.');
            // Optionally, you can fallback to useUser() data here
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserData();
        } else {
            setFetchedUserName('');
            setFetchedAvatar('');
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isFocused) {
            setActiveScreen(route.name);
        }
    }, [isFocused, route]);

    // General Navigation Items
    const navigationItems = [
        {
            name: 'LastUpdates',
            screen: 'LastUpdates',
            label: 'Last Updates',
            icon: 'flame-outline',
        },
        {
            name: 'Seasons',
            screen: 'Seasons',
            label: 'Seasons',
            icon: 'calendar-outline',
        },
        
        {
            name: 'TopCharacters',
            screen: 'TopCharacters',
            label: 'Top Characters',
            icon: 'people-outline',
        },
        {
            name: 'GlobalRate',
            screen: 'GlobalRate',
            label: 'Global Rate',
            icon: 'stats-chart-outline',
        },
        // "My List" item
        {
            name: 'MyList',
            screen: 'LoggedHome', // Default screen if authenticated
            label: 'My List',
            icon: 'list-outline',
        },
        {
            name: 'AirDates',
            screen: 'AirDates',
            label: 'Air Dates',
            icon: 'calendar-number-outline', // Choose an appropriate icon
        },
    ];

    // User-Specific Navigation Items (excluding "My List")
    const userNavigationItems = [
        {
            name: 'CustomList',
            screen: 'CustomList', // Ensure this screen is registered in your navigation stack
            label: 'Custom List',
            icon: 'create-outline', // Choose an appropriate icon
        },
        {
            name: 'LastWatch',
            screen: 'LastWatch',
            label: 'Last Watch',
            icon: 'time-outline',
        },
        // Updated "Coins" screen for logged-in users
        {
            name: 'Coins',
            screen: 'AddCoins', // Updated to navigate to 'CoinScreen'
            label: 'Coins',
            icon: 'wallet-outline', // Choose an appropriate icon
        },
    ];

    // Removed quizzesItems array
    /*
    // Quizzes Section Items
    const quizzesItems = [
        {
            name: 'DailyQuiz',
            screen: 'DailyQuiz',
            label: 'Daily Quiz',
            icon: 'clipboard-outline',
        },
        {
            name: 'AnimeIQ',
            screen: 'AnimeIQ',
            label: 'Anime IQ',
            icon: 'bulb-outline',
        },
        {
            name: 'Quizzes',
            screen: 'Quizzes',
            label: 'Quizzes',
            icon: 'help-circle-outline',
        },
    ];
    */

    // Function to handle "My List" navigation
    const handleMyListPress = () => {
        navigation.navigate('LoggedHome');
        setActiveScreen('LoggedHome');
        setOpen(false);
    };

    const renderNavigationView = () => (
        <ScrollView 
            contentContainerStyle={[
                styles.drawerContainer, 
                { backgroundColor: theme === 'dark' ? '#262626' : '#fff' }
            ]}
        >
            {/* User Section */}
            <TouchableOpacity 
                style={styles.userSection} 
                onPress={() => {
                    if (userId) {
                        navigation.navigate('Profile', { userId });
                    } else {
                        navigation.navigate('Login'); // Ensure you have a 'Login' screen
                    }
                    setOpen(false);
                }}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#5abf75" style={{ marginRight: 10 }} />
                ) : userId ? (
                    <>
                        {/* Display fetched avatar from API or fallback to default */}
                        <Image 
                            source={ { uri: fetchedAvatar }} 
                            style={styles.userAvatar} 
                        />
                        <Text style={[styles.userName, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                            {fetchedUserName || 'User'}
                        </Text>
                    </>
                ) : (
                    <>
                        {/* Display anonymous avatar from the internet and "Log In" text */}
                        <Image 
                            source={{ uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' }} 
                            style={styles.userAvatar} 
                        />
                        <Text style={[styles.userName, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                            Log In
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {/* General Navigation Items */}
            <View style={styles.navigationSection}>
                {navigationItems.map((item) => {
                    if (item.name === 'MyList') {
                        // Handle "My List" separately
                        return (
                            <TouchableOpacity
                                key={item.name}
                                style={[
                                    styles.sectionItem, 
                                    activeScreen === item.screen && styles.activeItem
                                ]}
                                onPress={handleMyListPress}
                            >
                                <Icon 
                                    name={item.icon} 
                                    size={24} 
                                    color={theme === 'dark' ? '#fff' : '#000'} 
                                />
                                <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={item.name}
                            style={[
                                styles.sectionItem, 
                                activeScreen === item.screen && styles.activeItem
                            ]}
                            onPress={() => { 
                                navigation.navigate(item.screen); 
                                setOpen(false); 
                                setActiveScreen(item.screen); 
                            }}
                        >
                            <Icon 
                                name={item.icon} 
                                size={24} 
                                color={theme === 'dark' ? '#fff' : '#000'} 
                            />
                            <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Separator */}
            <View style={[
                styles.separator, 
                { backgroundColor: theme === 'dark' ? '#444' : '#ccc' }
            ]} />

            {/* User-Specific Navigation Items */}
            {userId && (
                <>
                    <View style={styles.navigationSection}>
                        {userNavigationItems.map((item) => (
                            <TouchableOpacity
                                key={item.name}
                                style={[
                                    styles.sectionItem, 
                                    activeScreen === item.screen && styles.activeItem
                                ]}
                                onPress={() => { 
                                    navigation.navigate(item.screen); 
                                    setOpen(false); 
                                    setActiveScreen(item.screen); 
                                }}
                            >
                                <Icon 
                                    name={item.icon} 
                                    size={24} 
                                    color={theme === 'dark' ? '#fff' : '#000'} 
                                />
                                <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Separator */}
                    <View style={[
                        styles.separator, 
                        { backgroundColor: theme === 'dark' ? '#444' : '#ccc' }
                    ]} />
                </>
            )}

            {/* Removed Quizzes Section */}
            {/*
            <View style={styles.navigationSection}>
                {quizzesItems.map((item) => (
                    <TouchableOpacity
                        key={item.name}
                        style={[
                            styles.sectionItem, 
                            activeScreen === item.screen && styles.activeItem
                        ]}
                        onPress={() => { 
                            navigation.navigate(item.screen); 
                            setOpen(false); 
                            setActiveScreen(item.screen); 
                        }}
                    >
                        <Icon 
                            name={item.icon} 
                            size={24} 
                            color={theme === 'dark' ? '#fff' : '#000'} 
                        />
                        <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Separator */}
            {/* <View style={[
                styles.separator, 
                { backgroundColor: theme === 'dark' ? '#444' : '#ccc' }
            ]} /> 
            */}

            {/* Settings Section */}
            <View style={styles.navigationSection}>
                <TouchableOpacity
                    style={[
                        styles.sectionItem, 
                        activeScreen === 'Settings' && styles.activeItem
                    ]}
                    onPress={() => { 
                        navigation.navigate('Settings'); 
                        setOpen(false);
                        setActiveScreen('Settings');
                    }}
                >
                    <Icon 
                        name="settings-outline" 
                        size={24} 
                        color={theme === 'dark' ? '#fff' : '#000'} 
                    />
                    <Text style={[styles.sectionText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                        Settings
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <Drawer
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            drawerPosition="left"
            drawerType="front"
            drawerStyle={{ width: 300 }}
            renderDrawerContent={renderNavigationView}
        >
            <View style={[styles.mainContainer, { backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}>
                <SafeAreaView style={Platform.OS === "ios" ? styles.safeAreaIOS : styles.safeAreaAndroid}>
                    <StatusBar 
                        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
                        backgroundColor={theme === 'dark' ? "#262626" : "#fff"} 
                    />
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setOpen(true)}>
                            <Bars3CenterLeftIcon size={30} color={theme === 'dark' ? "white" : "black"} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                            {activeScreen === "Home" || activeScreen === "LoggedHome" ? (
                                <>
                                    <Text style={{ color: "#5abf75" }}>A</Text>
                                    nimo
                                </>
                            ) : (
                                <>
                                    <Text style={{ color: "#5abf75" }}>{activeScreen.charAt(0)}</Text>
                                    {activeScreen.slice(1)}
                                </>
                            )}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                            <MagnifyingGlassIcon size={30} color={theme === 'dark' ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
                {children}
            </View>
        </Drawer>
    );
}

const styles = StyleSheet.create({
    drawerContainer: {
        flexGrow: 1,
        padding: 0,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    navigationSection: {
        // Ensures sections are stacked vertically with consistent spacing
        marginBottom: 10,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 20,
        marginBottom: 5,
    },
    sectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingLeft: 20,
    },
    sectionText: {
        fontSize: 16,
        marginLeft: 10,
    },
    separator: {
        height: 1,
        marginVertical: 10,
        marginHorizontal: 20,
        backgroundColor: '#ccc', // Default color, overridden by dynamic color
    },
    activeItem: {
        backgroundColor: '#5abf751f', // Light green background for active item
    },
    mainContainer: {
        flex: 1,
    },
    safeAreaIOS: {
        marginBottom: -2,
    },
    safeAreaAndroid: {
        marginBottom: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default Layout;
