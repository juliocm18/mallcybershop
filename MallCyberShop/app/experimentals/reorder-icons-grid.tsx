import React, {useState} from "react";
import {View, StyleSheet, Text} from "react-native";
import {DraggableGrid} from "react-native-draggable-grid";

const MyTest = () => {
  const [data, setData] = useState([
    {name: "1", key: "one"},
    {name: "2", key: "two"},
    {name: "3", key: "three"},
    {name: "4", key: "four"},
    {name: "5", key: "five"},
    {name: "6", key: "six"},
    {name: "7", key: "seven"},
    {name: "8", key: "eight"},
    {name: "9", key: "night"},
    {name: "0", key: "zero"},
  ]);

  const render_item = (item: {name: string; key: string}) => (
    <View style={styles.item} key={item.key}>
      <Text style={styles.item_text}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <DraggableGrid
        numColumns={4}
        renderItem={render_item}
        data={data}
        onDragRelease={(newData) => setData(newData)} // Update data on drag release
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 100,
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  item: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
  },
  item_text: {
    fontSize: 40,
    color: "#FFFFFF",
  },
});

export default MyTest;
