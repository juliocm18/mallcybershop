import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Button,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {supabase} from "../supabase"; // Asegúrate de importar tu configuración de Supabase
import {LineChart} from "react-native-chart-kit";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const Dashboard = () => {
  const screenWidth = Dimensions.get("window").width;

  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  const [totalCounter, setTotalCounter] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const showStartDatePicker = () => {
    setStartDatePickerVisible(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisible(false);
  };

  const handleStartConfirm = (date: Date) => {
    setSelectedStartDate(date);
    hideStartDatePicker();
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisible(true);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisible(false);
  };

  const handleEndConfirm = (date: Date) => {
    setSelectedEndDate(date);
    hideEndDatePicker();
  };

  const fetchData = async () => {
    setLabels([]);
    setData([]);
    setLoading(true);

    if (selectedStartDate === null || selectedEndDate === null) {
      Alert.alert("Error", "Selecciona las fechas de inicio y fin");
      setLoading(false);
      return;
    }

    const {error, data} = await supabase
      .from("counter")
      .select("created_at")
      .gte("created_at", selectedStartDate.toISOString())
      .lte("created_at", selectedEndDate.toISOString());

    //console.log("data", data);

    if (error) {
      console.error(error);
    } else {
      setTotalCounter(data.length);
      // Procesar los datos para contarlos por día
      const groupedData = data.reduce((acc: Record<string, number>, item) => {
        const dateKey = new Date(item.created_at).toLocaleDateString();
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {});

      console.log("📊 Datos agrupados:", groupedData);

      setLabels(Object.keys(groupedData));
      setData(Object.values(groupedData));
    }
    setLoading(false);
  };

  const fetchSessionLogs = async () => {
    setLoading(true);
    setLabels([]);
    setData([]);
    if (selectedStartDate === null || selectedEndDate === null) {
      Alert.alert("Error", "Selecciona las fechas de inicio y fin");
      setLoading(false);
      return;
    }

    const {error, data} = await supabase
      .from("session_logs")
      .select("*")
      .gte("created_at", selectedStartDate.toISOString())
      .lte("created_at", selectedEndDate.toISOString());

    //console.log("data", data);

    if (error) {
      console.error(error);
    } else {
      // Procesar los datos para contarlos por día
      const groupedData = data.reduce((acc: Record<string, number>, item) => {
        const dateKey = new Date(item.created_at).toLocaleDateString();
        acc[dateKey] = (acc[dateKey] || 0) + item.duration_seconds / 60;
        return acc;
      }, {});

      const totalSum = Object.values(groupedData).reduce(
        (sum, value) => sum + value,
        0
      );
      setTotalCounter(totalSum);
      console.log("📊 Datos agrupados:", groupedData);
      setLabels(Object.keys(groupedData));
      setData(Object.values(groupedData));
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {/* Selectores de Fecha */}
      <View style={styles.pickerContainer}>
        <Button
          title="📅 Fecha Inicio"
          onPress={showStartDatePicker}
          color="#0087ff"
        />
        {selectedStartDate && (
          <Text style={{marginTop: 20}}>
            Selected Date: {selectedStartDate.toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.pickerContainer}>
        <Button
          title="📅 Fecha Fin"
          onPress={showEndDatePicker}
          color="#0087ff"
        />
        {selectedEndDate && (
          <Text style={{marginTop: 20}}>
            Selected Date: {selectedEndDate.toLocaleString()}
          </Text>
        )}
      </View>

      <Button
        title="Buscar Total de ingresos"
        onPress={fetchData}
        color="#ff9f61"
      />

      <Button
        title="Tiempo total en la aplicación"
        onPress={fetchSessionLogs}
        color="#ff9f61"
      />

      {data.length === 0 ? (
        loading ? (
          <ActivityIndicator size="large" color="#ff9f61" />
        ) : (
          <Text>Realice una búsqueda</Text>
        )
      ) : data.length > 5 ? (
        <Text>Numero de Ingresos: {totalCounter} </Text>
      ) : (
        <LineChart
          data={{
            labels: labels,
            datasets: [{data: data}],
          }}
          width={screenWidth - 10}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: () => "#ff9f61",
            labelColor: () => "#333",
            decimalPlaces: 0,
            propsForDots: {r: "6", strokeWidth: "2", stroke: "#fff"},
          }}
          style={styles.chart}
        />
      )}

      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="datetime"
        onConfirm={handleStartConfirm}
        onCancel={hideStartDatePicker}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="datetime"
        onConfirm={handleEndConfirm}
        onCancel={hideEndDatePicker}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
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
});

export default Dashboard;
