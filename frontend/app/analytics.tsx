import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './theme';

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  threshold: number;
}

interface SaleLog {
  id: string;
  product_name: string;
  timestamp: string;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleLog[]>([]);

  const [metrics, setMetrics] = useState({
    totalIngredients: 0,
    criticalShortages: 0,
    healthScore: 100,
    totalSalesCount: 0,
    topProduct: 'None'
  });

  const IP_ADDRESS = '192.168.254.109';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [invResponse, salesResponse] = await Promise.all([
        fetch(`http://${IP_ADDRESS}:5000/api/inventory`),
        fetch(`http://${IP_ADDRESS}:5000/api/sales/history`)
      ]);

      const invData = await invResponse.json();
      const salesData = await salesResponse.json();

      if (invResponse.ok && salesResponse.ok) {
        setIngredients(invData);
        setSalesHistory(salesData);
        calculateMetrics(invData, salesData);
      }
    } catch (error) {
      console.error("Analytics engine aggregation failure:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMetrics = (currentInv: Ingredient[], currentSales: SaleLog[]) => {
    const totalIngredients = currentInv.length;
    const criticalShortages = currentInv.filter(item => item.current_stock <= item.threshold).length;
    const healthScore = totalIngredients > 0 ? Math.round(((totalIngredients - criticalShortages) / totalIngredients) * 100) : 100;
    const totalSalesCount = currentSales.length;

    const productCounts: { [key: string]: number } = {};
    let topProduct = 'No Sales Yet';
    let maxCount = 0;

    currentSales.forEach(sale => {
      productCounts[sale.product_name] = (productCounts[sale.product_name] || 0) + 1;
      if (productCounts[sale.product_name] > maxCount) {
        maxCount = productCounts[sale.product_name];
        topProduct = sale.product_name;
      }
    });

    setMetrics({ totalIngredients, criticalShortages, healthScore, totalSalesCount, topProduct });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return Theme.colors.success;
    if (score >= 50) return Theme.colors.warning;
    return Theme.colors.danger;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>System Metrics</Text>
        <Text style={styles.headerSubTitle}>Real-time system data health analytics dashboard</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
      >
        <View style={[styles.largeCard, { backgroundColor: getHealthColor(metrics.healthScore) }]}>
          <Text style={styles.largeCardTitle}>Aggregate Stock Health</Text>
          <Text style={styles.largeCardMetric}>{metrics.healthScore}%</Text>
          <Text style={styles.largeCardDesc}>
            {metrics.healthScore === 100 
              ? 'Operational logistics fully stable. No deficits cataloged.' 
              : 'Supply deficits identified. Replenishment tasks recommended.'}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.miniCard}>
            <Ionicons name="cash-outline" size={20} color={Theme.colors.primary} />
            <Text style={styles.cardLabel}>Sales Volume</Text>
            <Text style={styles.cardMetricValue}>{metrics.totalSalesCount}</Text>
          </View>

          <View style={styles.miniCard}>
            <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
            <Text style={styles.cardLabel}>Top Product</Text>
            <Text style={styles.topProductText} numberOfLines={2}>{metrics.topProduct}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.miniCard}>
            <Ionicons name="warning-outline" size={20} color={metrics.criticalShortages > 0 ? Theme.colors.danger : Theme.colors.success} />
            <Text style={styles.cardLabel}>Deficits</Text>
            <Text style={[styles.cardMetricValue, { color: metrics.criticalShortages > 0 ? Theme.colors.danger : Theme.colors.success }]}>
              {metrics.criticalShortages}
            </Text>
          </View>

          <View style={styles.miniCard}>
            <Ionicons name="layers-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.cardLabel}>SKU Items</Text>
            <Text style={styles.cardMetricValue}>{metrics.totalIngredients}</Text>
          </View>
        </View>
      </ScrollView>

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
        <Link href="/history" asChild>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="receipt-outline" size={20} color={Theme.colors.textMuted} />
            <Text style={styles.tabText}>Ledger</Text>
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
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  largeCard: { padding: 20, borderRadius: Theme.roundness.medium, marginBottom: 16, boxShadow: Theme.shadows.medium },
  largeCardTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  largeCardMetric: { color: '#FFFFFF', fontSize: 44, fontWeight: '800', marginVertical: 2 },
  largeCardDesc: { color: '#FFFFFF', fontSize: 13, opacity: 0.9 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  miniCard: { 
    backgroundColor: Theme.colors.surface, 
    width: '48%', 
    padding: 16, 
    borderRadius: Theme.roundness.medium, 
    minHeight: 110,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: Theme.shadows.light
  },
  cardLabel: { fontSize: 11, color: Theme.colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginTop: 8 },
  cardMetricValue: { fontSize: 24, fontWeight: '800', color: Theme.colors.textDark, marginTop: 2 },
  topProductText: { fontSize: 15, fontWeight: '700', color: Theme.colors.textDark, marginTop: 4, lineHeight: 18 },
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