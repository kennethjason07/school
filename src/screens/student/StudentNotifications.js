import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StudentNotifications = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Notifications</Text>
    <Text style={styles.subtitle}>This is the student notifications screen.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#555' },
});

export default StudentNotifications; 