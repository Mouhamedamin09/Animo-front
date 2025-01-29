// LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../Context/UserContext'; // Import useUser from context

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isLoggingIn, setIsLoggingIn] = useState(false); // New state for loader

  const { setUserId, setUserName, setAuthToken, setAvatar,BASE_URL } = useUser(); // Destructure context setters

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    setIsLoggingIn(true);

    try {
      console.log('Build Type:', __DEV__ ? 'Development' : 'Production');
      console.log('Attempting to connect to:', BASE_URL);
      
      // Test connection first
      try {
        const testResponse = await axios.get(`${BASE_URL}/health`);
        console.log('Server health check:', testResponse.status);
      } catch (healthError) {
        console.log('Health check failed:', healthError.message);
      }

      const response = await axios.post(`${BASE_URL}/login`, {
        email: email,
        password: password,
      }, {
        timeout: 15000, // Increased timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      console.log('Response received:', response.status);

      if (response.status === 200) {
        Alert.alert('Success', 'Login successful!');
        console.log('Response:', response.data);

        const { token, user } = response.data;

        // Save token and user data to AsyncStorage
        await AsyncStorage.setItem('@auth_token', token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(user));

        // Update context
        setAuthToken(token);
        setUserId(user.id);
        setUserName(user.username);
        setAvatar(user.avatar || null);

        console.log('User ID:', user.id);

        // Navigate to LoggedHome
        navigation.replace('LoggedHome');
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      console.log('Full error:', error);
      console.log('Error type:', typeof error);
      console.log('Is Axios Error:', axios.isAxiosError(error));
      console.log('Error message:', error.message);
      console.log('Error response:', error.response);
      console.log('Error request:', error.request);
      console.log('Error config:', error.config);
      
      let errorMessage = 'Failed to login. ';
      if (error.isAxiosError && !error.response) {
        errorMessage += `Network error - Cannot connect to ${BASE_URL}`;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoggingIn(false);
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
        <Text style={styles.subtitle}>Sign in to continue your adventure</Text>
      </Animated.View>
      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email Input"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={(text) => setPassword(text)}
            autoCapitalize="none"
            accessibilityLabel="Password Input"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? "Hide Password" : "Show Password"}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#B0B0B0"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={handleLogin} 
          style={styles.loginButton}
          disabled={isLoggingIn} // Disable button while logging in
          accessibilityLabel="Login Button"
        >
          {isLoggingIn ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Added Forgot Password Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotPasswordLink}
          accessibilityLabel="Forgot Password Link"
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('Signup')}
          style={styles.registerLink}
          accessibilityLabel="Register Link"
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.highlight}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  forgotPasswordLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#5abf75',
    fontSize: 14,
  },
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40, // Add padding to make room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 20,
  },
  loginButton: {
    backgroundColor: '#5abf75',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#5abf75',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  highlight: {
    color: '#5abf75',
    fontWeight: 'bold',
  },
});

