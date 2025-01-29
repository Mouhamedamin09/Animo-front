// screens/AIChatScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeftIcon,
  Bars3CenterLeftIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import { useUser } from '../Context/UserContext'; // Adjust path if needed
import TypingIndicator from '../components/TypingIndicator'; // Import the TypingIndicator

const { width, height } = Dimensions.get('window');
const ios = Platform.OS === 'ios';

export default function AIChatScreen({ route, navigation }) {
  const { character } = route.params || {};
  const { userId, BASE_URL } = useUser(); // Provide userId from context
  const [coins, setCoins] = useState(50); // Example coin state

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([
    {
      text: `Hello, Welcome to Animo Otaku!, I am ${
        character?.name || 'Unknown'
      }. How can I help you today?`,
      sender: 'character',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sidebar animation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Reference to FlatList
  const flatListRef = useRef(null);

  // All sessions for this character
  const [chatSessions, setChatSessions] = useState([]);

  // Initialize chatId and fetch chat history
  useEffect(() => {
    const initializeChatIdAndFetchHistory = async () => {
      try {
        const storedChatId = await AsyncStorage.getItem(
          `${character?.name || 'Character'}-chatId-${userId}`
        );
        let currentChatId = storedChatId;

        if (!storedChatId) {
          // Create new chatId if none
          const newChatId = `${
            character?.name || 'Character'
          }-${Date.now()}`;
          await AsyncStorage.setItem(
            `${character?.name || 'Character'}-chatId-${userId}`,
            newChatId
          );
          currentChatId = newChatId;
          setChatId(newChatId);
          setIsLoading(false);
          // Stop - no existing messages
          return;
        }

        setChatId(currentChatId);

        // Fetch existing chat history from server
        const response = await axios.get(`${BASE_URL}/get-history`, {
          params: { chatId: currentChatId },
        });

        if (response.data && response.data.messages) {
          const fetchedMessages = response.data.messages.map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          }));
          setMessages(fetchedMessages);
        } else {
          console.warn('No messages found for this chatId.');
        }

        // Fetch all sessions for this user & character
        fetchUserSessions();
      } catch (error) {
        console.error('Error initializing or fetching history:', error);
        Alert.alert(
          'Error',
          'Unable to load chat history. Please try again later.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeChatIdAndFetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.name]);

  // Fetch all sessions for this user & character
  const fetchUserSessions = async () => {
    try {
      // We include characterName in the query
      const response = await axios.get(`${BASE_URL}/chat-sessions`, {
        params: { userId, characterName: character?.name },
      });

      if (response.data && response.data.sessions) {
        setChatSessions(response.data.sessions);
      } else {
        setChatSessions([]);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error.message);
      // Possibly show a toast or alert
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage = input.trim();
    const newMessage = { text: userMessage, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);

    setIsTyping(true);

    const characterName = character?.name || 'Character';
    const biography = character?.bio || 'This character has no biography.';

    try {
      const response = await axios.post(`${BASE_URL}/character-chat`, {
        userId,
        chatId,
        characterName,
        biography,
        userMessage,
      });

      const characterReply = response.data.response;

      const aiMessage = {
        text: characterReply,
        sender: 'character',
      };

      setMessages((prev) => [...prev, aiMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error(
        'Error communicating with the server:',
        error?.message || error
      );
      const errorMessage = {
        text: "I'm having trouble understanding. Please try again.",
        sender: 'character',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Parse text for (thoughts) and [actions]
  const parseText = (text) => {
    const regex = /\((.*?)\)|\[([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (lastIndex < match.index) {
        parts.push({
          text: text.slice(lastIndex, match.index),
          type: 'normal',
        });
      }

      if (match[1]) {
        // (thought)
        parts.push({ text: `(${match[1]})`, type: 'thought' });
      } else if (match[2]) {
        // [action]
        parts.push({ text: `[${match[2]}]`, type: 'action' });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        text: text.slice(lastIndex),
        type: 'normal',
      });
    }

    return parts;
  };

  const renderMessage = ({ item, index }) => {
    const parsedText = parseText(item.text);
    const isCharacter = item.sender === 'character';

    return (
      <View
        style={[
          styles.messageContainer,
          isCharacter ? styles.characterMessage : styles.userMessage,
        ]}
        key={index}
      >
        {isCharacter && (
          <Image
            source={{ uri: character?.images?.jpg?.image_url }}
            style={styles.characterImage}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isCharacter ? styles.characterBubble : styles.userBubble,
          ]}
        >
          {parsedText.map((part, idx) => (
            <Text
              key={`part-${idx}`}
              style={[
                part.type === 'thought' && styles.thoughtText,
                part.type === 'action' && styles.actionText,
                part.type === 'normal' && styles.normalText,
              ]}
            >
              {part.text}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // Typing indicator is now a separate component
  // Removed the old TypingIndicator implementation

  // Sidebar animation
  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: width * 0.25, // Adjusted for sliding in
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0.5, // Semi-transparent overlay
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsSidebarOpen(false));
  };

  // Start new chat
  const startNewChat = async () => {
    // Check if there's more than the initial message before saving
    if (messages.length > 1) {
      await saveChatHistory();
    }

    Alert.alert(
      'Start New Chat',
      'Are you sure you want to start a new chat? This will save the current session and clear the conversation.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start New Chat',
          onPress: async () => {
            // Create new chatId
            const newChatId = `${
              character?.name || 'Character'
            }-${Date.now()}`;
            await AsyncStorage.setItem(
              `${character?.name || 'Character'}-chatId-${userId}`,
              newChatId
            );
            setChatId(newChatId);

            // Reset messages
            setMessages([
              {
                text: `Hello, I am ${
                  character?.name || 'Unknown'
                }. How can I help you today?`,
                sender: 'character',
              },
            ]);

            // Refresh sessions
            fetchUserSessions();

            closeSidebar();
          },
        },
      ]
    );
  };

  // Switch to an existing chat session
  const switchToSession = async (selectedChatId) => {
    if (selectedChatId === chatId) {
      Alert.alert('Info', 'You are already in this chat session.');
      return;
    }

    // Save current chat if there's more than the initial message
    if (messages.length > 1) {
      await saveChatHistory();
    }

    // Set new chatId
    setChatId(selectedChatId);

    // Fetch selected chat history
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/get-history`, {
        params: { chatId: selectedChatId },
      });

      if (response.data && response.data.messages) {
        const fetchedMessages = response.data.messages.map((msg) => ({
          sender: msg.sender,
          text: msg.text,
        }));
        setMessages(fetchedMessages);
      } else {
        console.warn('No messages found for this chatId.');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error switching chat sessions:', error);
      Alert.alert('Error', 'Unable to load selected chat session.');
    } finally {
      setIsLoading(false);
      closeSidebar();
    }
  };

  // Confirm and Delete Session
  const confirmDeleteSession = (selectedChatId) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this chat session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(selectedChatId),
        },
      ]
    );
  };

  // Delete Session Function
  const deleteSession = async (selectedChatId) => {
    try {
      await axios.delete(`${BASE_URL}/delete-session`, {
        data: { chatId: selectedChatId, userId },
      });
      // Remove the deleted session from the local state
      setChatSessions((prevSessions) =>
        prevSessions.filter((session) => session.chatId !== selectedChatId)
      );
      // If the deleted session is the current one, handle accordingly
      if (selectedChatId === chatId) {
        // Optionally, navigate to a default session or create a new one
        Alert.alert('Session Deleted', 'The current session has been deleted.');
        // You might want to start a new chat or navigate away
        const newChatId = `${character?.name || 'Character'}-${Date.now()}`;
        await AsyncStorage.setItem(
          `${character?.name || 'Character'}-chatId-${userId}`,
          newChatId
        );
        setChatId(newChatId);
        setMessages([
          {
            text: `Hello, I am ${
              character?.name || 'Unknown'
            }. How can I help you today?`,
            sender: 'character',
          },
        ]);
        fetchUserSessions();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      Alert.alert(
        'Deletion Failed',
        'Unable to delete the chat session. Please try again later.'
      );
    }
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Detect horizontal swipes only
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        if (dx < -50 && !isSidebarOpen) {
          // Swipe left to open sidebar
          openSidebar();
        } else if (dx > 50 && isSidebarOpen) {
          // Swipe right to close sidebar
          closeSidebar();
        }
      },
    })
  ).current;

  // Save chat history
  const saveChatHistory = async () => {
    if (!chatId) return;

    // Check if there's more than the initial message
    if (messages.length <= 1) {
      console.log('No need to save empty chat session.');
      return;
    }

    const characterName = character?.name || 'Character';
    const biography = character?.bio || 'This character has no biography.';
    const formattedMessages = messages.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
      timestamp: new Date().toISOString(),
    }));

    try {
      await axios.post(`${BASE_URL}/save-history`, {
        userId,
        chatId,
        characterName,
        biography,
        messages: formattedMessages,
      });
      console.log('Chat history saved successfully.');
    } catch (error) {
      console.error('Error saving chat history:', error?.message || error);
      Alert.alert(
        'Save Failed',
        'Unable to save chat history. Please try again later.'
      );
    }
  };

  // Save chat history before leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default
      e.preventDefault();
      // Save chat history first
      saveChatHistory().then(() => {
        // After saving, allow navigation
        navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, chatId, messages]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5abf75" />
        <Text style={styles.loadingText}>Loading chat history...</Text>
      </SafeAreaView>
    );
  }

  const renderSessionItem = ({ item }) => {
    return (
      <View style={styles.sessionItemContainer}>
        <TouchableOpacity
          style={styles.sessionItemContent}
          onPress={() => switchToSession(item.chatId)}
        >
          <Text style={styles.sessionItemText}>{item.characterName}</Text>
          <Text style={styles.sessionItemPreview}>
            {item.lastMessage?.substring(0, 30) || 'No messages yet.'}
          </Text>
          <Text style={styles.sessionItemDate}>
            {new Date(item.updatedAt).toLocaleString()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteSession(item.chatId)}
        >
          <TrashIcon size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeftIcon size={28} strokeWidth={2.5} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Chat with {character?.name || 'Character'}
        </Text>
        <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
          <Bars3CenterLeftIcon size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}

      {/* Input Field */}
      <KeyboardAvoidingView
        behavior={ios ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor="#CCCCCC"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            coins < 10 && { backgroundColor: '#AAAAAA' },
          ]}
          onPress={sendMessage}
          disabled={coins < 10}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* No Coins Banner */}
      {coins < 10 && (
        <View style={styles.noCoinsBanner}>
          <Text style={styles.noCoinsText}>
            You have {coins} coins left. Please add more coins to continue
            chatting.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddCoins')}
            style={styles.addCoinsButton}
          >
            <Text style={styles.addCoinsButtonText}>Add Coins</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sidebar Overlay (clicking outside closes it) */}
      {isSidebarOpen && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnim }],
          },
        ]}
      >
        {/* Character info at top */}
        <View style={styles.sidebarHeader}>
          <Image
            source={{ uri: character?.images?.jpg?.image_url }}
            style={styles.sidebarCharacterImage}
          />
          <Text style={styles.sidebarCharacterName}>
            {character?.name || 'Character'}
          </Text>
        </View>

        {/* List of previous chats for this character */}
        <FlatList
          data={chatSessions}
          keyExtractor={(item) => item.chatId}
          renderItem={renderSessionItem}
          ListEmptyComponent={
            <Text style={styles.noSessionsText}>
              No past chat sessions found.
            </Text>
          }
          style={styles.sessionsList}
        />

        {/* Start New Chat Button */}
        <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
          <Text style={styles.newChatButtonText}>Start New Chat</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Container and Loading */
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#262626',
  },
  loadingText: {
    marginTop: 10,
    color: '#5abf75',
    fontSize: 16,
  },

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2A2A2A',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 10,
  },

  /* Chat */
  chatContainer: {
    padding: 10,
    paddingBottom: 60,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'flex-end',
  },
  characterMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  characterImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    padding: 12,
    borderRadius: 10,
  },
  characterBubble: {
    backgroundColor: '#333333',
  },
  userBubble: {
    backgroundColor: '#5abf75',
  },
  thoughtText: {
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
  },
  normalText: {
    color: 'white',
  },

  /* Typing Indicator */
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typingText: {
    color: '#5abf75',
    marginLeft: 8,
    fontStyle: 'italic',
  },

  /* Input */
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333333',
    color: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#5abf75',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Coins Banner */
  noCoinsBanner: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#5abf75',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noCoinsText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  addCoinsButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addCoinsButtonText: {
    color: '#5abf75',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Sidebar */
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.75,
    height: '100%',
    backgroundColor: '#2A2A2A',
    padding: 20,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0, // Changed to 0 to cover the entire screen
    width: width,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidebarHeader: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarCharacterImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  sidebarCharacterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  sessionsList: {
    flex: 1,
    marginTop: 10,
  },
  sessionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  sessionItemContent: {
    flex: 1,
  },
  sessionItemText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionItemPreview: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  sessionItemDate: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'right',
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  noSessionsText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  newChatButton: {
    marginTop: 20,
    backgroundColor: '#5abf75',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    width: '100%',
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
