import React from "react";
import {Modal, View, Text, ScrollView, TouchableOpacity} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import {globalStyles} from "./styles";

interface CategoryModalProps {
  visible: boolean;
  categories: string[];
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  categories,
  selectedCategories,
  toggleCategory,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={globalStyles.modalContainer}>
        <View style={globalStyles.modalContent}>
          <Text style={globalStyles.modalTitle}>Filtrar por Categoría</Text>
          <ScrollView>
            {categories.map((category) => (
              <View key={category} style={globalStyles.checkboxContainer}>
                <BouncyCheckbox
                  size={30}
                  fillColor="#ff9f61"
                  unFillColor="#FFFFFF"
                  text={category}
                  isChecked={selectedCategories.includes(category)}
                  onPress={() => toggleCategory(category)}
                  textStyle={globalStyles.checkboxText}
                  iconStyle={globalStyles.checkboxIcon}
                />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={globalStyles.closeButton} onPress={onClose}>
            <Text style={globalStyles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CategoryModal;
