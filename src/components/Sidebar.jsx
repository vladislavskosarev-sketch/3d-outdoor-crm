import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  CheckSquare, 
  Printer, 
  Settings, 
  LogOut, 
  UserCircle,
  Archive
} from 'lucide-react';

export default function Sidebar({ activeView, onViewChange }) {
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Вы действительно хотите выйти?')) {
      await logout();
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'manager': return 'Менеджер';
      case 'technician': return 'Техник';
      default: return 'Сотрудник';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'manager': return 'badge-manager';
      case 'technician': return 'badge-technician';
      default: return 'badge-pending';
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Панель', icon: <LayoutDashboard size={18} />, roles: ['admin', 'manager', 'technician'] },
    { id: 'kanban', label: 'Сделки', icon: <Layers size={18} />, roles: ['admin', 'manager'] },
    { id: 'production', label: 'Производство', icon: <Printer size={18} />, roles: ['admin', 'manager', 'technician'] },
    { id: 'clients', label: 'Клиенты', icon: <Users size={18} />, roles: ['admin', 'manager'] },
    { id: 'tasks', label: 'Задачи', icon: <CheckSquare size={18} />, roles: ['admin', 'manager', 'technician'] },
    { id: 'warehouse', label: 'Склад', icon: <Archive size={18} />, roles: ['admin', 'manager', 'technician'] },
    { id: 'users', label: 'Сотрудники', icon: <Settings size={18} />, roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      background: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'var(--glass-blur)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      boxShadow: 'var(--glass-shadow)',
      zIndex: 100
    }}>
      {/* Brand logo */}
      <div style={{ 
        padding: '0 12px 24px 12px', 
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          boxShadow: '0 0 10px var(--primary-glow)'
        }} />
        <span style={{ 
          fontSize: '18px', 
          fontWeight: '800', 
          fontFamily: 'Outfit', 
          background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          3D & AD CRM
        </span>
      </div>

      {/* Navigation menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {filteredMenuItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '14px',
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'left',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                paddingLeft: isActive ? '13px' : '16px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* User profile widget */}
      {profile && (
        <div style={{
          marginTop: 'auto',
          padding: '16px 12px 0 12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCircle size={36} style={{ color: 'var(--text-muted)' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {profile.full_name || 'Сотрудник'}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span className={`badge ${getRoleBadgeClass(profile.role)}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                  {getRoleLabel(profile.role)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: 'var(--error)',
              fontSize: '13px',
              fontWeight: '500',
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <LogOut size={14} />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
