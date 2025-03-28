import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, i18n.language === 'en' && styles.activeButton]}
        onPress={() => changeLanguage('en')}
      >
        <Text style={[styles.text, i18n.language === 'en' && styles.activeText]}>EN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, i18n.language === 'es' && styles.activeButton]}
        onPress={() => changeLanguage('es')}
      >
        <Text style={[styles.text, i18n.language === 'es' && styles.activeText]}>ES</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, i18n.language === 'pt' && styles.activeButton]}
        onPress={() => changeLanguage('pt')}
      >
        <Text style={[styles.text, i18n.language === 'pt' && styles.activeText]}>PT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  activeText: {
    color: '#fff',
  },
});

export default LanguageSelector;
