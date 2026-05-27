import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Link } from 'expo-router';

// TypeScript data contract
interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  threshold?: number; // Optional custom threshold field from Firestore
}

export default function InventoryScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 📝 Using your explicit local PC IP Address
  const BACKEND_URL = 'http://192.168.254.109:5000/api/inventory';

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(BACKEND_URL);
      const data = await response.json();
      if (response.ok) {
        // Sort inventory so that low/empty items float to the very top automatically
        const sortedData = data.sort((a: Ingredient, b: Ingredient) => {
          const limitA = a.threshold || 20;
          const limitB = b.threshold || 20;
          const isLowA = a.current_stock <= limitA ? 1 : 0;
          const isLowB = b.current_stock <= limitB ? 1 : 0;
          return isLowB - isLowA; 
        });
        setIngredients(sortedData);
      }
    } catch (error) {
      console.error("Network error pulling inventory database matrix:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  // Business logic calculator for safety thresholds
  const getStockStatus = (stock: number, customThreshold?: number) => {
    const safetyLimit = customThreshold || 20; // Default safety threshold fallback
    if (stock <= 0) return { label: 'CRITICAL (OUT)', color: '#DC3545', bgColor: '#F8D7DA' };
    if (stock <= safetyLimit) return { label: 'LOW STOCK', color: '#FD7E14', bgColor: '#FFF3CD' };
    return { label: 'HEALTHY', color: '#198754', bgColor: '#D1E7DD' };
  };

  const renderIngredientCard = ({ item }: { item: Ingredient }) => {
    const status = getStockStatus(item.current_stock, item.threshold);

    return (
      <View style={[styles.card, { borderColor: status.color }]}>
        <View style={styles.cardLeft}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          <Text style={styles.stockCount}>
            Current Balance: <Text style={{ fontWeight: 'bold', color: '#333' }}>{item.current_stock}</Text> units
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    );
  };

  // Calculate quick metrics for an active warning banner at the top
  const lowStockCount = ingredients.filter(i => i.current_stock <= (i.threshold || 20)).length;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inventory Control</Text>
      <Text style={styles.subHeader}>Real-time stock monitoring & material tracking</Text>

      {/* 🚨 DYNAMIC ALERT BANNER TRIGGER */}
      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>
            ⚠️ Attention: {lowStockCount} ingredient(s) require immediate replenishment!
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={ingredients}
          keyExtractor={(item) => item.id}
          renderItem={renderIngredientCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No ingredients cataloged in system instance.</Text>
          }
        />
      )}

      {/* Footer Navigation */}
      <View style={styles.footerNav}>
        <Link href="/" style={styles.navLink}>🖥️ POS Home</Link>
        <Link href="/restock" style={styles.navLink}>🚚 Restock Material</Link>
        <Link href="/history" style={styles.navLink}>📜 Ledger</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#212529', textAlign: 'center' },
  subHeader: { fontSize: 13, color: '#6C757D', textAlign: 'center', marginBottom: 15, marginTop: 4 },
  alertBanner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEBA2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center'
  },
  alertBannerText: { color: '#856404', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  listContent: { paddingBottom: 30 },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 5, // Creates a solid vertical state line color indicator
    boxShadow: '0px 2px 4px rgba(0,0,0,0.03)'
  },
  cardLeft: { flex: 1 },
  ingredientName: { fontSize: 18, fontWeight: '600', color: '#343A40' },
  stockCount: { fontSize: 13, color: '#6C757D', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#ADB5BD', marginTop: 40, fontSize: 15 },
  footerNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12,
    boxShadow: '0px -2px 10px rgba(0,0,0,0.03)'
  },
  navLink: { fontSize: 14, color: '#007AFF', fontWeight: 'bold' }
});