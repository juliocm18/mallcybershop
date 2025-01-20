import {View, Text, Button} from "react-native";
import {useAuth} from "./context/AuthContext";

export default function Home() {
  const {signOut} = useAuth();

  return (
    <View>
      <Text>Welcome to Home</Text>
      <Button title="Logout" onPress={signOut} />
    </View>
  );
}
