"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  ChevronRight, 
  ShoppingCart, 
  ShoppingBag,
  Plus, 
  Minus, 
  Trash2, 
  Zap, 
  Shield, 
  Truck, 
  Radio, 
  Instagram, 
  Facebook, 
  Twitter,
  ArrowRight,
  Star,
  CheckCircle2,
  MapPin,
  Phone,
  Menu,
  X,
  Headset
} from 'lucide-react';


const productsData = [
  { id: 1, name: "Baofeng BF-888S", price: 10000, img: "/assets/bf888s_1.png", desc: "Dual-band hand-held transceiver with display function menu on the display 'LCD'.", specs: ["136-174 / 400-520MHz", "Up to 5km range", "Long battery life"] },
  { id: 2, name: "Baofeng UV-82", price: 20000, img: "/assets/uv82_new_1.png", desc: "The practical radio solution for professionals who need to stay in touch.", specs: ["UHF/VHF", "Rugged design", "Clear audio quality"] }
];

import { toast } from 'sonner';

const ProductCard = ({ p, idx, onOpenSpecs }) => {
  const images = (p.img || '/assets/baofeng.png').split(',').map(s => s.trim());
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.23, 1, 0.32, 1] }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'white', borderRadius: '16px', padding: '2.5rem 2rem 2rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
        position: 'relative'
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '280px', marginBottom: '2.5rem' }}>
        <motion.img 
          key={images[currentImgIdx]}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          src={images[currentImgIdx]} 
          alt={p.name} 
          style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
        />
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: '-20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {images.map((_, i) => (
              <div 
                key={i} 
                onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(i); }}
                style={{ 
                  width: i === currentImgIdx ? '24px' : '8px', 
                  height: '8px', 
                  background: i === currentImgIdx ? '#0250a3' : 'rgba(0,0,0,0.15)', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: '0.3s'
                }} 
              />
            ))}
          </div>
        )}
      </div>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)', textAlign: 'center', marginBottom: '1.5rem', marginTop: 'auto' }}>
        {p.name}
      </h3>

      <button 
        onClick={() => onOpenSpecs(p)}
        style={{
          background: '#0250a3',
          color: 'white',
          border: 'none',
          padding: '12px 32px',
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: '6px',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(2, 80, 163, 0.2)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#013e82';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#0250a3';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Spesifikasi
      </button>
    </motion.div>
  );
};

