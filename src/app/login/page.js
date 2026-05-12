'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        toast.success('Login berhasil! Mengalihkan...');
        // Tunggu sebentar agar toast terlihat
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Password salah!');
        setPassword('');
      }
    } catch (error) {
      toast.error('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      <Toaster position="top-center" richColors />
      
      <div style={{
        backgroundColor: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#eff6ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#2563eb'
        }}>
          <ShieldCheck size={32} />
        </div>
        
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 0.5rem'
        }}>SewaHTku Admin</h1>
        <p style={{
          color: '#64748b',
          fontSize: '0.95rem',
          marginBottom: '2rem'
        }}>Masukkan kata sandi pengelola untuk masuk ke area administratif.</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '1rem',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Lock size={20} />
            </div>
            <input
              type="password"
              placeholder="Kata Sandi Admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#f8fafc',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: password ? '#2563eb' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: password && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()} SewaHTku System
        </div>
      </div>
    </div>
  );
}
