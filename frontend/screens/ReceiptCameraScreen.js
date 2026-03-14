import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';
import { getSubscriptionUsage } from '../api';

function checkLimitReached(subscriptionUsage) {
  return subscriptionUsage && subscriptionUsage.scan_limit !== null && subscriptionUsage.scans_remaining !== null && subscriptionUsage.scans_remaining <= 0;
}

export default function ReceiptCameraScreen({ navigation }) {
  const { t } = useLanguage();
  const [capturedImage, setCapturedImage] = useState(null);
  const [subscriptionUsage, setSubscriptionUsage] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null); // null = loading, false = denied, true = granted

  useEffect(() => {
    loadSubscriptionUsage();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ImagePicker.getCameraPermissionsAsync().then(({ status }) => setCameraPermission(status === 'granted'));
    }
  }, []);

  const loadSubscriptionUsage = async () => {
    try {
      const usage = await getSubscriptionUsage();
      setSubscriptionUsage(usage);
    } catch (error) {
      console.error('Error loading subscription usage:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const takePhotoWithCamera = async () => {
    if (checkLimitReached(subscriptionUsage)) {
      Alert.alert(
        t('receipt.limitReached'),
        t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit),
        [
          { text: t('button.cancel'), style: 'cancel' },
          { text: t('receipt.upgradeNow'), onPress: () => navigation.navigate('ManageSubscription') },
        ]
      );
      return;
    }
    const granted = cameraPermission || (await requestCameraPermission());
    if (!granted) {
      Alert.alert(t('receipt.error'), t('receipt.cameraPermissionDenied'));
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedImage({ uri: asset.uri, base64: asset.base64 });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('receipt.error'), error.message || t('receipt.captureError'));
    }
  };

  const pickFromGallery = async () => {
    if (checkLimitReached(subscriptionUsage)) {
      Alert.alert(
        t('receipt.limitReached'),
        t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit),
        [
          { text: t('button.cancel'), style: 'cancel' },
          { text: t('receipt.upgradeNow'), onPress: () => navigation.navigate('ManageSubscription') },
        ]
      );
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('receipt.error'), t('receipt.galleryPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        let imageUri = asset.uri;
        if (Platform.OS === 'web' && asset.uri && !asset.base64) {
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setCapturedImage({
                uri: reader.result,
                base64: reader.result.split(',')[1],
              });
            };
            reader.readAsDataURL(blob);
            return;
          } catch (e) {
            console.error('Error converting image to base64:', e);
          }
        }
        setCapturedImage({ uri: imageUri, base64: asset.base64 });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('receipt.error'), error.message || t('receipt.galleryError'));
    }
  };

  const processReceipt = () => {
    if (capturedImage) {
      navigation.navigate('ReceiptReview', { imageUri: capturedImage.uri, imageBase64: capturedImage.base64 });
    }
  };

  const getUsageDisplay = () => {
    if (!subscriptionUsage) return null;
    if (subscriptionUsage.scans_remaining === null) return 'Unlimited';
    return `${subscriptionUsage.scans_used}/${subscriptionUsage.scan_limit}`;
  };

  const retakePhoto = () => setCapturedImage(null);

  const isLimitReached = checkLimitReached(subscriptionUsage);

  // Preview (same for web and native once we have an image)
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>{t('receipt.preview')}</Text>
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={retakePhoto}>
              <Text style={styles.buttonText}>{t('receipt.retake')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.processButton]} onPress={processReceipt}>
              <Text style={styles.buttonText}>{t('receipt.process')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Web: only gallery
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webContainer}>
          <Text style={styles.webTitle}>{t('receipt.selectReceiptPhoto')}</Text>
          {subscriptionUsage && (
            <View style={styles.usageBadgeWeb}>
              <Text style={styles.usageTextWeb}>Scans: {getUsageDisplay()}</Text>
            </View>
          )}
          {isLimitReached ? (
            <View style={styles.limitMessageContainer}>
              <Text style={styles.limitMessageText}>
                {t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit)}
              </Text>
              <TouchableOpacity style={[styles.button, styles.upgradeButton]} onPress={() => navigation.navigate('ManageSubscription')}>
                <Text style={styles.buttonText}>{t('receipt.upgradeNow')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
              <Text style={styles.buttonText}>{t('receipt.pickFromGallery')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Native: Take Photo or Pick from Gallery
  if (cameraPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('receipt.requestingPermission')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.choiceContainer}>
        <Text style={styles.choiceTitle}>{t('receipt.selectReceiptPhoto')}</Text>
        {subscriptionUsage && (
          <View style={styles.usageBadgeWeb}>
            <Text style={styles.usageTextWeb}>Scans: {getUsageDisplay()}</Text>
          </View>
        )}
        {isLimitReached ? (
          <View style={styles.limitMessageContainer}>
            <Text style={styles.limitMessageText}>
              {t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit)}
            </Text>
            <TouchableOpacity style={[styles.button, styles.upgradeButton]} onPress={() => navigation.navigate('ManageSubscription')}>
              <Text style={styles.buttonText}>{t('receipt.upgradeNow')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={takePhotoWithCamera}>
              <Text style={styles.buttonText}>📷 {t('receipt.scanReceipt')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
              <Text style={styles.buttonText}>{t('receipt.pickFromGallery')}</Text>
            </TouchableOpacity>
            {!cameraPermission && (
              <Text style={styles.hintText}>{t('receipt.cameraPermissionDenied')}</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  choiceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryButton: {
    marginBottom: 16,
  },
  hintText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: '60%',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  retakeButton: {
    backgroundColor: colors.textSecondary,
  },
  processButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: colors.textPrimary,
    marginTop: 10,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  usageBadgeWeb: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  usageTextWeb: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  limitMessageContainer: {
    backgroundColor: colors.error + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  limitMessageText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    marginTop: 0,
  },
});
