import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  Menu, X, Signal, Truck, ShieldCheck, Banknote, 
  MessageCircle, Instagram, Facebook, Twitter, Phone, 
  MapPin, Clock, ChevronRight, ShoppingCart, Trash2, 
  Plus, Minus, Star, Users, LayoutDashboard, ShoppingBag, 
  DollarSign, Package, Calendar, Zap, CreditCard, Bookmark
} from 'lucide-react';

// Pages
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

// Assets
import logoImg from './assets/logo.png';
import heroImg from './assets/hero.png';
import baofengImg from './assets/baofeng.png';
import motorolaImg from './assets/motorola.png';
import hyteraImg from './assets/hytera.png';

const productsData = [
  { id: 1, name: 'Baofeng UV-5R', price: 25000, img: baofengImg, specs: ["HT Dual Band, jarak jauh, cocok untuk berbagai komunikasi."] },
  { id: 2, name: 'Motorola GP328', price: 30000, img: motorolaImg, specs: ["Suara jernih, kokoh, cocok untuk event besar."] },
  { id: 3, name: 'Hytera BD-505', price: 35000, img: hyteraImg, specs: ["Digital radio dengan kualitas suara terbaik."] },
];

function LandingPage() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [duration, setDuration] = useState(2);
  const [view, setView] = useState('home'); // 'home' or 'checkout'
  const [bookingData, setBookingData] = useState({ name: '', whatsapp: '', note: '' });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const updateCartQty = (id, delta) => setCart(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * duration;

  const handleCheckout = () => {
    const itemsSummary = cart.map(item => `${item.name} (${item.quantity} Unit)`).join(', ');
    const waMsg = `Halo Sewa HT Ku, saya ingin sewa:
*Nama:* ${bookingData.name}
*WA:* ${bookingData.whatsapp}
*Pesanan:* ${itemsSummary}
*Durasi:* ${duration} Hari
*Total:* Rp ${totalPrice.toLocaleString()}
Mohon diproses segera!`;
    window.open(`https://wa.me/6283195474510?text=${encodeURIComponent(waMsg)}`, '_blank');
  };

  if (view === 'checkout') {
    return (
      <div className="checkout-page bg-light">
        <nav className="nav-navy">
          <div className="container nav-content">
            <div className="logo-box" onClick={() => setView('home')} style={{cursor: 'pointer'}}>
              <img src={logoImg} alt="Logo" style={{height: '32px', filter: 'brightness(0) invert(1)'}} />
              <span>Sewa HT Ku</span>
            </div>
            <button className="btn-blue-pill" onClick={() => setView('home')}>Kembali ke Beranda</button>
          </div>
        </nav>

        <div className="container" style={{padding: '4rem 0'}}>
          <div className="checkout-grid">
            <div className="checkout-left">
              <div className="card-white" style={{marginBottom: '2rem'}}>
                <h2 style={{fontSize: '1.75rem', marginBottom: '2rem', color: '#0F172A'}}>Review Keranjang</h2>
                <table className="checkout-table">
                  <thead>
                    <tr><th>Produk</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th><th></th></tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td className="td-product">
                          <img src={item.img} alt={item.name} />
                          <span>{item.name}</span>
                        </td>
                        <td>Rp {item.price.toLocaleString()}</td>
                        <td>
                          <div className="table-qty-box">
                            <Minus size={14} onClick={() => updateCartQty(item.id, -1)} />
                            <span>{item.quantity}</span>
                            <Plus size={14} onClick={() => updateCartQty(item.id, 1)} />
                          </div>
                        </td>
                        <td style={{fontWeight: 700}}>Rp {(item.price * item.quantity).toLocaleString()}</td>
                        <td><Trash2 size={18} color="#EF4444" onClick={() => removeFromCart(item.id)} style={{cursor: 'pointer'}} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-white" style={{width: 'fit-content'}}>
                <h4 style={{marginBottom: '1rem'}}>Durasi Sewa</h4>
                <div className="duration-selector">
                  <Calendar size={20} color="#3B82F6" />
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                  <span>Hari</span>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <div className="card-white">
                <h3 style={{marginBottom: '2rem'}}>Formulir Booking</h3>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input type="text" placeholder="Nama Anda" value={bookingData.name} onChange={e => setBookingData({...bookingData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input type="text" placeholder="0812..." value={bookingData.whatsapp} onChange={e => setBookingData({...bookingData, whatsapp: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea placeholder="Contoh: Titik antar di lobby hotel" rows="3"></textarea>
                </div>
                <div className="total-summary-box">
                  <span>Total Bayar</span>
                  <strong>Rp {totalPrice.toLocaleString()}</strong>
                </div>
                <button className="btn-green-full" onClick={handleCheckout}>Kirim via WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="figma-sync">
      <nav className="nav-navy">
        <div className="container nav-content">
          <div className="logo-box">
            <img src={logoImg} alt="Logo" style={{height: '32px', filter: 'brightness(0) invert(1)'}} />
            <span>Sewa HT Ku</span>
          </div>
          <ul className="nav-links">
            <li>Beranda</li><li>Produk</li><li>Paket</li><li>Cara Sewa</li><li>Testimoni</li><li>Kontak</li>
          </ul>
          <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
            <div className="nav-cart" onClick={() => setView('checkout')}>
              <ShoppingCart size={24} />
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </div>
            <button className="btn-blue-pill">Sewa Sekarang</button>
          </div>
        </div>
      </nav>

      <header className="hero-navy">
        <div className="container hero-grid">
          <div className="hero-text">
            <h1>Sewa HT Ku – Solusi Komunikasi Acara Anda</h1>
            <p>HT berkualitas, sinyal jernih, siap pakai untuk event, kegiatan outdoor, proyek, dan kebutuhan komunikasi lainnya.</p>
            <button className="btn-blue-pill hero-cta" onClick={() => setView('checkout')}>Sewa Sekarang via WhatsApp</button>
          </div>
          <div className="hero-visual">
            <img src={heroImg} alt="HT" />
          </div>
        </div>
      </header>

      <div className="container">
        <div className="trust-bar-figma">
          <TrustItem icon={<Star fill="#3B82F6" />} title="4.9/5" desc="Rating Pelanggan" />
          <TrustItem icon={<ShieldCheck />} title="Terpercaya" desc="Aman & Profesional" />
          <TrustItem icon={<Clock />} title="Respon Cepat" desc="Kurang dari 5 menit" />
          <TrustItem icon={<Banknote />} title="Harga Transparan" desc="Tanpa biaya tambahan" />
        </div>
      </div>

      <section className="section-keunggulan">
        <div className="container">
          <h2>Keunggulan</h2>
          <div className="keunggulan-grid">
            <KeunggulanItem icon={<Zap />} title="Siap Pakai" desc="Unit siap digunakan dalam kondisi terbaik." />
            <KeunggulanItem icon={<Signal />} title="Sinyal Stabil" desc="Jangkauan luas dan jernih di berbagai medan." />
            <KeunggulanItem icon={<Banknote />} title="Harga Terjangkau" desc="Kualitas terbaik dengan harga kompetitif." />
            <KeunggulanItem icon={<Truck />} title="Antar Jemput" desc="Layanan antar jemput unit ke lokasi acara." />
          </div>
        </div>
      </section>

      <section className="section-produk container">
        <div className="section-head-center">
          <h2>Produk Unggulan</h2>
          <p>Pilih paket HT sesuai kebutuhan acara Anda</p>
        </div>
        <div className="product-grid">
          {productsData.map(p => (
            <div key={p.id} className="product-card-figma">
              <div className="p-img"><img src={p.img} alt={p.name} /></div>
              <h3>{p.name}</h3>
              <p className="p-specs">{p.specs[0]}</p>
              <div className="p-price-box">
                <span className="price">Rp {p.price.toLocaleString()}</span>
                <span className="unit">/ hari</span>
              </div>
              <button className="btn-blue-pill full-width" onClick={() => addToCart(p)}>Tambah ke Keranjang</button>
            </div>
          ))}
        </div>
      </section>

      <section className="section-testi container">
        <div className="section-head-center">
          <h2>Testimoni</h2>
          <p>Apa kata mereka tentang layanan kami</p>
        </div>
        <div className="testi-grid-figma">
          <TestiItem name="Andi Pratama" role="Panitia Event" text="Unit HT sangat jernih dan tim sangat responsif. Acara kami sukses besar!" img="https://i.pravatar.cc/150?u=10" />
          <TestiItem name="Sarah Aulia" role="EO Wedding" text="Harga bersahabat dan kualitas alat terbaik. Sangat merekomendasikan Sewa HT Ku." img="https://i.pravatar.cc/150?u=20" />
          <TestiItem name="Dimas Setiawan" role="Project Manager" text="Baterai awet seharian meski digunakan intens. Sangat puas dengan layanannya." img="https://i.pravatar.cc/150?u=30" />
        </div>
      </section>

      <footer className="footer-figma">
        <div className="container footer-grid-figma">
          <div className="footer-brand">
            <div className="logo-box white">
              <img src={logoImg} alt="Logo" style={{height: '32px', filter: 'brightness(0) invert(1)'}} />
              <span>Sewa HT Ku</span>
            </div>
            <p>Solusi komunikasi terbaik untuk segala jenis acara Anda.</p>
            <div className="social-row">
              <Instagram size={20} /> <Facebook size={20} /> <Twitter size={20} />
            </div>
          </div>
          <div className="footer-col">
            <h4>Address</h4>
            <p>Griya Satria Jingga E2/21, Ragajaya, Citayam, Bogor</p>
          </div>
          <div className="footer-col">
            <h4>Cara Sewa</h4>
            <ul><li>Pilih HT</li><li>Booking WA</li><li>Unit Diantar</li><li>Selesai</li></ul>
          </div>
          <div className="footer-col">
            <h4>Kontak</h4>
            <ul><li>WA: 0812-3456-7890</li><li>IG: @sewahtku</li><li>Email: info@sewahtku.id</li></ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">© 2024 Sewa HT Ku. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

const TrustItem = ({ icon, title, desc }) => (
  <div className="trust-item-figma">
    <div className="icon-wrap">{icon}</div>
    <div><strong>{title}</strong><br/><small>{desc}</small></div>
  </div>
);

const KeunggulanItem = ({ icon, title, desc }) => (
  <div className="keunggulan-item-figma">
    <div className="icon-card">{icon}</div>
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

const TestiItem = ({ name, role, text, img }) => (
  <div className="testi-card-figma">
    <img src={img} alt={name} className="testi-avatar" />
    <h4>{name}</h4>
    <small>{role}</small>
    <p>"{text}"</p>
    <div className="testi-stars">
      <Star size={12} fill="#F59E0B" color="#F59E0B" /> <Star size={12} fill="#F59E0B" color="#F59E0B" /> <Star size={12} fill="#F59E0B" color="#F59E0B" /> <Star size={12} fill="#F59E0B" color="#F59E0B" /> <Star size={12} fill="#F59E0B" color="#F59E0B" />
    </div>
  </div>
);

function App() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('adminToken'));
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <AdminLogin onLogin={() => setIsAdmin(true)} />} />
      </Routes>
    </Router>
  );
}

export default App;
