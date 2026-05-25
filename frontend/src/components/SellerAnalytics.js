import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import API from '../api/api';

const GOLD       = '#C9952A';
const GOLD_LIGHT = '#E8B94A';
const COLORS     = [GOLD, '#4285F4', '#27AE60', '#8B5E3C', '#9b59b6', '#e74c3c', '#1abc9c'];

const STATUS_COLORS = {
  pending:   '#f59e0b',
  confirmed: '#4285F4',
  shipped:   '#8B5E3C',
  delivered: '#27AE60',
  cancelled: '#e74c3c',
};

function StatCard({ icon, label, value, sub, color = 'var(--gold)' }) {
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 22px', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "'Playfair Display', serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{
      fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700,
      marginBottom: 16, color: 'var(--dark)',
    }}>
      {children}
    </h3>
  );
}

export default function SellerAnalytics({ products, orders }) {
  const [range, setRange] = useState('30'); // days

  // ── Derived metrics ──────────────────────────────────────────────────────
  const now = Date.now();
  const rangeMs = parseInt(range) * 24 * 60 * 60 * 1000;
  const filteredOrders = orders.filter(o =>
    now - new Date(o.created_at).getTime() <= rangeMs
  );

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + parseFloat(o.total_price || o.total || 0), 0);

  const totalOrders    = filteredOrders.length;
  const deliveredCount = filteredOrders.filter(o => o.status === 'delivered').length;
  const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;
  const avgOrderValue  = totalOrders > 0 ? totalRevenue / (totalOrders - cancelledCount || 1) : 0;
  const fulfillmentRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : 0;

  const totalStock   = products.reduce((s, p) => s + (parseInt(p.stock) || 0), 0);
  const lowStockList = products.filter(p => parseInt(p.stock) < 5 && parseInt(p.stock) >= 0);
  const outOfStock   = products.filter(p => parseInt(p.stock) === 0);

  // ── Revenue over time (daily buckets) ───────────────────────────────────
  const revenueByDay = useCallback(() => {
    const buckets = {};
    const days = parseInt(range);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = 0;
    }
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in buckets) buckets[key] += parseFloat(o.total_price || o.total || 0);
    });
    return Object.entries(buckets)
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }))
      .slice(range === '7' ? 0 : range === '30' ? -14 : -12); // show last n points
  }, [filteredOrders, range, now]);

  // ── Orders by status (pie) ───────────────────────────────────────────────
  const statusData = Object.entries(
    filteredOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ name: status, value: count }));

  // ── Top products by orders ───────────────────────────────────────────────
  const productSales = {};
  filteredOrders.filter(o => o.status !== 'cancelled').forEach(o => {
    o.items?.forEach(item => {
      const name = item.product_name || 'Unknown';
      if (!productSales[name]) productSales[name] = { revenue: 0, qty: 0 };
      productSales[name].revenue += parseFloat(item.price || 0) * (item.quantity || 1);
      productSales[name].qty     += item.quantity || 1;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 6)
    .map(([name, data]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, ...data,
      revenue: parseFloat(data.revenue.toFixed(2)) }));

  // ── Category breakdown ───────────────────────────────────────────────────
  const categoryData = products.reduce((acc, p) => {
    const cat = p.category_name || p.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const catChartData = Object.entries(categoryData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const revData = revenueByDay();

  const customTooltipStyle = {
    background: 'var(--panel)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 14px', fontSize: 12,
  };

  return (
    <div style={{ animation: 'fadeUp 0.3s ease both' }}>

      {/* ── Date range filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0 }}>
          📊 Analytics
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['7', '7 days'], ['30', '30 days'], ['90', '90 days']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border)',
                background: range === v ? 'var(--dark)' : 'transparent',
                color: range === v ? '#fff' : 'var(--muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard icon="💰" label="Revenue" value={`$${totalRevenue.toFixed(0)}`} color={GOLD}
          sub={`last ${range} days`} />
        <StatCard icon="🧾" label="Orders" value={totalOrders} color="var(--dark)"
          sub={`${cancelledCount} cancelled`} />
        <StatCard icon="📦" label="Avg Order" value={`$${avgOrderValue.toFixed(0)}`} color={GOLD} />
        <StatCard icon="✅" label="Fulfilment" value={`${fulfillmentRate}%`}
          color={parseFloat(fulfillmentRate) > 70 ? '#27AE60' : '#f59e0b'} />
        <StatCard icon="🏷️" label="Products" value={products.length} color="var(--dark)"
          sub={`${lowStockList.length} low stock`} />
        <StatCard icon="📉" label="Out of Stock" value={outOfStock.length}
          color={outOfStock.length > 0 ? '#e74c3c' : '#27AE60'} />
      </div>

      {/* ── Revenue chart ── */}
      {revData.length > 0 && (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '22px 18px', marginBottom: 24,
        }}>
          <SectionTitle>💹 Revenue Over Time</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(v) => [`$${v}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: GOLD }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top products + Order status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Top products bar chart */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '22px 18px',
        }}>
          <SectionTitle>🏆 Top Products by Revenue</SectionTitle>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
              No sales data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} width={90} />
                <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status pie */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '22px 18px',
        }}>
          <SectionTitle>📋 Order Status Breakdown</SectionTitle>
          {statusData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
              No orders in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Category distribution + Inventory ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Category bar */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '22px 18px',
        }}>
          <SectionTitle>🗂️ Products by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={catChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {catChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alerts */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '22px 18px',
        }}>
          <SectionTitle>⚠️ Inventory Alerts</SectionTitle>
          {lowStockList.length === 0 && outOfStock.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#27AE60', padding: '40px 0', fontSize: 13 }}>
              ✅ All products are well-stocked!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {[...outOfStock.map(p => ({ ...p, alertType: 'out' })),
                ...lowStockList.filter(p => parseInt(p.stock) > 0).map(p => ({ ...p, alertType: 'low' }))
              ].map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8,
                  background: p.alertType === 'out' ? 'rgba(231,76,60,0.07)' : 'rgba(245,158,11,0.07)',
                  border: `1px solid ${p.alertType === 'out' ? 'rgba(231,76,60,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: p.alertType === 'out' ? '#e74c3c' : '#f59e0b',
                    padding: '2px 8px', borderRadius: 999,
                    background: p.alertType === 'out' ? 'rgba(231,76,60,0.12)' : 'rgba(245,158,11,0.12)',
                  }}>
                    {p.alertType === 'out' ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}