import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Linking, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../src/LanguageProvider';
import { getSubscriptionStatus, getSubscriptionUsage, createCheckoutSession, applyPromoCode, cancelSubscription } from '../api';
import { colors } from '../src/colors';

export default function ManageSubscriptionScreen({ navigation }) {
  const { t } = useLanguage();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionUsage, setSubscriptionUsage] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const loadSubscriptionData = async () => {
    try {
      setLoadingSubscription(true);
      const [status, usage] = await Promise.all([
        getSubscriptionStatus(),
        getSubscriptionUsage()
      ]);
      setSubscriptionStatus(status);
      setSubscriptionUsage(usage);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSubscriptionData();
    }, [])
  );

  const handleUpgrade = async (planType) => {
    try {
      setLoading(true);
      const result = await createCheckoutSession(planType);
      // Open Stripe checkout URL
      const url = result.checkout_url;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert(
          'Checkout',
          'Complete your purchase in the browser. Your subscription will be activated automatically after payment.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Cannot open checkout URL');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    try {
      setLoading(true);
      setPromoMessage({ type: '', text: '' });
      await applyPromoCode(promoCode.trim());
      setPromoMessage({ type: 'success', text: 'Promo code applied successfully!' });
      setPromoCode('');
      await loadSubscriptionData();
    } catch (error) {
      setPromoMessage({ type: 'error', text: error.message || 'Failed to apply promo code' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    setShowCancelModal(false);
    try {
      setLoading(true);
      await cancelSubscription();
      setCancelSuccess(true);
      await loadSubscriptionData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getPlanDisplayName = (planType) => {
    switch (planType) {
      case 'unlimited':
        return t('subscription.planUnlimited');
      case 'extra_30':
        return t('subscription.planExtra30');
      case 'free':
        return t('subscription.planFree');
      case 'limited':
        return t('subscription.planLimited');
      default:
        return planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : t('subscription.planLimited');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {loadingSubscription ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('subscription.loading')}</Text>
          </View>
        ) : (
          <>
            {/* Current Subscription Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('subscription.currentSubscription')}</Text>
              
              <View style={styles.planCard}>
                <Text style={styles.planName}>
                  {subscriptionStatus ? getPlanDisplayName(subscriptionStatus.plan_type) : t('subscription.limited')}
                </Text>
                <Text style={styles.planStatus}>
                  {t('subscription.status')}: {subscriptionStatus?.status === 'active' ? t('subscription.active') : subscriptionStatus?.status || t('subscription.active')}
                </Text>
                
                {subscriptionStatus?.current_period_end && (
                  <Text style={styles.periodEnd}>
                    {t('subscription.renewsOn')}: {formatDate(subscriptionStatus.current_period_end)}
                  </Text>
                )}
              </View>

              {/* Usage Statistics */}
              {subscriptionUsage && (
                <View style={styles.usageSection}>
                  <Text style={styles.usageTitle}>{t('subscription.usageThisMonth')}</Text>
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>{t('subscription.scansUsed')}</Text>
                    <Text style={styles.usageValue}>{subscriptionUsage.scans_used}</Text>
                  </View>
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>{t('subscription.scansRemaining')}</Text>
                    <Text style={styles.usageValue}>
                      {subscriptionUsage.scans_remaining === null 
                        ? t('subscription.unlimited') 
                        : subscriptionUsage.scans_remaining}
                    </Text>
                  </View>
                  {subscriptionUsage.scan_limit && (
                    <View style={styles.usageRow}>
                      <Text style={styles.usageLabel}>{t('subscription.monthlyLimit')}</Text>
                      <Text style={styles.usageValue}>{subscriptionUsage.scan_limit}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Upgrade Options */}
            {subscriptionStatus?.plan_type !== 'unlimited' && subscriptionStatus?.plan_type !== 'free' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('subscription.upgradeOptions')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('subscription.getMoreScans')}
                </Text>
                
                {(subscriptionStatus?.plan_type === 'limited' || subscriptionStatus?.plan_type === 'extra_30' || !subscriptionStatus?.plan_type) && (
                  <TouchableOpacity
                    style={[styles.button, styles.upgradeButton, loading && styles.disabledButton]}
                    onPress={() => handleUpgrade('extra_30')}
                    disabled={loading}
                  >
                    <View style={styles.upgradeButtonContent}>
                      <Text style={styles.upgradeButtonTitle}>{t('subscription.buy30Scans')}</Text>
                      <Text style={styles.upgradeButtonPrice}>{t('subscription.price30Scans')}</Text>
                      <Text style={styles.upgradeButtonDescription}>
                        {t('subscription.description30Scans')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.button, styles.upgradeButton, styles.unlimitedButton, loading && styles.disabledButton]}
                  onPress={() => handleUpgrade('unlimited')}
                  disabled={loading}
                >
                  <View style={styles.upgradeButtonContent}>
                    <Text style={styles.upgradeButtonTitle}>{t('subscription.unlimitedMonthly')}</Text>
                    <Text style={styles.upgradeButtonPrice}>{t('subscription.priceUnlimited')}</Text>
                    <Text style={styles.upgradeButtonDescription}>
                      {t('subscription.descriptionUnlimited')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Promo Code Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('subscription.promoCode')}</Text>
              <Text style={styles.sectionDescription}>
                {t('subscription.enterPromoCode')}
              </Text>
              
              <View style={styles.promoInputRow}>
                <TextInput
                  style={[styles.input, styles.promoInput]}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder={t('subscription.enterPromoCodePlaceholder')}
                  autoCapitalize="characters"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.button, styles.promoButton, loading && styles.disabledButton]}
                  onPress={handleApplyPromoCode}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>{t('subscription.apply')}</Text>
                </TouchableOpacity>
              </View>
              
              {promoMessage.text ? (
                <Text style={[
                  styles.message,
                  promoMessage.type === 'success' ? styles.successMessage : styles.errorMessage
                ]}>
                  {promoMessage.text}
                </Text>
              ) : null}
            </View>

            {/* Cancel Subscription */}
            {subscriptionStatus?.plan_type === 'unlimited' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('subscription.manageSubscription')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('subscription.cancelDescription')}
                </Text>
                <TouchableOpacity
                  style={[styles.button, styles.cancelSubscriptionButton, loading && styles.disabledButton]}
                  onPress={handleCancelSubscription}
                  disabled={loading}
                >
                  <Text style={styles.cancelSubscriptionText}>{t('subscription.cancelSubscription')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('subscription.cancelConfirmTitle')}</Text>
            <Text style={styles.modalMessage}>
              {t('subscription.cancelConfirmMessage')}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmCancellation}
                disabled={loading}
              >
                <Text style={styles.modalButtonConfirmText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={cancelSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('subscription.cancelSuccess')}</Text>
            <Text style={styles.modalMessage}>
              {t('subscription.cancelSuccessMessage')}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => setCancelSuccess(false)}
            >
              <Text style={styles.modalButtonConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  planStatus: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  periodEnd: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  usageSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  usageLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    ...(Platform.OS === 'web' && {
      maxWidth: 400,
    }),
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unlimitedButton: {
    backgroundColor: colors.primary,
    marginTop: 12,
  },
  upgradeButtonContent: {
    alignItems: 'center',
    width: '100%',
  },
  upgradeButtonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  upgradeButtonPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  upgradeButtonDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  promoInput: {
    flex: 1,
  },
  promoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    minWidth: 80,
    marginTop: 0,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  cancelSubscriptionButton: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 16,
  },
  cancelSubscriptionText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonCancelText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: colors.error,
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});



