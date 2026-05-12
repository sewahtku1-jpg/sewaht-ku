"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@sanity/client';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
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
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sanityConfig, setSanityConfig] = useState({ token: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [productModal, setProductModal] = useState({ open: false, mode: 'add', data: null });

  const getClient = () => {
    return createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'lzgftrin',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      useCdn: false,
      apiVersion: '2023-05-03',
      token: sanityConfig.token || localStorage.getItem('sanityToken') || ''
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('sanityToken');
    if (token) setSanityConfig({ token });
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const client = getClient();
      const [fetchedOrders, fetchedProducts] = await Promise.all([
        client.fetch('*[_type == "quotation"] | order(_createdAt desc)'),
        client.fetch('*[_type == "item"] | order(_createdAt desc)')
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('sanityToken', sanityConfig.token);
    setIsSettingsOpen(false);
    fetchData();
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!sanityConfig.token) return alert('Silakan masukkan Sanity API Token di pengaturan terlebih dahulu.');
    
    const form = e.target;
    const client = getClient();
    
    const doc = {
      _type: 'item',
      name: form.name.value,
      price: parseInt(form.price.value),
      img: form.img.value || '/assets/baofeng.png',
      desc: form.desc.value,
      specs: form.specs.value.split(',').map(s => s.trim())
    };

    try {
      if (productModal.mode === 'add') {
        await client.create(doc);
      } else {
        await client.patch(productModal.data._id).set(doc).commit();
      }
      setProductModal({ open: false, mode: 'add', data: null });
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    if (!sanityConfig.token) return alert('Butuh API Token!');
    try {
      await getClient().delete(id);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const updateOrderStatus = async (id, currentStatus) => {
    if (!sanityConfig.token) return alert('Butuh API Token!');
    const nextStatus = currentStatus === 'Draf' ? 'Diproses' : currentStatus === 'Diproses' ? 'Selesai' : 'Draf';
    try {
      await getClient().patch(id).set({ status: nextStatus }).commit();
      fetchData();
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Draf').length;

  return (
    <div className="admin-container">
      <div className="bg-blobs" style={{ opacity: 0.1 }}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* SIDEBAR */}
      <aside className="admin-sidebar" style={{ zIndex: 10 }}>
        <div className="logo-box" style={{ marginBottom: '3rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
            <Radio color="white" size={24} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--slate-900)' }}>Sewa HT Ku</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<ShoppingBag size={20} />} label="Pesanan" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={<Package size={20} />} label="Produk" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <SidebarItem icon={<Settings size={20} />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setIsSettingsOpen(true)} />
        </nav>

        <div style={{ paddingTop: '2rem', borderTop: '1px solid #E2E8F0' }}>
          <motion.a href="/" whileHover={{ x: 5, color: '#2563EB' }} className="sidebar-item" style={{ color: '#64748B', textDecoration: 'none' }}>
            <Eye size={20} /> Lihat Website
          </motion.a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main" style={{ zIndex: 10 }}>
        <header className="admin-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--slate-900)', letterSpacing: '-0.5px' }}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'orders' && 'Manajemen Pesanan'}
              {activeTab === 'products' && 'Manajemen Produk'}
            </h1>
            <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>Mode: Live Cloud (Sanity CMS)</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="/assets/logo.png"
              alt="Admin"
              style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', objectFit: 'contain', background: '#fff' }}
            />
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                  <AdminStatCard label="Total Pesanan" value={orders.length} icon={<FileText color="white" />} bg="#6366F1" trend="+2" delay={0.1} />
                  <AdminStatCard label="Total Produk" value={products.length} icon={<Package color="white" />} bg="#14B8A6" trend="Live" delay={0.2} />
                  <AdminStatCard label="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString()}`} icon={<CreditCard color="white" />} bg="#A855F7" trend="+15%" delay={0.3} />
                  <AdminStatCard label="Pesanan Baru" value={pendingOrders} icon={<Bookmark color="white" />} bg="#F59E0B" trend="Draf" delay={0.4} />
                </div>

                <div className="premium-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Aktivitas Terbaru</h3>
                  {orders.slice(0, 5).map(o => (
                    <div key={o._id} style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{o.customer?.name || 'Pelanggan'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{new Date(o._createdAt).toLocaleDateString()} - {o.items?.length || 0} unit</div>
                      </div>
                      <span className={`status-badge ${o.status === 'Selesai' ? 'badge-success' : o.status === 'Diproses' ? 'badge-process' : 'badge-pending'}`}>
                        {o.status || 'Draf'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="premium-card" style={{ padding: 0 }}>
                <div className="table-header" style={{ padding: '1.5rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input type="text" placeholder="Cari pelanggan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="premium-input" style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', width: '250px' }} />
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.85rem' }}>
                        <th style={{ padding: '1rem 1.5rem' }}>ID</th>
                        <th>PELANGGAN</th>
                        <th>DURASI</th>
                        <th>TOTAL</th>
                        <th>STATUS</th>
                        <th>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
                        <tr key={o._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#2563EB' }}>{o.id || o._id.slice(0,6)}</td>
                          <td style={{ fontWeight: 600 }}>{o.customer?.name} <br/><span style={{ fontSize: '0.8rem', color: '#64748B' }}>{o.customer?.phone}</span></td>
                          <td>{o.items?.[0]?.days || 1} Hari</td>
                          <td style={{ fontWeight: 700 }}>Rp {(o.grandTotal || 0).toLocaleString()}</td>
                          <td>
                            <button onClick={() => updateOrderStatus(o._id, o.status)} className={`status-badge ${o.status === 'Selesai' ? 'badge-success' : o.status === 'Diproses' ? 'badge-process' : 'badge-pending'}`} style={{ border: 'none', cursor: 'pointer' }}>
                              {o.status || 'Draf'}
                            </button>
                          </td>
                          <td>
                            <button className="btn-icon" style={{ background: '#F1F5F9', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: '#64748B' }}>
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 800 }}>Katalog Website</h3>
                  <button onClick={() => setProductModal({ open: true, mode: 'add', data: null })} className="btn-vibrant btn-primary" style={{ padding: '0.6rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Plus size={18} /> Tambah Produk
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {products.map(p => (
                    <div key={p._id} className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                      <img src={p.img || '/assets/baofeng.png'} alt={p.name} style={{ width: '100%', height: '180px', objectFit: 'contain', marginBottom: '1rem' }} />
                      <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{p.name}</h4>
                      <div style={{ color: '#2563EB', fontWeight: 700, marginBottom: '1rem' }}>Rp {p.price?.toLocaleString()} / Hari</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button onClick={() => setProductModal({ open: true, mode: 'edit', data: p })} style={{ flex: 1, background: '#F1F5F9', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '0.3rem', color: '#334155' }}>
                          <Edit2 size={16} /> Edit
                        </button>
                        <button onClick={() => deleteProduct(p._id)} style={{ flex: 1, background: '#FEF2F2', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '0.3rem', color: '#EF4444' }}>
                          <Trash2 size={16} /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* PRODUCT MODAL */}
      <AnimatePresence>
        {productModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="premium-card" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.3rem' }}>{productModal.mode === 'add' ? 'Tambah Produk' : 'Edit Produk'}</h3>
              <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>Nama Produk</label>
                  <input name="name" defaultValue={productModal.data?.name} required className="premium-input" style={{ width: '100%', padding: '0.7rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>Harga (Rp) per Hari</label>
                  <input name="price" type="number" defaultValue={productModal.data?.price} required className="premium-input" style={{ width: '100%', padding: '0.7rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>URL Gambar</label>
                  <input name="img" defaultValue={productModal.data?.img} className="premium-input" placeholder="/assets/baofeng.png" style={{ width: '100%', padding: '0.7rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>Deskripsi Pendek</label>
                  <input name="desc" defaultValue={productModal.data?.desc} required className="premium-input" style={{ width: '100%', padding: '0.7rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>Spesifikasi (Pisahkan dengan koma)</label>
                  <input name="specs" defaultValue={productModal.data?.specs?.join(', ')} required className="premium-input" placeholder="Dual-band, Jangkauan 5km" style={{ width: '100%', padding: '0.7rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setProductModal({ open: false, mode: 'add', data: null })} style={{ flex: 1, padding: '0.8rem', background: '#F1F5F9', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                  <button type="submit" className="btn-vibrant btn-primary" style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Simpan Data</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="premium-card" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.3rem' }}>Pengaturan Database</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>Sanity API Token (Writer)</label>
                  <input 
                    type="password" 
                    value={sanityConfig.token} 
                    onChange={e => setSanityConfig({...sanityConfig, token: e.target.value})} 
                    className="premium-input" 
                    placeholder="sk..." 
                    style={{ width: '100%', padding: '0.7rem' }} 
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.5rem' }}>Dibutuhkan untuk menambah/mengedit produk dan merubah status pesanan. Tersimpan lokal di browser.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setIsSettingsOpen(false)} style={{ flex: 1, padding: '0.8rem', background: '#F1F5F9', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                  <button onClick={saveSettings} className="btn-vibrant btn-primary" style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Simpan Token</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .admin-sidebar {
          width: 260px;
          background: white;
          border-right: 1px solid #E2E8F0;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          color: #64748B;
          transition: all 0.3s ease;
        }
        .sidebar-item.active {
          background: #EFF6FF;
          color: #2563EB;
        }
        .admin-main {
          flex: 1;
          padding: 2rem 3rem;
          overflow-y: auto;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }
        .premium-card {
          background: white;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(10px);
        }
        .stat-card-premium {
          padding: 1.5rem;
        }
        .badge-success { background: #D1FAE5; color: #10B981; }
        .badge-process { background: #DBEAFE; color: #2563EB; }
        .badge-pending { background: #FEF3C7; color: #D97706; }
        .status-badge {
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
const SidebarItem = ({ icon, label, active, onClick }) => (
  <motion.div whileHover={{ x: 5, background: '#F8FAFC' }} className={`sidebar-item ${active ? 'active' : ''}`} onClick={onClick}>
    {icon} <span style={{ fontSize: '0.9rem' }}>{label}</span>
  </motion.div>
);
const AdminStatCard = ({ label, value, icon, bg, trend, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="premium-card stat-card-premium">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
      <div style={{ background: bg, padding: '0.8rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 20px ${bg}44` }}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <span style={{ fontSize: '0.75rem', color: trend === 'Draf' ? '#D97706' : '#10B981', fontWeight: 800, background: trend === 'Draf' ? '#FEF3C7' : '#D1FAE5', padding: '0.3rem 0.7rem', borderRadius: '100px' }}>{trend}</span>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--slate-900)', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>{value}</div>
    <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>{label}</p>
  </motion.div>
);
