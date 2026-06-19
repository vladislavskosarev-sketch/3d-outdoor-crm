import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import DealDetailModal from './DealDetailModal';
import { Plus, Search, Filter, Layers, DollarSign, User, Printer, Tag } from 'lucide-react';

export default function KanbanBoard() {
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, 3d_printing, outdoor_ads, general

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(null); // For Detail Modal
  
  // Add Deal form state
  const [newTitle, setNewTitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newType, setNewType] = useState('general');
  const [newCost, setNewCost] = useState('0');
  const [newManager, setNewManager] = useState(user?.id || '');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  const stages = [
    { id: 'lead', name: 'Лид / Заявка', color: 'rgba(6, 182, 212, 0.15)', borderColor: 'var(--secondary)' },
    { id: 'negotiation', name: 'Переговоры', color: 'rgba(139, 92, 246, 0.15)', borderColor: 'var(--primary)' },
    { id: 'proposal_sent', name: 'КП отправлено', color: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--warning)' },
    { id: 'in_production', name: 'В производстве', color: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899' },
    { id: 'installation', name: 'Монтаж / Сдача', color: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6' },
    { id: 'closed_won', name: 'Успешно', color: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--success)' },
    { id: 'closed_lost', name: 'Проиграно', color: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--error)' }
  ];

  const loadDealsData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Load Deals with client and manager names
      const { data: dealsData, error: dealsErr } = await supabase
        .from('deals')
        .select('*, clients(name, company), profiles(full_name)')
        .order('updated_at', { ascending: false });

      if (dealsErr) throw dealsErr;
      setDeals(dealsData || []);

      // 2. Load Clients for dropdown
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, company')
        .order('name', { ascending: true });
      setClients(clientsData || []);

      // 3. Load Managers for dropdown
      const { data: managersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('role', 'pending')
        .neq('role', 'disabled');
      setManagers(managersData || []);

    } catch (err) {
      console.error('Failed to load Kanban data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealsData();

    // Setup realtime subscription
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, loadDealsData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    // Fast UI optimisitc update
    const previousDeals = [...deals];
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: targetStage } : d));

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: targetStage, updated_at: new Date().toISOString() })
        .eq('id', dealId);

      if (error) throw error;
    } catch (err) {
      console.error('Drag drop save failed:', err);
      setDeals(previousDeals); // Rollback on error
      alert('Ошибка при переносе сделки.');
    }
  };

  const handleAddDeal = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Пожалуйста, введите название сделки.');
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        client_id: newClientId || null,
        deal_type: newType,
        cost: Number(newCost || 0),
        assigned_manager: newManager || null,
        stage: 'lead',
        notes: newNotes.trim() || null
      };

      const { data, error } = await supabase
        .from('deals')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // If the deal is 3D printing or outdoor ad, create the matching detail rows
      if (newType === '3d_printing') {
        await supabase
          .from('jobs_3d_print')
          .insert([{ deal_id: data.id }]);
      } else if (newType === 'outdoor_ads') {
        await supabase
          .from('jobs_outdoor_ads')
          .insert([{ deal_id: data.id }]);
      }

      setIsAddModalOpen(false);
      
      // Clear forms
      setNewTitle('');
      setNewClientId('');
      setNewType('general');
      setNewCost('0');
      setNewNotes('');

      loadDealsData();
    } catch (err) {
      console.error('Failed to create deal:', err);
      setFormError(err.message || 'Ошибка создания сделки.');
    }
  };

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.notes && deal.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (deal.clients?.name && deal.clients.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || deal.deal_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-title">
          <h1>Сделки и продажи</h1>
          <p>Kanban-доска воронки продаж и заказов</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Добавить сделку
          </button>
        </div>
      </div>

      {/* Toolbar filters */}
      <div style={{
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(11, 15, 25, 0.4)',
        borderBottom: '1px solid var(--border-color)',
        gap: '16px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dark)' }} />
          <input 
            type="text" 
            className="form-control" 
            style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
            placeholder="Поиск по сделке или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px' }}>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px', background: typeFilter === 'all' ? 'var(--primary)' : 'transparent', color: 'white' }}
            onClick={() => setTypeFilter('all')}
          >
            Все
          </button>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px', background: typeFilter === '3d_printing' ? 'var(--primary)' : 'transparent', color: 'white' }}
            onClick={() => setTypeFilter('3d_printing')}
          >
            3D Печать
          </button>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px', background: typeFilter === 'outdoor_ads' ? 'var(--primary)' : 'transparent', color: 'white' }}
            onClick={() => typeFilter !== 'outdoor_ads' && setTypeFilter('outdoor_ads')}
          >
            Наружка
          </button>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px', background: typeFilter === 'general' ? 'var(--primary)' : 'transparent', color: 'white' }}
            onClick={() => setTypeFilter('general')}
          >
            Прочее
          </button>
        </div>
      </div>

      {/* Kanban Board columns scroll area */}
      <div style={{ 
        flex: 1, 
        overflowX: 'auto', 
        overflowY: 'hidden', 
        display: 'flex', 
        padding: '24px 32px',
        gap: '16px',
        background: '#070a13'
      }}>
        {stages.map(stage => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
          const stageSum = stageDeals.reduce((a, b) => a + Number(b.cost || 0), 0);

          return (
            <div 
              key={stage.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              style={{
                minWidth: '280px',
                maxWidth: '280px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px'
              }}
            >
              {/* Column Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: `2px solid ${stage.borderColor}`
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{stage.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stageDeals.length} сдел.
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary)' }}>
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stageSum)}
                </div>
              </div>

              {/* Column cards container */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                paddingBottom: '20px'
              }}>
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onClick={() => setSelectedDealId(deal.id)}
                    className="glass-card"
                    style={{ 
                      padding: '14px', 
                      cursor: 'grab', 
                      borderLeft: `3px solid ${deal.deal_type === '3d_printing' ? 'var(--primary)' : 
                                               deal.deal_type === 'outdoor_ads' ? 'var(--secondary)' : 'var(--text-dark)'}`
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {deal.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      <User size={10} />
                      <span>{deal.clients?.name || 'Нет клиента'}</span>
                    </div>

                    {/* Payment & Outsourcing Status Badges */}
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {deal.payment_status === 'paid' && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--success)',
                          border: '1px solid rgba(16, 185, 129, 0.25)'
                        }}>
                          Оплачен
                        </span>
                      )}
                      {deal.payment_status === 'partially_paid' && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--warning)',
                          border: '1px solid rgba(245, 158, 11, 0.25)'
                        }}>
                          Предоплата: {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(deal.prepayment)} ₽
                        </span>
                      )}
                      {deal.payment_status === 'unpaid' && Number(deal.cost || 0) > 0 && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: 'var(--error)',
                          border: '1px solid rgba(239, 68, 68, 0.25)'
                        }}>
                          Не оплачен
                        </span>
                      )}
                      
                      {deal.is_outsourced && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.25)'
                        }}>
                          Перезаказ
                        </span>
                      )}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '10px', 
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(deal.cost)}
                      </span>
                      
                      {deal.deal_type === '3d_printing' && <Printer size={12} style={{ color: 'var(--primary)' }} title="3D Печать" />}
                      {deal.deal_type === 'outdoor_ads' && <Layers size={12} style={{ color: 'var(--secondary)' }} title="Наружная реклама" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal Overlay */}
      {isAddModalOpen && (
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
          <div className="glass-panel animate-fade-in" style={{ width: '480px', border: '1px solid var(--border-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit' }}>Создать новую сделку</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddDeal}>
              <div className="form-group">
                <label className="form-label">НАЗВАНИЕ СДЕЛКИ *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Печать фигурок шестеренок / Вывеска Кофе" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">СВЯЗАННЫЙ КЛИЕНТ</label>
                <select 
                  className="form-control" 
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                >
                  <option value="">-- Выберите клиента --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ТИП СДЕЛКИ</label>
                  <select 
                    className="form-control" 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="general">Обычная сделка</option>
                    <option value="3d_printing">3D Печать</option>
                    <option value="outdoor_ads">Наружная реклама</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">БЮДЖЕТ (РУБ)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">ОТВЕТСТВЕННЫЙ МЕНЕДЖЕР</label>
                <select 
                  className="form-control" 
                  value={newManager}
                  onChange={(e) => setNewManager(e.target.value)}
                >
                  <option value="">Не назначен</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ЗАМЕТКИ К СДЕЛКЕ</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Краткое описание требований клиента..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Создать сделку</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDealId && (
        <DealDetailModal 
          dealId={selectedDealId} 
          onClose={() => {
            setSelectedDealId(null);
            loadDealsData();
          }} 
        />
      )}
    </div>
  );
}

// Simple local close helper wrapper
function X({ size, ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
