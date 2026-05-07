import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';

// Defining our TypeScript shape to keep the editor happy
type Ingredient = { id: string, name: string, current_stock: number };

export default function Restock() {
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the form
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/inventory');
      const data = await response.json();
      if (response.ok) setInventory(data);
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedId) {
      Alert.alert("Missing Info", "Please select an ingredient to restock.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid number.");
      return;
    }

    try {
      setStatusMessage('Updating database...');
      const response = await fetch('http://localhost:5000/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ingredient_id: selectedId,
          amount: amount
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(data.message);
        Alert.alert("Success!", data.message);
        setAmount(''); // Clear the input
        fetchInventory(); // Refresh the list to show the new stock!
      } else {
        setStatusMessage("Error: " + data.error);
        Alert.alert("Failed", data.error);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Network Error: Could not reach the server.");
    }
  };

  const renderIngredient = ({ item }: { item: Ingredient }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity 
        style={[styles.itemCard, isSelected && styles.selectedCard]} 
        onPress={() => setSelectedId(item.id)}
      >
        <Text style={[styles.itemName, isSelected && styles.selectedText]}>{item.name}</Text>
        <Text style={[styles.itemStock, isSelected && styles.selectedText]}>Current: {item.current_stock}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Restock Inventory</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>1. Select an Ingredient below</Text>
        
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <FlatList 
              data={inventory}
              keyExtractor={(item) => item.id}
              renderItem={renderIngredient}
              horizontal={true} // Makes it a neat scrolling row
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        <Text style={styles.label}>2. Amount to Add</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., 500" 
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleRestock}>
          <Text style={styles.buttonText}>Add to Stock</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{statusMessage}</Text>

      <Link href="/inventory" style={styles.linkText}>← Back to Live Inventory</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', padding: 20, paddingTop: 40 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  formCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '100%', maxWidth: 400, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10, marginTop: 10 },
  listContainer: { height: 70, marginBottom: 15 },
  itemCard: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginRight: 10, justifyContent: 'center', minWidth: 120 },
  selectedCard: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  itemStock: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 4 },
  selectedText: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#28a745', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  status: { marginTop: 20, fontSize: 14, color: '#888', textAlign: 'center' },
  linkText: { marginTop: 30, fontSize: 16, color: '#007AFF', fontWeight: '600' }
});