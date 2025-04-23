import React from "react";
import {TextInput, View, StyleSheet, Text} from "react-native";
import { globalStyles } from "../styles";

type PriorityInputProps = {
  priority: string;
  setPriority: (value: string) => void;
};

const PriorityInput: React.FC<PriorityInputProps> = ({
  priority,
  setPriority,
}) => {
  const handleChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, ""); // Solo números
    setPriority(numericValue);
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.label}>Prioridad:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={priority}
        onChangeText={handleChange}
        placeholder="Ingresa la proiridad"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom:10
  },
});

export default PriorityInput;
