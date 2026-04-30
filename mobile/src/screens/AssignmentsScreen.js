import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api from '../redux/api';

const AssignmentsScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const endpoint = user?.role === 'teacher' ? '/teacher/assignments' : '/student/assignments';
      const response = await api.get(endpoint);
      setAssignments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  const getDaysRemaining = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderAssignment = ({ item }) => {
    const daysRemaining = getDaysRemaining(item.dueDate);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: daysRemaining <= 0 ? '#fee2e2' : daysRemaining <= 2 ? '#fef3c7' : '#dcfce7' }]}>
            <Text style={[styles.statusText, { color: daysRemaining <= 0 ? '#dc2626' : daysRemaining <= 2 ? '#d97706' : '#16a34a' }]}>
              {daysRemaining <= 0 ? 'Overdue' : `${daysRemaining}d left`}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>Max: {item.maxMarks} marks</Text>
          </View>
        </View>
        {user?.role === 'student' && !item.mySubmission && (
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit Assignment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Assignments</Text>
      {assignments.length > 0 ? (
        <FlatList data={assignments} renderItem={renderAssignment} keyExtractor={(item, index) => index.toString()} scrollEnabled={false} />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#e2e8f0" />
          <Text style={styles.emptyText}>No assignments found</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 12, color: '#64748b', marginLeft: 4 },
  submitButton: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12 },
});

export default AssignmentsScreen;

