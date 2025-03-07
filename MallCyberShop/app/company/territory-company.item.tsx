import React from "react";
import {View, Text, TouchableOpacity, ActivityIndicator} from "react-native";

import {styles} from "./styles";
import {FontAwesome} from "@expo/vector-icons";

export const TerritoryCompanyItem = React.memo(
  ({item, onOpenTerritory}: any) => (
    <View style={styles.row}>
      <Text style={[styles.cell]}>{item.name}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.LinkButton}
          onPress={() => onOpenTerritory(item)}
        >
          <FontAwesome name="globe" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
);
