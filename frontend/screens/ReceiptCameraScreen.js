import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';
import { getSubscriptionUsage } from '../api';

export default function ReceiptCameraScreen({ navigation }) {
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [subscriptionUsage, setSubscriptionUsage] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadSubscriptionUsage();
  }, []);

  const loadSubscriptionUsage = async () => {
    try {
      const usage = await getSubscriptionUsage();
      setSubscriptionUsage(usage);
    } catch (error) {
      console.error('Error loading subscription usage:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) {
      console.error('Camera ref is null');
      Alert.alert(t('receipt.error'), 'Camera not ready');
      return;
    }
    try {
      setProcessing(true);
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
      console.log('Picture taken:', photo);
      setCapturedImage(photo);
      setProcessing(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('receipt.error'), error.message || t('receipt.captureError'));
      setProcessing(false);
    }
  };

  const pickFromGallery = async () => {
    // Check scan limit before allowing gallery pick
    if (subscriptionUsage && subscriptionUsage.scan_limit !== null && subscriptionUsage.scans_remaining !== null && subscriptionUsage.scans_remaining <= 0) {
      Alert.alert(
        t('receipt.limitReached'),
        t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit),
        [
          { text: t('button.cancel'), style: 'cancel' },
          { 
            text: t('receipt.upgradeNow'), 
            onPress: () => navigation.navigate('ManageSubscription')
          }
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

      console.log('Image picker result:', JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Setting captured image:', { uri: asset.uri, hasBase64: !!asset.base64 });
        
        // On web, convert blob URL to data URL if needed
        let imageUri = asset.uri;
        if (Platform.OS === 'web' && asset.uri && !asset.base64) {
          // Try to get base64 from the image
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setCapturedImage({
                uri: reader.result,
                base64: reader.result.split(',')[1], // Remove data:image/... prefix
              });
            };
            reader.readAsDataURL(blob);
            return; // Exit early, will set state in callback
          } catch (e) {
            console.error('Error converting image to base64:', e);
          }
        }
        
        setCapturedImage({
          uri: imageUri,
          base64: asset.base64,
        });
      } else {
        console.log('Image picker was canceled or no assets');
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
    if (subscriptionUsage.scans_remaining === null) {
      return 'Unlimited';
    }
    return `${subscriptionUsage.scans_used}/${subscriptionUsage.scan_limit}`;
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // On web, skip camera permission checks - go straight to gallery picker
  if (Platform.OS === 'web') {
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
    const isLimitReached = subscriptionUsage && subscriptionUsage.scan_limit !== null && subscriptionUsage.scans_remaining !== null && subscriptionUsage.scans_remaining <= 0;
    
    return (
      <View style={styles.container}>
        <View style={styles.webContainer}>
          <Text style={styles.webTitle}>{t('receipt.selectReceiptPhoto')}</Text>
          {subscriptionUsage && (
            <View style={styles.usageBadgeWeb}>
              <Text style={styles.usageTextWeb}>
                Scans: {getUsageDisplay()}
              </Text>
            </View>
          )}
          {isLimitReached ? (
            <View style={styles.limitMessageContainer}>
              <Text style={styles.limitMessageText}>
                {t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit)}
              </Text>
              <TouchableOpacity 
                style={[styles.button, styles.upgradeButton]} 
                onPress={() => navigation.navigate('ManageSubscription')}
              >
                <Text style={styles.buttonText}>{t('receipt.upgradeNow')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={pickFromGallery}
            >
              <Text style={styles.buttonText}>{t('receipt.pickFromGallery')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('receipt.requestingPermission')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    const isLimitReached = subscriptionUsage && subscriptionUsage.scan_limit !== null && subscriptionUsage.scans_remaining !== null && subscriptionUsage.scans_remaining <= 0;
    
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('receipt.cameraPermissionDenied')}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('receipt.requestPermission')}</Text>
        </TouchableOpacity>
        {isLimitReached ? (
          <View style={styles.limitMessageContainer}>
            <Text style={styles.limitMessageText}>
              {t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit)}
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.upgradeButton]} 
              onPress={() => navigation.navigate('ManageSubscription')}
            >
              <Text style={styles.buttonText}>{t('receipt.upgradeNow')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickFromGallery}
          >
            <Text style={styles.buttonText}>{t('receipt.pickFromGallery')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

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


  const isLimitReached = subscriptionUsage && subscriptionUsage.scan_limit !== null && subscriptionUsage.scans_remaining !== null && subscriptionUsage.scans_remaining <= 0;

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => {
                setFacing((current) => (current === 'back' ? 'front' : 'back'));
              }}
            >
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
            {subscriptionUsage && (
              <View style={styles.usageBadge}>
                <Text style={styles.usageText}>{getUsageDisplay()}</Text>
              </View>
            )}
            {!isLimitReached && (
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickFromGallery}
              >
                <Text style={styles.galleryButtonText}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLimitReached && (
            <View style={styles.limitOverlay}>
              <View style={styles.limitMessageBox}>
                <Text style={styles.limitMessageTitle}>{t('receipt.limitReached')}</Text>
                <Text style={styles.limitMessageText}>
                  {t('receipt.limitReachedMessage').replace('{limit}', subscriptionUsage.scan_limit)}
                </Text>
                <TouchableOpacity 
                  style={[styles.button, styles.upgradeButton]} 
                  onPress={() => navigation.navigate('ManageSubscription')}
                >
                  <Text style={styles.buttonText}>{t('receipt.upgradeNow')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                isLimitReached && styles.disabledButton
              ]}
              onPress={takePicture}
              disabled={processing || isLimitReached}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  galleryButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 24,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
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
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  webMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  usageBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  usageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  disabledButton: {
    opacity: 0.5,
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
  limitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  limitMessageBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 350,
  },
  limitMessageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 12,
  },
});

