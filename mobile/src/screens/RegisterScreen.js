import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/slices/authSlice';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    const userData = { name, email, password, role, department };
    const result = await dispatch(register(userData));
    if (register.fulfilled.match(result)) {
      // Navigation handled by AppNavigator
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join AssignIQ today</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.roleContainer}>
            <TouchableOpacity style={[styles.roleButton, role === 'student' && styles.roleButtonActive]} onPress={() => setRole('student')}>
              <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, role === 'teacher' && styles.roleButtonActive]} onPress={() => setRole('teacher')}>
              <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Teacher</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          {role === 'teacher' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department</Text>
              <TextInput style={styles.input} placeholder="Enter your department" value={department} onChangeText={setDepartment} />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Create password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>

          {role === 'teacher' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Teacher accounts require admin approval before accessing all features.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  error: { color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  roleContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4 },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  roleButtonActive: { backgroundColor: '#2563eb' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  roleTextActive: { color: '#fff' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  infoBox: { backgroundColor: '#dbeafe', padding: 12, borderRadius: 8, marginBottom: 16 },
  infoText: { fontSize: 12, color: '#1e40af' },
  registerButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginButton: { marginTop: 24, alignItems: 'center' },
  loginText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});

export default RegisterScreen;

