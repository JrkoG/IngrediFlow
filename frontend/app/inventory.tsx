import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  

  // useEffect runs this code automatically as soon as the screen opens
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      // Note: Change localhost to your IP address if testing on a physical phone!
      const response = await fetch('http://localhost:5000/api/inventory');
      const data = await response.json();

      if (response.ok) {
        setInventory(data);
      } else {
        console.error("Error from server:", data.error);
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // This designs how a single ingredient row looks
  const renderIngredient = ({ item }: { item: { id: string, name: string, current_stock: number } }) => (
    <View style={styles.card}>
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>Stock:</Text>
        <Text style={[
          styles.stockValue, 
          item.current_stock <= 0 ? styles.outOfStock : styles.inStock
        ]}>
          {item.current_stock}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Inventory</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={fetchInventory}>
        <Text style={styles.refreshText}>↻ Refresh Data</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={inventory}
          keyExtractor={(item) => item.id}
          renderItem={renderIngredient}
          contentContainerStyle={styles.listContainer}
          // Show a message if the database is completely empty
          ListEmptyComponent={<Text style={styles.emptyText}>No ingredients found.</Text>}
        />
      )}

      <Link href="/" style={styles.linkText}>← Back to POS</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, paddingTop: 40 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  refreshButton: { backgroundColor: '#E5F1FF', padding: 10, borderRadius: 8, alignSelf: 'center', marginBottom: 20 },
  refreshText: { color: '#007AFF', fontWeight: 'bold' },
  listContainer: { paddingBottom: 40 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  itemName: { fontSize: 18, fontWeight: '600', color: '#333' },
  stockContainer: { alignItems: 'flex-end' },
  stockLabel: { fontSize: 12, color: '#888' },
  stockValue: { fontSize: 20, fontWeight: 'bold' },
  inStock: { color: '#28a745' }, // Green
  outOfStock: { color: '#dc3545' }, // Red
  emptyText: { textAlign: 'center', color: '#888', marginTop: 30, fontSize: 16 },
  linkText: { marginTop: 20, fontSize: 16, color: '#007AFF', fontWeight: '600', textAlign: 'center' }
});