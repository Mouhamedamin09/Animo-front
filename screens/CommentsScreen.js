// CommentsScreen.js
import React, { useEffect, useState } from 'react';
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
import { ArrowLeftIcon, TrashIcon, Bars3BottomRightIcon } from 'react-native-heroicons/outline';
import { HeartIcon as HeartOutline } from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolid } from 'react-native-heroicons/solid';
import Icon from 'react-native-vector-icons/FontAwesome';

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

export default function CommentsScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { userId, BASE_URL } = useUser();

  const { animeId, title } = params;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [remainingChars, setRemainingChars] = useState(150);
  const [posting, setPosting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [showSortOptions, setShowSortOptions] = useState(false); 
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'mostLikes'
  const [refreshing, setRefreshing] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [likingCommentId, setLikingCommentId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [sortOrder, animeId, userId]);

  // Fetch comments from the server
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/comment?animeId=${animeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to fetch comments:', response.status);
        Alert.alert('Error', 'Failed to load comments.');
        return;
      }

      const data = await response.json();
      let fetchedComments = data.comments || [];

      // Process comments to include likedByUser
      fetchedComments = fetchedComments.map((comment) => {
        const likedByArray = Array.isArray(comment.likedBy) ? comment.likedBy : [];
        const likedByUser = likedByArray.includes(userId);

        console.log(`Comment ID: ${comment._id}, Liked by User: ${likedByUser}`);

        return {
          ...comment,
          likedByUser,
          likedBy: likedByArray,
        };
      });

      // Sort comments based on sortOrder
      if (sortOrder === 'newest') {
        fetchedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortOrder === 'oldest') {
        fetchedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortOrder === 'mostLikes') {
        fetchedComments.sort((a, b) => b.likesCount - a.likesCount);
      }

      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'An error occurred while fetching comments.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
  };

  // Post a new comment
  const postComment = async () => {
    const trimmedComment = commentText.trim();

    if (trimmedComment === '') {
      Alert.alert('Empty Comment', 'Please enter a comment before posting.');
      return;
    }

    if (trimmedComment.length > 150) {
      Alert.alert('Comment Too Long', 'Comments cannot exceed 150 characters.');
      return;
    }

    setPosting(true);
    try {
      const response = await fetch(`${BASE_URL}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          animeId,
          commentText: trimmedComment,
          spoiler: isSpoiler, // Include the spoiler flag
        }),
      }); 

      if (!response.ok) {
        console.log('Failed to post comment:', response.status);
        Alert.alert('Error', 'Failed to post comment.');
        return;
      }

      const data = await response.json();
      if (data && data.comment) {
        const comment = data.comment;
        if (comment._id && comment.commentText) {
          const likedByArray = Array.isArray(comment.likedBy) ? comment.likedBy : [];
          const likedByUser = likedByArray.includes(userId);
          const newComment = { 
            ...comment, 
            likedByUser, 
            likedBy: likedByArray,
            spoiler: comment.spoiler,
          };

          if (sortOrder === 'newest') {
            setComments([newComment, ...comments]);
          } else if (sortOrder === 'oldest') {
            setComments([...comments, newComment]);
          } else if (sortOrder === 'mostLikes') {
            setComments([...comments, newComment].sort((a, b) => b.likesCount - a.likesCount));
          }
          setCommentText('');
          setRemainingChars(150);
          setIsSpoiler(false);
        } else {
          console.error('Comment structure is invalid:', comment);
          Alert.alert('Error', 'Invalid comment data received from the server.');
        }
      } else {
        console.error('Unexpected response format:', data);
        Alert.alert('Error', 'Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'An error occurred while posting your comment.');
    } finally {
      setPosting(false);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingCommentId(commentId);
            try {
              const response = await fetch(
                `${BASE_URL}/comment/${commentId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: userId,
                  }),
                }
              );

              if (!response.ok) {
                console.log('Failed to delete comment:', response.status);
                Alert.alert('Error', 'Failed to delete comment.');
                return;
              }

              setComments(comments.filter((comment) => comment._id !== commentId));
              Alert.alert('Success', 'Comment deleted successfully.');
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'An error occurred while deleting the comment.');
            } finally {
              setDeletingCommentId(null);
            }
          },
        },
      ]
    );
  };

  // Handle Like/Unlike
  const handleLikePress = async (commentId) => {
    if (!userId) {
      Alert.alert('Unauthorized', 'You must be logged in to like comments.');
      return;
    }

    setLikingCommentId(commentId);

    try {
      const response = await fetch(
        `${BASE_URL}/comment/${commentId}/${userId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to like/unlike comment:', response.status);
        Alert.alert('Error', 'Failed to like/unlike comment.');
        return;
      }

      const data = await response.json();
      const { likesCount, likedByUser } = data;

      // Update the local state
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId
            ? { ...comment, likesCount, likedByUser }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
      Alert.alert('Error', 'An error occurred while liking/unliking the comment.');
    } finally {
      setLikingCommentId(null);
    }
  };

  // Render each comment
  const renderComment = ({ item }) => {
    const isAuthor = item.userId && item.userId._id === userId;

    const handleReplyPress = () => {
      if (item.userId) {
        navigation.navigate('Replies', {
          parentCommentId: item._id,
          animeId: animeId,
          parentUsername: item.userId.username,
        });
      } else {
        Alert.alert('Error', 'Cannot reply to a comment with no user information.');
      }
    };

    const handleDeletePress = () => {
      deleteComment(item._id);
    };

    const handleProfilePress = () => {
      if (item.userId) {
        navigation.navigate('OthersProfile', { userId: item.userId._id });
      } else {
        Alert.alert('Error', 'User information is unavailable.');
      }
    };

    const toggleSpoiler = () => {
      setRevealedSpoilers((prev) => ({
        ...prev,
        [item._id]: !prev[item._id],
      }));
    };

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileTouchable}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.userId && item.userId.avatar ? (
                <Image source={{ uri: item.userId.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {item.userId && item.userId.username ? item.userId.username[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <Text style={styles.commentUser}>
                {item.userId && item.userId.username ? item.userId.username : 'Unknown User'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        {item.spoiler && !revealedSpoilers[item._id] ? (
          <TouchableOpacity onPress={toggleSpoiler}>
            <Text style={styles.spoilerText}>This comment has a spoiler. Tap here to view.</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={item.spoiler ? styles.commentTextSpoiler : styles.commentText}>
              {item.commentText}
            </Text>
            {item.spoiler && (
              <TouchableOpacity onPress={toggleSpoiler}>
                <Text style={styles.hideSpoilerText}>Hide Spoiler</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikePress(item._id)}
            disabled={likingCommentId === item._id}
          >
            {likingCommentId === item._id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : item.likedByUser ? (
              <HeartSolid size={20} color="#ff4d4d" />
            ) : (
              <HeartOutline size={20} color="#ffffff" />
            )}
            <Text style={styles.actionText}>{item.likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReplyPress}>
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          {isAuthor && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDeletePress}>
              <TrashIcon size={20} color="#ff4d4d" />
              <Text style={styles.actionText}></Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentDate}>{formatTimeDifference(item.createdAt)}</Text>
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
    setShowSortOptions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeftIcon size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
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
                <Text style={styles.modalOptionText}>Most Liked</Text>
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

      {/* Comments List */}
      {loading ? (
        <ActivityIndicator size="large" color="#5abf75" style={{ marginTop: 569 }} />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.commentsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          } 
          ListEmptyComponent={
            <Text style={styles.noCommentsText}>
              No comments yet. Be the first to comment!
            </Text>
          }
        />
      )}

      {/* Comment Input */}
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
            placeholder="Add a comment..."
            placeholderTextColor="#888"
            value={commentText}
            onChangeText={(text) => {
              setCommentText(text);
              setRemainingChars(150 - text.length);
            }}
            multiline
            maxLength={150} // Restrict input to 150 characters
          />
          <TouchableOpacity
            style={styles.postButton}
            onPress={postComment}
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortButton: {
    padding: 8,
  },
  commentsList: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  commentContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  commentHeader: {
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
  commentUser: {
    color: '#5abf75',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentActions: {
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
  commentText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  commentTextSpoiler: { // Style for spoiler comment
    color: '#ff4500', // Red color
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
  commentDate: {
    color: '#b0b0b0',
    fontSize: 12,
    textAlign: 'right',
  },
  noCommentsText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
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
    color: '#333',
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
});
