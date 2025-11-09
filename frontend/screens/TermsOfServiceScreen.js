import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { useLanguage } from '../src/LanguageProvider';

export default function TermsOfServiceScreen({ navigation }) {
  const { t } = useLanguage();

  const openDocument = () => {
    // On web, try to open the markdown file
    if (Platform.OS === 'web') {
      window.open('/TERMS_OF_SERVICE.md', '_blank');
    } else {
      // On mobile, show a message or navigate to a web view
      alert('Please visit our website to view the full Terms of Service document.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.termsOfService')}</Text>
        <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using this Expense App, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.text}>
            The Expense App is a web and mobile application that allows users to track and manage their personal expenses. The Service includes features for recording expenses, categorizing transactions, viewing statistics, and generating reports.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Account</Text>
          <Text style={styles.text}>
            You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must be at least 13 years old to use this Service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Use License</Text>
          <Text style={styles.text}>
            Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Text>
          <Text style={styles.listItem}>• Modify or copy the materials</Text>
          <Text style={styles.listItem}>• Use the materials for any commercial purpose</Text>
          <Text style={styles.listItem}>• Attempt to reverse engineer any software</Text>
          <Text style={styles.listItem}>• Remove any copyright or proprietary notations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Conduct</Text>
          <Text style={styles.text}>
            You agree not to use the Service for any illegal purpose, transmit any viruses or harmful code, attempt to gain unauthorized access, interfere with the Service, or harass other users.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data and Privacy</Text>
          <Text style={styles.text}>
            Your data is stored securely on our servers. We do not share your personal information with third parties without your consent. Please review our Privacy Policy for detailed information about data collection and use. You retain ownership of your data and can delete it at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.text}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICE.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.text}>
            You may terminate your account at any time by deleting your account through the Service. We may terminate or suspend your account immediately, without prior notice, if you breach these Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.text}>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice. By continuing to use the Service after changes become effective, you agree to be bound by the revised terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact</Text>
          <Text style={styles.text}>
            If you have any questions about these Terms of Service, please contact us.
          </Text>
        </View>

        <View style={styles.fullDocumentLink}>
          <Text style={styles.linkText} onPress={openDocument}>
            View Full Terms of Service Document →
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

