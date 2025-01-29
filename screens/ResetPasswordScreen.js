import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../Context/UserContext';

export default function ResetPasswordScreen({ route, navigation }) {
  const { userId, userName } = route.params || {};
  console.log('Received route.params:', route.params);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    console.log('Reset Password Button Pressed');
    // const { BASE_URL } = useUser(); // Uncomment if using useUser

    // Input Validation
    if (!newPassword || !confirmPassword) {
      console.log('Validation Failed: Missing Passwords');
      Alert.alert('Error', 'Please enter and confirm your new password');
      return;
    }

    if (newPassword.length < 6) {
      console.log('Validation Failed: Password Length');
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('Validation Failed: Password Mismatch');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    console.log('Loading Started');

    try {
      // Make API request to reset password
      console.log(`Making API request to: http://192.168.43.44:3000/reset-password`);
      const response = await axios.post(`${BASE_URL}/reset-password`, {
        userId,
        newPassword,
      });

      console.log('API Response:', response);

      if (response.status === 200) {
        const { token, user, message } = response.data;

        Alert.alert('Success', message);
        console.log('Password Reset Successful');

        // Store token and user data in AsyncStorage
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        console.log('Token and User Stored');

        // Navigate to LoggedHome screen
        navigation.replace('LoggedHome', {
          userName: user.username,
          userId: user._id,
        });
        console.log('Navigation to LoggedHome');
      } else {
        console.log('API Error:', response.data.error || 'Failed to reset password');
        Alert.alert('Error', response.data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset Password Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
      console.log('Loading Ended');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>
        Please enter your new password below.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Styles for the ResetPasswordScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    width: '80%',
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#5abf75',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row', // To center the loader properly
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#4caf64', // Slightly darker to indicate disabled state
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
