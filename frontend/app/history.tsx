import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Link, useNavigation } from 'expo-router';

interface SaleLog {
  id: string;
  product_name: string;
  timestamp: string;
}

export default function SalesHistory() {
  const [logs, setLogs] = useState<SaleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://192.168.254.109:5000/api/sales/history');
      const data = await response.json();
      if (response.ok) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed fetching sales log history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderLogItem = ({ item }: { item: SaleLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logLeft}>
        <Text style={styles.productText}>{item.product_name}</Text>
        <Text style={styles.dateText}>{item.timestamp}</Text>
      </View>
      <View style={styles.logRight}>
        <Text style={styles.qtyBadge}>1x Sold</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction Ledger</Text>
      <Text style={styles.subHeader}>Historical logging of automated BOM updates</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sales transactions logged in this ledger cycle.</Text>
          }
        />
      )}

      <View style={styles.footerNav}>
        <Link href="/" style={styles.navLink}>🖥️ POS Home</Link>
        <Link href="/inventory" style={styles.navLink}>📦 Stock View</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#212529', textAlign: 'center' },
  subHeader: { fontSize: 13, color: '#6C757D', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  listContent: { paddingBottom: 30 },
  logCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.04)'
  },
  logLeft: { flex: 1 },
  logRight: { marginLeft: 10 },
  productText: { fontSize: 17, fontWeight: '600', color: '#343A40' },
  dateText: { fontSize: 12, color: '#868E96', marginTop: 4 },
  qtyBadge: { 
    backgroundColor: '#E6F0FF', 
    color: '#007AFF', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 6, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  emptyText: { textAlign: 'center', color: '#ADB5BD', marginTop: 40, fontSize: 15 },
  footerNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12,
    boxShadow: '0px -2px 10px rgba(0,0,0,0.03)'
  },
  navLink: { fontSize: 15, color: '#007AFF', fontWeight: 'bold' }
});