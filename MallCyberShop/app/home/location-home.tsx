import React from "react";
import { View, Text, Pressable } from "react-native";
import ChatButton from "./chat-button";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const LocationZoneHome = ({
  country,
  department,
}: {
  country: string;
  department: string;
}) => {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 5,
        paddingRight: 5,
      }}
    >
      <ChatButton />
      <Pressable onPress={() => router.push("../locationhome")}>
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: 5 }}>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {country}/{department}
          </Text>
          <FontAwesome
            style={{ marginLeft: 6 }}
            name="refresh"
            size={16}
            color="white"
          />
        </View>
      </Pressable>
    </View>
  );
};

export default LocationZoneHome;
