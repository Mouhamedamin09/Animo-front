// RepliesScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUser } from '../Context/UserContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeftIcon, TrashIcon, Bars3BottomRightIcon } from 'react-native-heroicons/outline';
import { ChevronDownIcon, ChevronUpIcon } from 'react-native-heroicons/solid';
import { HeartIcon as HeartOutline } from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolid } from 'react-native-heroicons/solid';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

// Utility function to format time differences
const formatTimeDifference = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

export default function RepliesScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { userId, BASE_URL } = useUser();

  const { parentCommentId, animeId, parentUsername } = params;

  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [remainingChars, setRemainingChars] = useState(150);
  const [posting, setPosting] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState(null);
  const [showSortOptions, setShowSortOptions] = useState(false); 
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'mostLikes'
  const [refreshing, setRefreshing] = useState(false);
  
  const [isSpoiler, setIsSpoiler] = useState(false); // Spoiler toggle state
  const [revealedSpoilers, setRevealedSpoilers] = useState({}); // Track revealed spoilers

  const [likingReplyId, setLikingReplyId] = useState(null); // Track liking replies

  // Fetch replies when component mounts or sortOrder changes
  useEffect(() => {
    fetchReplies();
  }, [sortOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReplies();
    setRefreshing(false);
  };

  // Fetch replies from the server
  const fetchReplies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/reply?parentCommentId=${parentCommentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to fetch replies:', response.status);
        Alert.alert('Error', 'Failed to load replies.');
        return;
      }

      const data = await response.json();
      let fetchedReplies = data.replies || [];

      // Process replies to include likedByUser
      fetchedReplies = fetchedReplies.map((reply) => {
        const likedByArray = Array.isArray(reply.likedBy) ? reply.likedBy : [];
        const likedByUser = likedByArray.includes(userId);

        console.log(`Reply ID: ${reply._id}, Liked by User: ${likedByUser}`);

        return {
          ...reply,
          likedByUser,
          likedBy: likedByArray,
        };
      });

      // Sort replies based on sortOrder
      if (sortOrder === 'newest') {
        fetchedReplies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortOrder === 'oldest') {
        fetchedReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortOrder === 'mostLikes') {
        fetchedReplies.sort((a, b) => b.likesCount - a.likesCount);
      }

      setReplies(fetchedReplies);
    } catch (error) {
      console.error('Error fetching replies:', error);
      Alert.alert('Error', 'An error occurred while fetching replies.');
    } finally {
      setLoading(false);
    }
  };

  // Post a new reply
  const postReply = async () => {
    const trimmedReply = replyText.trim();
  
    if (trimmedReply === '') {
      Alert.alert('Empty Reply', 'Please enter a reply before posting.');
      return;
    }
  
    if (trimmedReply.length > 150) {
      Alert.alert('Reply Too Long', 'Replies cannot exceed 150 characters.');
      return;
    }
  
    setPosting(true);
    try {
      const response = await axios.post(`${BASE_URL}/reply`, {
        userId: userId,
        animeId,
        parentCommentId,
        replyText: trimmedReply,
        spoiler: isSpoiler,
      });
  
      const data = response.data; // Axios already parses the JSON response
      if (data && data.reply) {
        const reply = data.reply;
        const likedByArray = Array.isArray(reply.likedBy) ? reply.likedBy : [];
        const likedByUser = likedByArray.includes(userId);
        const newReply = {
          ...reply,
          likedByUser,
          likedBy: likedByArray,
          spoiler: reply.spoiler, // Ensure spoiler flag is included
        };
  
        // Update replies based on sortOrder
        if (sortOrder === 'newest') {
          setReplies([newReply, ...replies]);
        } else if (sortOrder === 'oldest') {
          setReplies([...replies, newReply]);
        } else if (sortOrder === 'mostLikes') {
          setReplies([...replies, newReply].sort((a, b) => b.likesCount - a.likesCount));
        }
  
        // Reset input fields
        setReplyText('');
        setRemainingChars(150);
        setIsSpoiler(false);
      } else {
        console.error('Unexpected reply structure:', data);
        Alert.alert('Error', 'Invalid reply data received from the server.');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'An error occurred while posting your reply.');
    } finally {
      setPosting(false);
    }
  };

  // Delete a reply
  const deleteReply = async (replyId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingReplyId(replyId);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Authentication Error', 'Please log in again.');
                navigation.replace('Login');
                return;
              }

              const response = await fetch(
                `${BASE_URL}/reply/${replyId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    userId: userId,
                  }),
                }
              );

              if (!response.ok) {
                console.log('Failed to delete reply:', response.status);
                Alert.alert('Error', 'Failed to delete reply.');
                return;
              }

              setReplies(replies.filter((reply) => reply._id !== replyId));
              Alert.alert('Success', 'Reply deleted successfully.');
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('Error', 'An error occurred while deleting the reply.');
            } finally {
              setDeletingReplyId(null);
            }
          },
        },
      ]
    );
  };

  // Handle Like/Unlike
  const handleLikePress = async (replyId) => {
    if (!userId) {
      Alert.alert('Unauthorized', 'You must be logged in to like replies.');
      return;
    }
  
    setLikingReplyId(replyId);
  
    try {
      const response = await axios.post(
        `${BASE_URL}/${replyId}/${userId}/like`,
        {}, // No request body needed for this POST request
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      const { likesCount, likedByUser } = response.data;
  
      // Update the local state
      setReplies((prevReplies) =>
        prevReplies.map((reply) =>
          reply._id === replyId
            ? { ...reply, likesCount, likedByUser }
            : reply
        )
      );
    } catch (error) {
      console.error('Error liking/unliking reply:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'An error occurred while liking/unliking the reply.'
      );
    } finally {
      setLikingReplyId(null);
    }
  };

  // Render each reply
  const renderReply = ({ item }) => {
    const { userId: user, replyText, createdAt, _id, spoiler, likesCount, likedByUser } = item;
    const isAuthor = user._id === userId;

    const handleProfilePress = () => {
      navigation.navigate('OthersProfile', { userId: user._id });
    };

    const toggleSpoiler = () => {
      setRevealedSpoilers((prev) => ({
        ...prev,
        [item._id]: !prev[item._id],
      }));
    };

    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyHeader}>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileTouchable}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {user.username[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.replyUser}>{user.username}</Text>
            </View>
          </TouchableOpacity>
          {isAuthor && (
            <TouchableOpacity
              onPress={() => deleteReply(_id)}
              style={styles.deleteButton}
            >
              <TrashIcon size={20} color="#ff4d4d" />
            </TouchableOpacity>
          )}
        </View>
        {spoiler && !revealedSpoilers[_id] ? (
          <TouchableOpacity onPress={toggleSpoiler}>
            <Text style={styles.spoilerText}>This reply contains a spoiler. Tap to reveal.</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={spoiler ? styles.replyTextSpoiler : styles.replyText}>
              {replyText}
            </Text>
            {spoiler && (
              <TouchableOpacity onPress={toggleSpoiler}>
                <Text style={styles.hideSpoilerText}>Hide Spoiler</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={styles.replyActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePress(_id)}
            disabled={likingReplyId === _id}
          >
            {likingReplyId === _id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : likedByUser ? (
              <HeartSolid size={20} color="#ff4d4d" />
            ) : (
              <HeartOutline size={20} color="#ffffff" />
            )}
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>
          {/* Optionally, add a Reply button here if nesting is supported */}
          {/* {userId && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleReplyPress(_id)}>
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )} */}
        </View>
        <Text style={styles.replyDate}>{formatTimeDifference(createdAt)}</Text>
      </View>
    );
  };

  // Toggle sort order to cycle through 'newest', 'oldest', 'mostLikes'
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => {
      if (prevOrder === 'newest') return 'oldest';
      if (prevOrder === 'oldest') return 'mostLikes';
      return 'newest';
    });
  };

  // Get display text based on sortOrder
  const getSortOrderText = () => {
    switch (sortOrder) {
      case 'newest':
        return 'Newest First';
      case 'oldest':
        return 'Oldest First';
      case 'mostLikes':
        return 'Most Likes';
      default:
        return 'Newest First';
    }
  };

  const handleOptionSelect = (order) => {
    setSortOrder(order);
    setShowSortOptions(false); // Close the modal after selection
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeftIcon size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Replies to {parentUsername}</Text>
        <TouchableOpacity
          onPress={() => setShowSortOptions(true)}
          style={styles.sortButton}
        >
          <Bars3BottomRightIcon size={28} color="#ffffff" />
        </TouchableOpacity>
      </View> 

      {/* Sort Options Modal */}
      <Modal
        visible={showSortOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sort By</Text>

            {/* Newest First Option */}
            <TouchableOpacity
              onPress={() => handleOptionSelect('newest')}
              style={styles.modalOption}
            >
              <View style={styles.radioButtonContainer}>
                <View
                  style={[
                    styles.radioButton,
                    sortOrder === 'newest' ? styles.radioButtonSelected : null,
                  ]}
                />
                <Text style={styles.modalOptionText}>Newest First</Text>
              </View>
            </TouchableOpacity>

            {/* Oldest First Option */}
            <TouchableOpacity
              onPress={() => handleOptionSelect('oldest')}
              style={styles.modalOption}
            >
              <View style={styles.radioButtonContainer}>
                <View
                  style={[
                    styles.radioButton,
                    sortOrder === 'oldest' ? styles.radioButtonSelected : null,
                  ]}
                />
                <Text style={styles.modalOptionText}>Oldest First</Text>
              </View>
            </TouchableOpacity>

            {/* Most Liked Option */}
            <TouchableOpacity
              onPress={() => handleOptionSelect('mostLikes')}
              style={styles.modalOption}
            >
              <View style={styles.radioButtonContainer}>
                <View
                  style={[
                    styles.radioButton,
                    sortOrder === 'mostLikes' ? styles.radioButtonSelected : null,
                  ]}
                />
                <Text style={styles.modalOptionText}>Most Likes</Text>
              </View>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowSortOptions(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Replies List */}
      {loading ? (
        <ActivityIndicator size="large" color="#5abf75" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={replies}
          renderItem={renderReply}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.repliesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          } 
          ListEmptyComponent={
            <Text style={styles.noRepliesText}>
              No replies yet. Be the first to reply!
            </Text>
          }
        />
      )}

      {/* Reply Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 60, android: 78 })}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.spoilerToggle}
            onPress={() => setIsSpoiler(!isSpoiler)}
          >
            <Icon
              name="fire"
              size={24}
              color={isSpoiler ? "#ff4500" : "#888"}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Add a reply..."
            placeholderTextColor="#888"
            value={replyText}
            onChangeText={(text) => {
              setReplyText(text);
              setRemainingChars(150 - text.length);
            }}
            multiline
            maxLength={150} // Restrict input to 150 characters
          />
          <TouchableOpacity
            style={styles.postButton}
            onPress={postReply}
            disabled={posting}
          >
            {posting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Icon name="paper-plane" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#262626',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  sortButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5abf75',
    marginRight: 12,
  },
  radioButtonSelected: {
    backgroundColor: '#5abf75',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalCloseButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: 'bold',
  },
  repliesList: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  replyContainer: {
    
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  profileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5abf75',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  replyUser: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  replyText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  replyTextSpoiler: { // Style for spoiler reply
    color: '#ff4500', // Red color indicating spoiler
    fontSize: 16,
    marginBottom: 10,
  },
  spoilerText: { // Style for spoiler placeholder
    color: '#ff4500',
    fontSize: 16,
    marginBottom: 10,
  },
  hideSpoilerText: { // Style for hide spoiler text
    color: '#5abf75',
    fontSize: 14,
    marginTop: 5,
  },
  replyActions: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#b0b0b0',
    fontSize: 14,
    marginLeft: 5,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 5,
  },
  replyDate: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'right',
  },
  noRepliesText: {
    color: '#b0b0b0',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    alignItems: 'center',
  },
  spoilerToggle: { // Style for spoiler toggle
    padding: 5,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    padding: 10,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: '#5abf75',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  charCountText: { // Style for character count
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'right',
    paddingHorizontal: 20,
    paddingTop: 5,
  },
});