export default function LandingPage() {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(productsData);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // --- SYNC WITH NEON DB ---
  useEffect(() => {
    const fetchFromNeonDB = async () => {
      try {
        const url = `/api/admin/db?store=items`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data.length > 0) {
          const mappedItems = data.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            img: item.img || "/assets/baofeng.png", // This might be comma separated
            desc: item.desc || "Perangkat HT profesional dengan kualitas suara jernih.",
            specs: item.specs || ["Dual-band", "Range up to 5km", "Long battery"]
          }));
          setProducts(mappedItems);
        }
      } catch (err) {
        console.error("Failed to fetch products from Neon DB", err);
      }
    };
    
    fetchFromNeonDB();
  }, []);

  const [marqueeLogos, setMarqueeLogos] = useState([]);
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch('/api/logos');
        const data = await res.json();
        if (data.success && data.logos) {
          setMarqueeLogos(data.logos);
        }
      } catch (err) {
        console.error('Failed to fetch marquee logos', err);
      }
    };
    fetchLogos();
  }, []);

  // Checkout states
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [duration, setDuration] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} ditambahkan ke keranjang!`);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const totalCart = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) * duration;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !whatsapp || !paymentProof) {
      toast.error('Mohon lengkapi data dan bukti pembayaran.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Send order to our secure Next.js API Route which writes to Sanity
      const orderPayload = {
        customerName,
        whatsapp,
        duration,
        totalCart,
        cart,
        paymentProof: "Uploaded via WA" // You can implement actual image upload to Sanity later if needed
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server error');
      }

      toast.success('Pesanan berhasil dibuat & masuk ke Dashboard Admin!');
      
      // Format WA message
      let itemsText = cart.map(i => `- ${i.name} (${i.qty}x)`).join('%0A');
      let waText = `Halo Sewa HT Ku!%0A%0ASaya ingin menyewa HT dengan detail berikut:%0A%0A*Nama:* ${customerName}%0A*WhatsApp:* ${whatsapp}%0A*Durasi:* ${duration} Hari%0A%0A*Pesanan:*%0A${itemsText}%0A%0A*Total:* Rp ${totalCart.toLocaleString()}%0A%0ABukti pembayaran telah saya unggah. Mohon konfirmasinya.%0A(ID Pesanan: ${data.orderId || 'ORD-NEW'})`;
      
      window.open(`https://wa.me/6283195474510?text=${waText}`, '_blank');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setWhatsapp('');
      setDuration(1);
      setPaymentProof(null);
      setView('home');
    } catch (err) {
      toast.error('Gagal memproses pesanan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="hero-bg-img"></div>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-logo">
            Sewa<span>HT</span>Ku
          </div>
          <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="mobile-nav-list">
          {[
            { num: '01', label: 'Beranda', href: '#', icon: <Zap size={20} /> },
            { num: '02', label: 'Produk', href: '#produk', icon: <Radio size={20} /> },
            { num: '03', label: 'Kontak', href: '#footer', icon: <Phone size={20} /> }
          ].map((item) => (
            <a 
              key={item.num} 
              href={item.href} 
              className="mobile-nav-item" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mobile-nav-num">{item.num}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </div>
              <ChevronRight className="mobile-nav-arrow" size={20} />
            </a>
          ))}
        </div>

        <div className="mobile-drawer-cta">
          <button 
            className="mobile-cta-btn" 
            onClick={() => { setMobileMenuOpen(false); setView('checkout'); }}
          >
            Mulai Sewa Sekarang <ArrowRight size={20} />
          </button>
          <p className="mobile-contact-hint">Tersedia 24/7 untuk kebutuhan Anda</p>
        </div>
      </div>

      <nav className={`nav-vibrant ${isScrolled ? 'nav-scrolled' : ''}`}>
        <div className="container flex-between" style={{ transition: '0.4s', height: isScrolled ? '65px' : '90px' }}>
          <div className="logo-box" onClick={() => setView('home')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <span style={{ fontSize: isScrolled ? '1.4rem' : '1.6rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--slate-900)', letterSpacing: '-1px', lineHeight: 1 }}>
                Sewa<span className="text-highlight">HT</span>Ku
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: isScrolled ? '2.5rem' : '3rem' }}>
            <ul className="nav-links" style={{ gap: isScrolled ? '2rem' : '2.5rem' }}>
              <li><a href="#" className="nav-link-premium" style={{ fontSize: isScrolled ? '0.9rem' : '0.95rem' }}>Beranda</a></li>
              <li><a href="#produk" className="nav-link-premium" style={{ fontSize: isScrolled ? '0.9rem' : '0.95rem' }}>Produk</a></li>
              <li><a href="#footer" className="nav-link-premium" style={{ fontSize: isScrolled ? '0.9rem' : '0.95rem' }}>Kontak</a></li>
            </ul>
            
            <motion.div 
              whileHover={{ scale: 1.1, translateY: -2 }}
              whileTap={{ scale: 0.9 }}
              className="cart-icon-wrapper"
              style={{ 
                background: 'white', 
                border: '2px solid #F1F5F9', 
                boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                width: isScrolled ? '52px' : '60px',
                height: isScrolled ? '52px' : '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setView('checkout')}
            >
              <ShoppingCart size={isScrolled ? 24 : 28} color="var(--indigo-primary)" strokeWidth={2.5} />
              {cart.length > 0 && <span className="cart-badge" style={{ border: '2px solid white', width: '22px', height: '22px', fontSize: '0.75rem', top: '-5px', right: '-5px' }}>{cart.length}</span>}
            </motion.div>

            {/* Hamburger — shown on mobile via CSS */}
            <button
              className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{ zIndex: 1001 }}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className="view-home-wrapper">
        {view === 'home' ? (
          <div key="home">
            <header className="hero-modern">
              <div className="container">
                <div className="hero-grid">
                  <div className="hero-content" suppressHydrationWarning>
                    {/* Label badge */}
                    <div className="hero-tag-wrapper">
                      <span className="hero-tag">
                        <Radio size={12} />
                        <span>Penyewaan Walky Talky</span>
                      </span>
                    </div>

                    {/* Title — no glass box wrapper, cleaner standalone */}
                    <h1 className="hero-title" suppressHydrationWarning>
                      <span>Komunikasi </span>
                      <span className="text-highlight">Lancar</span>
                      <span>,</span>
                      <br />
                      <span>Event Makin </span>
                      <span className="text-highlight">Besar</span>
                      <span>.</span>
                    </h1>

                    <div className="hero-actions">
                      <button className="btn-vibrant btn-primary" onClick={() => setView('checkout')}>
                        <span>Mulai Sewa Sekarang</span> <ArrowRight size={18} />
                      </button>
                      <a href="#produk" className="btn-vibrant btn-outline">
                        <span>Lihat Produk</span>
                      </a>
                    </div>

                    {/* Continuous Logo Marquee */}
                    <div className="marquee-container">
                      <div className="marquee-eyebrow">Dipercaya & Mensponsori Berbagai Event Besar</div>
                      <div className="marquee-track-wrapper">
                        <div className="marquee-track">
                          {marqueeLogos.concat(marqueeLogos, marqueeLogos, marqueeLogos).map((logo, idx) => (
                            <div key={idx} className="marquee-logo-item">
                              <img src={logo.url} alt={logo.name} className="marquee-img" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </header>

            {/* Trust Badges */}
            <div className="trust-section">
              <div className="container">
                <div className="trust-grid">
                  <TrustFeature icon={<Zap color="var(--indigo-primary)" />} title="Instan" desc="Ready Stock" />
                  <TrustFeature icon={<Shield color="var(--teal-primary)" />} title="Bergaransi" desc="Alat Terjamin" />
                  <TrustFeature icon={<Truck color="#A855F7" />} title="Free Ongkir" desc="Sesuai S&K" />
                  <TrustFeature icon={<Headset color="#F59E0B" />} title="24/7" desc="Fast Support" />
                </div>
              </div>
            </div>


            {/* Products Section */}
            <section id="produk" className="products-section">
              <div className="container">
                <div className="section-header">
                  <span className="section-eyebrow">Armada Kami</span>
                  <h2 className="section-title-vibrant">Pilih <span className="text-highlight">Perangkat</span> Terbaik</h2>
                  <p className="section-desc">Perangkat berkualitas tinggi untuk jangkauan sinyal tanpa batas.</p>
                </div>
                <div className="product-grid">
                  {products.map((p, idx) => (
                    <ProductCard key={p.id} p={p} idx={idx} onOpenSpecs={setSelectedProduct} />
                  ))}
                </div>
              </div>
            </section>

            <footer id="footer" className="footer-premium">
              <div className="footer-bg-overlay">
                <Image src="/assets/footer-bg.png" alt="HT Background" fill />
              </div>
              <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 0.7fr 0.7fr 1.2fr', gap: '1.5rem', justifyContent: 'start' }}>
                  <div className="footer-logo-col">
                    <div className="logo-box footer-logo-wrapper">
                      <Image 
                        src="/assets/logo.png" 
                        alt="Sewa HT Ku Logo" 
                        width={600} 
                        height={220} 
                        className="footer-logo-img"
                        style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
                      />
                    </div>
                    <div className="footer-social-col">
                      <div className="social-badge-premium" style={{ width: '36px', height: '36px' }}><Instagram size={16} /></div>
                      <div className="social-badge-premium" style={{ width: '36px', height: '36px' }}><Facebook size={16} /></div>
                      <div className="social-badge-premium" style={{ width: '36px', height: '36px' }}><Twitter size={16} /></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="footer-title">Tautan Cepat</h4>
                    <a href="#" className="footer-link">Beranda</a>
                    <a href="#" className="footer-link">Produk Kami</a>
                    <a href="#" className="footer-link">Paket Sewa</a>
                    <a href="/admin/index.html" className="footer-link" style={{color: 'var(--teal-primary)', fontWeight: 'bold'}}>Dashboard Admin</a>
                    <a href="#" className="footer-link">Syarat & Ketentuan</a>
                  </div>

                  <div>
                    <h4 className="footer-title">Layanan</h4>
                    <a href="#" className="footer-link">Sewa HT Harian</a>
                    <a href="#" className="footer-link">Sewa HT Mingguan</a>
                    <a href="#" className="footer-link">Event Support</a>
                    <a href="#" className="footer-link">Pengiriman Unit</a>
                  </div>

                  <div>
                    <h4 className="footer-title">Hubungi Kami</h4>
                    <div className="footer-contact-item">
                      <div className="footer-contact-icon"><MapPin size={18} /></div>
                      <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>Jl. Ragajaya, Bojonggede, Bogor</span>
                    </div>
                    <div className="footer-contact-item">
                      <div className="footer-contact-icon"><Phone size={18} /></div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>+62 831-9547-4510</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                  <p>&copy; 2024 <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Sewa HT Ku</span>. Crafted for Excellence.</p>
                </div>
              </div>
            </footer>
          </div>
        ) : (
          <motion.div key="checkout" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }} style={{ paddingTop: '160px' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', cursor: 'pointer' }} onClick={() => setView('home')}>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem', borderRadius: '12px' }}>
                  <Minus size={20} />
                </div>
                <span style={{ fontWeight: 800, color: 'var(--slate-600)' }}>Kembali Belanja</span>
              </div>

              <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                <div className="checkout-card premium-card" style={{ padding: '3rem' }}>
                  <h2 className="section-title-vibrant" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: '2.5rem' }}>Detail <span className="text-highlight">Pesanan</span></h2>
                  
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                      <ShoppingBag size={80} color="var(--slate-400)" style={{ marginBottom: '2rem' }} />
                      <p style={{ fontSize: '1.2rem', color: 'var(--slate-600)' }}>Keranjang Anda masih kosong.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {cart.map(item => (
                        <div key={item.id} className="cart-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                              <img src={item.img.split(',')[0].trim()} alt={item.name} style={{ maxHeight: '50px' }} />
                            </div>
                            <div>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{item.name}</h4>
                              <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>Rp {item.price.toLocaleString()} / hari</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQty(item.id, -1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem' }}><Minus size={16} /></motion.button>
                              <span style={{ width: '30px', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>{item.qty}</span>
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQty(item.id, 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem' }}><Plus size={16} /></motion.button>
                            </div>
                            <motion.button whileHover={{ color: '#EF4444' }} onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)' }}><Trash2 size={20} /></motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="checkout-card premium-card" style={{ padding: '3rem', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--slate-900)' }}>Informasi Penyewa</h3>
                  <form onSubmit={handleSubmitOrder}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-700)' }}>Nama Lengkap</label>
                      <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="glass-input" placeholder="Masukkan nama" />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-700)' }}>No. WhatsApp</label>
                      <input type="text" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="glass-input" placeholder="08..." />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-700)' }}>Durasi Sewa (Hari)</label>
                      <input type="number" required min="1" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} className="glass-input" />
                    </div>
                    <div style={{ marginBottom: '2.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-700)' }}>Upload Bukti Transfer</label>
                      <input type="file" required accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} className="glass-input" style={{ borderStyle: 'dashed', fontSize: '0.85rem' }} />
                    </div>

                    <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--slate-600)' }}>
                        <span>Subtotal ({duration} Hari)</span>
                        <span style={{ fontWeight: 800 }}>Rp {totalCart.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 900, color: 'var(--slate-900)' }}>
                        <span>Total Bayar</span>
                        <span style={{ color: 'var(--indigo-primary)' }}>Rp {totalCart.toLocaleString()}</span>
                      </div>
                    </div>

                    <button type="submit" disabled={isSubmitting || cart.length === 0} className="btn-vibrant btn-primary" style={{ width: '100%', padding: '1.25rem', justifyContent: 'center', opacity: (isSubmitting || cart.length === 0) ? 0.7 : 1 }}>
                      {isSubmitting ? 'Memproses...' : 'Kirim Pesanan & Lanjut WA'} <ArrowRight size={20} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Product Specs Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: 'absolute', top: '20px', right: '20px',
                  background: 'var(--bg-secondary)', border: 'none',
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10, color: 'var(--slate-600)'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: 'var(--bg-secondary)', borderRadius: '24px 24px 0 0' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--slate-900)', paddingRight: '40px', lineHeight: 1.2 }}>
                  {selectedProduct.name}
                </h3>
              </div>

              <div style={{ padding: '2rem', flex: 1 }}>
                <p style={{ color: 'var(--slate-600)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  {selectedProduct.desc}
                </p>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '1rem' }}>
                  Spesifikasi Teknis
                </h4>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {selectedProduct.specs.map((s, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <CheckCircle2 size={18} color="var(--teal-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--slate-700)', lineHeight: 1.4 }}>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ 
                padding: '1.5rem 2rem', 
                borderTop: '1px solid #f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'white',
                borderRadius: '0 0 24px 24px'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Harga Sewa</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--indigo-primary)' }}>Rp {selectedProduct.price.toLocaleString()}</span>
                    <span style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>/hari</span>
                  </div>
                </div>
                
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="btn-vibrant btn-primary"
                  style={{ padding: '0.8rem 1.5rem' }}
                >
                  <Plus size={20} />
                  <span>Sewa Alat Ini</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

const TrustFeature = ({ icon, title, desc }) => (
  <motion.div 
    whileHover={{ y: -6 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    className="trust-card premium-card"
  >
    <div className="trust-icon-box">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <h4 className="trust-title">{title}</h4>
    <p className="trust-desc">{desc}</p>
  </motion.div>
);
