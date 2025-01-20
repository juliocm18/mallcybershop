import {View, Text, TextInput, Button} from "react-native";
import {useState} from "react";
import {useAuth} from "./context/AuthContext";
import {useRouter} from "expo-router";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {signUp} = useAuth();
  const router = useRouter();

  return (
    <View>
      <Text>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} />
      <Text>Password:</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Sign Up" onPress={() => signUp(email, password)} />
      <Button title="Go to Login" onPress={() => router.push("./login")} />
    </View>
  );
}
