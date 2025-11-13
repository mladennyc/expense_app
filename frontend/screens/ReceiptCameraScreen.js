import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';

export default function ReceiptCameraScreen({ navigation }) {
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef(null);

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
    return (
      <View style={styles.container}>
        <View style={styles.webContainer}>
          <Text style={styles.webTitle}>{t('receipt.selectReceiptPhoto')}</Text>
          <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
            <Text style={styles.buttonText}>{t('receipt.pickFromGallery')}</Text>
          </TouchableOpacity>
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
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('receipt.cameraPermissionDenied')}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('receipt.requestPermission')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
          <Text style={styles.buttonText}>{t('receipt.pickFromGallery')}</Text>
        </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickFromGallery}
            >
              <Text style={styles.galleryButtonText}>📷</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={processing}
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
});

