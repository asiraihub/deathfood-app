import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "bn" | "en";

const translations = {
  // App Header
  appName: { bn: "Dead Food - App", en: "Dead Food - App" },
  appSubtitle: { bn: "খাদ্য পরীক্ষক", en: "Food Inspector" },
  install: { bn: "ইন্সটল", en: "Install" },

  // Camera
  cameraPrompt: { bn: "ক্যামেরা চালু করুন বা ছবি আপলোড করুন", en: "Open camera or upload a photo" },
  openCamera: { bn: "ক্যামেরা খুলুন", en: "Open Camera" },
  uploadGallery: { bn: "গ্যালারি থেকে আপলোড", en: "Upload from Gallery" },
  analyzing: { bn: "বিশ্লেষণ করা হচ্ছে...", en: "Analyzing..." },
  retake: { bn: "আবার তুলুন", en: "Retake" },
  otherPhoto: { bn: "অন্য ছবি", en: "Other Photo" },
  scanInstruction: { bn: "খাবারের প্যাকেটের", en: "Take a photo of the" },
  scanInstructionBold: { bn: "Ingredients List", en: "Ingredients List" },
  scanInstructionEnd: { bn: "এর ছবি তুলুন", en: "on the food package" },

  // Camera errors
  cameraNoPermission: { bn: "ক্যামেরা অনুমতি নেই", en: "Camera permission denied" },
  cameraNoPermissionDesc: { bn: "ব্রাউজার সেটিংস থেকে ক্যামেরা অনুমতি দিন, অথবা গ্যালারি থেকে ছবি আপলোড করুন।", en: "Allow camera in browser settings, or upload from gallery." },
  cameraNotFound: { bn: "ক্যামেরা পাওয়া যায়নি", en: "Camera not found" },
  cameraNotFoundDesc: { bn: "এই ডিভাইসে ক্যামেরা নেই। গ্যালারি থেকে ছবি আপলোড করুন।", en: "No camera on this device. Upload from gallery." },
  cameraError: { bn: "ক্যামেরা খুলতে সমস্যা", en: "Camera error" },
  cameraErrorDesc: { bn: "গ্যালারি থেকে ছবি আপলোড করে চেষ্টা করুন।", en: "Try uploading from gallery." },

  // Analysis
  problemOccurred: { bn: "সমস্যা হয়েছে", en: "Something went wrong" },
  analysisFailed: { bn: "বিশ্লেষণ ব্যর্থ", en: "Analysis failed" },
  tryAgain: { bn: "আবার চেষ্টা করুন।", en: "Please try again." },
  startChat: { bn: "Start Chat", en: "Start Chat" },

  // Results
  overallAssessment: { bn: "📋 সামগ্রিক মূল্যায়ন", en: "📋 Overall Assessment" },
  safe: { bn: "নিরাপদ", en: "Safe" },
  warning: { bn: "সতর্কতা", en: "Warning" },
  danger: { bn: "ক্ষতিকর", en: "Harmful" },

  // Share
  share: { bn: "শেয়ার করুন", en: "Share" },
  shareBtn: { bn: "শেয়ার", en: "Share" },
  saveImage: { bn: "ছবি সেভ", en: "Save Image" },
  copy: { bn: "কপি", en: "Copy" },
  copied: { bn: "কপি হয়েছে", en: "Copied" },
  imageDownloaded: { bn: "ছবি ডাউনলোড হয়েছে!", en: "Image downloaded!" },
  imageGenFailed: { bn: "ছবি তৈরি করা যায়নি", en: "Failed to generate image" },
  instagramTip: { bn: "💡 Instagram এ শেয়ার করতে \"ছবি সেভ\" করে Story/Post এ আপলোড করুন", en: "💡 To share on Instagram, save the image and upload to Story/Post" },

  // Chat
  aiChat: { bn: "AI চ্যাট", en: "AI Chat" },
  typeQuestion: { bn: "প্রশ্ন লিখুন...", en: "Type your question..." },

  // Bottom Nav
  chatHistory: { bn: "চ্যাট হিস্ট্রি", en: "Chat History" },
  profile: { bn: "প্রোফাইল", en: "Profile" },
  settings: { bn: "সেটিংস", en: "Settings" },

  // Chat History Page
  loading: { bn: "লোড হচ্ছে...", en: "Loading..." },
  noChatHistory: { bn: "কোনো চ্যাট হিস্ট্রি নেই", en: "No chat history" },
  messages: { bn: "মেসেজ", en: "messages" },
  continueChat: { bn: "চালিয়ে যান", en: "Continue" },

  // Profile Page
  email: { bn: "ইমেইল", en: "Email" },
  name: { bn: "নাম", en: "Name" },
  namePlaceholder: { bn: "আপনার নাম", en: "Your name" },
  phone: { bn: "ফোন নম্বর", en: "Phone Number" },
  age: { bn: "বয়স", en: "Age" },
  gender: { bn: "লিঙ্গ", en: "Gender" },
  male: { bn: "পুরুষ", en: "Male" },
  female: { bn: "মহিলা", en: "Female" },
  selectGender: { bn: "বাছাই করুন", en: "Select" },
  save: { bn: "সেভ করুন", en: "Save" },
  saving: { bn: "সেভ হচ্ছে...", en: "Saving..." },
  profileUpdated: { bn: "প্রোফাইল আপডেট হয়েছে!", en: "Profile updated!" },
  healthHistory: { bn: "স্বাস্থ্য তথ্য", en: "Health History" },
  personalInfo: { bn: "প্রোফাইল তথ্য", en: "Profile Info" },
  hasDiabetic: { bn: "আপনার কি ডায়াবেটিস আছে?", en: "Do you have Diabetes?" },
  hasHeartProblem: { bn: "আপনার কি হার্টে সমস্যা আছে?", en: "Do you have Heart Problems?" },
  hasAllergy: { bn: "আপনার কি অ্যালার্জির সমস্যা আছে?", en: "Do you have Allergy problems?" },
  weight: { bn: "ওজন (কেজি)", en: "Weight (kg)" },
  height: { bn: "উচ্চতা", en: "Height" },
  feet: { bn: "ফুট", en: "ft" },
  inch: { bn: "ইঞ্চি", en: "in" },
  healthNotes: { bn: "আপনার স্বাস্থ্যের বিষয়ে বলুন (ঐচ্ছিক)", en: "Tell us about your health (Optional)" },
  yes: { bn: "হ্যাঁ", en: "Yes" },
  no: { bn: "না", en: "No" },

  // Settings Page
  darkMode: { bn: "ডার্ক মোড", en: "Dark Mode" },
  darkModeDesc: { bn: "অন্ধকার থিম চালু/বন্ধ করুন", en: "Toggle dark theme on/off" },
  language: { bn: "ভাষা", en: "Language" },
  languageDesc: { bn: "অ্যাপের ভাষা পরিবর্তন করুন", en: "Change app language" },
  version: { bn: "ভার্সন ১.০.০", en: "Version 1.0.0" },
  appDescription: { bn: "AI দ্বারা চালিত খাদ্য উপাদান বিশ্লেষক", en: "AI-powered food ingredient analyzer" },
  logout: { bn: "লগআউট", en: "Logout" },

  // Auth Page
  login: { bn: "লগইন", en: "Login" },
  signup: { bn: "সাইনআপ", en: "Sign Up" },
  googleLogin: { bn: "Google দিয়ে লগইন", en: "Login with Google" },
  or: { bn: "অথবা", en: "or" },
  password: { bn: "পাসওয়ার্ড", en: "Password" },
  waiting: { bn: "অপেক্ষা করুন...", en: "Please wait..." },
  noAccount: { bn: "অ্যাকাউন্ট নেই?", en: "No account?" },
  hasAccount: { bn: "অ্যাকাউন্ট আছে?", en: "Have an account?" },
  signupNow: { bn: "সাইনআপ করুন", en: "Sign up" },
  loginNow: { bn: "লগইন করুন", en: "Login" },
  loginOptional: { bn: "লগইন ছাড়াও অ্যাপ ব্যবহার করা যাবে, তবে চ্যাট হিস্ট্রি সেভ হবে না।", en: "You can use the app without login, but chat history won't be saved." },
  fillAllFields: { bn: "সব তথ্য দিন", en: "Fill all fields" },
  fillAllFieldsDesc: { bn: "সব ফিল্ড পূরণ করুন।", en: "Please fill all fields." },
  correctAge: { bn: "সঠিক বয়স দিন", en: "Enter valid age" },
  accountCreated: { bn: "অ্যাকাউন্ট তৈরি হয়েছে!", en: "Account created!" },
  accountCreatedDesc: { bn: "আপনি এখন লগইন অবস্থায় আছেন।", en: "You are now logged in." },
  googleLoginFailed: { bn: "Google লগইন ব্যর্থ", en: "Google login failed" },

  // Footer
  footer: { bn: "AI দ্বারা চালিত • শুধুমাত্র তথ্যমূলক উদ্দেশ্যে", en: "Powered by AI • For informational purposes only" },
} as const;

type TranslationKey = keyof typeof translations;

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "bn",
  setLang: () => {},
  t: (key) => translations[key]?.bn || key,
});

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as Lang) || "bn";
    }
    return "bn";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: TranslationKey): string => {
    return translations[key]?.[lang] || translations[key]?.bn || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
