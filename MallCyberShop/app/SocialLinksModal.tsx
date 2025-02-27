import React from "react";
import {View, Text, TouchableOpacity, Image, StyleSheet} from "react-native";
import RNModal from "react-native-modal";
import {iconMap} from "./constants/socialLinks";
import {Link} from "./link/model";
import {CompanyLink} from "./company/company.interface";

interface SocialLinksModalProps {
  visible: boolean;
  companyLinks: any;
  company: any;
  handleLinkPress: (link: string, onClose: () => void) => void;
  onClose: () => void;
}

const SocialLinksModal: React.FC<SocialLinksModalProps> = ({
  visible,
  companyLinks,
  company,
  handleLinkPress,
  onClose,
}) => {
  const renderIcon = (key: string) => {
    return <Image source={{uri: key}} style={styles.icon} resizeMode="cover" />;
  };
  return (
    <RNModal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>{company?.name || ""}</Text>
        <View style={styles.linksContainer}>
          {companyLinks.map((companyLink: CompanyLink) => (
            <TouchableOpacity
              key={companyLink.id}
              style={styles.linkButton}
              onPress={() => handleLinkPress(companyLink.url || "", onClose)}
            >
              {renderIcon(companyLink.link?.icon || "")}
              <Text style={styles.linkText}>{companyLink.link?.name}</Text>
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
