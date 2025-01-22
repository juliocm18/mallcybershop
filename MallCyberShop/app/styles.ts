import {StyleSheet} from "react-native";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9f61",
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf7f7",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: 50,
    color: "#000",
    fontSize: 16,
  },
  categoryButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#ff5a5f",
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#ff5a5f",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoContainer: {
    marginHorizontal: 10, // Espacio horizontal entre las celdas
    //marginBottom: 20, // Aumenta el espacio entre las filas
    alignItems: "center",
    justifyContent: "center",
    height: 120, // Asegura que haya suficiente altura para el ícono y el texto
  },
  logoWrapper: {
    width: 60,
    height: 60,
    marginBottom: 10, // Mayor espacio entre la imagen y el texto
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  logoLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  checkboxContainer: {
    marginVertical: 10, // Espacio vertical entre checkboxes
    paddingVertical: 5, // Más espacio para mejorar la interacción
  },
  checkboxText: {
    fontSize: 16,
    textDecorationLine: "none",
    color: "#333",
    fontWeight: "bold",
  },
  checkboxIcon: {
    borderRadius: 5, // Bordes más suaves
  },
  floatingWhatsAppButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#25D366",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  socialModaltitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  socialModallinksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  socialModallinkButton: {
    flexBasis: "48%", // Dos columnas
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 5,
    alignItems: "center",
  },
  socialModallinkText: {
    fontSize: 16,
  },
  socialModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
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
