import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';
import { scanReceipt } from '../api';
import { CATEGORY_KEY_TO_NAME, CATEGORY_NAME_TO_KEY } from './AddExpenseScreen';

export default function ReceiptReviewScreen({ navigation, route }) {
  const { t, language } = useLanguage();
  const { imageUri, imageBase64 } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    merchant: '',
    category: '',
    description: '',
  });

  useEffect(() => {
    if (imageBase64) {
      processReceipt();
    }
  }, [imageBase64]);

  const processReceipt = async () => {
    try {
      setLoading(true);
      console.log('Starting receipt scan...');
      const result = await scanReceipt(imageBase64, language);
      console.log('Receipt scan result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        const data = result.data;
        console.log('Extracted data:', data);
        
        // Even if some fields are missing, show what we have
        setExtractedData(data);
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        setFormData({
          amount: data.amount ? String(data.amount) : '',
          date: data.date || todayString,
          merchant: data.merchant || '',
          category: data.category ? (CATEGORY_NAME_TO_KEY[data.category] || '') : '',
          description: data.description || '',
        });
      } else {
        console.error('Scan failed or no data:', result);
        Alert.alert(t('receipt.error'), result.detail || t('receipt.extractionFailed'));
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert(
        t('receipt.error'),
        error.message || t('receipt.processingError')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Navigate back to Add Expense with pre-filled data
    navigation.navigate('AddExpense', {
      prefillData: {
        amount: formData.amount,
        date: formData.date,
        category: formData.category,
        description: formData.description || formData.merchant,
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Try to parse and format
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  };

  const categoryKeys = Object.keys(CATEGORY_KEY_TO_NAME);

  return (
    <ScrollView style={styles.container}>
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.receiptImage} />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('receipt.processing')}</Text>
        </View>
      ) : extractedData ? (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>{t('receipt.reviewData')}</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('label.amount')}</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('label.date')}</Text>
            <TextInput
              style={styles.input}
              value={formatDate(formData.date)}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('label.merchant')}</Text>
            <TextInput
              style={styles.input}
              value={formData.merchant}
              onChangeText={(text) => setFormData({ ...formData, merchant: text })}
              placeholder={t('receipt.merchantPlaceholder')}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('label.category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categoryKeys.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    formData.category === key && styles.categoryChipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, category: key })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.category === key && styles.categoryChipTextSelected
                  ]}>
                    {t(key)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t('label.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder={t('receipt.descriptionPlaceholder')}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('receipt.useThisData')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('receipt.noData')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={processReceipt}>
            <Text style={styles.retryButtonText}>{t('receipt.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

