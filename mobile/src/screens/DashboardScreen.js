import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api from '../redux/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const endpoint = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      const response = await api.get(endpoint);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const stats = user?.role === 'teacher' ? [
    { label: 'Sections', value: data?.totalSections || 0, icon: 'people', color: '#2563eb' },
    { label: 'Students', value: data?.totalStudents || 0, icon: 'school', color: '#7c3aed' },
    { label: 'Assignments', value: data?.totalAssignments || 0, icon: 'document-text', color: '#059669' },
    { label: 'Pending', value: data?.pendingSubmissions || 0, icon: 'time', color: '#ea580c' },
  ] : [
    { label: 'Sections', value: data?.sections?.length || 0, icon: 'people', color: '#2563eb' },
    { label: 'Pending', value: data?.pendingAssignments?.length || 0, icon: 'time', color: '#ea580c' },
    { label: 'Submitted', value: data?.submittedCount || 0, icon: 'checkmark-circle', color: '#059669' },
    { label: 'Avg Score', value: data?.averageScore || 'N/A', icon: 'stats-chart', color: '#7c3aed' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Ionicons name={stat.icon} size={28} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {user?.role === 'teacher' ? (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Assignments')}>
              <Ionicons name="add-circle" size={24} color="#2563eb" />
              <Text style={styles.actionText}>Create Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Assignments')}>
              <Ionicons name="people" size={24} color="#7c3aed" />
              <Text style={styles.actionText}>Manage Sections</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Assignments')}>
              <Ionicons name="document-text" size={24} color="#2563eb" />
              <Text style={styles.actionText}>View Assignments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Messages')}>
              <Ionicons name="chatbubbles" size={24} color="#7c3aed" />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 12, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  quickActions: {},
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  actionText: { fontSize: 16, fontWeight: '600', color: '#374151', marginLeft: 12 },
});

export default DashboardScreen;

