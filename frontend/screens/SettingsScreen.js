import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useLanguage } from '../src/LanguageProvider';
import { useAuth } from '../src/AuthContext';
import { changePassword, deleteAccount } from '../api';
import { colors } from '../src/colors';

export default function SettingsScreen({ navigation }) {
  const { t } = useLanguage();
  const { user, deleteAccount: deleteAccountFromContext } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.fillAllFields') });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordTooShort') });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordsDoNotMatch') });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.newPasswordSame') });
      return;
    }

    try {
      setLoading(true);
      setPasswordMessage({ type: '', text: '' });
      await changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: t('settings.passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      let errorMessage = t('settings.failedToChangePassword');
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = t('settings.networkError');
      } else if (error.message.includes('Invalid password')) {
        errorMessage = t('settings.invalidCurrentPassword');
      } else if (error.message) {
        errorMessage = error.message;
      }
      setPasswordMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('auth.deleteAccount'),
      t('auth.confirmDeleteAccount'),
      [
        {
          text: t('button.cancel'),
          style: 'cancel',
        },
        {
          text: t('button.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAccountFromContext();
              // User will be logged out automatically
            } catch (error) {
              Alert.alert(
                t('auth.error'),
                error.message || t('auth.failedToDeleteAccount')
              );
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.accountInfo')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.name')}</Text>
            <Text style={styles.infoValue}>{user?.name || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.email')}</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>
          {user?.username && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('settings.username')}</Text>
              <Text style={styles.infoValue}>@{user.username}</Text>
            </View>
          )}
        </View>

        {/* Change Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.changePassword')}</Text>
          
          <Text style={styles.label}>{t('settings.currentPassword')}</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('settings.currentPasswordPlaceholder')}
            secureTextEntry={true}
            autoCapitalize="none"
            editable={Boolean(!loading)}
          />

          <Text style={styles.label}>{t('settings.newPassword')}</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('settings.newPasswordPlaceholder')}
            secureTextEntry={true}
            autoCapitalize="none"
            editable={Boolean(!loading)}
          />

          <Text style={styles.label}>{t('settings.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('settings.confirmPasswordPlaceholder')}
            secureTextEntry={true}
            autoCapitalize="none"
            editable={Boolean(!loading)}
          />

          {passwordMessage.text ? (
            <Text style={[
              styles.message,
              passwordMessage.type === 'success' ? styles.successMessage : styles.errorMessage
            ]}>
              {passwordMessage.text}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, styles.changePasswordButton, loading && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={Boolean(loading)}
          >
            <Text style={styles.buttonText}>{t('settings.changePassword')}</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dangerZone')}</Text>
          <Text style={styles.dangerText}>{t('settings.deleteAccountWarning')}</Text>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton, loading && styles.disabledButton]}
            onPress={handleDeleteAccount}
            disabled={Boolean(loading)}
          >
            <Text style={styles.deleteButtonText}>{t('auth.deleteAccount')}</Text>
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
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
  message: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  successMessage: {
    backgroundColor: colors.success + '20',
    color: colors.success,
  },
  errorMessage: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    ...(Platform.OS === 'web' && {
      maxWidth: 300,
      alignSelf: 'flex-start',
      padding: 14,
    }),
  },
  changePasswordButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  dangerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
});

