import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';
import { scanReceipt, createExpense, createExpensesBatch } from '../api';
import { CATEGORY_KEY_TO_NAME, CATEGORY_NAME_TO_KEY } from './AddExpenseScreen';

export default function ReceiptReviewScreen({ navigation, route }) {
  const { t, language } = useLanguage();
  const { imageUri, imageBase64 } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [receiptType, setReceiptType] = useState(null); // 'utility' or 'store'
  
  // For utility receipts (single entry)
  const [utilityFormData, setUtilityFormData] = useState({
    amount: '',
    date: '',
    merchant: '',
    category: '',
    description: '',
  });
  
  // For store receipts (itemized)
  const [storeData, setStoreData] = useState({
    date: '',
    merchant: '',
    items: [],
    tax: 0,
    subtotal: 0,
    total: 0,
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
        
        const type = data.receipt_type || 'utility';
        setReceiptType(type);
        setExtractedData(data);
        
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (type === 'store') {
          // Handle itemized store receipt
          const items = (data.items || []).map(item => ({
            id: Math.random().toString(36).substr(2, 9),
            amount: String(item.amount || 0),
            taxShare: '0',
            category: item.category ? (CATEGORY_NAME_TO_KEY[item.category] || '') : '',
            description: item.description || '',
          }));
          
          // Calculate tax distribution
          const tax = parseFloat(data.tax || 0);
          const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
          
          if (tax > 0 && subtotal > 0) {
            items.forEach(item => {
              const itemAmount = parseFloat(item.amount || 0);
              const taxShare = (itemAmount / subtotal) * tax;
              item.taxShare = taxShare.toFixed(2);
            });
          }
          
          setStoreData({
            date: data.date || todayString,
            merchant: data.merchant || '',
            items: items,
            tax: String(tax),
            subtotal: String(subtotal),
            total: String(data.total || subtotal + tax),
          });
        } else {
          // Handle utility receipt
          setUtilityFormData({
            amount: data.amount ? String(data.amount) : '',
            date: data.date || todayString,
            merchant: data.merchant || '',
            category: data.category ? (CATEGORY_NAME_TO_KEY[data.category] || '') : '',
            description: data.description || '',
          });
        }
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

  const calculateTaxDistribution = (items, tax) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    if (tax > 0 && subtotal > 0) {
      return items.map(item => {
        const itemAmount = parseFloat(item.amount || 0);
        const taxShare = (itemAmount / subtotal) * tax;
        return { ...item, taxShare: taxShare.toFixed(2) };
      });
    }
    return items.map(item => ({ ...item, taxShare: '0' }));
  };

  const updateStoreItem = (itemId, field, value) => {
    setStoreData(prev => {
      const newItems = prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      );
      
      // Recalculate tax distribution if amount or tax changed
      if (field === 'amount' || field === 'tax') {
        const tax = parseFloat(field === 'tax' ? value : prev.tax || 0);
        const updatedItems = calculateTaxDistribution(newItems, tax);
        const subtotal = updatedItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const total = subtotal + tax;
        
        return {
          ...prev,
          items: updatedItems,
          tax: field === 'tax' ? String(tax) : prev.tax,
          subtotal: String(subtotal),
          total: String(total),
        };
      }
      
      return { ...prev, items: newItems };
    });
  };

  const addStoreItem = () => {
    setStoreData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Math.random().toString(36).substr(2, 9),
          amount: '0',
          taxShare: '0',
          category: '',
          description: '',
        },
      ],
    }));
  };

  const removeStoreItem = (itemId) => {
    setStoreData(prev => {
      const newItems = prev.items.filter(item => item.id !== itemId);
      const tax = parseFloat(prev.tax || 0);
      const updatedItems = calculateTaxDistribution(newItems, tax);
      const subtotal = updatedItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const total = subtotal + tax;
      
      return {
        ...prev,
        items: updatedItems,
        subtotal: String(subtotal),
        total: String(total),
      };
    });
  };

  const handleSaveUtility = async () => {
    if (!utilityFormData.amount || !utilityFormData.date) {
      Alert.alert(t('receipt.error'), 'Amount and date are required');
      return;
    }
    
    try {
      setSaving(true);
      await createExpense({
        amount: parseFloat(utilityFormData.amount),
        date: utilityFormData.date,
        category: utilityFormData.category ? CATEGORY_KEY_TO_NAME[utilityFormData.category] : null,
        description: utilityFormData.description || utilityFormData.merchant || null,
      });
      
      Alert.alert(t('receipt.success'), 'Expense created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('receipt.error'), error.message || 'Failed to create expense');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStore = async () => {
    if (storeData.items.length === 0) {
      Alert.alert(t('receipt.error'), 'At least one item is required');
      return;
    }
    
    if (!storeData.date) {
      Alert.alert(t('receipt.error'), 'Date is required');
      return;
    }
    
    try {
      setSaving(true);
      const expenses = storeData.items.map(item => {
        const amount = parseFloat(item.amount || 0) + parseFloat(item.taxShare || 0);
        return {
          amount: amount,
          date: storeData.date,
          category: item.category ? CATEGORY_KEY_TO_NAME[item.category] : null,
          description: item.description || null,
        };
      });
      
      await createExpensesBatch(expenses);
      
      Alert.alert(t('receipt.success'), `${expenses.length} expenses created successfully`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert(t('receipt.error'), error.message || 'Failed to create expenses');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
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

  const renderUtilityReceipt = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{t('receipt.reviewData')}</Text>
      
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('label.amount')}</Text>
        <TextInput
          style={styles.input}
          value={utilityFormData.amount}
          onChangeText={(text) => setUtilityFormData({ ...utilityFormData, amount: text })}
          keyboardType="numeric"
          placeholder="0.00"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('label.date')}</Text>
        <TextInput
          style={styles.input}
          value={formatDate(utilityFormData.date)}
          onChangeText={(text) => setUtilityFormData({ ...utilityFormData, date: text })}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t('label.merchant')}</Text>
        <TextInput
          style={styles.input}
          value={utilityFormData.merchant}
          onChangeText={(text) => setUtilityFormData({ ...utilityFormData, merchant: text })}
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
                utilityFormData.category === key && styles.categoryChipSelected
              ]}
              onPress={() => setUtilityFormData({ ...utilityFormData, category: key })}
            >
              <Text style={[
                styles.categoryChipText,
                utilityFormData.category === key && styles.categoryChipTextSelected
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
          value={utilityFormData.description}
          onChangeText={(text) => setUtilityFormData({ ...utilityFormData, description: text })}
          placeholder={t('receipt.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.disabledButton]} 
        onPress={handleSaveUtility}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? t('receipt.saving') || 'Saving...' : t('receipt.useThisData')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStoreReceipt = () => {
    const hasTax = parseFloat(storeData.tax || 0) > 0;
    
    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>{t('receipt.reviewData')}</Text>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('label.date')}</Text>
          <TextInput
            style={styles.input}
            value={formatDate(storeData.date)}
            onChangeText={(text) => setStoreData({ ...storeData, date: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t('label.merchant')}</Text>
          <TextInput
            style={styles.input}
            value={storeData.merchant}
            onChangeText={(text) => setStoreData({ ...storeData, merchant: text })}
            placeholder={t('receipt.merchantPlaceholder')}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Items</Text>
          {storeData.items.map((item, index) => {
            const amount = parseFloat(item.amount || 0);
            const taxShare = parseFloat(item.taxShare || 0);
            const total = amount + taxShare;
            
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemRowContent}>
                  {hasTax ? (
                    <View style={styles.amountRow}>
                      <TextInput
                        style={[styles.compactInput, styles.amountInput]}
                        value={item.amount}
                        onChangeText={(text) => updateStoreItem(item.id, 'amount', text)}
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                      <Text style={styles.plus}>+</Text>
                      <TextInput
                        style={[styles.compactInput, styles.taxInput]}
                        value={item.taxShare}
                        onChangeText={(text) => {
                          // Update tax share manually, then recalculate
                          const newItems = storeData.items.map(i =>
                            i.id === item.id ? { ...i, taxShare: text } : i
                          );
                          const subtotal = newItems.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
                          const newTax = parseFloat(text || 0) * (subtotal / (parseFloat(item.amount || 0) || 1));
                          setStoreData(prev => ({
                            ...prev,
                            tax: String(newTax),
                            items: newItems,
                          }));
                        }}
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                      <Text style={styles.equals}>=</Text>
                      <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.compactInput, styles.amountInput]}
                      value={item.amount}
                      onChangeText={(text) => updateStoreItem(item.id, 'amount', text)}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  )}
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollCompact}>
                    {categoryKeys.map((key) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.categoryChipCompact,
                          item.category === key && styles.categoryChipSelected
                        ]}
                        onPress={() => updateStoreItem(item.id, 'category', key)}
                      >
                        <Text style={[
                          styles.categoryChipTextCompact,
                          item.category === key && styles.categoryChipTextSelected
                        ]}>
                          {t(key)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <TextInput
                    style={[styles.compactInput, styles.descriptionInput]}
                    value={item.description}
                    onChangeText={(text) => updateStoreItem(item.id, 'description', text)}
                    placeholder="Description"
                  />
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeStoreItem(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          
          <TouchableOpacity style={styles.addButton} onPress={addStoreItem}>
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {hasTax && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tax</Text>
            <TextInput
              style={styles.input}
              value={storeData.tax}
              onChangeText={(text) => {
                const tax = parseFloat(text || 0);
                const updatedItems = calculateTaxDistribution(storeData.items, tax);
                const subtotal = updatedItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                const total = subtotal + tax;
                setStoreData(prev => ({
                  ...prev,
                  tax: String(tax),
                  items: updatedItems,
                  subtotal: String(subtotal),
                  total: String(total),
                }));
              }}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Subtotal: ${parseFloat(storeData.subtotal || 0).toFixed(2)}
            {hasTax && ` | Tax: $${parseFloat(storeData.tax || 0).toFixed(2)}`}
            {' | Total: $' + parseFloat(storeData.total || 0).toFixed(2)} ✓
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSaveStore}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('receipt.saving') || 'Saving...' : 'Confirm & Create Entries'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
        receiptType === 'store' ? renderStoreReceipt() : renderUtilityReceipt()
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
  disabledButton: {
    opacity: 0.6,
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
  // Compact itemized receipt styles
  itemRow: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  compactInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minWidth: 60,
  },
  amountInput: {
    width: 70,
  },
  taxInput: {
    width: 50,
  },
  plus: {
    marginHorizontal: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  equals: {
    marginHorizontal: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 60,
  },
  categoryScrollCompact: {
    marginHorizontal: 8,
    maxWidth: 150,
  },
  categoryChipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 4,
  },
  categoryChipTextCompact: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  descriptionInput: {
    flex: 1,
    minWidth: 100,
    marginHorizontal: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
