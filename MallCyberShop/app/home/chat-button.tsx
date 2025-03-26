import React, { useState, useEffect } from "react";
import { Text, Pressable } from "react-native";

const ChatButton = () => {
  const [color, setColor] = useState("#007AFF");

  // Función para generar un color aleatorio
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setColor(getRandomColor());
//     }, 500); // Cambia cada segundo

//     return () => clearInterval(interval); // Limpieza del intervalo
//   }, []);

  return (
    <Pressable onPress={() => console.log("Chat presionado")}>
      <Text
        style={{
          color,
          fontSize: 24,
          //textDecorationLine: "underline",
        }}
      >
        Chat
      </Text>
    </Pressable>
  );
};

export default ChatButton;
