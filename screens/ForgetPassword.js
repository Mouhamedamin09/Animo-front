// ForgotPasswordScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import { useUser } from '../Context/UserContext';


const ForgotPasswordScreen = ({ navigation }) => {
  const { BASE_URL } = useUser();
  const [email, setEmail] = useState('');
  const fadeAnim = new Animated.Value(0);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/forgot-password`, {
        email: email,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Password reset link has been sent to your email');
        navigation.replace("Verification");
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Forgot Password Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send password reset link');
    }
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />
      <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
        <Text style={styles.title}>
          <Text style={{ color: '#5abf75' }}>A</Text>nimo
        </Text>
        <Text style={styles.subtitle}>Reset your password</Text>
      </Animated.View>
      <View style={styles.form}>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={handleForgotPassword} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Send Reset Link</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    paddingVertical: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
  },
  form: {
    width: '85%',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  resetButton: {
    backgroundColor: '#5abf75',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#5abf75',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    elevation: 10,
    marginBottom: 15,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    alignItems: 'center',
  },
  backText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
});
