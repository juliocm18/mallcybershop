import {StyleSheet} from "react-native";
export const styles = StyleSheet.create({
  container: {padding: 20},
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  cell: {flex: 1},
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%", // Ajusta el ancho del modal
    minHeight: 200, // Altura mínima
    //maxHeight: "90%", // No sobrepasar el 80% de la pantalla
  },
  label: {fontSize: 16, marginBottom: 5, color: "#898989"},
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  socialModaltitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#ff9f61",
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 5,
    height: 40,
    justifyContent: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    height: 40,
    justifyContent: "center",
  },
  LinkButton: {
    backgroundColor: "#0087ff",
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  greenLinkButton: {
    backgroundColor: "#08C737AB",
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  imagePicker: {
    backgroundColor: "#0087ff",
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  imagePickerText: {color: "#fff"},
  logoPreview: {width: 100, height: 100, marginBottom: 15},
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  modalCancelButton: {
    backgroundColor: "#898989",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "45%",
  },

  modalUpdateButton: {
    backgroundColor: "#ff9f61",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "45%",
  },
  socialModalFooterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 15,
    color: "#fb8436",
  },
  title: {
    fontSize: 20,
    marginBottom: 5,
    color: "#fb8436",
    textAlign: "center",
    fontWeight: "bold",
    padding: 10,
  },
});
