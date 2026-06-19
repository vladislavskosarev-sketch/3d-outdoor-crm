import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Users, Search, ShieldAlert, CheckCircle, Trash2, Shield } from 'lucide-react';

export default function UserSettings() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  const loadUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load user list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, nextRole) => {
    // Safety check: Don't let the logged-in admin change their own role!
    if (userId === currentUser?.id) {
      setStatus({ type: 'error', message: 'Вы не можете изменить свою собственную роль!' });
      return;
    }

    setStatus({ type: '', message: '' });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state directly
      setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      setStatus({ type: 'success', message: 'Роль сотрудника успешно обновлена!' });
    } catch (err) {
      console.error('Failed to update role:', err);
      setStatus({ type: 'error', message: err.message || 'Ошибка обновления роли.' });
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-title">
          <h1>Управление сотрудниками</h1>
          <p>Настройка прав доступа (RBAC) и одобрение новых пользователей</p>
        </div>
      </div>

      {/* Main Panel Content */}
      <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
        {status.message && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: status.type === 'success' ? 'var(--success)' : 'var(--error)'
          }}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
            <span>{status.message}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-dark)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '44px' }} 
              placeholder="Поиск сотрудника по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Загрузка списка сотрудников...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Сотрудники не найдены.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ФИО Сотрудника</th>
                    <th>Email</th>
                    <th>Дата регистрации</th>
                    <th>Права / Роль</th>
                    <th style={{ width: '220px', textAlign: 'center' }}>Сменить роль</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} style={{ opacity: u.role === 'disabled' ? 0.6 : 1 }}>
                        <td style={{ fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={14} style={{ color: isSelf ? 'var(--primary)' : 'var(--text-dark)' }} />
                            {u.full_name} {isSelf && <span style={{ color: 'var(--text-dark)', fontWeight: '400', fontSize: '12px' }}>(Вы)</span>}
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <span className={`badge ${
                            u.role === 'admin' ? 'badge-admin' :
                            u.role === 'manager' ? 'badge-manager' :
                            u.role === 'technician' ? 'badge-technician' :
                            u.role === 'pending' ? 'badge-pending' : 'badge-disabled'
                          }`}>
                            {u.role === 'admin' ? 'Администратор' :
                             u.role === 'manager' ? 'Менеджер' :
                             u.role === 'technician' ? 'Техник/Мастер' :
                             u.role === 'pending' ? 'На модерации' : 'Заблокирован'}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-control"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            value={u.role}
                            disabled={isSelf} // Self role protection
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="pending">На модерации (Доступ закрыт)</option>
                            <option value="technician">Мастер (Производство)</option>
                            <option value="manager">Менеджер (Продажи & Сделки)</option>
                            <option value="admin">Администратор (Полный доступ)</option>
                            <option value="disabled">Заблокировать доступ</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
