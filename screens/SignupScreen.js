import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../Context/UserContext';

const { width } = Dimensions.get('window');

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { BASE_URL } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State variables for error messages
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Regular expression for password validation (at least one number)
  const passwordRegex = /^(?=.*\d).{8,}$/;

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required.');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required.');
      return false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError(
        'Password must be at least 8 characters long and contain at least one number.'
      );
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleSignup = async () => {
    // Reset error messages
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!username) {
      Alert.alert('Error', 'Username is required.');
      return;
    }

    if (!isEmailValid || !isPasswordValid) {
      // If any validation fails, do not proceed
      return;
    }

    setLoading(true);

    try {
      // Change the endpoint to your actual server address
      const response = await axios.post(`${BASE_URL}/register`, {
        username,
        email,
        password,
      });

      if (response.status === 201) {
        // We get userId from response
        const { userId } = response.data;
        Alert.alert(
          'Success',
          'Account created! Please check your email for a verification code.'
        );

        // Navigate to Verification screen
        navigation.replace('Verification', { userId });
      } else {
        Alert.alert('Error', response.data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />

      <View style={styles.topSection}>
        <Text style={styles.title}>
          <Text style={{ color: '#5abf75' }}>A</Text>nimo
        </Text>
        <Text style={styles.subtitle}>
          Create an account to start your journey
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={username}
          onChangeText={(text) => setUsername(text)}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
          onBlur={validateEmail} // Validate on blur
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={(text) => setPassword(text)}
            onBlur={validatePassword} // Validate on blur
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#B0B0B0"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSignup}
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.highlight}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // Top section
  topSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: width * 0.8,
    lineHeight: 22,
  },

  // Form section
  form: {
    width: '85%',
    marginTop: 20,
  },

  // Inputs
  input: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 10, // Reduced margin to accommodate error messages
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444444',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  // Password container
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 45, // leave room for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },

  // Signup button
  signupButton: {
    backgroundColor: '#5abf75',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    elevation: 5,
    shadowColor: '#5abf75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  signupButtonDisabled: {
    opacity: 0.6, // Visually indicate button is disabled
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Login navigation
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  highlight: {
    color: '#5abf75',
    fontWeight: 'bold',
  },

  // Error text
  errorText: {
    color: '#FF6B6B',
    marginBottom: 10,
    marginLeft: 5,
  },
});
