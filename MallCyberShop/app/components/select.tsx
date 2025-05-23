import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, HelperText } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

interface SelectProps {
  label: string;
  selectedValue: string;
  onValueChange: (itemValue: string) => void;
  items: { id: string; name: string }[];
}

const Select: React.FC<SelectProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
}) => {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.label}>{label}</Text> */}
      <Picker
  selectedValue={selectedValue}
  onValueChange={onValueChange}
  style={styles.picker}
>
  <Picker.Item
    style={{
      color: selectedValue === "" ? "#fb8436" : "#000"

    }}
    label={`-- SELECCIONA ${label.toUpperCase()} --`}
    value=""
  />
  {items.map((item) => (
    <Picker.Item
      key={item.id}
      label={item.name}
      value={item.id}
      style={{
        color: selectedValue === item.id ? "#fb8436" : "#000",
      }}
    />
  ))}
</Picker>
      {/* <HelperText type="info" visible={!selectedValue}>
        Por favor selecciona {label.toLowerCase()}.
      </HelperText> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 5,
  },
  picker: {
    height: 50,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
});

export default Select;
