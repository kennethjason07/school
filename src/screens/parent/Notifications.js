import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { supabase, TABLES, dbHelpers } from '../../utils/supabase';
import { useAuth } from '../../utils/AuthContext';

const { width } = Dimensions.get('window');

const Notifications = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get notifications (simplified approach for parents)
        const { data: parentNotifications, error: notificationsError } = await supabase
          .from(TABLES.NOTIFICATIONS)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (notificationsError && notificationsError.code !== '42P01') {
          throw notificationsError;
        }
        
        // Transform the data to match the expected format
        const transformedNotifications = (parentNotifications || []).map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          sender: notification.sender || 'School Admin',
          type: notification.type || 'general',
          priority: notification.priority || 'regular',
          isRead: notification.is_read || false,
          timestamp: notification.created_at,
          relatedAction: notification.related_action || null
        }));
        
        setNotifications(transformedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err.message);
        Alert.alert('Error', 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    if (filter === 'important') return n.priority === 'important';
    return true;
  }).filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase()) ||
    n.sender.toLowerCase().includes(search.toLowerCase())
  );

  const markAsRead = async (id) => {
    try {
      // Update notification in database
      await dbHelpers.update('notifications', id, { is_read: true });
      
      // Update local state
      setNotifications(notifications =>
        notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAsUnread = async (id) => {
    try {
      // Update notification in database
      await dbHelpers.update('notifications', id, { is_read: false });
      
      // Update local state
      setNotifications(notifications =>
        notifications.map(n => n.id === id ? { ...n, isRead: false } : n)
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      Alert.alert('Error', 'Failed to mark notification as unread');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  const renderNotification = ({ item }) => (
    <View style={[styles.card, item.isRead ? styles.cardRead : styles.cardUnread]}>
      <View style={styles.cardHeader}>
        <Ionicons name={item.isRead ? 'mail-open' : 'mail'} size={22} color={item.isRead ? '#888' : '#1976d2'} style={{ marginRight: 10 }} />
        <Text style={[styles.title, item.isRead && { color: '#888' }]}>{item.title}</Text>
        {item.priority === 'important' && (
          <Ionicons name="star" size={18} color="#FFD700" style={{ marginLeft: 6 }} />
        )}
        <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.sender}>{item.sender}</Text>
        <View style={styles.actionButtons}>
          {item.isRead ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => markAsUnread(item.id)}>
              <Ionicons name="mail" size={18} color="#1976d2" />
              <Text style={styles.actionText}>Mark as Unread</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => markAsRead(item.id)}>
              <Ionicons name="mail-open" size={18} color="#388e3c" />
              <Text style={styles.actionText}>Mark as Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'important', label: 'Important' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Notifications" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Notifications" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack={true} />
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            {f.key === 'important' && (
              <Ionicons name="star" size={15} color="#FFD700" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search notifications..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#aaa"
      />
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'You have no notifications yet.' 
                : `No ${filter} notifications found.`
              }
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e3eaf2',
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#1976d2',
  },
  filterText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e3eaf2',
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e3eaf2',
  },
  cardUnread: {
    borderLeftWidth: 5,
    borderLeftColor: '#1976d2',
  },
  cardRead: {
    borderLeftWidth: 5,
    borderLeftColor: '#bdbdbd',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#222',
  },
  date: {
    color: '#888',
    fontSize: 13,
    marginLeft: 8,
  },
  message: {
    color: '#333',
    fontSize: 15,
    marginBottom: 8,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e3eaf2',
    marginLeft: 8,
  },
  actionText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#1976d2',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default Notifications; 