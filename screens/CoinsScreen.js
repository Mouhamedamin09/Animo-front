// screens/AddCoins.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import Layout from '../Layouts/Layout'; // Adjust the path if necessary
import { useUser } from '../Context/UserContext';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native'; // Ensure Linking is imported

const AddCoins = () => {
    const { userId, BASE_URL } = useUser();
    const navigation = useNavigation();

    const [loadingAd, setLoadingAd] = useState(false);
    const [coins, setCoins] = useState(0); // State to manage coin balance

    // Animation values for buttons
    const scaleValueNormalAd = useState(new Animated.Value(1))[0];
    const scaleValueAdultAd = useState(new Animated.Value(1))[0];

    const animateButton = (scaleValue) => {
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
        ]).start();
    };

    const handleWatchAd = async (adType) => {
        if (!userId) {
            Alert.alert('Authentication Required', 'Please log in to watch ads and earn coins.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
            return;
        }

        // Determine the ad URL and reward based on adType
        let adUrl = '';
        let rewardCoins = 0;
        let adDescription = '';

        if (adType === 'normal') {
            adUrl = 'https://www.profitablecpmrate.com/pv11sw1v0?key=13a9d5897dc1f7220100cde4e99635a4';
            rewardCoins = 2;
            adDescription = 'Do you want to watch a normal ad to earn 5 coins?';
        } else if (adType === 'adult') {
            adUrl = 'https://www.profitablecpmrate.com/tyv9q4guiu?key=ae8041dca64053926b741f0ce3c2d9b2';
            rewardCoins = 5;
            adDescription = 'Do you want to watch an adult ad to earn 15 coins?';
        } else {
            Alert.alert('Error', 'Invalid ad type.', [{ text: 'OK' }]);
            return;
        }

        // Confirm with the user before opening the ad
        Alert.alert(
            'Watch Ad',
            adDescription,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: async () => {
                        setLoadingAd(true);

                        // Attempt to open the URL in the default browser
                        const supported = await Linking.canOpenURL(adUrl);
                        if (supported) {
                            try {
                                await Linking.openURL(adUrl);
                                // Assuming the ad is watched, reward the user
                                const response = await axios.post(`${BASE_URL}/watch-ads`, { userId, adType });

                                Alert.alert('Success', response.data.message, [
                                    { text: 'OK' }
                                ]);
                                setCoins(response.data.coinsRemaining);
                            } catch (error) {
                                if (error.response && error.response.data && error.response.data.error) {
                                    Alert.alert('Error', error.response.data.error, [
                                        { text: 'OK' }
                                    ]);
                                } else {
                                    Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
                                        { text: 'OK' }
                                    ]);
                                }
                                console.error('Error watching ad:', error);
                            } finally {
                                setLoadingAd(false);
                            }
                        } else {
                            Alert.alert('Error', 'Cannot open the ad link. Please try again later.', [
                                { text: 'OK' }
                            ]);
                            setLoadingAd(false);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    useEffect(() => {
        const fetchCoinBalance = async () => {
            if (!userId) return;

            try {
                const response = await axios.get(`${BASE_URL}/user/${userId}/coins`);
                setCoins(response.data.coins);
            } catch (error) {
                console.error('Error fetching coin balance:', error);
                // Optionally, handle errors (e.g., show an alert)
            }
        };

        fetchCoinBalance();
    }, [userId, BASE_URL]);

    return (
        <Layout>
            <View style={styles.container}>
                <Text style={styles.title}>Earn Coins</Text>

                <View style={styles.balanceContainer}>
                    <Icon name="wallet-outline" size={24} color="#5abf75" style={{ marginRight: 10 }} />
                    <Text style={styles.balanceText}> {coins} Coins</Text>
                </View>

                {/* Watch Normal Ad Button */}
                <Animated.View style={{ transform: [{ scale: scaleValueNormalAd }] }}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            animateButton(scaleValueNormalAd);
                            handleWatchAd('normal');
                        }}
                        disabled={loadingAd}
                        accessibilityLabel="Watch Normal Ad to earn 5 coins"
                        accessibilityRole="button"
                    >
                        {loadingAd ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon name="play-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Watch Normal Ad (+2 Coins)</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Watch Adult Ad Button */}
                <Animated.View style={{ transform: [{ scale: scaleValueAdultAd }] }}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            animateButton(scaleValueAdultAd);
                            handleWatchAd('adult');
                        }}
                        disabled={loadingAd}
                        accessibilityLabel="Watch Adult Ad to earn 15 coins"
                        accessibilityRole="button"
                    >
                        {loadingAd ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon name="warning-outline" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Watch Adult Ad (+5 Coins)</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Layout>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
        color: '#5abf75', // Maintained color consistency
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent', // Kept transparent to respect original background
        padding: 15,
        borderRadius: 10,
        marginBottom: 40,
        width: '100%',
        justifyContent: 'center',
    },
    balanceText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#5abf75', // Consistent with palette
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5abf75',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
        width: '90%',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    // Removed modal-related styles since WebView is no longer used
});

export default AddCoins;
