import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import api from '../redux/api';

const MessagesScreen = () => {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    fetchConversations();
    initializeSocket();
    return () => {
      if (global.socket) global.socket.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    const socket = io('http://localhost:5000');
    global.socket = socket;
    socket.emit('join', user?._id);
    socket.on('onlineUsers', (users) => setOnlineUsers(users));
    socket.on('newMessage', (message) => {
      if (selectedUser && message.sender === selectedUser._id) {
        setMessages((prev) => [...prev, message]);
      }
    });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const response = await api.get(`/messages/${otherUserId}`);
      setMessages(response.data.data);
      const conv = conversations.find((c) => c.user._id === otherUserId);
      setSelectedUser(conv?.user || { _id: otherUserId });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    try {
      const response = await api.post('/messages', { receiverId: selectedUser._id, content: newMessage });
      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity style={styles.conversationItem} onPress={() => fetchMessages(item.user._id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.user.name?.charAt(0)}</Text>
        {onlineUsers.includes(item.user._id) && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.user.name}</Text>
        <Text style={styles.conversationLast} numberOfLines={1}>{item.lastMessage?.content || 'No messages yet'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isOwn = item.sender === user?._id;
    return (
      <View style={[styles.messageBubble, isOwn ? styles.messageOwn : styles.messageOther]}>
        <Text style={[styles.messageText, isOwn && { color: '#fff' }]}>{item.content}</Text>
        <Text style={[styles.messageTime, isOwn && { color: 'rgba(255,255,255,0.7)' }]}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.chatContainer}>
          <View style={styles.conversationsList}>
            <FlatList data={conversations} renderItem={renderConversation} keyExtractor={(item, index) => index.toString()} />
          </View>
          <View style={styles.chatArea}>
            {selectedUser ? (
              <>
                <View style={styles.chatHeader}>
                  <View style={styles.chatUserInfo}>
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>{selectedUser.name?.charAt(0)}</Text>
                    </View>
                    <Text style={styles.chatUserName}>{selectedUser.name}</Text>
                  </View>
                </View>
                <FlatList data={messages} renderItem={renderMessage} keyExtractor={(item, index) => index.toString()} style={styles.messagesList} contentContainerStyle={styles.messagesContent} inverted />
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} placeholder="Type a message..." value={newMessage} onChangeText={setNewMessage} />
                  <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    <Ionicons name="send" size={24} color={newMessage.trim() ? '#2563eb' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noChat}>
                <Ionicons name="chatbubbles-outline" size={48} color="#e2e8f0" />
                <Text style={styles.noChatText}>Select a conversation to start chatting</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  chatContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  conversationsList: { width: '35%', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  conversationItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  conversationInfo: { flex: 1, justifyContent: 'center' },
  conversationName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  conversationLast: { fontSize: 12, color: '#64748b', marginTop: 2 },
  chatArea: { flex: 1 },
  chatHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  chatUserInfo: { flexDirection: 'row', alignItems: 'center' },
  smallAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  smallAvatarText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  chatUserName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  messagesList: { flex: 1 },
  messagesContent: { padding: 12 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 8 },
  messageOther: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start' },
  messageOwn: { backgroundColor: '#2563eb', alignSelf: 'flex-end' },
  messageText: { fontSize: 14, color: '#1e293b' },
  messageTime: { fontSize: 10, color: '#64748b', marginTop: 4 },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  sendButton: { justifyContent: 'center', padding: 8 },
  noChat: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noChatText: { fontSize: 14, color: '#64748b', marginTop: 12 },
});

export default MessagesScreen;

