import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function Home() {
  const [statusMessage, setStatusMessage] = useState('Ready for next customer.');

  const handleSale = async () => {
    try {
      setStatusMessage('Processing sale...');

      // ⚠️ IMPORTANT NETWORK NOTE:
      // If you are testing on a web browser or PC emulator, 'localhost' works perfectly.
      // If you are testing on a physical phone via Expo Go, you must replace 'localhost' 
      // with your computer's IPv4 address (e.g., http://192.168.1.5:5000/api/sales)
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productId: 'prod_001', 
          quantitySold: 1 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(data.message);
        Alert.alert("Transaction Successful!", data.message);
      } else {
        setStatusMessage("Error: " + data.error);
        Alert.alert("Transaction Failed", data.error);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Network Error: Could not reach the server.");
      Alert.alert("Network Error", "Is your backend running?");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>IngrediFlow POS</Text>
      
      <View style={styles.card}>
        <Text style={styles.productName}>Large Milk Tea</Text>
        <Text style={styles.recipeNote}>Deducts: 200ml Fresh Milk</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleSale}>
          <Text style={styles.buttonText}>Ring Up Sale</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{statusMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  productName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 5,
  },
  recipeNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 30,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});