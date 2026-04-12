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
    // 1. Get the data sent from the frontend (e.g., {"productId": "prod_001", "quantitySold": 1})
    const { productId, quantitySold } = req.body;

    // 2. Fetch the product from Firestore to get its "recipe" (BOM)
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found in database.' });
    }

    const productData = productDoc.data();
    const recipe = productData.recipe; 

    // 3. Set up a Firestore "Batch" (This updates all ingredients at the exact same time safely)
    const batch = db.batch();

    // 4. Loop through the recipe and calculate deductions
    for (const item of recipe) {
      const ingredientRef = db.collection('ingredients').doc(item.ingredient_id);
      
      // Multiply recipe amount by how many cups were sold
      const totalDeduction = item.quantity_needed * quantitySold; 

      // Tell Firebase to subtract this amount from the current_stock
      batch.update(ingredientRef, {
        current_stock: admin.firestore.FieldValue.increment(-totalDeduction)
      });
    }

    // 5. Execute the batch update
    await batch.commit();

    // 6. Send success message back to the React app
    res.status(200).json({ 
      message: `Success! Sold ${quantitySold}x ${productData.name} and deducted ingredients.` 
    });

  } catch (error) {
    console.error("Error processing sale:", error);
    res.status(500).json({ error: 'Something went wrong processing the sale.' });
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

// 4. Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});