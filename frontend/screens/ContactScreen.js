import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useLanguage } from '../src/LanguageProvider';
import { useAuth } from '../src/AuthContext';
import { colors } from '../src/colors';

const FORMPREE_FORM_ID = 'mdkrqyya';
const FORMPREE_URL = `https://formspree.io/f/${FORMPREE_FORM_ID}`;

export default function ContactScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear error message when user starts typing
  useEffect(() => {
    if (errorMessage && (subject || message)) {
      setErrorMessage('');
    }
  }, [subject, message, errorMessage]);

  const handleSubmit = async () => {
    // Clear previous messages
    setIsSuccess(false);
    setErrorMessage('');

    // Validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage(t('contact.fillAllFields'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage(t('contact.invalidEmail'));
      return;
    }

    try {
      setLoading(true);

      // Send to Formspree
      const response = await fetch(FORMPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          _replyto: email.trim(), // So Formspree knows where to send reply
        }),
      });

      if (response.ok) {
        // Show success state - replace form
        setIsSuccess(true);
        // Clear form
        setSubject('');
        setMessage('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('contact.failedToSend'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage(error.message || t('contact.failedToSend'));
    } finally {
      setLoading(false);
    }
  };

  // Success State - Replace entire form
  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>{t('contact.success')}</Text>
            <Text style={styles.successMessage}>{t('contact.messageSent')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeButtonText}>{t('button.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Form State
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.contactUs')}</Text>
          <Text style={styles.description}>{t('contact.description')}</Text>

          {/* Error Message - Inline */}
          {errorMessage ? (
            <View style={styles.errorMessage}>
              <Text style={styles.errorText}>✕ {errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{t('contact.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('contact.namePlaceholder')}
            editable={!loading}
          />

          <Text style={styles.label}>{t('contact.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('contact.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>{t('contact.subject')}</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={(text) => {
              setSubject(text);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder={t('contact.subjectPlaceholder')}
            editable={!loading}
          />

          <Text style={styles.label}>{t('contact.message')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder={t('contact.messagePlaceholder')}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('contact.sendMessage')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      marginHorizontal: 'auto',
      width: '100%',
      padding: 24,
    }),
  },
  section: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: colors.textPrimary,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Success State Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  successContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: '#28a745',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 120,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Error Message Styles (Inline)
  errorMessage: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },
});
