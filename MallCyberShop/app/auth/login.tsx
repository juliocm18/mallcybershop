import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {useState} from "react";
import {useAuth} from "../context/AuthContext";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import RoleFunctions from "../role/functions";
import {globalStyles} from "../styles";
import { ActivityIndicator } from "react-native-paper";
import { useTranslation } from "react-i18next";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {signIn} = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.error.completeFields'));
      return;
    }
    setLoading(true);

    try {
      const userLogged = await signIn(email, password);
      if (userLogged && userLogged.id) {
        const roles = await RoleFunctions.getByUser(userLogged.id);
        roles ? (userLogged.roles = roles) : (userLogged.roles = []);
      }
      setError(null);
      router.push("../adminhome");
    } catch (err) {
      setError(t('auth.error.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.pageTitle}>{t('auth.login')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={24}
          />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t('auth.loginButton')}
                  </Text>
                )}
              </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../home/home")}
      >
        <Text style={styles.buttonText}>{t('auth.goToStore')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
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
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  eyeButton: {
    padding: 10,
  },
  eyeText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: "#ff9f61",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
});
