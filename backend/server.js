const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Initialize Express
const app = express();
app.use(cors());
app.use(express.json()); // Allows your server to read JSON data from the frontend

// 2. Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 3. Create a simple test route
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'IngrediFlow Backend is running and connected to Firebase!' });
});

// --- UPDATED SALES ROUTE WITH HISTORICAL LOGGING ---
app.post('/api/sales', async (req, res) => {
  try {
    const { product_id } = req.body;
    console.log(`--- Processing Sale & Logging for Product: ${product_id} ---`);

    const productDoc = await db.collection('products').doc(product_id).get();
    if (!productDoc.exists) return res.status(404).json({ error: 'Product not found' });

    const productData = productDoc.data();
    const recipe = productData.recipe || [];
    const batch = db.batch();

    // 1. Inventory Deduction Loop
    for (const item of recipe) {
      if (!item.ingredient_id) continue;

      const qtyNeeded = Number(item.quantity_needed) || 0;
      if (qtyNeeded <= 0) continue;

      const ingRef = db.collection('ingredients').doc(item.ingredient_id);
      const ingDoc = await ingRef.get();

      if (ingDoc.exists) {
        const currentStock = Number(ingDoc.data().current_stock) || 0;
        if (currentStock >= qtyNeeded) {
          batch.update(ingRef, { current_stock: currentStock - qtyNeeded });
        } else {
          return res.status(400).json({ error: `Not enough ${ingDoc.data().name}` });
        }
      }
    }

    // 2. Log Transaction to Sales History Collection
    const historyRef = db.collection('sales_history').doc();
    batch.set(historyRef, {
      product_id: product_id,
      product_name: productData.name,
      timestamp: admin.firestore.FieldValue.serverTimestamp() // Secure server-side time
    });

    await batch.commit();
    res.status(200).json({ message: 'Sale processed and logged successfully!' });

  } catch (error) {
    console.error("CRITICAL ERROR IN SALES ROUTE:", error.message);
    res.status(500).json({ error: 'Server error processing transaction.' });
  }
});

// --- NEW GET ROUTE: FETCH TRANSACTION LOGS ---
app.get('/api/sales/history', async (req, res) => {
  try {
    // Fetches history sorting by latest timestamp first
    const snapshot = await db.collection('sales_history').orderBy('timestamp', 'desc').get();
    const historyList = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Cleanly parse the Firestore timestamp object to a readable string before sending
      let readableTime = "Unknown Date";
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        readableTime = data.timestamp.toDate().toLocaleString();
      }

      historyList.push({
        id: doc.id,
        product_name: data.product_name,
        timestamp: readableTime
      });
    });

    res.status(200).json(historyList);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: 'Failed to retrieve transaction history.' });
  }
});

// --- ADMIN ROUTE: ADD NEW PRODUCT (DYNAMIC INGREDIENTS) ---
app.post('/api/products', async (req, res) => {
  try {
    const { name, ingredients } = req.body; 
    // ingredients will look like: [{ name: "Fresh Milk", quantity: 150 }, { name: "Espresso", quantity: 2 }]
    
    const recipe = [];

    // Loop through the ingredients the admin typed in
    for (const item of ingredients) {
      const ingName = item.name.trim();
      const qty = Number(item.quantity);

      if (!ingName || isNaN(qty) || qty <= 0) continue; // Skip empty or invalid rows

      // 1. Check if this ingredient already exists in the database
      const ingQuery = await db.collection('ingredients').where('name', '==', ingName).get();
      let ingredientId;

      if (ingQuery.empty) {
        // 2. If it DOES NOT exist, create it automatically with 0 stock!
        const newIngRef = await db.collection('ingredients').add({
          name: ingName,
          current_stock: 0 
        });
        ingredientId = newIngRef.id;
      } else {
        // 3. If it DOES exist, grab its existing ID
        ingredientId = ingQuery.docs[0].id;
      }

      // Add to our final recipe array
      recipe.push({
        ingredient_id: ingredientId,
        quantity_needed: qty
      });
    }

    // 4. Save the final product with the correct recipe IDs
    const newProductRef = await db.collection('products').add({
      name: name,
      recipe: recipe
    });

    res.status(201).json({ 
      message: `Successfully added ${name} and linked ingredients!`,
      productId: newProductRef.id
    });

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: 'Failed to add new product.' });
  }
});

// --- ADMIN ROUTE: GET LIVE INVENTORY ---
app.get('/api/inventory', async (req, res) => {
  try {
    console.log("📦 Inventory request received at /api/inventory");
    
    const snapshot = await db.collection('ingredients').get();
    const inventoryList = [];
    
    snapshot.forEach(doc => {
      // 🚨 FIX: Defining the 'data' variable properly here resolves the ReferenceError
      const data = doc.data(); 
      
      inventoryList.push({
        id: doc.id,
        name: data.name || "Unnamed Ingredient",
        current_stock: Number(data.current_stock) || 0,
        threshold: Number(data.threshold) || 20 
      });
    });

    res.status(200).json(inventoryList);

  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
});

// --- ADMIN ROUTE: RESTOCK INGREDIENT ---
app.post('/api/inventory/restock', async (req, res) => {
  try {
    const { ingredient_id, amount } = req.body;
    const addAmount = Number(amount);

    // 1. Validate the input (block NaNs and negative numbers)
    if (!ingredient_id || isNaN(addAmount) || addAmount <= 0) {
      return res.status(400).json({ error: 'Invalid ingredient ID or amount.' });
    }

    const ingRef = db.collection('ingredients').doc(ingredient_id);
    const doc = await ingRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Ingredient not found.' });
    }

    // 2. Calculate the new total
    const currentStock = doc.data().current_stock || 0;
    const newStock = currentStock + addAmount;

    // 3. Update only the current_stock field in Firebase
    await ingRef.update({
      current_stock: newStock
    });

    res.status(200).json({ 
      message: `Successfully added ${addAmount} to stock!`, 
      newStock: newStock 
    });

  } catch (error) {
    console.error("Error restocking:", error);
    res.status(500).json({ error: 'Failed to restock ingredient.' });
  }
});

// --- POS ROUTE: GET ALL PRODUCTS ---
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const productsList = [];
    
    snapshot.forEach(doc => {
      productsList.push({
        id: doc.id,
        name: doc.data().name
      });
    });

    res.status(200).json(productsList);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// 4. Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});