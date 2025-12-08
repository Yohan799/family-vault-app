import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "te" | "kn" | "hi" | "ta";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentLanguage: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Settings page
    "settings.title": "Settings",
    "settings.subtitle": "Manage your preferences",
    "settings.changePassword": "Change Password",
    "settings.changePassword.subtitle": "Update your password",
    "settings.emailPreferences": "Email Preferences",
    "settings.emailPreferences.subtitle": "Manage email settings",
    "settings.twoFactorAuth": "Two-Factor Auth",
    "settings.twoFactorAuth.subtitle": "Extra security layer",
    "settings.twoFactorAuth.enabled": "Enabled",
    "settings.appLock": "App Lock",
    "settings.appLock.subtitle": "PIN or Biometric",
    "settings.appLock.active": "Active",
    "settings.activeSessions": "Active Sessions",
    "settings.activeSessions.subtitle": "Manage logged-in devices",
    "settings.pushNotifications": "Push Notifications",
    "settings.pushNotifications.subtitle": "Get mobile alerts",
    "settings.pushNotifications.mobileOnly": "Only available on mobile app",
    "settings.autoLockTimeout": "Auto Lock Timeout",
    "settings.backupRestore": "Backup & Restore",
    "settings.backupRestore.subtitle": "Export or restore your vault",
    "settings.helpSupport": "Help & Support",
    "settings.helpSupport.subtitle": "FAQs, guides & contact",
    "settings.language": "Language",
    "settings.language.subtitle": "Change app language",
    "settings.signOut": "Sign Out",
    "settings.deleteAccount": "Delete Account",
    "settings.deleteAccount.title": "Delete Account",
    "settings.deleteAccount.description": "Are you sure you want to delete your account? This action cannot be undone. All your data, documents, and settings will be permanently deleted.",
    "settings.deleteAccount.confirm": "Delete Account",
    "settings.deleting": "Deleting...",
    "settings.appVersion": "App Version 2.0.0",
    
    // Language page
    "language.title": "Language",
    "language.subtitle": "Choose your preferred language",
    "language.current": "Current",
    
    // Navigation
    "nav.home": "Home",
    "nav.vault": "Vault",
    "nav.settings": "Settings",
    
    // Common
    "common.enabled": "Enabled",
    "common.disabled": "Disabled",
    "common.minutes": "minutes",
    "common.minute": "minute",
    
    // Toasts
    "toast.signedOut": "Signed out",
    "toast.signedOut.description": "See you soon!",
    "toast.accountDeleted": "Account Deleted",
    "toast.accountDeleted.description": "Your account has been permanently deleted",
    "toast.deleteFailed": "Delete Failed",
    "toast.error": "Error",
    "toast.pushEnabled": "Push Notifications Enabled",
    "toast.pushEnabled.description": "You'll receive alerts on this device",
    "toast.pushDisabled": "Push Notifications Disabled",
    "toast.permissionDenied": "Permission Denied",
    "toast.permissionDenied.description": "Please enable notifications in your device settings",
    "toast.languageChanged": "Language Changed",
  },
  te: {
    // Settings page
    "settings.title": "సెట్టింగ్స్",
    "settings.subtitle": "మీ ప్రాధాన్యతలను నిర్వహించండి",
    "settings.changePassword": "పాస్‌వర్డ్ మార్చండి",
    "settings.changePassword.subtitle": "మీ పాస్‌వర్డ్‌ను అప్‌డేట్ చేయండి",
    "settings.emailPreferences": "ఇమెయిల్ ప్రాధాన్యతలు",
    "settings.emailPreferences.subtitle": "ఇమెయిల్ సెట్టింగ్స్ నిర్వహించండి",
    "settings.twoFactorAuth": "రెండు-కారక ప్రమాణీకరణ",
    "settings.twoFactorAuth.subtitle": "అదనపు భద్రత",
    "settings.twoFactorAuth.enabled": "ఆన్ చేయబడింది",
    "settings.appLock": "యాప్ లాక్",
    "settings.appLock.subtitle": "PIN లేదా బయోమెట్రిక్",
    "settings.appLock.active": "యాక్టివ్",
    "settings.activeSessions": "యాక్టివ్ సెషన్లు",
    "settings.activeSessions.subtitle": "లాగిన్ చేసిన పరికరాలను నిర్వహించండి",
    "settings.pushNotifications": "పుష్ నోటిఫికేషన్లు",
    "settings.pushNotifications.subtitle": "మొబైల్ అలర్ట్‌లు పొందండి",
    "settings.pushNotifications.mobileOnly": "మొబైల్ యాప్‌లో మాత్రమే అందుబాటులో ఉంటుంది",
    "settings.autoLockTimeout": "ఆటో లాక్ టైమ్‌అవుట్",
    "settings.backupRestore": "బ్యాకప్ & రీస్టోర్",
    "settings.backupRestore.subtitle": "మీ వాల్ట్‌ను ఎక్స్‌పోర్ట్ లేదా రీస్టోర్ చేయండి",
    "settings.helpSupport": "సహాయం & సపోర్ట్",
    "settings.helpSupport.subtitle": "FAQలు, గైడ్‌లు & సంప్రదించండి",
    "settings.language": "భాష",
    "settings.language.subtitle": "యాప్ భాషను మార్చండి",
    "settings.signOut": "సైన్ అవుట్",
    "settings.deleteAccount": "ఖాతాను తొలగించు",
    "settings.deleteAccount.title": "ఖాతాను తొలగించు",
    "settings.deleteAccount.description": "మీరు మీ ఖాతాను తొలగించాలనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు. మీ అన్ని డేటా, డాక్యుమెంట్లు మరియు సెట్టింగ్‌లు శాశ్వతంగా తొలగించబడతాయి.",
    "settings.deleteAccount.confirm": "ఖాతాను తొలగించు",
    "settings.deleting": "తొలగిస్తోంది...",
    "settings.appVersion": "యాప్ వెర్షన్ 2.0.0",
    
    // Language page
    "language.title": "భాష",
    "language.subtitle": "మీకు నచ్చిన భాషను ఎంచుకోండి",
    "language.current": "ప్రస్తుతం",
    
    // Navigation
    "nav.home": "హోమ్",
    "nav.vault": "వాల్ట్",
    "nav.settings": "సెట్టింగ్స్",
    
    // Common
    "common.enabled": "ఆన్ చేయబడింది",
    "common.disabled": "ఆఫ్ చేయబడింది",
    "common.minutes": "నిమిషాలు",
    "common.minute": "నిమిషం",
    
    // Toasts
    "toast.signedOut": "సైన్ అవుట్ అయింది",
    "toast.signedOut.description": "త్వరలో కలుద్దాం!",
    "toast.accountDeleted": "ఖాతా తొలగించబడింది",
    "toast.accountDeleted.description": "మీ ఖాతా శాశ్వతంగా తొలగించబడింది",
    "toast.deleteFailed": "తొలగించడం విఫలమైంది",
    "toast.error": "లోపం",
    "toast.pushEnabled": "పుష్ నోటిఫికేషన్లు ఆన్ చేయబడ్డాయి",
    "toast.pushEnabled.description": "మీరు ఈ పరికరంలో అలర్ట్‌లు పొందుతారు",
    "toast.pushDisabled": "పుష్ నోటిఫికేషన్లు ఆఫ్ చేయబడ్డాయి",
    "toast.permissionDenied": "అనుమతి నిరాకరించబడింది",
    "toast.permissionDenied.description": "దయచేసి మీ పరికర సెట్టింగ్స్‌లో నోటిఫికేషన్లను ఆన్ చేయండి",
    "toast.languageChanged": "భాష మార్చబడింది",
  },
  kn: {
    // Settings page
    "settings.title": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "settings.subtitle": "ನಿಮ್ಮ ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
    "settings.changePassword": "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
    "settings.changePassword.subtitle": "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
    "settings.emailPreferences": "ಇಮೇಲ್ ಆದ್ಯತೆಗಳು",
    "settings.emailPreferences.subtitle": "ಇಮೇಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
    "settings.twoFactorAuth": "ಎರಡು-ಅಂಶ ದೃಢೀಕರಣ",
    "settings.twoFactorAuth.subtitle": "ಹೆಚ್ಚುವರಿ ಭದ್ರತೆ",
    "settings.twoFactorAuth.enabled": "ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
    "settings.appLock": "ಆ್ಯಪ್ ಲಾಕ್",
    "settings.appLock.subtitle": "PIN ಅಥವಾ ಬಯೋಮೆಟ್ರಿಕ್",
    "settings.appLock.active": "ಸಕ್ರಿಯ",
    "settings.activeSessions": "ಸಕ್ರಿಯ ಸೆಷನ್‌ಗಳು",
    "settings.activeSessions.subtitle": "ಲಾಗಿನ್ ಆದ ಸಾಧನಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
    "settings.pushNotifications": "ಪುಶ್ ಅಧಿಸೂಚನೆಗಳು",
    "settings.pushNotifications.subtitle": "ಮೊಬೈಲ್ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ",
    "settings.pushNotifications.mobileOnly": "ಮೊಬೈಲ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ಮಾತ್ರ ಲಭ್ಯವಿದೆ",
    "settings.autoLockTimeout": "ಆಟೋ ಲಾಕ್ ಟೈಮ್‌ಔಟ್",
    "settings.backupRestore": "ಬ್ಯಾಕಪ್ & ಮರುಸ್ಥಾಪನೆ",
    "settings.backupRestore.subtitle": "ನಿಮ್ಮ ವಾಲ್ಟ್ ಅನ್ನು ರಫ್ತು ಅಥವಾ ಮರುಸ್ಥಾಪಿಸಿ",
    "settings.helpSupport": "ಸಹಾಯ & ಬೆಂಬಲ",
    "settings.helpSupport.subtitle": "FAQಗಳು, ಮಾರ್ಗದರ್ಶಿಗಳು & ಸಂಪರ್ಕ",
    "settings.language": "ಭಾಷೆ",
    "settings.language.subtitle": "ಆ್ಯಪ್ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ",
    "settings.signOut": "ಸೈನ್ ಔಟ್",
    "settings.deleteAccount": "ಖಾತೆ ಅಳಿಸಿ",
    "settings.deleteAccount.title": "ಖಾತೆ ಅಳಿಸಿ",
    "settings.deleteAccount.description": "ನೀವು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.",
    "settings.deleteAccount.confirm": "ಖಾತೆ ಅಳಿಸಿ",
    "settings.deleting": "ಅಳಿಸಲಾಗುತ್ತಿದೆ...",
    "settings.appVersion": "ಆ್ಯಪ್ ಆವೃತ್ತಿ 2.0.0",
    
    // Language page
    "language.title": "ಭಾಷೆ",
    "language.subtitle": "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
    "language.current": "ಪ್ರಸ್ತುತ",
    
    // Navigation
    "nav.home": "ಮುಖಪುಟ",
    "nav.vault": "ವಾಲ್ಟ್",
    "nav.settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    
    // Common
    "common.enabled": "ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
    "common.disabled": "ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
    "common.minutes": "ನಿಮಿಷಗಳು",
    "common.minute": "ನಿಮಿಷ",
    
    // Toasts
    "toast.signedOut": "ಸೈನ್ ಔಟ್ ಆಯಿತು",
    "toast.signedOut.description": "ಶೀಘ್ರದಲ್ಲಿ ಭೇಟಿಯಾಗೋಣ!",
    "toast.accountDeleted": "ಖಾತೆ ಅಳಿಸಲಾಗಿದೆ",
    "toast.accountDeleted.description": "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ",
    "toast.deleteFailed": "ಅಳಿಸುವಿಕೆ ವಿಫಲವಾಯಿತು",
    "toast.error": "ದೋಷ",
    "toast.pushEnabled": "ಪುಶ್ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
    "toast.pushEnabled.description": "ನೀವು ಈ ಸಾಧನದಲ್ಲಿ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಸ್ವೀಕರಿಸುತ್ತೀರಿ",
    "toast.pushDisabled": "ಪುಶ್ ಅಧಿಸೂಚನೆಗಳನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ",
    "toast.permissionDenied": "ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ",
    "toast.permissionDenied.description": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಾಧನ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ",
    "toast.languageChanged": "ಭಾಷೆ ಬದಲಾಯಿಸಲಾಗಿದೆ",
  },
  hi: {
    // Settings page
    "settings.title": "सेटिंग्स",
    "settings.subtitle": "अपनी प्राथमिकताएं प्रबंधित करें",
    "settings.changePassword": "पासवर्ड बदलें",
    "settings.changePassword.subtitle": "अपना पासवर्ड अपडेट करें",
    "settings.emailPreferences": "ईमेल प्राथमिकताएं",
    "settings.emailPreferences.subtitle": "ईमेल सेटिंग्स प्रबंधित करें",
    "settings.twoFactorAuth": "दो-कारक प्रमाणीकरण",
    "settings.twoFactorAuth.subtitle": "अतिरिक्त सुरक्षा",
    "settings.twoFactorAuth.enabled": "सक्षम",
    "settings.appLock": "ऐप लॉक",
    "settings.appLock.subtitle": "PIN या बायोमेट्रिक",
    "settings.appLock.active": "सक्रिय",
    "settings.activeSessions": "सक्रिय सत्र",
    "settings.activeSessions.subtitle": "लॉग इन डिवाइस प्रबंधित करें",
    "settings.pushNotifications": "पुश नोटिफिकेशन",
    "settings.pushNotifications.subtitle": "मोबाइल अलर्ट प्राप्त करें",
    "settings.pushNotifications.mobileOnly": "केवल मोबाइल ऐप पर उपलब्ध",
    "settings.autoLockTimeout": "ऑटो लॉक टाइमआउट",
    "settings.backupRestore": "बैकअप और रिस्टोर",
    "settings.backupRestore.subtitle": "अपनी वॉल्ट निर्यात या पुनर्स्थापित करें",
    "settings.helpSupport": "सहायता और समर्थन",
    "settings.helpSupport.subtitle": "FAQs, गाइड और संपर्क",
    "settings.language": "भाषा",
    "settings.language.subtitle": "ऐप की भाषा बदलें",
    "settings.signOut": "साइन आउट",
    "settings.deleteAccount": "खाता हटाएं",
    "settings.deleteAccount.title": "खाता हटाएं",
    "settings.deleteAccount.description": "क्या आप वाकई अपना खाता हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
    "settings.deleteAccount.confirm": "खाता हटाएं",
    "settings.deleting": "हटाया जा रहा है...",
    "settings.appVersion": "ऐप संस्करण 2.0.0",
    
    // Language page
    "language.title": "भाषा",
    "language.subtitle": "अपनी पसंदीदा भाषा चुनें",
    "language.current": "वर्तमान",
    
    // Navigation
    "nav.home": "होम",
    "nav.vault": "वॉल्ट",
    "nav.settings": "सेटिंग्स",
    
    // Common
    "common.enabled": "सक्षम",
    "common.disabled": "अक्षम",
    "common.minutes": "मिनट",
    "common.minute": "मिनट",
    
    // Toasts
    "toast.signedOut": "साइन आउट हो गया",
    "toast.signedOut.description": "जल्द मिलते हैं!",
    "toast.accountDeleted": "खाता हटा दिया गया",
    "toast.accountDeleted.description": "आपका खाता स्थायी रूप से हटा दिया गया है",
    "toast.deleteFailed": "हटाना विफल",
    "toast.error": "त्रुटि",
    "toast.pushEnabled": "पुश नोटिफिकेशन सक्षम",
    "toast.pushEnabled.description": "आपको इस डिवाइस पर अलर्ट मिलेंगे",
    "toast.pushDisabled": "पुश नोटिफिकेशन अक्षम",
    "toast.permissionDenied": "अनुमति अस्वीकृत",
    "toast.permissionDenied.description": "कृपया अपनी डिवाइस सेटिंग्स में नोटिफिकेशन सक्षम करें",
    "toast.languageChanged": "भाषा बदल दी गई",
  },
  ta: {
    // Settings page
    "settings.title": "அமைப்புகள்",
    "settings.subtitle": "உங்கள் விருப்பங்களை நிர்வகிக்கவும்",
    "settings.changePassword": "கடவுச்சொல்லை மாற்று",
    "settings.changePassword.subtitle": "உங்கள் கடவுச்சொல்லை புதுப்பிக்கவும்",
    "settings.emailPreferences": "மின்னஞ்சல் விருப்பங்கள்",
    "settings.emailPreferences.subtitle": "மின்னஞ்சல் அமைப்புகளை நிர்வகிக்கவும்",
    "settings.twoFactorAuth": "இரு-காரணி அங்கீகாரம்",
    "settings.twoFactorAuth.subtitle": "கூடுதல் பாதுகாப்பு",
    "settings.twoFactorAuth.enabled": "செயல்படுத்தப்பட்டது",
    "settings.appLock": "ஆப் லாக்",
    "settings.appLock.subtitle": "PIN அல்லது பயோமெட்ரிக்",
    "settings.appLock.active": "செயலில்",
    "settings.activeSessions": "செயலில் உள்ள அமர்வுகள்",
    "settings.activeSessions.subtitle": "உள்நுழைந்த சாதனங்களை நிர்வகிக்கவும்",
    "settings.pushNotifications": "புஷ் அறிவிப்புகள்",
    "settings.pushNotifications.subtitle": "மொபைல் எச்சரிக்கைகளைப் பெறுங்கள்",
    "settings.pushNotifications.mobileOnly": "மொபைல் ஆப்பில் மட்டுமே கிடைக்கும்",
    "settings.autoLockTimeout": "ஆட்டோ லாக் நேரம்",
    "settings.backupRestore": "காப்புப்பிரதி & மீட்டமை",
    "settings.backupRestore.subtitle": "உங்கள் வால்ட்டை ஏற்றுமதி அல்லது மீட்டமைக்கவும்",
    "settings.helpSupport": "உதவி & ஆதரவு",
    "settings.helpSupport.subtitle": "FAQகள், வழிகாட்டிகள் & தொடர்பு",
    "settings.language": "மொழி",
    "settings.language.subtitle": "ஆப் மொழியை மாற்றவும்",
    "settings.signOut": "வெளியேறு",
    "settings.deleteAccount": "கணக்கை நீக்கு",
    "settings.deleteAccount.title": "கணக்கை நீக்கு",
    "settings.deleteAccount.description": "உங்கள் கணக்கை நீக்க விரும்புகிறீர்களா? இந்த செயலை செயல்தவிர்க்க முடியாது.",
    "settings.deleteAccount.confirm": "கணக்கை நீக்கு",
    "settings.deleting": "நீக்கப்படுகிறது...",
    "settings.appVersion": "ஆப் பதிப்பு 2.0.0",
    
    // Language page
    "language.title": "மொழி",
    "language.subtitle": "உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    "language.current": "தற்போதைய",
    
    // Navigation
    "nav.home": "முகப்பு",
    "nav.vault": "வால்ட்",
    "nav.settings": "அமைப்புகள்",
    
    // Common
    "common.enabled": "செயல்படுத்தப்பட்டது",
    "common.disabled": "முடக்கப்பட்டது",
    "common.minutes": "நிமிடங்கள்",
    "common.minute": "நிமிடம்",
    
    // Toasts
    "toast.signedOut": "வெளியேறியது",
    "toast.signedOut.description": "விரைவில் சந்திப்போம்!",
    "toast.accountDeleted": "கணக்கு நீக்கப்பட்டது",
    "toast.accountDeleted.description": "உங்கள் கணக்கு நிரந்தரமாக நீக்கப்பட்டது",
    "toast.deleteFailed": "நீக்குவது தோல்வியடைந்தது",
    "toast.error": "பிழை",
    "toast.pushEnabled": "புஷ் அறிவிப்புகள் செயல்படுத்தப்பட்டன",
    "toast.pushEnabled.description": "இந்த சாதனத்தில் எச்சரிக்கைகளைப் பெறுவீர்கள்",
    "toast.pushDisabled": "புஷ் அறிவிப்புகள் முடக்கப்பட்டன",
    "toast.permissionDenied": "அனுமதி மறுக்கப்பட்டது",
    "toast.permissionDenied.description": "உங்கள் சாதன அமைப்புகளில் அறிவிப்புகளை செயல்படுத்தவும்",
    "toast.languageChanged": "மொழி மாற்றப்பட்டது",
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app_language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const currentLanguage = languages.find((l) => l.code === language) || languages[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
