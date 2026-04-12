import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function Admin() {
  const [productName, setProductName] = useState('');
  // We use an array of objects so the admin can add multiple rows
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [statusMessage, setStatusMessage] = useState('');

 // Function to update a specific row when typing
const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
  const newIngredients = [...ingredients];
  newIngredients[index][field] = value;
  setIngredients(newIngredients);
};

  // Function to add a new blank row
  const addIngredientRow = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const handleAddProduct = async () => {
    if (!productName) {
      Alert.alert("Missing Info", "Please provide a product name.");
      return;
    }

    try {
      setStatusMessage('Saving product and ingredients...');

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: productName,
          ingredients: ingredients // Send the whole array!
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(data.message);
        Alert.alert("Success!", data.message);
        // Clear the form to start fresh
        setProductName(''); 
        setIngredients([{ name: '', quantity: '' }]);
      } else {
        setStatusMessage("Error: " + data.error);
        Alert.alert("Failed", data.error);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Network Error: Could not reach the server.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>Recipe Creator</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Caramel Macchiato" 
          value={productName}
          onChangeText={setProductName}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Ingredients List</Text>

        {/* Loop through our ingredients array and generate input fields */}
        {ingredients.map((ing, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput 
              style={[styles.input, styles.ingNameInput]} 
              placeholder="Name (e.g., Espresso)" 
              value={ing.name}
              onChangeText={(text) => handleIngredientChange(index, 'name', text)}
            />
            <TextInput 
              style={[styles.input, styles.ingQtyInput]} 
              placeholder="Qty" 
              value={ing.quantity}
              onChangeText={(text) => handleIngredientChange(index, 'quantity', text)}
              keyboardType="numeric"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.secondaryButton} onPress={addIngredientRow}>
          <Text style={styles.secondaryButtonText}>+ Add Another Ingredient</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleAddProduct}>
          <Text style={styles.buttonText}>Save Recipe to Database</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{statusMessage}</Text>

      <Link href="/" style={styles.linkText}>← Back to POS</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#F5F5F5', alignItems: 'center', padding: 20, paddingVertical: 40 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '100%', maxWidth: 400, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ingNameInput: { flex: 2, marginRight: 10 },
  ingQtyInput: { flex: 1 },
  secondaryButton: { backgroundColor: '#E5F1FF', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 25 },
  secondaryButtonText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#28a745', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  status: { marginTop: 20, fontSize: 14, color: '#888', textAlign: 'center' },
  linkText: { marginTop: 30, fontSize: 16, color: '#007AFF', fontWeight: '600' }
});