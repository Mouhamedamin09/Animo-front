import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../Context/UserContext';

export default function VerificationScreen({ route, navigation }) {
  const { userId } = route.params || {}; // `userId` may be undefined
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { BASE_URL } = useUser();
  console.log(userId);

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/verify`, {
        userId,
        code,
      });

      if (response.status === 200) {
        const { token, user, message } = response.data;

        if (message === 'Password reset code verified successfully') {
          // Navigate to the Reset Password screen
          navigation.replace('ResetPassword', {
            userId: user._id,
            userName: user.username,
          });
        } else {
          Alert.alert('Success', 'Email verified successfully!');

          // Store the token and user in AsyncStorage
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('user', JSON.stringify(user));

          // Navigate to the Preference screen
          navigation.replace('Preference', {
            userId: user._id,
            userName: user.username,
          });
        }
      } else {
        Alert.alert('Error', response.data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to verify');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to your email.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Verification Code"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={code}
        onChangeText={setCode}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
