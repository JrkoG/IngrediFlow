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

// --- CORE TRANSACTION ROUTE ---
app.post('/api/sales', async (req, res) => {
  try {
    const { product_id } = req.body;
    console.log(`--- Processing Sale for Product: ${product_id} ---`);

    const productDoc = await db.collection('products').doc(product_id).get();
    if (!productDoc.exists) return res.status(404).json({ error: 'Product not found' });

    const recipe = productDoc.data().recipe || [];
    const batch = db.batch();

    for (const item of recipe) {
      // 1. Skip if ID is missing or empty
      if (!item.ingredient_id) {
        console.log("⚠️ Skipping item: Missing ingredient_id");
        continue;
      }

      // 2. Force quantity to a number and default to 0 if it's NaN
      const qtyNeeded = Number(item.quantity_needed) || 0;
      
      if (qtyNeeded <= 0) {
        console.log(`⚠️ Skipping ${item.ingredient_id}: Quantity is 0 or NaN`);
        continue;
      }

      const ingRef = db.collection('ingredients').doc(item.ingredient_id);
      const ingDoc = await ingRef.get();

      if (ingDoc.exists) {
        const currentStock = Number(ingDoc.data().current_stock) || 0;
        
        if (currentStock >= qtyNeeded) {
          batch.update(ingRef, { current_stock: currentStock - qtyNeeded });
          console.log(`✅ Deducting ${qtyNeeded} from ${ingDoc.data().name}`);
        } else {
          return res.status(400).json({ error: `Not enough ${ingDoc.data().name}` });
        }
      }
    }

    await batch.commit();
    res.status(200).json({ message: 'Sale Successful!' });

  } catch (error) {
    console.error("CRITICAL ERROR IN SALES ROUTE:", error.message);
    res.status(500).json({ error: 'Server crashed while processing sale.' });
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
    // 1. Ask Firebase for everything inside the 'ingredients' collection
    const snapshot = await db.collection('ingredients').get();
    
    // 2. Package it into a neat array
    const inventoryList = [];
    snapshot.forEach(doc => {
      inventoryList.push({
        id: doc.id,
        name: doc.data().name,
        current_stock: doc.data().current_stock
      });
    });

    // 3. Send the array to the frontend
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