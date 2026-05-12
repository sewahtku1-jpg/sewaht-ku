"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Radio, User, Lock, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        router.push('/admin/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal menghubungi server');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: '#FDFEFF' }}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="premium-card auth-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.div 
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            style={{ background: 'var(--accent-gradient)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)' }}
          >
            <Radio size={40} color="white" />
          </motion.div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--slate-900)', letterSpacing: '-1.5px', marginBottom: '0.4rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600, fontSize: '0.95rem' }}>Silakan login untuk mengelola pesanan.</p>
        </div>
        
        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box">{error}</motion.div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--slate-900)' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--indigo-primary)' }} />
              <input 
                type="text" 
                className="premium-input"
                placeholder="Admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--slate-900)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--indigo-primary)' }} />
              <input 
                type="password" 
                className="premium-input"
                placeholder="Enter secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
            <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-vibrant btn-primary" 
            style={{ width: '100%', padding: '1.25rem', justifyContent: 'center', fontSize: '1.1rem' }}
          >
            Authenticate <ArrowRight size={20} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
