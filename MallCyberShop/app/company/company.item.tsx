import React from "react";
import {View, Text, TouchableOpacity, ActivityIndicator} from "react-native";

import {styles} from "./styles";
import {FontAwesome} from "@expo/vector-icons";

export const CompanyItem = React.memo(
  ({item, onEdit, onLinks, onDelete, deleting}: any) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(item)}
        >
          <FontAwesome name="edit" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.LinkButton}
          onPress={() => onLinks(item)}
        >
          <FontAwesome name="link" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id || 0)}
          disabled={deleting === item.id}
        >
          {deleting === item.id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <FontAwesome name="trash" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
);
