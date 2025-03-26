import React, { useState } from "react";
import {View, Text} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {useRouter} from "expo-router";

const LocationZoneHome = ({country, department}: {country: string, department: string}) => {
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
        {country}/{department}
      </Text>      
    </View>
  );
};

export default LocationZoneHome;
