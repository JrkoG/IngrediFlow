import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './theme';

interface SaleLog {
  id: string;
  product_name: string;
  timestamp: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<SaleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP_ADDRESS = '192.168.254.109';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://${IP_ADDRESS}:5000/api/sales/history`);
      const data = await response.json();
      if (response.ok) {
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed fetching sales history matrix:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • ' + date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const renderLogItem = ({ item }: { item: SaleLog }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={styles.timelineNode}>
          <Ionicons name="receipt" size={14} color="#FFFFFF" />
        </View>
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.timelineCard}>
        <Text style={styles.productTitle}>{item.product_name}</Text>
        <Text style={styles.timestampText}>{formatTimestamp(item.timestamp)}</Text>
        <View style={styles.amountTag}>
          <Text style={styles.amountTagText}>Deduction Complete</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>Deduction Ledger</Text>
        <Text style={styles.headerSubTitle}>Chronological historical system transactional record</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions committed to current matrix instance.</Text>
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
        <Link href="/restock" asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="refresh-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Restock</Text>
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
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', marginRight: 12 },
  timelineNode: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: Theme.colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    boxShadow: Theme.shadows.light
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: Theme.colors.border, marginVertical: 4 },
  timelineCard: { 
    flex: 1, 
    backgroundColor: Theme.colors.surface, 
    padding: 16, 
    borderRadius: Theme.roundness.medium,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
    boxShadow: Theme.shadows.light
  },
  productTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.textDark },
  timestampText: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 3 },
  amountTag: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#E6F6EE', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4, 
    marginTop: 8 
  },
  amountTagText: { color: Theme.colors.primary, fontSize: 11, fontWeight: '700' },
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