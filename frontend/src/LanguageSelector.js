import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from './LanguageProvider';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, language === 'en' && styles.buttonActive]}
        onPress={() => setLanguage('en')}
      >
        <Text style={[styles.buttonText, language === 'en' && styles.buttonTextActive]}>
          EN
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, language === 'sr' && styles.buttonActive]}
        onPress={() => setLanguage('sr')}
      >
        <Text style={[styles.buttonText, language === 'sr' && styles.buttonTextActive]}>
          SR
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginRight: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextActive: {
    color: '#fff',
  },
});

