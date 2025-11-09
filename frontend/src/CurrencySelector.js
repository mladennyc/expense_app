import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { useCurrency } from './CurrencyProvider';

export default function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency();
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonText}>
          {currencies[currency]?.symbol || currency}
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
            <Text style={styles.modalTitle}>Select Currency</Text>
            <ScrollView>
              {Object.entries(currencies).map(([code, info]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.currencyItem,
                    currency === code && styles.currencyItemActive
                  ]}
                  onPress={() => {
                    setCurrency(code);
                    setShowModal(false);
                  }}
                >
                  <Text style={[
                    styles.currencyText,
                    currency === code && styles.currencyTextActive
                  ]}>
                    {info.symbol} - {info.name} ({code})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 10,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  currencyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currencyItemActive: {
    backgroundColor: '#e3f2fd',
  },
  currencyText: {
    fontSize: 16,
    color: '#333',
  },
  currencyTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

