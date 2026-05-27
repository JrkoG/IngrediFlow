import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Link } from 'expo-router';

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
  
  // Data States
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleLog[]>([]);

  // Analytics Metrics States
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
      // 1. Concurrent fetching from both verified operational endpoints
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
      console.error("Analytics aggregation engine failure:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMetrics = (currentInv: Ingredient[], currentSales: SaleLog[]) => {
    // A. Inventory Metrics
    const totalIngredients = currentInv.length;
    const criticalShortages = currentInv.filter(item => item.current_stock <= item.threshold).length;
    
    // B. Stock Health Score Calculation
    const healthScore = totalIngredients > 0 
      ? Math.round(((totalIngredients - criticalShortages) / totalIngredients) * 100) 
      : 100;

    // C. Sales Volume Metrics
    const totalSalesCount = currentSales.length;

    // D. Popular Product Mode Calculation
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

    setMetrics({
      totalIngredients,
      criticalShortages,
      healthScore,
      totalSalesCount,
      topProduct
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Compiling business data charts...</Text>
      </View>
    );
  }

  // Determine color matching for system status card
  const getHealthColor = (score: number) => {
    if (score >= 80) return '#198754';
    if (score >= 50) return '#FD7E14';
    return '#DC3545';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Business Analytics</Text>
      <Text style={styles.subHeader}>Real-time system health and operational metrics</Text>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />}
      >
        {/* BIG STATUS CARD: HEALTH SCORE */}
        <View style={[styles.largeCard, { backgroundColor: getHealthColor(metrics.healthScore) }]}>
          <Text style={styles.largeCardTitle}>Inventory Health Score</Text>
          <Text style={styles.largeCardMetric}>{metrics.healthScore}%</Text>
          <Text style={styles.largeCardDesc}>
            {metrics.healthScore === 100 
              ? 'All supply streams stable. Zero operational deficits detected.' 
              : `System running at limited capacity. Replenish critical lines.`}
          </Text>
        </View>

        {/* 2x2 GRID METRICS MARGINS */}
        <View style={styles.grid}>
          <View style={styles.miniCard}>
            <Text style={styles.cardLabel}>Sales Volume</Text>
            <Text style={styles.cardMetricValue}>{metrics.totalSalesCount}</Text>
            <Text style={styles.cardSubText}>Completed checkouts</Text>
          </View>

          <View style={styles.miniCard}>
            <Text style={styles.cardLabel}>Top Product</Text>
            <Text style={[styles.cardMetricValue, { fontSize: 16, marginTop: 12 }]} numberOfLines={2}>
              {metrics.topProduct}
            </Text>
            <Text style={styles.cardSubText}>Highest movement volume</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.miniCard}>
            <Text style={styles.cardLabel}>Deficit Alerts</Text>
            <Text style={[styles.cardMetricValue, { color: metrics.criticalShortages > 0 ? '#DC3545' : '#198754' }]}>
              {metrics.criticalShortages}
            </Text>
            <Text style={styles.cardSubText}>Below safety limit</Text>
          </View>

          <View style={styles.miniCard}>
            <Text style={styles.cardLabel}>Tracked Materials</Text>
            <Text style={styles.cardMetricValue}>{metrics.totalIngredients}</Text>
            <Text style={styles.cardSubText}>Active ingredients in system</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer System Navigation */}
      <View style={styles.footerNav}>
        <Link href="/" style={styles.navLink}>🖥️ POS Home</Link>
        <Link href="/inventory" style={styles.navLink}>📦 Stock View</Link>
        <Link href="/history" style={styles.navLink}>📜 Ledger</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9', padding: 20, paddingTop: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F9' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6C757D', fontWeight: '500' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#212529', textAlign: 'center' },
  subHeader: { fontSize: 13, color: '#6C757D', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  scrollContainer: { paddingBottom: 20 },
  largeCard: { padding: 24, borderRadius: 16, marginBottom: 16, elevation: 2, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' },
  largeCardTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  largeCardMetric: { color: '#FFFFFF', fontSize: 48, fontWeight: '800', marginVertical: 4 },
  largeCardDesc: { color: '#FFFFFF', fontSize: 13, opacity: 0.9, lineHeight: 18, marginTop: 4 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  miniCard: { 
    backgroundColor: '#FFFFFF', 
    width: '48%', 
    padding: 16, 
    borderRadius: 12, 
    justifyContent: 'space-between',
    minHeight: 120,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.02)'
  },
  cardLabel: { fontSize: 12, color: '#868E96', fontWeight: 'bold', textTransform: 'uppercase' },
  cardMetricValue: { fontSize: 26, fontWeight: 'bold', color: '#212529', marginTop: 8 },
  cardSubText: { fontSize: 11, color: '#ADB5BD', marginTop: 4 },
  footerNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12,
    boxShadow: '0px -2px 10px rgba(0,0,0,0.03)'
  },
  navLink: { fontSize: 13, color: '#007AFF', fontWeight: 'bold' }
});