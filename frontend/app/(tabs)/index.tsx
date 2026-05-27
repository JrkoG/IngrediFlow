import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Link } from 'expo-router';

// TypeScript definition
type Product = { id: string, name: string };

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch products as soon as the app loads
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.254.109:5000/api/products');
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data);
      } else {
        Alert.alert("Error", "Could not load products.");
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // This handles the sale dynamically based on WHICH button was pressed
  const handleCheckout = async (productId: string, productName: string) => {
    try {
      setProcessing(true);
      const response = await fetch('http://192.168.254.109:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sale Successful!", `Sold 1x ${productName}\nIngredients deducted!`);
      } else {
        Alert.alert("Sale Failed", data.error || "Not enough stock.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not reach the server.");
    } finally {
      setProcessing(false);
    }
  };

  // The design for a single product button
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productButton} 
      onPress={() => handleCheckout(item.id, item.name)}
      disabled={processing}
    >
      <Text style={styles.productText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>IngrediFlow POS</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.gridContainer}>
          <FlatList 
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            numColumns={2} // Arranges buttons in a neat 2-column grid
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No products found. Go to Admin to add some!</Text>}
          />
        </View>
      )}

      {/* Navigation Footer */}
      <View style={styles.navContainer}>
        <Link href="/analytics" style={styles.linkText}>📊 Analytics</Link>
        <Link href="/admin" style={styles.linkText}>⚙️ Admin</Link>
        <Link href="/inventory" style={styles.linkText}>📦 Inventory</Link>
        <Link href="/restock" style={styles.linkText}>🚚 Restock</Link>
        <Link href="/history" style={styles.linkText}>📜 History</Link>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, paddingTop: 50 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  gridContainer: { flex: 1, width: '100%' },
  listContent: { paddingBottom: 20 },
  productButton: { 
    flex: 1, 
    backgroundColor: '#007AFF', 
    padding: 25, 
    margin: 8, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' // Modern shadow format!
  },
  productText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  navContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 15, 
    marginTop: 10,
    boxShadow: '0px -2px 10px rgba(0,0,0,0.05)'
  },
  linkText: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' }
});