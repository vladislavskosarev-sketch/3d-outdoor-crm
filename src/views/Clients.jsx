import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Plus, User, Phone, Mail, FileText, Check, X, Edit2, Trash2 } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [clientId, setClientId] = useState(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadClients = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openAddModal = () => {
    setClientId(null);
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setClientId(client.id);
    setName(client.name || '');
    setCompany(client.company || '');
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setNotes(client.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('ФИО/Наименование обязательно для заполнения.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        company: company.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null
      };

      if (clientId) {
        // Edit Mode
        const { error } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', clientId);
        if (error) throw error;
      } else {
        // Create Mode
        const { error } = await supabase
          .from('clients')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      loadClients();
    } catch (err) {
      console.error('Save client error:', err);
      setErrorMsg(err.message || 'Не удалось сохранить клиента.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Вы действительно хотите удалить этого клиента? Все связанные сделки потеряют ссылку на него.')) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);
        if (error) throw error;
        loadClients();
      } catch (err) {
        console.error('Delete client error:', err);
        alert('Не удалось удалить клиента. Возможно, он связан со сделками.');
      }
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(query)) ||
      (client.company && client.company.toLowerCase().includes(query)) ||
      (client.phone && client.phone.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-title">
          <h1>База клиентов</h1>
          <p>Управление контактами и организациями ваших заказчиков</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Добавить клиента
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
        {/* Search controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-dark)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '44px' }} 
              placeholder="Поиск по имени, компании, телефону или почте..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Загрузка базы клиентов...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
              Клиенты не найдены. Создайте нового клиента кнопкой выше.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ФИО / Название</th>
                    <th>Компания</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Заметки</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => (
                    <tr key={client.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} style={{ color: 'var(--primary)' }} />
                          {client.name}
                        </div>
                      </td>
                      <td>{client.company || '—'}</td>
                      <td>
                        {client.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} style={{ color: 'var(--text-dark)' }} />
                            {client.phone}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {client.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} style={{ color: 'var(--text-dark)' }} />
                            {client.email}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ 
                        maxWidth: '220px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        color: 'var(--text-muted)'
                      }}>
                        {client.notes ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={12} style={{ color: 'var(--text-dark)' }} />
                            {client.notes}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px' }}
                            onClick={() => openEditModal(client)}
                            title="Редактировать"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', color: 'var(--error)' }}
                            onClick={() => handleDelete(client.id)}
                            title="Удалить"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '500px', border: '1px solid var(--border-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit' }}>
                {clientId ? 'Редактировать клиента' : 'Новый клиент'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">ФИО / НАИМЕНОВАНИЕ *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Иван Иванович" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">КОМПАНИЯ</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ООО Ромашка" 
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ТЕЛЕФОН</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="+7 (999) 123-45-67" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">EMAIL</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="client@mail.ru" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ДОПОЛНИТЕЛЬНЫЕ ЗАМЕТКИ</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Адреса доставки, требования к чертежам и т.д."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
