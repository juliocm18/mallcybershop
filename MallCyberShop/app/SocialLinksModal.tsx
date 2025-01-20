import React from "react";
import {View, Text, TouchableOpacity} from "react-native";
import RNModal from "react-native-modal";
import {FontAwesome, Ionicons} from "@expo/vector-icons";
import {styles} from "./styles";

interface SocialLinksModalProps {
  visible: boolean;
  links: Record<string, string>;
  handleLinkPress: (link: string, onClose: () => void) => void;
  onClose: () => void;
}

const SocialLinksModal: React.FC<SocialLinksModalProps> = ({
  visible,
  links,
  handleLinkPress,
  onClose,
}) => {
  const renderIcon = (key: string) => {
    switch (key) {
      case "web":
        return <FontAwesome name="globe" size={20} color="#006140" />;
      case "App":
        return <FontAwesome name="mobile" size={20} color="#484545" />;
      case "Facebook":
        return <FontAwesome name="facebook" size={20} color="#1877F2" />;
      case "Instagram":
        return <FontAwesome name="instagram" size={20} color="#C13584" />;
      case "TikTok":
        return <Ionicons name="logo-tiktok" size={24} color="black" />;
      case "Twitter":
        return <FontAwesome name="twitter" size={20} color="#1da1f2" />;
      case "YouTube":
        return <FontAwesome name="youtube" size={20} color="#FF0000" />;
      default:
        return null;
    }
  };

  return (
    <RNModal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.socialModalContent}>
        <Text style={styles.socialModaltitle}>Selecciona un enlace:</Text>
        <View style={styles.socialModallinksContainer}>
          {Object.keys(links).map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.socialModallinkButton}
              onPress={() => handleLinkPress(links[key], onClose)}
            >
              {renderIcon(key)}
              <Text style={styles.socialModallinkText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </RNModal>
  );
};

export default SocialLinksModal;
