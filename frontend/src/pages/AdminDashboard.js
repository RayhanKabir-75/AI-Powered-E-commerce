import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getAdminStats, getAdminOrders, updateOrderStatus } from '../api/api';
import './auth.css';

const STATUS_COLORS = {
  pending:   '#f39c12',
  confirmed: '#3498db',
  shipped:   '#9b59b6',
  delivered: '#27ae60',
  cancelled: '#e74c3c',
};

const PIE_COLORS = ['#c9952a', '#3498db', '#9b59b6', '#27ae60', '#e74c3c'];

const STATUS_CHOICES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)',
      padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 18,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${color}18`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 24, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: `${STATUS_COLORS[status]}22`,
      color: STATUS_COLORS[status],
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const [stats,         setStats]         = useState(null);
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [activeTab,     setActiveTab]     = useState('overview');
  const [updatingId,    setUpdatingId]    = useState(null);
  const [error,         setError]         = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (statusVal = '') => {
    setOrdersLoading(true);
    try {
      const params = statusVal ? { status: statusVal } : {};
      const res = await getAdminOrders(params);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders(statusFilter);
  }, [activeTab, statusFilter, fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (stats) fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => { onLogout(); navigate('/'); };

  if (loading) {
    return (
      <div className="home page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <div style={{ color: 'var(--muted)' }}>Loading admin dashboard…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>
          <button className="btn btn-primary" onClick={fetchStats}>Retry</button>
        </div>
      </div>
    );
  }

  const { kpis, daily_revenue, status_breakdown, top_products, category_revenue, recent_orders } = stats;

  const revenueChartData = daily_revenue.map(d => ({
    day:     d.day.slice(5),
    revenue: parseFloat(d.revenue.toFixed(2)),
    orders:  d.orders,
  }));

  const statusPieData = status_breakdown.map(s => ({
    name:  s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
  }));

  const topProductsData = top_products.map(p => ({
    name:    p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
    fullName: p.name,
    revenue: parseFloat(p.revenue.toFixed(2)),
    units:   p.units_sold,
  }));

  const categoryData = category_revenue.map(c => ({
    name:    c.category,
    revenue: parseFloat(c.revenue.toFixed(2)),
    units:   c.units,
  }));

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'orders',   label: '📦 All Orders' },
  ];

  return (
    <div className="home page">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="nav-logo" style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%' }} />
          ShopAI <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginLeft: 4 }}>Admin</span>
        </div>

        <div className="home-nav-right">
          <span className="role-badge seller" style={{ background: 'rgba(231,76,60,0.12)', color: '#e74c3c' }}>
            ⚙️ admin
          </span>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user?.email}</div>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <div className="home-main">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Full platform overview — orders, revenue, products, and customers.
          </p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={activeTab === t.key ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 13, padding: '8px 18px' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════ OVERVIEW TAB ════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <KpiCard icon="💰" label="Total Revenue" value={`$${kpis.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Confirmed + shipped + delivered" color="#c9952a" />
              <KpiCard icon="📦" label="Total Orders" value={kpis.total_orders.toLocaleString()} sub="All time" color="#3498db" />
              <KpiCard icon="👥" label="Customers" value={kpis.total_customers.toLocaleString()} sub="Registered buyers" color="#9b59b6" />
              <KpiCard icon="🏷️" label="Products" value={kpis.total_products.toLocaleString()} sub="Listed in catalogue" color="#27ae60" />
            </div>

            {/* Revenue chart + Status donut */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>

              {/* Revenue over time */}
              <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                  Revenue Over Time (last 30 days)
                </h3>
                {revenueChartData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    No completed orders in the last 30 days
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v, name) => name === 'revenue' ? [`$${v}`, 'Revenue'] : [v, 'Orders']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#c9952a" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="orders"  stroke="#3498db" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="5 4" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Order status donut */}
              <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                  Order Status Breakdown
                </h3>
                {statusPieData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No orders</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {statusPieData.map((entry, i) => (
                            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
                      {statusPieData.map((entry, i) => (
                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top Products + Category revenue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

              {/* Top products horizontal bar */}
              <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                  Top Products by Revenue
                </h3>
                {topProductsData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No sales yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.fullName}</div>
                              <div>Revenue: <strong>${d.revenue}</strong></div>
                              <div>Units sold: <strong>{d.units}</strong></div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="revenue" fill="#c9952a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category revenue bar */}
              <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                  Revenue by Category
                </h3>
                {categoryData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryData} margin={{ top: 0, right: 8, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v, name) => name === 'revenue' ? [`$${v}`, 'Revenue'] : [v, 'Units']} />
                      <Bar dataKey="revenue" fill="#3498db" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recent orders */}
            <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, marginBottom: 32 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                Recent Transactions
              </h3>
              <OrdersTable
                orders={recent_orders}
                onStatusUpdate={handleStatusUpdate}
                updatingId={updatingId}
                showAll={false}
              />
            </div>
          </>
        )}

        {/* ════════════════════════ ORDERS TAB ══════════════════════════════ */}
        {activeTab === 'orders' && (
          <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700 }}>
                All Orders
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className={!statusFilter ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ fontSize: 12, padding: '6px 14px' }}
                  onClick={() => setStatusFilter('')}
                >
                  All
                </button>
                {STATUS_CHOICES.map(s => (
                  <button
                    key={s}
                    className={statusFilter === s ? 'btn btn-primary' : 'btn btn-ghost'}
                    style={{ fontSize: 12, padding: '6px 14px', textTransform: 'capitalize' }}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {ordersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading orders…</div>
            ) : (
              <OrdersTable
                orders={orders}
                onStatusUpdate={handleStatusUpdate}
                updatingId={updatingId}
                showAll
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function OrdersTable({ orders, onStatusUpdate, updatingId, showAll }) {
  if (!orders.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
        No orders found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>#</th>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Customer</th>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Items</th>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Total</th>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Date</th>
            {showAll && <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Update</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr
              key={order.id}
              style={{
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? '#fff' : '#fdfaf4',
              }}
            >
              <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gold)' }}>#{order.id}</td>
              <td style={{ padding: '10px 12px', color: 'var(--dark)' }}>{order.customer_email}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                {order.items.map(it => `${it.product_name} ×${it.quantity}`).join(', ')}
              </td>
              <td style={{ padding: '10px 12px', fontWeight: 700 }}>${parseFloat(order.total).toFixed(2)}</td>
              <td style={{ padding: '10px 12px' }}><StatusBadge status={order.status} /></td>
              <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                {new Date(order.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              {showAll && (
                <td style={{ padding: '10px 12px' }}>
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={e => onStatusUpdate(order.id, e.target.value)}
                    style={{
                      border: '1px solid var(--border)', borderRadius: 8,
                      padding: '4px 8px', fontSize: 12, cursor: 'pointer',
                      background: 'var(--panel)', fontFamily: 'inherit',
                      opacity: updatingId === order.id ? 0.5 : 1,
                    }}
                  >
                    {STATUS_CHOICES.map(s => (
                      <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
