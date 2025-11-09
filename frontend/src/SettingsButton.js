import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SettingsButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        try {
          navigation.navigate('Settings');
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }}
    >
      <Text style={styles.buttonText}>⚙️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      ':hover': {
        opacity: 0.7,
      },
    }),
  },
  buttonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '500',
    ...(Platform.OS === 'web' && {
      fontSize: 14,
    }),
  },
});

