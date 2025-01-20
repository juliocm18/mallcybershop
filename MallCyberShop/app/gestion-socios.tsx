import React from "react";
import {View, Text, StyleSheet} from "react-native";

const GestionSocios: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Gestión de Categorías</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GestionSocios;
