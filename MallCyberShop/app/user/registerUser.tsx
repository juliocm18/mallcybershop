import { Text, StyleSheet, TouchableOpacity, View, Image, Alert, Platform, Linking } from "react-native";
import { TextInput, Checkbox } from "react-native-paper";
import { globalStyles } from "../styles";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { pickImage, uploadImage } from "../company/functions";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../context/AuthContext";
import UserFunctions from "./functions";

export default function RegisterUser() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [birthDate, setBirthDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [name, setName] = useState("");

    const { signUp } = useAuth();

    const clearFields = () => {
        setEmail("");
        setPassword("");
        setLogoUri(null);
        setLoading(false);
    };

    const handlePickImage = async () => {

        const uri = await pickImage(); // 
        if (uri) {
            setLogoUri(uri); // 
        }
    };

    const handleSaveUser = async () => {
        if (!email || !password || !logoUri || !birthDate || !termsAccepted) {
            Alert.alert("Error", "Debe completar todos los campos y aceptar los términos y condiciones");
            return;
        }

        // Validar que el usuario tenga al menos 18 años
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            Alert.alert("Error", "Debes tener al menos 18 años para registrarte");
            return;
        }

        setLoading(true);
        try {
            const uploadedUrl = await uploadImage(logoUri);
            console.log("uploadedUrl", uploadedUrl);
            if (uploadedUrl) {
                console.log(" Imagen subida con éxito:", uploadedUrl);
            } else {
                return;
            }

            const userSaved = await UserFunctions.saveClient(email, password);

            const newProfile = {
                id: userSaved.id,
                avatar_url: uploadedUrl,
                name: name,
                birth_date: birthDate.toISOString().split('T')[0],
            };
            await UserFunctions.saveClientProfile(newProfile);
            Alert.alert("Aviso", "Registro creado con éxito");
            clearFields();
        } catch (error: any) {
            console.error("Error al crear el usuario:", error);
            Alert.alert("Error", "Ocurrió un error al crear el usuario");
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setBirthDate(selectedDate);
        }
    };

    const openTerms = async () => {
        const url = 'https://mallcybershop.com/terms'; // Reemplaza con la URL real de tus términos
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "No se puede abrir el enlace");
        }
    };

    return (
        <View style={globalStyles.whiteContainer}>
            <Text style={globalStyles.pageTitle}>Registro de Usuario</Text>

            <TextInput
                style={globalStyles.input}
                placeholder="Ingrese su nombre completo"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={globalStyles.input}
                placeholder="Ingrese su correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                underlineColorAndroid="transparent"

            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    underlineColorAndroid="transparent"
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={24}
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.datePickerButtonText}>
                    {birthDate ? birthDate.toLocaleDateString() : 'Seleccione su fecha de nacimiento'}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                />
            )}

            <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
            >
                <Text style={styles.imagePickerText}>Seleccione su foto de perfil</Text>
            </TouchableOpacity>

            {logoUri && (
                <Image source={{ uri: logoUri }} style={styles.logoPreview} />
            )}

            <View style={styles.termsContainer}>
                <Checkbox.Android
                    status={termsAccepted ? 'checked' : 'unchecked'}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    color="#0087ff"
                />
                <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>Acepto los </Text>
                    <TouchableOpacity onPress={openTerms}>
                        <Text style={styles.termsLink}>términos y condiciones</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.imagePicker, !termsAccepted && styles.buttonDisabled]}
                onPress={handleSaveUser}
                disabled={!termsAccepted}
            >
                <Text style={styles.imagePickerText}>
                    {loading ? "Guardando..." : "Registrarse"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        backgroundColor: 'white',
    },
    eyeButton: {
        padding: 10,
        backgroundColor: '#fff',
    },
    eyeText: {
        fontSize: 18,
    },
    imagePicker: {
        backgroundColor: "#0087ff",
        padding: 10,
        alignItems: "center",
        marginBottom: 10,
    },
    imagePickerText: { color: "#fff" },
    logoPreview: { width: 100, height: 100, marginBottom: 15 },
    datePickerButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    datePickerButtonText: {
        color: '#333',
        fontSize: 16,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    termsTextContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
    },
    termsText: {
        fontSize: 14,
        color: '#333',
    },
    termsLink: {
        fontSize: 14,
        color: '#0087ff',
        textDecorationLine: 'underline',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    }
});