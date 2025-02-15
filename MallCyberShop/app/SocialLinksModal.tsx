import React from "react";
import {View, Text, TouchableOpacity, Image, StyleSheet} from "react-native";
import RNModal from "react-native-modal";
import {iconMap} from "./constants/socialLinks";

interface SocialLinksModalProps {
  visible: boolean;
  links: any;
  company: any;
  handleLinkPress: (link: string, onClose: () => void) => void;
  onClose: () => void;
}

const SocialLinksModal: React.FC<SocialLinksModalProps> = ({
  visible,
  links,
  company,
  handleLinkPress,
  onClose,
}) => {
  const renderIcon = (key: string) => {
    const imageSource =
      iconMap[key] || require("../assets/images/linkType/comestibles.png");
    return (
      <Image source={imageSource} style={styles.icon} resizeMode="cover" />
    );
  };

  return (
    <RNModal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>{company?.name || ""}</Text>
        <View style={styles.linksContainer}>
          {links.map((key: any) => (
            <TouchableOpacity
              key={key.id}
              style={styles.linkButton}
              onPress={() => handleLinkPress(key.link, onClose)}
            >
              {renderIcon(key.identificador)}
              <Text style={styles.linkText}>{key.identificador}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </RNModal>
  );
};

export default SocialLinksModal;

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  linksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  linkButton: {
    width: "30%", // 4 columnas
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    alignItems: "center",
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25, // Hace los iconos redondos
    marginBottom: 5,
  },
  linkText: {
    fontSize: 12,
    textAlign: "center",
  },
});
