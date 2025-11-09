import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../src/AuthContext';
import { useLanguage } from '../src/LanguageProvider';

export default function LoginScreen({ navigation }) {
  const { login, signup } = useAuth();
  const { t } = useLanguage();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Don't clear error on mount - let user see it if there was an error

  const handleSubmit = async () => {
    // For login, email/username is required
    // For signup, email and name are required
    if (!isSignup && !email) {
      setError('Please enter your email or username');
      return;
    }

    if (isSignup && !email) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (isSignup && !name) {
      setError('Please enter your name');
      return;
    }

    if (isSignup && !acceptedTerms) {
      setError(t('error.acceptTerms'));
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate username if provided
    if (isSignup && username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        setError('Username can only contain letters, numbers, underscores, and hyphens');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      if (isSignup) {
        await signup(email, password, name, username.trim() || null);
      } else {
        // For login, use email field (which can contain email or username)
        await login(email, password);
      }
      // Navigation will happen automatically via AuthProvider
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isSignup ? t('auth.signup') : t('auth.login')}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.clearErrorButton}
              onPress={() => setError('')}
            >
              <Text style={styles.clearErrorText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isSignup && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={Boolean(!loading)}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {isSignup ? t('auth.email') : t('auth.loginIdentifier')}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={isSignup ? t('auth.emailPlaceholder') : t('auth.loginIdentifierPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType={isSignup ? "email-address" : "default"}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {isSignup && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.username')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.usernamePlaceholder')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={Boolean(!loading)}
            />
          </View>
        )}

        {isSignup && (
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              disabled={loading}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t('auth.acceptTerms1')}{' '}
                <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsOfService')}>
                  {t('auth.termsOfService')}
                </Text>
                {' '}{t('auth.and')}{' '}
                <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                  {t('auth.privacyPolicy')}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            editable={Boolean(!loading)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={Boolean(loading)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSignup ? t('auth.signup') : t('auth.login')}
            </Text>
          )}
        </TouchableOpacity>

        {!isSignup && (
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={Boolean(loading)}
          >
            <Text style={styles.forgotPasswordText}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setIsSignup(!isSignup);
            setError('');
            setUsername(''); // Clear username when switching
            setAcceptedTerms(false); // Clear terms acceptance when switching
          }}
          disabled={Boolean(loading)}
        >
          <Text style={styles.switchButtonText}>
            {isSignup
              ? t('auth.haveAccount')
              : t('auth.noAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      minHeight: '100%',
    }),
  },
  content: {
    padding: 24,
    paddingTop: 60,
    ...(Platform.OS === 'web' && {
      width: '100%',
      maxWidth: 440,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 40,
      paddingTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      fontSize: 28,
      marginBottom: 32,
      color: '#1E293B',
    }),
  },
  inputContainer: {
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      marginBottom: 20,
    }),
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    ...(Platform.OS === 'web' && {
      fontSize: 14,
      marginBottom: 10,
      color: '#1E293B',
    }),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    ...(Platform.OS === 'web' && {
      padding: 14,
      fontSize: 16,
      borderColor: '#E2E8F0',
      borderRadius: 8,
      transition: 'border-color 0.2s',
      ':focus': {
        borderColor: '#10B981',
        outline: 'none',
      },
    }),
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    flex: 1,
  },
  clearErrorButton: {
    marginLeft: 10,
    padding: 4,
  },
  clearErrorText: {
    color: '#721c24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...(Platform.OS === 'web' && {
      alignSelf: 'center',
      minWidth: 200,
      padding: 14,
      marginTop: 8,
      marginBottom: 16,
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      ':hover': {
        backgroundColor: '#059669',
      },
      ':active': {
        transform: 'scale(0.98)',
      },
    }),
  },
  disabledButton: {
    opacity: 0.6,
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
      ':hover': {
        backgroundColor: '#10B981',
      },
    }),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    ...(Platform.OS === 'web' && {
      fontSize: 16,
    }),
  },
  forgotPasswordButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  switchButton: {
    padding: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

