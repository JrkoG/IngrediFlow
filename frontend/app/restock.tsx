import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './theme';

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  threshold: number;
}

export default function RestockScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔍 UI Search State
  const [searchQuery, setSearchQuery] = useState('');
  // ⚡ Tracking input quantities by ingredient ID: { [id]: "quantity" }
  const [quantities, setQuantities] = useState<{ [key: string]: string }>({});

  const IP_ADDRESS = '192.168.254.109';

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`http://${IP_ADDRESS}:5000/api/inventory`);
      const data = await response.json();
      if (response.ok) {
        setIngredients(data);
      }
    } catch (error) {
      console.error("Restock view data download failure:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handleApplyRestock = async (id: string, currentStock: number) => {
    const incrementStr = quantities[id];
    const incrementAmount = parseInt(incrementStr, 10);

    if (!incrementStr || isNaN(incrementAmount) || incrementAmount <= 0) {
      alert("❌ Please enter a valid positive restocking quantity.");
      return;
    }

    try {
      // Assuming a generic utility PATCH endpoint to update specific properties
      const response = await fetch(`http://${IP_ADDRESS}:5000/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_stock: currentStock + incrementAmount }),
      });

      if (response.ok) {
        alert("💚 Stock levels adjusted successfully!");
        setQuantities(prev => ({ ...prev, [id]: '' })); // Clear input field
        fetchInventory(); // Live UI sync
      } else {
        alert("❌ Failed to commit updated stock parameters to server.");
      }
    } catch (error) {
      alert("💥 Server connectivity failure. Check your backend status terminal.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  // 🛡️ Engine: Real-time search query modifier matching against material strings
  const filteredIngredients = ingredients.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRestockItem = ({ item }: { item: Ingredient }) => {
    const isLow = item.current_stock <= item.threshold;

    return (
      <View style={[styles.restockCard, isLow && styles.lowStockBorder]}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.miniBadge, { backgroundColor: isLow ? Theme.colors.warningBg : Theme.colors.successBg }]}>
            <Text style={[styles.miniBadgeText, { color: isLow ? Theme.colors.warning : Theme.colors.success }]}>
              {item.current_stock} units left
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TextInput
            style={styles.quantityInput}
            placeholder="+ Add Amount"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="number-pad"
            value={quantities[item.id] || ''}
            onChangeText={(val) => handleInputChange(item.id, val)}
          />
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={() => handleApplyRestock(item.id, item.current_stock)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>Supply Inbound</Text>
        <Text style={styles.headerSubTitle}>Replenish line raw ingredients and update reserves</Text>
      </View>

      {/* 🔍 PREMIUM SEARCH COMPONENT */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials (e.g., Milk, Sugar, Espresso)..."
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={Theme.colors.textMuted} style={{ marginRight: 10 }} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item) => item.id}
          renderItem={renderRestockItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? "No ingredients match your criteria." : "No baseline inventory data logged."}
            </Text>
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
        <Link href="/inventory" asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="cube-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Inventory</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: Theme.roundness.medium,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
    boxShadow: Theme.shadows.light,
  },
  searchIcon: { paddingLeft: 14, paddingRight: 8 },
  searchInput: { flex: 1, height: 46, fontSize: 14, color: Theme.colors.textDark, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  restockCard: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: Theme.roundness.medium,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: Theme.shadows.light
  },
  lowStockBorder: { borderColor: 'rgba(245, 158, 11, 0.4)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: '700', color: Theme.colors.textDark },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniBadgeText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  quantityInput: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    height: 42,
    borderRadius: Theme.roundness.small,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textDark
  },
  applyButton: {
    backgroundColor: Theme.colors.primary,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: Theme.roundness.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
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