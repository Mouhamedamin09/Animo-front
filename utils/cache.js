// utils/cache.js

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Retrieves cached data for a given key.
 * @param {string} key
 * @returns {Promise<any>}
 */
export const getCache = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Error reading cache:', e);
        return null;
    }
};

/**
 * Sets cached data for a given key.
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export const setCache = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error('Error setting cache:', e);
    }
};
