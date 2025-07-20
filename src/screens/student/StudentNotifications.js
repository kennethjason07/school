import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StudentNotifications = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Notifications</Text>
    <Text style={styles.subtitle}>
      This is a placeholder screen. Here, students can view a list of notifications sent to them.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});

export default StudentNotifications; 