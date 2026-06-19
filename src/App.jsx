import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ConnectionSetup from './views/ConnectionSetup';
import { clearSupabaseConfig } from './supabaseClient';
import Login from './views/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import KanbanBoard from './views/KanbanBoard';
import ProductionQueue from './views/ProductionQueue';
import Clients from './views/Clients';
import Tasks from './views/Tasks';
import UserSettings from './views/UserSettings';
import Warehouse from './views/Warehouse';
import { Loader2, ShieldAlert, Clock, LogOut, X } from 'lucide-react';

function AppContent() {
  const { isConnected, user, profile, profileError, loading, logout, refreshProfile } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onUpdateMessage) {
      window.electronAPI.onUpdateMessage((info) => {
        setUpdateInfo(info);
        if (info.status === 'not-available' || info.status === 'error') {
          setTimeout(() => {
            setUpdateInfo(null);
          }, 4000);
        }
      });
    }
  }, []);

  // Adjust default view based on role
  useEffect(() => {
    if (profile) {
      if (profile.role === 'technician') {
        setActiveView('production');
      } else {
        setActiveView('dashboard');
      }
    }
  }, [profile]);

  // 1. Database connection check
  if (!isConnected) {
    return <ConnectionSetup />;
  }

  // 2. Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: '#070a13',
        gap: '16px'
      }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Загрузка CRM...</div>
      </div>
    );
  }

  // 3. User session check
  if (!user) {
    return <Login />;
  }

  // 4. Wait for profile loading
  if (!profile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: '#070a13',
        gap: '20px'
      }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Загрузка профиля...</div>
        
        {profileError && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '12px',
            maxWidth: '360px',
            textAlign: 'center'
          }}>
            Ошибка: {profileError}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button 
            onClick={logout}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Выйти из аккаунта
          </button>
          <button 
            onClick={() => {
              if (confirm('Сбросить настройки подключения к базе данных?')) {
                clearSupabaseConfig();
                window.location.reload();
              }
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-dark)' }}
          >
            Сбросить БД
          </button>
        </div>
      </div>
    );
  }

  // 5. Role checking (Pending and Disabled status screens)
  if (profile.role === 'pending' || profile.role === 'disabled') {
    const isPending = profile.role === 'pending';
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: '#070a13'
      }}>
        <div className="glass-panel animate-fade-in" style={{ width: '450px', textAlign: 'center', padding: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isPending ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isPending ? 'var(--warning)' : 'var(--error)',
            marginBottom: '20px'
          }}>
            {isPending ? <Clock size={32} /> : <ShieldAlert size={32} />}
          </div>
          
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', fontFamily: 'Outfit' }}>
            {isPending ? 'Доступ ограничен' : 'Аккаунт заблокирован'}
          </h2>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            {isPending 
              ? 'Ваш аккаунт успешно зарегистрирован, но ожидает одобрения администратора. Пожалуйста, обратитесь к руководителю для назначения роли.'
              : 'Доступ к этой системе для вашего аккаунта заблокирован администратором.'
            }
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isPending && (
              <button 
                onClick={refreshProfile}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Проверить статус одобрения
              </button>
            )}
            
            <button 
              onClick={logout}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogOut size={16} />
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Render view based on activeView state
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <KanbanBoard />;
      case 'production':
        return <ProductionQueue />;
      case 'clients':
        return <Clients />;
      case 'tasks':
        return <Tasks />;
      case 'users':
        return <UserSettings />;
      case 'warehouse':
        return <Warehouse />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {updateInfo && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-hover)',
          borderRadius: '10px',
          padding: '16px 20px',
          width: '320px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader2 className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Обновление CRM</span>
            <button 
              onClick={() => setUpdateInfo(null)}
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0 }}>
            {updateInfo.text}
          </p>
          {updateInfo.status === 'downloading' && (
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${updateInfo.percent || 0}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease-out' }} />
            </div>
          )}
        </div>
      )}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="main-content">
        {renderView()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
