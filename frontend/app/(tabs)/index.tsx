import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Premium UI Icons
import { Theme } from '../theme'; // Import your unified styling tokens

interface Product {
  id: string;
  name: string;
  price?: number; 
}

export default function POSScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const IP_ADDRESS = '192.168.254.109';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`http://${IP_ADDRESS}:5000/api/products`);
      const data = await response.json();
      if (response.ok) setProducts(data);
    } catch (error) {
      console.error("POS product fetch mismatch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSale = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await fetch(`http://${IP_ADDRESS}:5000/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProduct }),
      });

      if (response.ok) {
        alert("🎉 Sale Completed! Inventory deducted cleanly.");
        setSelectedProduct(null);
      } else {
        const errData = await response.json();
        alert(`❌ Transaction Failed: ${errData.error}`);
      }
    } catch (error) {
      alert("💥 Server connection error. Verify runtime terminal status.");
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isSelected = selectedProduct === item.id;
    return (
      <TouchableOpacity 
        style={[styles.productCard, isSelected && styles.selectedCard]} 
        onPress={() => setSelectedProduct(isSelected ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, isSelected && styles.selectedIconCircle]}>
          <Ionicons 
            name="fast-food-outline" 
            size={24} 
            color={isSelected ? '#FFFFFF' : Theme.colors.primary} 
          />
        </View>
        <Text style={[styles.productName, isSelected && styles.selectedProductText]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productPrice, isSelected && styles.selectedPriceText]}>
          ₱{(item.price || 120).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Upper Status Block Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.appTitle}>IngrediFlow</Text>
        <Text style={styles.appSubTitle}>Dynamic Checkout & Material Sync Terminal</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Syncing store inventory cards...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={styles.rowSpacing}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No available products logged in core system database.</Text>
          }
        />
      )}

      {/* Dynamic Master Control Drawer */}
      {selectedProduct && (
        <View style={styles.actionDrawer}>
          <View style={styles.drawerInfo}>
            <Ionicons name="cart" size={20} color={Theme.colors.textDark} />
            <Text style={styles.drawerText}>1 Item Queued for Deduction</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleProcessSale}>
            <Text style={styles.checkoutButtonText}>Complete Order</Text>
            <Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Foot Navigation System Matrix */}
      <View style={styles.navFooter}>
        <Link href="/inventory" style={styles.navTab} asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="cube-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Inventory</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/restock" style={styles.navTab} asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="refresh-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Restock</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/history" style={styles.navTab} asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="receipt-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Ledger</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/analytics" style={styles.navTab} asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="bar-chart-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Analytics</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingTop: 60 },
  headerBlock: { paddingHorizontal: 20, marginBottom: 15 },
  appTitle: { fontSize: 32, fontWeight: '800', color: Theme.colors.textDark, letterSpacing: -0.5 },
  appSubTitle: { fontSize: 13, color: Theme.colors.textMuted, marginTop: 2 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: Theme.colors.textMuted, fontSize: 14 },
  gridContent: { paddingHorizontal: 16, paddingBottom: 120 },
  rowSpacing: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: Theme.colors.surface,
    width: '48%',
    borderRadius: Theme.roundness.medium,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: Theme.shadows.light,
  },
  selectedCard: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
    boxShadow: Theme.shadows.medium,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F6EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedIconCircle: { backgroundColor: 'rgba(255,255,255,0.2)' },
  productName: { fontSize: 16, fontWeight: '600', color: Theme.colors.textDark, textAlign: 'center', minHeight: 44 },
  selectedProductText: { color: '#FFFFFF' },
  productPrice: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary, marginTop: 4 },
  selectedPriceText: { color: 'rgba(255,255,255,0.9)' },
  emptyText: { textAlign: 'center', color: Theme.colors.textMuted, marginTop: 40 },
  actionDrawer: {
    position: 'absolute',
    bottom: 95,
    left: 16,
    right: 16,
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: Theme.roundness.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: Theme.shadows.medium,
  },
  drawerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textDark },
  checkoutButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Theme.roundness.small,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  navFooter: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.large,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: Theme.shadows.medium,
  },
  navTab: { flex: 1 },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 65 },
  tabText: { fontSize: 11, color: Theme.colors.textMuted, fontWeight: '500', marginTop: 3 },
});