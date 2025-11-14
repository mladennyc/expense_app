import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/ErrorBoundary';
import { LanguageProvider, useLanguage } from './src/LanguageProvider';
import { CurrencyProvider } from './src/CurrencyProvider';
import { AuthProvider, useAuth } from './src/AuthContext';
import LanguageSelector from './src/LanguageSelector';
import CurrencySelector from './src/CurrencySelector';
import LogoutButton from './src/LogoutButton';
import SettingsButton from './src/SettingsButton';
import ExportButton from './src/ExportButton';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import EditExpenseScreen from './screens/EditExpenseScreen';
import AddIncomeScreen from './screens/AddIncomeScreen';
import EditIncomeScreen from './screens/EditIncomeScreen';
import CategoryBreakdownScreen from './screens/CategoryBreakdownScreen';
import SettingsScreen from './screens/SettingsScreen';
import ReceiptCameraScreen from './screens/ReceiptCameraScreen';
import ReceiptReviewScreen from './screens/ReceiptReviewScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { t, language } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              title: t('auth.login'),
              headerShown: true,
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CurrencySelector />
                  <LanguageSelector />
                </View>
              ),
            }}
          />
                  <Stack.Screen 
                    name="ForgotPassword" 
                    component={ForgotPasswordScreen}
                    options={{ 
                      title: t('auth.resetPassword'),
                      headerShown: true,
                    }}
                  />
                  <Stack.Screen 
                    name="TermsOfService" 
                    component={TermsOfServiceScreen}
                    options={{ 
                      title: t('auth.termsOfService'),
                      headerShown: true,
                    }}
                  />
                  <Stack.Screen 
                    name="PrivacyPolicy" 
                    component={PrivacyPolicyScreen}
                    options={{ 
                      title: t('auth.privacyPolicy'),
                      headerShown: true,
                    }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            );
          }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ 
            title: t('screen.dashboard'),
            headerShown: true,
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ExportButton />
                <CurrencySelector />
                <LanguageSelector />
                <SettingsButton />
                <LogoutButton />
              </View>
            ),
          }}
        />
        <Stack.Screen 
          name="AddExpense" 
          component={AddExpenseScreen}
          options={{ 
            title: t('screen.addExpense'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="EditExpense" 
          component={EditExpenseScreen}
          options={{ 
            title: t('screen.editExpense'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="AddIncome" 
          component={AddIncomeScreen}
          options={{ 
            title: t('screen.addIncome'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="EditIncome" 
          component={EditIncomeScreen}
          options={{ 
            title: t('screen.editIncome'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="CategoryBreakdown" 
          component={CategoryBreakdownScreen}
          options={{ 
            title: t('screen.categoryBreakdown'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: t('screen.settings'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="ReceiptCamera" 
          component={ReceiptCameraScreen}
          options={{ 
            title: t('screen.scanReceipt'),
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="ReceiptReview" 
          component={ReceiptReviewScreen}
          options={{ 
            title: t('screen.reviewReceipt'),
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
