import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, DollarSign, Clock, 
  Search, Trash2, CheckCircle2, LogOut, Radio, Package,
  TrendingUp, Users, Calendar, ArrowRight, Settings, User, Eye,
  FileText, CreditCard, Bookmark
} from 'lucide-react';

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch('http://localhost:5001/api/admin/orders', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.reload();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processedOrders = orders.filter(o => o.status === 'Diproses').length;

  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Poppins, sans-serif' }}>
      {/* Sidebar - CLONE STYLE */}
      <aside style={{ width: '280px', background: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.4rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio color="#0F172A" size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px' }}>SEWA HT KU</h2>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem' }}>
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <SidebarItem icon={<ShoppingBag size={20} />} label="Pesanan" />
          <SidebarItem icon={<Package size={20} />} label="Produk" />
          <SidebarItem icon={<Users size={20} />} label="Pelanggan" />
          <SidebarItem icon={<Settings size={20} />} label="Pengaturan" />
        </nav>

        <div style={{ padding: '2rem' }}>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', color: '#94A3B8', cursor: 'pointer', transition: '0.3s' }} className="hover-nav">
            <LogOut size={20} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2.5rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B' }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>Admin</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Administrator</div>
            </div>
            <img src="https://i.pravatar.cc/150?u=feriman" alt="Admin" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
          </div>
        </header>

        {/* Stat Cards - EXACT REPLICATION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <AdminStatCard label="Total Pesanan" value={totalOrders} icon={<FileText color="#3B82F6" />} bg="#F0F7FF" desc="Semua waktu" />
          <AdminStatCard label="Pesanan Hari Ini" value={processedOrders} icon={<TrendingUp color="#10B981" />} bg="#F0FDF4" desc="+20% dari kemarin" />
          <AdminStatCard label="Pendapatan" value={`Rp ${totalRevenue.toLocaleString()}`} icon={<CreditCard color="#8B5CF6" />} bg="#FAF5FF" desc="Semua waktu" />
          <AdminStatCard label="Pesanan Pending" value={pendingOrders} icon={<Bookmark color="#F59E0B" />} bg="#FFFBEB" desc="Perlu diproses" />
        </div>

        {/* Orders Table */}
        <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyDirection: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>Daftar Pesanan Terbaru</h3>
            <button style={{ background: '#1E3A8A', color: 'white', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Lihat Semua</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '1.25rem 2rem' }}>No</th>
                  <th style={{ padding: '1.25rem' }}>Nama</th>
                  <th style={{ padding: '1.25' }}>Produk</th>
                  <th style={{ padding: '1.25' }}>Durasi</th>
                  <th style={{ padding: '1.25' }}>Total</th>
                  <th style={{ padding: '1.25' }}>Status</th>
                  <th style={{ padding: '1.25rem 2rem' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }} className="table-row-hover">
                    <td style={{ padding: '1.25rem 2rem', color: '#94A3B8' }}>#00{idx + 1}</td>
                    <td style={{ padding: '1.25rem', fontWeight: 600, color: '#1E293B' }}>{o.customer_name}</td>
                    <td style={{ padding: '1.25rem', color: '#64748B', fontSize: '0.9rem' }}>{o.items_summary}</td>
                    <td style={{ padding: '1.25rem', color: '#64748B' }}>{o.duration} hari</td>
                    <td style={{ padding: '1.25rem', fontWeight: 700, color: '#1E293B' }}>Rp {o.total_price.toLocaleString()}</td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ 
                        padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                        background: o.status === 'Selesai' ? '#D1FAE5' : o.status === 'Diproses' ? '#DBEAFE' : '#FEF3C7',
                        color: o.status === 'Selesai' ? '#065F46' : o.status === 'Diproses' ? '#1E40AF' : '#92400E'
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}><Eye size={20} color="#94A3B8" style={{ cursor: 'pointer' }} /></td>
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
  <div style={{ 
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', 
    background: active ? '#3B82F6' : 'transparent', color: active ? 'white' : '#94A3B8',
    borderRadius: '12px', cursor: 'pointer', transition: '0.3s', marginBottom: '0.6rem',
    boxShadow: active ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none'
  }}>
    {icon} <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{label}</span>
  </div>
);

const AdminStatCard = ({ label, value, icon, bg, desc }) => (
  <div style={{ background: 'white', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
      <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>{label}</span>
      <div style={{ background: bg, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{desc}</span>
    </div>
  </div>
);

export default AdminDashboard;
