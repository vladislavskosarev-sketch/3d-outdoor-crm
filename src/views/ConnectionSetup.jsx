import React, { useState } from 'react';
import { updateSupabaseConfig } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Database, Link, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ConnectionSetup() {
  const { checkConnection } = useAuth();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatus({ type: 'error', message: 'Пожалуйста, заполните оба поля.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // 1. Update config (sets local variables and storage)
      const client = updateSupabaseConfig(url.trim(), key.trim());

      // 2. Validate connection by making a dummy call
      // We check if we can query profiles (head only, to verify keys are valid)
      const { error } = await client
        .from('profiles')
        .select('*')
        .limit(1);

      // Note: If the table doesn't exist yet, we might get a table not found error, 
      // but if the error is 401 Unauthorized or network error, then the credentials are wrong.
      // A successful query or table not found (PostgrestError) with correct status code means we connected.
      if (error && error.message.includes('API key')) {
        throw new Error('Неверный Supabase Anon Key.');
      } else if (error && error.code === 'PGRST116') {
        // Table single error is fine, means we connected!
      } else if (error && error.message.includes('fetch')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте URL.');
      }

      setStatus({ type: 'success', message: 'Соединение успешно установлено! Перезапуск...' });
      
      // Notify AuthContext and refresh state
      setTimeout(() => {
        checkConnection();
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatus({ 
        type: 'error', 
        message: err.message || 'Ошибка соединения. Проверьте правильность введенных данных.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100vh',
      background: '#070a13'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '480px', border: '1px solid var(--border-hover)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--primary)',
            marginBottom: '16px'
          }}>
            <Database size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit' }}>Подключение к Базе Данных</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Настройте облачную базу данных Supabase для вашей CRM
          </p>
        </div>

        {status.message && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: status.type === 'success' ? 'var(--success)' : 'var(--error)'
          }}>
            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <div>{status.message}</div>
          </div>
        )}

        <form onSubmit={handleConnect}>
          <div className="form-group">
            <label className="form-label">SUPABASE URL</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="https://xxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">SUPABASE ANON KEY</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Подключение...' : 'Подключиться к базе'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            <Info size={14} />
            <span>Как настроить?</span>
          </div>
          <ol style={{ paddingLeft: '16px', lineHeight: '1.6' }}>
            <li>Создайте бесплатный аккаунт на <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>supabase.com</a></li>
            <li>Создайте новый проект (Project Name: <b>CRM-3D-Outdoor</b>)</li>
            <li>Перейдите в настройки <b>Project Settings → API</b></li>
            <li>Скопируйте <b>Project URL</b> и <b>anon/public Key</b> и вставьте их выше</li>
            <li>Запустите SQL-скрипт (файл <code>supabase_schema.sql</code> в корне проекта) в разделе <b>SQL Editor</b> в панели Supabase</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
