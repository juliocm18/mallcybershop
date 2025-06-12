import { Text, StyleSheet, TouchableOpacity, View, Image, Alert, Platform, Linking, ScrollView, KeyboardAvoidingView, SafeAreaView } from "react-native";
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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.container}>
                        <Text style={styles.pageTitle}>Registro de Usuario</Text>
                        
                        <View style={styles.formContainer}>
                            <Text style={styles.inputLabel}>Nombre Completo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ingrese su nombre completo"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                outlineColor="#ddd"
                                activeOutlineColor="#fb8436"
                                theme={{ colors: { primary: '#fb8436' } }}
                            />

                            <Text style={styles.inputLabel}>Correo Electrónico</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ingrese su correo electrónico"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                mode="outlined"
                                outlineColor="#ddd"
                                activeOutlineColor="#fb8436"
                                theme={{ colors: { primary: '#fb8436' } }}
                            />

                            <Text style={styles.inputLabel}>Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                mode="outlined"
                                outlineColor="#ddd"
                                activeOutlineColor="#fb8436"
                                theme={{ colors: { primary: '#fb8436' } }}
                                right={
                                    <TextInput.Icon 
                                        icon={showPassword ? "eye-outline" : "eye-off-outline"} 
                                        onPress={() => setShowPassword(!showPassword)}
                                        color="#666"
                                    />
                                }
                            />

                            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.dateIcon} />
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

                            <Text style={styles.inputLabel}>Foto de Perfil</Text>
                            <TouchableOpacity
                                style={styles.imagePicker}
                                onPress={handlePickImage}
                            >
                                <Ionicons name="camera-outline" size={24} color="#fff" style={styles.cameraIcon} />
                                <Text style={styles.imagePickerText}>Seleccione su foto de perfil</Text>
                            </TouchableOpacity>

                            {logoUri && (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: logoUri }} style={styles.logoPreview} />
                                </View>
                            )}

                            <View style={styles.termsContainer}>
                                <Checkbox.Android
                                    status={termsAccepted ? 'checked' : 'unchecked'}
                                    onPress={() => setTermsAccepted(!termsAccepted)}
                                    color="#fb8436"
                                />
                                <View style={styles.termsTextContainer}>
                                    <Text style={styles.termsText}>Acepto los </Text>
                                    <TouchableOpacity onPress={openTerms}>
                                        <Text style={styles.termsLink}>términos y condiciones</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.registerButton, !termsAccepted && styles.buttonDisabled]}
                                onPress={handleSaveUser}
                                disabled={!termsAccepted}
                            >
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <Text style={styles.buttonText}>Guardando...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Ionicons name="person-add-outline" size={20} color="#fff" style={styles.buttonIcon} />
                                        <Text style={styles.buttonText}>Registrarse</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 35,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 30,
        color: "#fb8436",
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: "#555",
        fontWeight: "500",
    },
    input: {
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    imagePicker: {
        backgroundColor: "#fb8436",
        padding: 15,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cameraIcon: {
        marginRight: 10,
    },
    imagePickerText: { 
        color: "#fff",
        fontWeight: "500",
        fontSize: 16,
    },
    imagePreviewContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    logoPreview: { 
        width: 120, 
        height: 120, 
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#fb8436",
    },
    datePickerButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    dateIcon: {
        marginRight: 10,
    },
    datePickerButtonText: {
        color: '#333',
        fontSize: 16,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10,
    },
    termsTextContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
    },
    termsText: {
        fontSize: 15,
        color: '#333',
    },
    termsLink: {
        fontSize: 15,
        color: '#fb8436',
        textDecorationLine: 'underline',
    },
    registerButton: {
        backgroundColor: "#fb8436",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    }
});