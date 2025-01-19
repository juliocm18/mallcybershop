import React, {useState} from "react";
import {View, StyleSheet, Pressable} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import {MaterialIcons} from "@expo/vector-icons";

const initialIcons = [
  {id: "1", name: "home"},
  {id: "2", name: "settings"},
  {id: "3", name: "notifications"},
  {id: "4", name: "favorite"},
  {id: "5", name: "person"},
];

export default function App() {
  const [icons, setIcons] = useState(initialIcons);

  return (
    <GestureHandlerRootView style={styles.container}>
      <DraggableFlatList
        data={icons}
        keyExtractor={(item) => item.id}
        renderItem={({item, drag}) => (
          <Pressable
            onLongPress={drag} // Se usa onLongPress en lugar de onTouchStart
            style={styles.iconContainer}
          >
            <MaterialIcons name={item.name} size={40} color="black" />
          </Pressable>
        )}
        onDragEnd={({data}) => setIcons([...data])} // Se crea un nuevo array
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  iconContainer: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 3,
    alignItems: "center",
  },
});
