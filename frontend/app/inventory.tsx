import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './theme'; // Same-directory import

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  threshold: number;
}

export default function InventoryScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP_ADDRESS = '192.168.254.109';

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`http://${IP_ADDRESS}:5000/api/inventory`);
      const data = await response.json();
      if (response.ok) {
        const sortedData = data.sort((a: Ingredient, b: Ingredient) => {
          const isLowA = a.current_stock <= a.threshold ? 1 : 0;
          const isLowB = b.current_stock <= b.threshold ? 1 : 0;
          return isLowB - isLowA; 
        });
        setIngredients(sortedData);
      }
    } catch (error) {
      console.error("Network error pulling inventory:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock <= 0) return { label: 'CRITICAL', color: Theme.colors.danger, bgColor: Theme.colors.dangerBg, icon: 'alert-circle' };
    if (stock <= threshold) return { label: 'LOW STOCK', color: Theme.colors.warning, bgColor: Theme.colors.warningBg, icon: 'warning' };
    return { label: 'HEALTHY', color: Theme.colors.success, bgColor: Theme.colors.successBg, icon: 'checkmark-circle' };
  };

  const renderIngredientCard = ({ item }: { item: Ingredient }) => {
    const status = getStockStatus(item.current_stock, item.threshold);

    return (
      <View style={[styles.card, { borderLeftColor: status.color }]}>
        <View style={styles.cardLeft}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          <Text style={styles.stockCount}>
            Available Level: <Text style={styles.boldStock}>{item.current_stock}</Text> units
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bgColor }]}>
          <Ionicons name={status.icon as any} size={12} color={status.color} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    );
  };

  const lowStockCount = ingredients.filter(i => i.current_stock <= i.threshold).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>Material Inventory</Text>
        <Text style={styles.headerSubTitle}>Real-time replenishment monitoring controls</Text>
      </View>

      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="notifications" size={16} color={Theme.colors.warning} />
          <Text style={styles.alertBannerText}>
            Attention: {lowStockCount} lines running below active threshold limits.
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={ingredients}
          keyExtractor={(item) => item.id}
          renderItem={renderIngredientCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No inventory cataloged on network instance.</Text>
          }
        />
      )}

      {/* Synchronized Master Tab Bar */}
      <View style={styles.navFooter}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="apps-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>POS Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/restock" asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="refresh-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Restock</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/history" asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="receipt-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Ledger</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/analytics" asChild>
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
  headerTitle: { fontSize: 32, fontWeight: '800', color: Theme.colors.textDark, letterSpacing: -0.5 },
  headerSubTitle: { fontSize: 13, color: Theme.colors.textMuted, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  alertBanner: {
    backgroundColor: Theme.colors.warningBg,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: Theme.roundness.small,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)'
  },
  alertBannerText: { color: '#856404', fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { 
    backgroundColor: Theme.colors.surface, 
    padding: 16, 
    borderRadius: Theme.roundness.medium, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: Theme.shadows.light
  },
  cardLeft: { flex: 1 },
  ingredientName: { fontSize: 17, fontWeight: '600', color: Theme.colors.textDark },
  stockCount: { fontSize: 13, color: Theme.colors.textMuted, marginTop: 4 },
  boldStock: { fontWeight: '700', color: Theme.colors.textDark },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: Theme.colors.textMuted, marginTop: 40 },
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
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 65 },
  tabText: { fontSize: 11, color: Theme.colors.textMuted, fontWeight: '500', marginTop: 3 },
});