"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  Search,
  Eye,
  TrendingUp,
  CreditCard,
  FileText,
  Bookmark,
  Radio,
  Bell,
  Plus
} from 'lucide-react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
      else router.push('/admin/login');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processedOrders = orders.filter(o => o.status === 'Diproses').length;

  const filteredOrders = orders.filter(o =>
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="bg-blobs" style={{ opacity: 0.2 }}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <aside className="admin-sidebar">
        <div className="logo-box" style={{ marginBottom: '4rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
            <Radio color="white" size={24} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--slate-900)' }}>Sewa HT Ku</span>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarItem icon={<LayoutDashboard size={22} />} label="Dashboard" active />
          <SidebarItem icon={<ShoppingBag size={22} />} label="Pesanan" />
          <SidebarItem icon={<Package size={22} />} label="Produk" />
          <SidebarItem icon={<Users size={22} />} label="Pelanggan" />
          <SidebarItem icon={<Settings size={22} />} label="Pengaturan" />
        </nav>

        <div style={{ paddingTop: '2rem', borderTop: '1px solid #F1F5F9' }}>
          <motion.div
            whileHover={{ x: 5, color: '#EF4444' }}
            onClick={handleLogout}
            className="sidebar-item"
            style={{ color: '#64748B' }}
          >
            <LogOut size={22} /> Logout Admin
          </motion.div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--slate-900)', letterSpacing: '-1px' }}>Dashboard</h1>
            <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>Halo Admin, selamat datang kembali!</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative' }}>
              <Bell size={20} color="#64748B" />
              <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '8px', height: '8px', background: '#EF4444', border: '2px solid white', borderRadius: '50%' }}></span>
            </div>
            <motion.img
              whileHover={{ scale: 1.1 }}
              src="https://i.pravatar.cc/150?u=admin"
              alt="Admin"
              style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            />
          </div>
        </header>

        <div className="stat-grid">
          <AdminStatCard label="Total Order" value={totalOrders} icon={<FileText color="white" />} bg="#6366F1" trend="+12.5%" delay={0.1} />
          <AdminStatCard label="Active Unit" value={processedOrders} icon={<TrendingUp color="white" />} bg="#14B8A6" trend="+5.2%" delay={0.2} />
          <AdminStatCard label="Revenue" value={`Rp ${totalRevenue.toLocaleString()}`} icon={<CreditCard color="white" />} bg="#A855F7" trend="+18.3%" delay={0.3} />
          <AdminStatCard label="New Request" value={pendingOrders} icon={<Bookmark color="white" />} bg="#F59E0B" trend="New" delay={0.4} />
        </div>

        <div className="premium-card" style={{ padding: 0 }}>
          <div className="table-header">
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem' }}>Daftar Transaksi Terbaru</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Cari nama pelanggan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-input"
                  style={{ padding: '0.7rem 1.25rem 0.7rem 2.5rem', width: '300px', fontSize: '0.85rem' }}
                />
              </div>
              <button className="btn-vibrant btn-primary" style={{ padding: '0.7rem 1.25rem', fontSize: '0.85rem' }}>
                <Plus size={16} /> Tambah Data
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '2.5rem' }}>ORDER ID</th>
                  <th>CUSTOMER</th>
                  <th>UNIT</th>
                  <th>DURATION</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th style={{ paddingRight: '2.5rem' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F8FAFC', transition: '0.3s' }}>
                    <td style={{ paddingLeft: '2.5rem', fontWeight: 800, color: '#6366F1' }}>#HT-{idx + 101}</td>
                    <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{o.customer_name}</td>
                    <td style={{ color: '#64748B', fontWeight: 500 }}>{o.items_summary}</td>
                    <td style={{ color: '#64748B' }}>{o.duration} Days</td>
                    <td style={{ fontWeight: 800, color: 'var(--slate-900)' }}>Rp {o.total_price.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${o.status === 'Selesai' ? 'badge-success' : o.status === 'Diproses' ? 'badge-process' : 'badge-pending'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ paddingRight: '2.5rem' }}>
                      <motion.div whileHover={{ scale: 1.1, background: '#F1F5F9' }} style={{ padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', width: 'fit-content' }}>
                        <Eye size={20} color="#64748B" />
                      </motion.div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const SidebarItem = ({ icon, label, active }) => (
  <motion.div
    whileHover={{ x: 5, background: '#F8FAFC' }}
    className={`sidebar-item ${active ? 'active' : ''}`}
  >
    {icon} <span style={{ fontSize: '0.9rem' }}>{label}</span>
  </motion.div>
);

const AdminStatCard = ({ label, value, icon, bg, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="premium-card stat-card-premium"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
      <div style={{ background: bg, padding: '0.8rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 20px ${bg}44` }}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, background: '#D1FAE5', padding: '0.3rem 0.7rem', borderRadius: '100px' }}>{trend}</span>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--slate-900)', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>{value}</div>
    <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>{label}</p>
  </motion.div>
);
