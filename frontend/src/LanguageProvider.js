import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage not available, use in-memory fallback
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
  };
}

const LanguageContext = createContext();

const STORAGE_KEY = '@app_language';

const translations = {
  en: {
            // Screen titles
            'screen.addExpense': 'Add Expense',
            'screen.editExpense': 'Edit Expense',
            'screen.addIncome': 'Add Income',
            'screen.editIncome': 'Edit Income',
            'screen.dashboard': 'Dashboard',
            'screen.categoryBreakdown': 'Category Breakdown',
    
    // Labels
    'label.amount': 'Amount',
    'label.date': 'Date',
    'label.category': 'Category',
    'label.description': 'Description',
    
            // Buttons
            'button.submit': 'Submit',
            'button.saveChanges': 'Save changes',
            'button.addExpense': 'Add Expense',
            'button.addIncome': 'Add Income',
            'button.scanReceipt': 'Scan receipt (coming soon)',
            'button.ok': 'OK',
            'button.selectCategory': 'Select a category',
            'button.deleteExpense': 'Delete Expense',
            'button.deleteIncome': 'Delete Income',
            'button.delete': 'Delete',
            'button.cancel': 'Cancel',
            'button.overview': 'Overview',
            'button.income': 'Income',
            'button.expenses': 'Expenses',
    
            // Messages
            'message.expenseAdded': 'Expense added successfully!',
            'message.expenseUpdated': 'Expense updated',
            'message.expenseDeleted': 'Expense deleted successfully',
            'message.deletingExpense': 'Deleting expense...',
            'message.confirmDelete': 'Are you sure you want to delete this expense? This action cannot be undone.',
            'message.confirmDeleteIncome': 'Are you sure you want to delete this income? This action cannot be undone.',
            'message.incomeAdded': 'Income added successfully!',
            'message.incomeUpdated': 'Income updated',
            'message.incomeDeleted': 'Income deleted successfully',
            'message.deletingIncome': 'Deleting income...',
            'message.success': 'Success',
            'message.loadingExpense': 'Loading expense...',
            'message.loadingIncome': 'Loading income...',
            'message.failedToCreate': 'Failed to create expense',
            'message.failedToUpdate': 'Failed to update expense',
            'message.failedToDelete': 'Failed to delete expense',
            'message.failedToLoad': 'Failed to load expense',
            'message.failedToCreateIncome': 'Failed to create income',
            'message.failedToUpdateIncome': 'Failed to update income',
            'message.failedToDeleteIncome': 'Failed to delete income',
            'message.failedToLoadIncome': 'Failed to load income',
    
    // Validation errors
            'error.invalidAmount': 'Please enter a valid amount greater than 0',
            'error.selectCategory': 'Please select a category',
            'error.selectDate': 'Please select a date',
            'error.acceptTerms': 'You must accept the Terms of Service and Privacy Policy to sign up',
    
            // Dashboard
            'dashboard.currentMonthTotal': 'Current Month Total',
            'dashboard.netIncome': 'Net Income',
            'dashboard.totalIncome': 'Total Income',
            'dashboard.totalExpenses': 'Total Expenses',
            'dashboard.monthComparison': 'Month Comparison',
            'dashboard.last6Months': 'Last 6 Months',
            'dashboard.recentExpenses': 'Recent Expenses',
            'dashboard.recentIncome': 'Recent Income',
            'dashboard.monthlyTotals': 'Monthly Totals',
            'dashboard.noExpenses': 'No expenses yet',
            'dashboard.noIncome': 'No income yet',
            'dashboard.noMonthlyData': 'No monthly data yet',
            'dashboard.error': 'Error',
            'dashboard.tapForDetails': 'Tap for category breakdown',
            'dashboard.categoryBreakdown': 'Category Breakdown',
            'dashboard.categoryDetails': 'Category Details',
            'dashboard.tap': 'Tap',
            'dashboard.total': 'Total',
            'dashboard.noData': 'No data',
    
    // Expense Categories
    'category.groceries': 'Groceries',
    'category.utilities': 'Utilities',
    'category.transportation': 'Transportation',
    'category.housing': 'Housing',
    'category.healthcare': 'Healthcare',
    'category.education': 'Education',
    'category.entertainment': 'Entertainment',
    'category.diningOut': 'Dining Out',
    'category.clothing': 'Clothing',
    'category.personalCare': 'Personal Care',
    'category.giftsDonations': 'Gifts & Donations',
    'category.travel': 'Travel',
    'category.loansDebt': 'Loans & Debt Payments',
    'category.bankFees': 'Bank Fees & Overdrafts',
    'category.insurance': 'Insurance',
    'category.taxes': 'Taxes',
    'category.other': 'Other',
    
    // Income Categories
    'category.salary': 'Salary',
    'category.freelance': 'Freelance',
    'category.investment': 'Investment',
    'category.gift': 'Gift',
    'category.bonus': 'Bonus',
    'category.otherIncome': 'Other',
    
    // Placeholders
    'placeholder.amount': '0.00',
    'placeholder.description': 'Optional description',
    
            // Authentication
            'auth.login': 'Login',
            'auth.signup': 'Sign Up',
            'auth.email': 'Email',
            'auth.emailPlaceholder': 'your@email.com',
            'auth.username': 'Username (optional)',
            'auth.usernamePlaceholder': 'username',
            'auth.loginIdentifier': 'Email or Username',
            'auth.loginIdentifierPlaceholder': 'email or username',
            'auth.password': 'Password',
            'auth.passwordPlaceholder': 'Enter password',
            'auth.name': 'Name',
            'auth.namePlaceholder': 'Your name',
            'auth.haveAccount': 'Already have an account? Login',
            'auth.noAccount': "Don't have an account? Sign Up",
            'auth.forgotPassword': 'Forgot password?',
            'auth.resetPassword': 'Reset Password',
            'auth.resetPasswordTitle': 'Reset Your Password',
            'auth.resetPasswordMessage': 'Enter your email address and we will send you instructions to reset your password.',
            'auth.resetPasswordSent': 'If an account exists with this email, password reset instructions have been sent.',
            'auth.backToLogin': 'Back to Login',
            'auth.acceptTerms1': 'I agree to the',
            'auth.termsOfService': 'Terms of Service',
            'auth.and': 'and',
            'auth.privacyPolicy': 'Privacy Policy',
            'auth.deleteAccount': 'Delete Account',
            'auth.confirmDeleteAccount': 'Are you sure you want to delete your account? This will permanently delete all your data including all expenses. This action cannot be undone.',
            'auth.failedToDeleteAccount': 'Failed to delete account. Please try again.',
            'auth.error': 'Error',
            
            // Settings
            'screen.settings': 'Settings',
            'settings.openSettings': 'Open Settings',
            'settings.accountInfo': 'Account Information',
            'settings.name': 'Name',
            'settings.email': 'Email',
            'settings.username': 'Username',
            'settings.changePassword': 'Change Password',
            'settings.currentPassword': 'Current Password',
            'settings.currentPasswordPlaceholder': 'Enter current password',
            'settings.newPassword': 'New Password',
            'settings.newPasswordPlaceholder': 'Enter new password',
            'settings.confirmPassword': 'Confirm New Password',
            'settings.confirmPasswordPlaceholder': 'Confirm new password',
            'settings.passwordChanged': 'Password changed successfully',
            'settings.failedToChangePassword': 'Failed to change password',
            'settings.invalidCurrentPassword': 'Current password is incorrect',
            'settings.passwordTooShort': 'Password must be at least 6 characters',
            'settings.passwordsDoNotMatch': 'New passwords do not match',
            'settings.newPasswordSame': 'New password must be different from current password',
            'settings.fillAllFields': 'Please fill in all fields',
            'settings.networkError': 'Cannot connect to backend. Make sure the backend is running.',
            'settings.dangerZone': 'Danger Zone',
            'settings.deleteAccountWarning': 'Once you delete your account, there is no going back. Please be certain.',
  },
  sr: {
            // Screen titles
            'screen.addExpense': 'Dodaj Rashod',
            'screen.editExpense': 'Izmeni Rashod',
            'screen.addIncome': 'Dodaj Prihod',
            'screen.editIncome': 'Izmeni Prihod',
            'screen.dashboard': 'Kontrolna Tabla',
            'screen.categoryBreakdown': 'Pregled po Kategorijama',
    
    // Labels
    'label.amount': 'Iznos',
    'label.date': 'Datum',
    'label.category': 'Kategorija',
    'label.description': 'Opis',
    
    // Buttons
    'button.submit': 'Pošalji',
    'button.saveChanges': 'Sačuvaj izmene',
    'button.addExpense': 'Dodaj Rashod',
    'button.addIncome': 'Dodaj Prihod',
    'button.scanReceipt': 'Skeniraj račun (uskoro)',
    'button.ok': 'OK',
    'button.selectCategory': 'Izaberi kategoriju',
    'button.deleteExpense': 'Obriši Rashod',
    'button.deleteIncome': 'Obriši Prihod',
    'button.delete': 'Obriši',
    'button.cancel': 'Otkaži',
    'button.overview': 'Pregled',
    'button.income': 'Prihod',
    'button.expenses': 'Rashodi',
    
            // Messages
            'message.expenseAdded': 'Rashod je uspešno dodat!',
            'message.expenseUpdated': 'Rashod je ažuriran',
            'message.expenseDeleted': 'Rashod je uspešno obrisan',
            'message.deletingExpense': 'Brisanje rashoda...',
            'message.confirmDelete': 'Da li ste sigurni da želite da obrišete ovaj rashod? Ova akcija se ne može poništiti.',
            'message.confirmDeleteIncome': 'Da li ste sigurni da želite da obrišete ovaj prihod? Ova akcija se ne može poništiti.',
            'message.incomeAdded': 'Prihod je uspešno dodat!',
            'message.incomeUpdated': 'Prihod je ažuriran',
            'message.incomeDeleted': 'Prihod je uspešno obrisan',
            'message.deletingIncome': 'Brisanje prihoda...',
            'message.success': 'Uspeh',
            'message.loadingExpense': 'Učitavanje rashoda...',
            'message.loadingIncome': 'Učitavanje prihoda...',
            'message.failedToCreate': 'Neuspešno kreiranje rashoda',
            'message.failedToUpdate': 'Neuspešno ažuriranje rashoda',
            'message.failedToDelete': 'Neuspešno brisanje rashoda',
            'message.failedToLoad': 'Neuspešno učitavanje rashoda',
            'message.failedToCreateIncome': 'Neuspešno kreiranje prihoda',
            'message.failedToUpdateIncome': 'Neuspešno ažuriranje prihoda',
            'message.failedToDeleteIncome': 'Neuspešno brisanje prihoda',
            'message.failedToLoadIncome': 'Neuspešno učitavanje prihoda',
    
    // Validation errors
            'error.invalidAmount': 'Molimo unesite važeći iznos veći od 0',
            'error.selectCategory': 'Molimo izaberite kategoriju',
            'error.selectDate': 'Molimo izaberite datum',
            'error.acceptTerms': 'Morate prihvatiti Uslove Korišćenja i Politiku Privatnosti da biste se registrovali',
    
            // Dashboard
            'dashboard.currentMonthTotal': 'Ukupno za Tekući Mesec',
            'dashboard.netIncome': 'Neto Prihod',
            'dashboard.totalIncome': 'Ukupan Prihod',
            'dashboard.totalExpenses': 'Ukupni Rashodi',
            'dashboard.monthComparison': 'Poređenje Meseci',
            'dashboard.last6Months': 'Poslednjih 6 Meseci',
            'dashboard.recentExpenses': 'Nedavni Rashodi',
            'dashboard.recentIncome': 'Nedavni Prihodi',
            'dashboard.monthlyTotals': 'Mesečni Ukupni',
            'dashboard.noExpenses': 'Još nema rashoda',
            'dashboard.noIncome': 'Još nema prihoda',
            'dashboard.noMonthlyData': 'Još nema mesečnih podataka',
            'dashboard.error': 'Greška',
            'dashboard.tapForDetails': 'Kliknite za pregled po kategorijama',
            'dashboard.categoryBreakdown': 'Pregled po Kategorijama',
            'dashboard.categoryDetails': 'Detalji Kategorija',
            'dashboard.tap': 'Klikni',
            'dashboard.total': 'Ukupno',
            'dashboard.noData': 'Nema podataka',
    
    // Expense Categories
    'category.groceries': 'Namirnice',
    'category.utilities': 'Komunalije',
    'category.transportation': 'Prevoz',
    'category.housing': 'Stanovanje',
    'category.healthcare': 'Zdravstvena Zaštita',
    'category.education': 'Obrazovanje',
    'category.entertainment': 'Zabava',
    'category.diningOut': 'Jelo Napolju',
    'category.clothing': 'Odeća',
    'category.personalCare': 'Lična Nega',
    'category.giftsDonations': 'Pokloni i Donacije',
    'category.travel': 'Putovanja',
    'category.loansDebt': 'Krediti i Otplate Duga',
    'category.bankFees': 'Bankovne Naknade i Prekoračenja',
    'category.insurance': 'Osiguranje',
    'category.taxes': 'Porezi',
    'category.other': 'Ostalo',
    
    // Income Categories
    'category.salary': 'Plata',
    'category.freelance': 'Slobodno Zanimanje',
    'category.investment': 'Investicija',
    'category.gift': 'Poklon',
    'category.bonus': 'Bonus',
    'category.otherIncome': 'Ostalo',
    
    // Placeholders
    'placeholder.amount': '0.00',
    'placeholder.description': 'Opcioni opis',
    
            // Authentication
            'auth.login': 'Prijava',
            'auth.signup': 'Registracija',
            'auth.email': 'Email',
            'auth.emailPlaceholder': 'vas@email.com',
            'auth.username': 'Korisničko Ime (opciono)',
            'auth.usernamePlaceholder': 'korisničko ime',
            'auth.loginIdentifier': 'Email ili Korisničko Ime',
            'auth.loginIdentifierPlaceholder': 'email ili korisničko ime',
            'auth.password': 'Lozinka',
            'auth.passwordPlaceholder': 'Unesite lozinku',
            'auth.name': 'Ime',
            'auth.namePlaceholder': 'Vaše ime',
            'auth.haveAccount': 'Već imate nalog? Prijavite se',
            'auth.noAccount': 'Nemate nalog? Registrujte se',
            'auth.forgotPassword': 'Zaboravili ste lozinku?',
            'auth.resetPassword': 'Resetuj Lozinku',
            'auth.resetPasswordTitle': 'Resetujte Vašu Lozinku',
            'auth.resetPasswordMessage': 'Unesite vašu email adresu i poslaćemo vam uputstva za resetovanje lozinke.',
            'auth.resetPasswordSent': 'Ako nalog postoji sa ovom email adresom, uputstva za resetovanje lozinke su poslata.',
            'auth.backToLogin': 'Nazad na Prijavu',
            'auth.acceptTerms1': 'Prihvatam',
            'auth.termsOfService': 'Uslove Korišćenja',
            'auth.and': 'i',
            'auth.privacyPolicy': 'Politiku Privatnosti',
            'auth.deleteAccount': 'Obriši Nalog',
            'auth.confirmDeleteAccount': 'Da li ste sigurni da želite da obrišete svoj nalog? Ovo će trajno obrisati sve vaše podatke uključujući sve rashode. Ova akcija se ne može poništiti.',
            'auth.failedToDeleteAccount': 'Neuspešno brisanje naloga. Molimo pokušajte ponovo.',
            'auth.error': 'Greška',
            
            // Settings
            'screen.settings': 'Podešavanja',
            'settings.openSettings': 'Otvori Podešavanja',
            'settings.accountInfo': 'Informacije o Nalogu',
            'settings.name': 'Ime',
            'settings.email': 'Email',
            'settings.username': 'Korisničko Ime',
            'settings.changePassword': 'Promeni Lozinku',
            'settings.currentPassword': 'Trenutna Lozinka',
            'settings.currentPasswordPlaceholder': 'Unesite trenutnu lozinku',
            'settings.newPassword': 'Nova Lozinka',
            'settings.newPasswordPlaceholder': 'Unesite novu lozinku',
            'settings.confirmPassword': 'Potvrdite Novu Lozinku',
            'settings.confirmPasswordPlaceholder': 'Potvrdite novu lozinku',
            'settings.passwordChanged': 'Lozinka je uspešno promenjena',
            'settings.failedToChangePassword': 'Neuspešna promena lozinke',
            'settings.invalidCurrentPassword': 'Trenutna lozinka nije tačna',
            'settings.passwordTooShort': 'Lozinka mora imati najmanje 6 karaktera',
            'settings.passwordsDoNotMatch': 'Nove lozinke se ne poklapaju',
            'settings.newPasswordSame': 'Nova lozinka mora biti drugačija od trenutne',
            'settings.fillAllFields': 'Molimo popunite sva polja',
            'settings.networkError': 'Ne može se povezati sa backend-om. Proverite da li je backend pokrenut.',
            'settings.dangerZone': 'Opasna Zona',
            'settings.deleteAccountWarning': 'Kada obrišete svoj nalog, nema povratka. Molimo budite sigurni.',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      if (!AsyncStorage) {
        setIsLoading(false);
        return;
      }
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY).catch(err => {
        console.error('Error reading language:', err);
        return null;
      });
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      // Continue with default language
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetLanguage = async (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, newLanguage);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en?.[key] || key;
  };

  // Show loading indicator while language is loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

