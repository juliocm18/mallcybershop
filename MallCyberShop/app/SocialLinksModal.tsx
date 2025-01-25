import React from "react";
import {View, Text, TouchableOpacity, Image} from "react-native";
import RNModal from "react-native-modal";
import {FontAwesome, Ionicons} from "@expo/vector-icons";
import {styles} from "./styles";

interface SocialLinksModalProps {
  visible: boolean;
  links: any;
  handleLinkPress: (link: string, onClose: () => void) => void;
  onClose: () => void;
}

const iconMap: {[key: string]: any} = {
  comestibles: require("../assets/images/linkType/comestibles.png"),
  facebook: require("../assets/images/linkType/facebook.png"),
  instagram: require("../assets/images/linkType/instagram.png"),
  line: require("../assets/images/linkType/line.png"),
  linkedin: require("../assets/images/linkType/linkedin.png"),
  meet: require("../assets/images/linkType/meet.png"),
  messenger: require("../assets/images/linkType/messenger.png"),
  online: require("../assets/images/linkType/online.png"),
  paginaweb: require("../assets/images/linkType/paginaweb.png"),

  panaderia: require("../assets/images/linkType/panaderia.png"),
  pinterest: require("../assets/images/linkType/pinterest.png"),
  snapchat: require("../assets/images/linkType/snapchat.png"),
  telefono: require("../assets/images/linkType/telefono.png"),
  telegram: require("../assets/images/linkType/telegram.png"),
  threads: require("../assets/images/linkType/threads.png"),

  tienda: require("../assets/images/linkType/tienda.png"),
  tiktok: require("../assets/images/linkType/tiktok.png"),
  wechat: require("../assets/images/linkType/wechat.png"),

  whatssapp: require("../assets/images/linkType/whatsapp.png"),
  whatssappb: require("../assets/images/linkType/whatssappb.png"),
  x: require("../assets/images/linkType/x.png"),
  youtube: require("../assets/images/linkType/youtube.png"),
  zoom: require("../assets/images/linkType/zoom.png"),
};

const SocialLinksModal: React.FC<SocialLinksModalProps> = ({
  visible,
  links,
  handleLinkPress,
  onClose,
}) => {
  const renderIcon = (key: string) => {
    const imageSource =
      iconMap[key] || require(`../assets/images/linkType/comestibles.png`);
    return (
      <Image
        source={imageSource}
        style={{width: 20, height: 20}}
        resizeMode="cover"
      />
    );
  };

  return (
    <RNModal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.socialModalContent}>
        <Text style={styles.socialModaltitle}>Selecciona un enlace:</Text>
        <View style={styles.socialModallinksContainer}>
          {links.map((key: any) => (
            <TouchableOpacity
              key={key.key}
              style={styles.socialModallinkButton}
              onPress={() => handleLinkPress(key.identificador, onClose)}
            >
              {renderIcon(key.identificador)}
              <Text style={styles.socialModallinkText}>
                {key.identificador}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </RNModal>
  );
};

export default SocialLinksModal;
