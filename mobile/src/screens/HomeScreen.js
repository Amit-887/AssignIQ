import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api from '../redux/api';

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const endpoint = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      const response = await api.get(endpoint);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.name}</Text>
        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
      </View>

      {user?.role === 'student' && dashboardData?.pendingAssignments?.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          {dashboardData.pendingAssignments.slice(0, 3).map((assignment, index) => {
            const dueDate = new Date(assignment.dueDate);
            const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <View key={index} style={styles.taskCard}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{assignment.title}</Text>
                  <Text style={styles.taskSubtitle}>{assignment.section?.name}</Text>
                </View>
                <View style={[styles.dueBadge, { backgroundColor: daysLeft <= 1 ? '#fee2e2' : '#dbeafe' }]}>
                  <Text style={[styles.dueText, { color: daysLeft <= 1 ? '#dc2626' : '#2563eb' }]}>
                    {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Assignments')}>
          <Ionicons name="document-text" size={28} color="#2563eb" />
          <Text style={styles.actionText}>Assignments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Messages')}>
          <Ionicons name="chatbubbles" size={28} color="#7c3aed" />
          <Text style={styles.actionText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person" size={28} color="#059669" />
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => alert('Code Gen coming soon')}>
          <Ionicons name="code-slash" size={28} color="#ea580c" />
          <Text style={styles.actionText}>Code Gen</Text>
        </TouchableOpacity>
      </View>

      {user?.role === 'teacher' && dashboardData?.sections?.length > 0 && (
        <View style={styles.sectionsSection}>
          <Text style={styles.sectionTitle}>Your Sections</Text>
          {dashboardData.sections.slice(0, 3).map((section, index) => (
            <View key={index} style={styles.sectionCard}>
              <Ionicons name="people" size={24} color="#2563eb" />
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionName}>{section.name}</Text>
                <Text style={styles.sectionCount}>{section.students?.length || 0} students</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  welcomeText: { fontSize: 16, color: '#64748b' },
  nameText: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  roleText: { fontSize: 12, fontWeight: '600', color: '#2563eb', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  pendingSection: { marginBottom: 24 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  taskSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  dueBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  dueText: { fontSize: 12, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 8 },
  sectionsSection: {},
  sectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  sectionInfo: { marginLeft: 12 },
  sectionName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  sectionCount: { fontSize: 12, color: '#64748b' },
});

export default HomeScreen;

