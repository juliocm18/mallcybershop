import React, {useState, useEffect} from "react";
import {Picker} from "@react-native-picker/picker";
import {View, Text, Button, Alert, TouchableOpacity} from "react-native";
import {supabase} from "../supabase"; // Asegúrate de importar tu configuración de Supabase
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ChartData from "./chart-data";
import {styles} from "./styles";

const options = [
  {value: "totalIngreso", display: "Total de Ingresos"},
  {value: "totalLogs", display: "Tiempo total en la aplicación"},
  {value: "totalByCompany", display: "Total de ingresos por Empresa"},
];
const Dashboard = () => {
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  const [totalCounter, setTotalCounter] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const [reportType, setReportType] = useState<string>("");
  const [selectedReportType, setSelectedReportType] = useState<string>("");

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

  const handleSearch = async () => {
    setReportType(selectedReportType);
    if (selectedStartDate === null || selectedEndDate === null) {
      Alert.alert("Error", "Selecciona las fechas de inicio y fin");
      return;
    }
    if (reportType === "totalIngreso") {
      fetchData();
    } else if (reportType === "totalLogs") {
      fetchSessionLogs();
    } else if (reportType === "totalByCompany") {
      console.log("🏢 Buscando total por empresa");
      fetchTotalByCompany();
    }
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

  const fetchTotalByCompany = async () => {
    setLabels([]);
    setData([]);
    setLoading(true);

    if (selectedStartDate === null || selectedEndDate === null) {
      Alert.alert("Error", "Selecciona las fechas de inicio y fin");
      setLoading(false);
      return;
    }

    const {data, error} = await supabase.rpc("get_company_count4", {
      start_date: selectedStartDate.toISOString(),
      end_date: selectedEndDate.toISOString(),
    });

    if (error) {
      console.error(error);
    } else {
      setData(data);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Control</Text>

      <View style={styles.datePickerContainer}>
        <TouchableOpacity style={styles.button} onPress={showStartDatePicker}>
          {selectedStartDate ? (
            <Text style={{marginTop: 20, color: "white"}}>
              📅 Fecha Inicio: {selectedStartDate.toLocaleString()}
            </Text>
          ) : (
            <Text style={styles.buttonText}>📅 Fecha Inicio</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={showEndDatePicker}>
          {selectedEndDate ? (
            <Text style={{marginTop: 20, color: "white"}}>
              📅 Fecha Fin: {selectedEndDate.toLocaleString()}
            </Text>
          ) : (
            <Text style={styles.buttonText}>📅 Fecha Fin</Text>
          )}
        </TouchableOpacity>
      </View>

      <View>
        <Text style={styles.label}>Tipo de Reporte:</Text>
        <View style={styles.input}>
          <Picker
            selectedValue={reportType}
            onValueChange={(itemValue) => setSelectedReportType(itemValue)}
          >
            {options.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.display}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      <Button title="Buscar" onPress={handleSearch} color="#ff9f61" />

      <ChartData
        data={data}
        totalCounter={totalCounter || 0}
        loading={loading}
        labels={labels}
        reportType={reportType}
      />

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
    </View>
  );
};

export default Dashboard;
