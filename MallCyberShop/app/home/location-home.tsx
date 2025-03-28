import React, { useState } from "react";
import {View, Text} from "react-native";
import ChatButton from "./chat-button";

const LocationZoneHome = ({country, department}: {country: string, department: string}) => {
  return (    
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // Distribuye los elementos a los lados
        paddingBottom: 5,
        paddingRight: 5,
      }}
    >
      <ChatButton />
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
