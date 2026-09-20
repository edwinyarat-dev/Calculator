import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import CalculusLimitVisualizer from './components/CalculusLimitVisualizer';
import DataStatisticsModule from './components/DataStatisticsModule';
import TrigonometryUnitCircle from './components/TrigonometryUnitCircle';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CalculusLimitVisualizer />
        <TrigonometryUnitCircle />
        <DataStatisticsModule />
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
