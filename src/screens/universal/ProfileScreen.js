import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const DUMMY_USER = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  photo: 'https://randomuser.me/api/portraits/men/32.jpg',
  contact: '+1 234 567 8901',
  linkedAccounts: ['Parent', 'Student'],
};

const ProfileScreen = () => {
  const [user, setUser] = useState(DUMMY_USER);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    contact: user.contact,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();

  const handleSave = () => {
    setUser({ ...user, ...form });
    setEditing(false);
    Alert.alert('Profile updated!');
  };

  const handleChangePassword = () => {
    if (!password || password !== confirmPassword) {
      Alert.alert('Passwords do not match!');
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    Alert.alert('Password changed!');
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleTakePhoto();
          } else if (buttonIndex === 2) {
            await handleChooseFromGallery();
          }
        }
      );
    } else {
      // For Android, use a simple prompt
      Alert.alert('Profile Photo', 'Select an option', [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handleChooseFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUser(u => ({ ...u, photo: result.assets[0].uri }));
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to use your camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUser(u => ({ ...u, photo: result.assets[0].uri }));
    }
  };

  const handleLogout = () => {
    setUser({ ...DUMMY_USER }); // Optionally reset profile
    Alert.alert('See you soon! 👋', 'You have been logged out.', [
      { text: 'OK', onPress: () => navigation.navigate('Login') }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileSection}>
        <View style={styles.photoRow}>
          <Image source={{ uri: user.photo }} style={styles.profilePhoto} />
          {editing && (
            <TouchableOpacity style={styles.editPhotoBtn} onPress={handlePickPhoto}>
              <Ionicons name="camera" size={20} color="#1976d2" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Info</Text>
        <View style={styles.inputGroup}>
          <Ionicons name="person" size={18} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={editing ? form.name : user.name}
            onChangeText={text => setForm(f => ({ ...f, name: text }))}
            editable={editing}
            placeholder="Name"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="mail" size={18} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={editing ? form.email : user.email}
            onChangeText={text => setForm(f => ({ ...f, email: text }))}
            editable={editing}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="call" size={18} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={editing ? form.contact : user.contact}
            onChangeText={text => setForm(f => ({ ...f, contact: text }))}
            editable={editing}
            placeholder="Contact"
            keyboardType="phone-pad"
          />
        </View>
        <TouchableOpacity
          style={[styles.editBtn, editing ? styles.saveBtn : styles.editProfileBtn]}
          onPress={editing ? handleSave : () => setEditing(true)}
          activeOpacity={0.85}
        >
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit Profile'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        {showPassword ? (
          <>
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed" size={18} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="New Password"
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed" size={18} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                secureTextEntry
              />
            </View>
            <View style={styles.securityBtnRow}>
              <TouchableOpacity style={[styles.editBtn, styles.saveBtn]} onPress={handleChangePassword}>
                <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.editBtnText}>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editBtn, styles.cancelBtn]} onPress={() => setShowPassword(false)}>
                <Ionicons name="close" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.editBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={[styles.editBtn, styles.editProfileBtn]} onPress={() => setShowPassword(true)}>
            <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Change Password</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Linked Accounts</Text>
        <View style={styles.linkedRow}>
          {user.linkedAccounts.map(acc => (
            <View key={acc} style={styles.linkedBadge}>
              <Ionicons name={acc === 'Parent' ? 'people' : acc === 'Student' ? 'school' : 'person'} size={16} color="#1976d2" style={{ marginRight: 4 }} />
              <Text style={styles.linkedText}>{acc}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 0,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  photoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#1976d2',
  },
  editPhotoBtn: {
    position: 'absolute',
    right: 0,
    bottom: 10,
    backgroundColor: '#e3eaf2',
    borderRadius: 16,
    padding: 6,
    elevation: 2,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 6,
  },
  profileEmail: {
    color: '#888',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    marginHorizontal: 12,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 6,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 1,
  },
  editProfileBtn: {
    backgroundColor: '#1976d2',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
  },
  cancelBtn: {
    backgroundColor: '#888',
    marginLeft: 8,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  securityBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  linkedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3eaf2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 8,
  },
  linkedText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutSection: {
    marginTop: 18,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
});

export default ProfileScreen; 