import {StyleSheet} from "react-native";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff9f61",
    marginBottom: 20,
  },
  pickerContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  chart: {
    marginVertical: 20,
    borderRadius: 10,
  },
  datePickerContainer: {
    flexDirection: "column", // Asegura que los botones estén en una columna
    alignItems: "center", // Centra los botones horizontalmente
    justifyContent: "center", // Centra los botones verticalmente
    marginTop: 20, // Un margen superior para el espaciado
  },
  button: {
    marginBottom: 10, // Añadir espacio entre los botones
    padding: 10,
    backgroundColor: "#0087ff", // O el color que desees
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  label: {fontSize: 16, marginBottom: 5, color: "#898989"},
  input: {
    width: 300,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});
