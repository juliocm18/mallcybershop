import React from "react";
import {View, Text} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {useRouter} from "expo-router";

const AdminZone = () => {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 5,
        paddingRight: 5,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 16,
          marginRight: 8,
          fontWeight: "bold",
        }}
      >
        Zona Admin
      </Text>
      <FontAwesome
        name="user-circle-o"
        size={24} // Tamaño mediano
        color="white" // Color blanco
        onPress={() => router.push("./auth/login")}
      />
    </View>
  );
};

export default AdminZone;
