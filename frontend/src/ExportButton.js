import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Modal, View, Alert, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from './LanguageProvider';
import { exportData } from '../api';

export default function ExportButton() {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  
  // Set start date to first day of current month, end date to today
  const getFirstDayOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };
  
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(new Date());
  const [formats, setFormats] = useState({ csv: true });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const handleStartDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'web') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(0, 0, 0, 0);
      setStartDate(normalizedDate);
    }
  };
  
  const handleEndDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'web') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(0, 0, 0, 0);
      setEndDate(normalizedDate);
    }
  };

  const handleExport = async () => {
    if (startDate > endDate) {
      Alert.alert(t('export.error') || 'Error', t('export.invalidDateRange') || 'Start date must be before end date');
      return;
    }
    
    setExporting(true);
    try {
      const result = await exportData(startDate, endDate, 'csv');
      const results = [result.filename];
      
      Alert.alert(
        t('export.success') || 'Success',
        t('export.downloadStarted') || `Export started. Files: ${results.join(', ')}`
      );
      setShowModal(false);
    } catch (error) {
      Alert.alert(t('export.error') || 'Error', error.message || t('export.failed') || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonText}>
          {Platform.OS === 'web' && Dimensions.get('window').width < 768 
            ? '📥' 
            : `📥 ${t('export.exportData') || 'Export'}`}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('export.title') || 'Export Data'}</Text>
            
            <View style={styles.section}>
              <Text style={styles.label}>{t('export.dateRange') || 'Date Range'}</Text>
              
              {/* Start Date */}
              <View style={styles.inputContainer}>
                <Text style={styles.dateLabel}>{t('export.startDate') || 'Start Date'}</Text>
                {Platform.OS === 'web' ? (
                  <View style={{ width: '100%' }}>
                    {React.createElement('input', {
                      type: 'date',
                      value: formatDate(startDate),
                      onChange: (e) => {
                        const dateString = e.target.value;
                        if (dateString) {
                          const [year, month, day] = dateString.split('-').map(Number);
                          const newDate = new Date(year, month - 1, day);
                          newDate.setHours(0, 0, 0, 0);
                          setStartDate(newDate);
                        }
                      },
                      style: styles.webDateInput,
                    })}
                  </View>
                ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={handleStartDateChange}
                    />
                  )}
                </>
                )}
              </View>
              
              {/* End Date */}
              <View style={styles.inputContainer}>
                <Text style={styles.dateLabel}>{t('export.endDate') || 'End Date'}</Text>
                {Platform.OS === 'web' ? (
                  <View style={{ width: '100%' }}>
                    {React.createElement('input', {
                      type: 'date',
                      value: formatDate(endDate),
                      onChange: (e) => {
                        const dateString = e.target.value;
                        if (dateString) {
                          const [year, month, day] = dateString.split('-').map(Number);
                          const newDate = new Date(year, month - 1, day);
                          newDate.setHours(0, 0, 0, 0);
                          setEndDate(newDate);
                        }
                      },
                      style: styles.webDateInput,
                    })}
                  </View>
                ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={handleEndDateChange}
                    />
                  )}
                </>
                )}
              </View>
            </View>
            
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('button.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonExport, exporting && styles.disabledButton]}
                onPress={handleExport}
                disabled={exporting}
              >
                <Text style={styles.modalButtonText}>
                  {exporting ? (t('export.exporting') || 'Exporting...') : (t('export.export') || 'Export')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'scroll',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E293B',
  },
  section: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 8,
  },
  webDateInput: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: '1px solid #ddd',
    borderRadius: 8,
    boxSizing: 'border-box',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  formatButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  formatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  formatButtonTextActive: {
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#ddd',
  },
  modalButtonExport: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

