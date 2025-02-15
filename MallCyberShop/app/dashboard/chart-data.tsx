import React from "react";
import {
  Text,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  FlatList as RNFlatList,
  View,
  FlatList,
} from "react-native";
import {LineChart} from "react-native-chart-kit";
// Asumimos que tienes estilos definidos

const screenWidth = Dimensions.get("window").width;

interface Props {
  data: number[];
  totalCounter: number;
  loading: boolean;
  labels: string[];
  reportType: string;
}

const ChartData: React.FC<Props> = ({
  data,
  totalCounter,
  loading,
  labels,
  reportType,
}) => {
  if (data.length === 0) {
    return <LoadingOrMessage loading={loading} />;
  }
  if (reportType === "totalByCompany") {
    return <CompanyList data={data} />;
  } else {
    if (data.length > 5) {
      return <TotalCounter totalCounter={totalCounter} />;
    }
    return <Chart data={data} labels={labels} />;
  }
};

const LoadingOrMessage: React.FC<{loading: boolean}> = ({loading}) => {
  return loading ? (
    <ActivityIndicator size="large" color="#ff9f61" />
  ) : (
    <Text>Realice una búsqueda</Text>
  );
};

const TotalCounter: React.FC<{totalCounter: number}> = ({totalCounter}) => {
  return <Text>Numero de Ingresos: {totalCounter}</Text>;
};

const CompanyList: React.FC<{data: any[]}> = ({data}) => {
  return (
    <FlatList
      data={data}
      renderItem={({item}: any) => (
        <View style={styles.itemContainer}>
          <Text style={styles.itemTitle}>
            S.E: <Text style={styles.bold}>{item.name}</Text>
          </Text>
          <Text style={styles.itemSubtitle}>
            Total: <Text style={styles.bold}>{item.total_count}</Text>
          </Text>
        </View>
      )}
      //keyExtractor={(item) => item.id.toString()} // Asumiendo que cada item tiene un id único
    />
  );
};

const Chart: React.FC<{data: number[]; labels: string[]}> = ({
  data,
  labels,
}) => {
  return (
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
  );
};

const styles = StyleSheet.create({
  chart: {
    marginVertical: 20,
    borderRadius: 10,
  },
  itemContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    color: "#333",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  bold: {
    fontWeight: "bold",
  },
});

export default ChartData;
