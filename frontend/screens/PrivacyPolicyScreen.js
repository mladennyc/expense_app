import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLanguage } from '../src/LanguageProvider';

export default function PrivacyPolicyScreen({ navigation }) {
  const { t } = useLanguage();

  const openDocument = () => {
    // On web, try to open the markdown file
    if (Platform.OS === 'web') {
      window.open('/PRIVACY_POLICY.md', '_blank');
    } else {
      // On mobile, show a message or navigate to a web view
      alert('Please visit our website to view the full Privacy Policy document.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.privacyPolicy')}</Text>
        <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.text}>
            We collect the following information when you use our app:
          </Text>
          <Text style={styles.listItem}>• Email address (for account creation and login)</Text>
          <Text style={styles.listItem}>• Username (optional, if provided)</Text>
          <Text style={styles.listItem}>• Password (encrypted and stored securely)</Text>
          <Text style={styles.listItem}>• Expense data (amount, date, category, description)</Text>
          <Text style={styles.listItem}>• Name (for account identification)</Text>
          <Text style={styles.text}>
            All passwords are hashed using industry-standard encryption (bcrypt) and cannot be retrieved in plain text.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.text}>
            We use your information solely to:
          </Text>
          <Text style={styles.listItem}>• Provide expense tracking functionality</Text>
          <Text style={styles.listItem}>• Authenticate your account</Text>
          <Text style={styles.listItem}>• Send password reset emails (if requested)</Text>
          <Text style={styles.text}>
            We do not use your data for advertising, analytics, or any other commercial purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
          <Text style={styles.text}>
            Your data is stored on secure servers with industry-standard security measures:
          </Text>
          <Text style={styles.listItem}>• Passwords are encrypted using bcrypt</Text>
          <Text style={styles.listItem}>• Data is stored in encrypted databases</Text>
          <Text style={styles.listItem}>• All connections use HTTPS/SSL encryption</Text>
          <Text style={styles.text}>
            While we implement strong security measures, no system is 100% secure. We cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.text}>
            We do not share, sell, or rent your personal information to third parties. Your data is only accessible to you through your authenticated account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.text}>
            You have the right to:
          </Text>
          <Text style={styles.listItem}>• Access your data at any time</Text>
          <Text style={styles.listItem}>• Delete your account and all associated data</Text>
          <Text style={styles.listItem}>• Export your expense data</Text>
          <Text style={styles.listItem}>• Update or correct your information</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.text}>
            We retain your data for as long as your account is active. If you delete your account, all associated data will be permanently deleted from our servers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cookies and Tracking</Text>
          <Text style={styles.text}>
            We use authentication tokens (JWT) to maintain your login session. These tokens are stored locally on your device and are not used for tracking or advertising.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.text}>
            Our app is not intended for users under the age of 13. We do not knowingly collect information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Privacy Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date. Continued use of the app after changes constitutes acceptance of the new policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us.
          </Text>
        </View>

        <View style={styles.fullDocumentLink}>
          <Text style={styles.linkText} onPress={openDocument}>
            View Full Privacy Policy Document →
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginLeft: 16,
    marginBottom: 4,
  },
  fullDocumentLink: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

