import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Archive, Plus, Trash2, Edit2, Loader2, Save, X, Info, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Warehouse() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [errorType, setErrorType] = useState(null); // 'table_missing' or other
  const [activeTab, setActiveTab] = useState('3d_print'); // '3d_print' or 'outdoor_ads'

  // Edit / Add modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('3d_print');
  const [itemType, setItemType] = useState('filament');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(0);
  const [saving, setSaving] = useState(false);

  const canEdit = profile && (profile.role === 'admin' || profile.role === 'manager');

  const fetchInventory = async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorType(null);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) {
        // Postgrest Error 42P01 is "relation does not exist"
        if (error.code === '42P01') {
          setErrorType('table_missing');
        } else {
          throw error;
        }
      } else {
        setItems(data || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory(activeTab);
    setItemType(activeTab === '3d_print' ? 'filament' : 'banner_mat');
    setStockQuantity(0);
    setUnit(activeTab === '3d_print' ? 'kg' : 'sqm');
    setPricePerUnit(0);
    setMinStockLevel(0);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setItemType(item.item_type);
    setStockQuantity(Number(item.stock_quantity) || 0);
    setUnit(item.unit);
    setPricePerUnit(Number(item.price_per_unit) || 0);
    setMinStockLevel(Number(item.min_stock_level) || 0);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const itemData = {
        name,
        category,
        item_type: itemType,
        stock_quantity: Number(stockQuantity),
        unit,
        price_per_unit: Number(pricePerUnit),
        min_stock_level: Number(minStockLevel)
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('inventory_items')
          .insert([itemData]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchInventory();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      alert('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (confirm('Вы действительно хотите удалить этот материал со склада?')) {
      try {
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchInventory();
      } catch (err) {
        console.error('Error deleting inventory item:', err);
        alert('Ошибка удаления.');
      }
    }
  };

  // Filter items by category
  const filteredItems = items.filter(i => i.category === activeTab);

  // Helper labels
  const getItemTypeLabel = (type) => {
    switch (type) {
      case 'filament': return 'Пластик (нить)';
      case 'banner_mat': return 'Баннерное полотно';
      case 'eyelet': return 'Люверсы';
      case 'edge_tape': return 'Лента проварки';
      case 'frame_pipe': return 'Профильная труба';
      case 'face_mat': return 'Лицевой материал (акрил/ПК)';
      case 'side_profile': return 'Бортовой профиль';
      case 'led_module': return 'Светодиоды';
      case 'power_supply': return 'Блок питания';
      default: return type;
    }
  };

  // Helper style badges for stock quantity
  const getStockStatus = (qty, minLevel) => {
    const min = Number(minLevel || 0);
    if (qty <= 0) return { label: 'Нет на складе', class: 'badge-admin' }; // Red color
    if (qty <= min) return { label: 'Критический остаток', class: 'badge-pending' }; // Yellow
    return { label: 'В наличии', class: 'badge-technician' }; // Green color
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Загрузка остатков склада...</div>
      </div>
    );
  }

  if (errorType === 'table_missing') {
    return (
      <div className="animate-fade-in" style={{ padding: '40px' }}>
        <div className="glass-panel" style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          background: 'rgba(239, 68, 68, 0.02)',
          padding: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error)', marginBottom: '16px' }}>
            <AlertTriangle size={32} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'Outfit' }}>Необходимо создать таблицу склада</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '20px' }}>
            В вашей базе данных Supabase отсутствует таблица <strong>inventory_items</strong>. Пожалуйста, зайдите в панель управления Supabase, откройте раздел <strong>SQL Editor</strong>, нажмите <strong>New Query</strong>, скопируйте следующий SQL-код и выполните его (нажмите <strong>Run</strong>):
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            color: '#a78bfa',
            fontFamily: 'monospace',
            fontSize: '11px',
            overflowX: 'auto',
            marginBottom: '24px',
            maxHeight: '300px'
          }}>
{`-- 1. Create Inventory Table
CREATE TABLE public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    item_type TEXT NOT NULL,
    stock_quantity NUMERIC DEFAULT 0.0 NOT NULL,
    unit TEXT DEFAULT 'pcs' NOT NULL,
    price_per_unit NUMERIC DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies
CREATE POLICY "Inventory is readable by authenticated users" ON public.inventory_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Managers can manage inventory" ON public.inventory_items
  FOR ALL TO authenticated USING (
    public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role])
  )
  WITH CHECK (
    public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role])
  );

-- 4. Insert Default Inventory Items
INSERT INTO public.inventory_items (name, category, item_type, stock_quantity, unit, price_per_unit) VALUES
('PLA Plastic (Standard)', '3d_print', 'filament', 10, 'kg', 1500),
('PETG Plastic (Strong)', '3d_print', 'filament', 5, 'kg', 1800),
('ABS Plastic (Heat-Resistant)', '3d_print', 'filament', 4, 'kg', 1700),
('TPU Plastic (Flexible)', '3d_print', 'filament', 2, 'kg', 3500),
('Nylon Plastic (Engineering)', '3d_print', 'filament', 1, 'kg', 4000),
('Frontlit Banner 440g', 'outdoor_ads', 'banner_mat', 150, 'sqm', 500),
('Backlit Banner 510g', 'outdoor_ads', 'banner_mat', 80, 'sqm', 800),
('Standard Eyelet 12mm', 'outdoor_ads', 'eyelet', 2000, 'pcs', 15),
('Reinforced Eyelet 16mm', 'outdoor_ads', 'eyelet', 1000, 'pcs', 25),
('Edge Welding Tape', 'outdoor_ads', 'edge_tape', 500, 'meters', 100),
('Metal Square Tube 20x20mm', 'outdoor_ads', 'frame_pipe', 120, 'meters', 300),
('Metal Square Tube 40x20mm', 'outdoor_ads', 'frame_pipe', 90, 'meters', 450),
('Acrylic Glass 3mm (White)', 'outdoor_ads', 'face_mat', 40, 'sqm', 3000),
('Polycarbonate 4mm (Translucent)', 'outdoor_ads', 'face_mat', 60, 'sqm', 2200),
('Aluminum Profile 130mm', 'outdoor_ads', 'side_profile', 180, 'meters', 800),
('Plastic Side Profile 100mm', 'outdoor_ads', 'side_profile', 100, 'meters', 550),
('LED Module SMD 2835 1.2W', 'outdoor_ads', 'led_module', 500, 'pcs', 45),
('LED Module SMD 5730 1.5W', 'outdoor_ads', 'led_module', 300, 'pcs', 60),
('Power Supply IP67 12V 100W', 'outdoor_ads', 'power_supply', 15, 'pcs', 1200),
('Power Supply IP67 12V 250W', 'outdoor_ads', 'power_supply', 10, 'pcs', 2400);`}
          </pre>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={fetchInventory}>
              Проверить подключение
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', animation: 'var(--transition)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Материалы и остатки
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <Archive size={28} style={{ color: 'var(--primary)' }} />
            Склад материалов
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchInventory}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} />
              Добавить материал
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('3d_print')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === '3d_print' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === '3d_print' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          3D Печать
        </button>
        <button
          onClick={() => setActiveTab('outdoor_ads')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'outdoor_ads' ? 'var(--secondary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'outdoor_ads' ? '2px solid var(--secondary)' : '2px solid transparent',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          Наружная реклама
        </button>
      </div>

      {/* Main List */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Info size={40} style={{ marginBottom: '12px', opacity: '0.2' }} />
            <h4>На складе нет товаров</h4>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Нажмите кнопку выше, чтобы занести материалы на склад.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-dark)', fontWeight: '600' }}>
                <th style={{ padding: '16px 24px' }}>Название материала</th>
                <th style={{ padding: '16px 24px' }}>Тип</th>
                <th style={{ padding: '16px 24px' }}>Остаток на складе</th>
                <th style={{ padding: '16px 24px' }}>Стоимость за единицу</th>
                {canEdit && <th style={{ padding: '16px 24px', textAlign: 'right' }}>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.stock_quantity, item.min_stock_level);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{getItemTypeLabel(item.item_type)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700' }}>{item.stock_quantity} {item.unit}</span>
                        <span className={`badge ${stockStatus.class}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {stockStatus.label}
                        </span>
                      </div>
                      {Number(item.min_stock_level) > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Минимум: {item.min_stock_level} {item.unit}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.price_per_unit} руб. / {item.unit}
                    </td>
                    {canEdit && (
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            title="Редактировать"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <form onSubmit={handleSave} className="glass-panel animate-fade-in" style={{ width: '450px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit' }}>
                {editingItem ? 'Редактировать материал' : 'Добавить новый материал'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">НАЗВАНИЕ МАТЕРИАЛА *</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Например, PETG Черный FDPlast"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">КАТЕГОРИЯ</label>
                <select 
                  className="form-control" 
                  value={category} 
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value === '3d_print') {
                      setItemType('filament');
                      setUnit('kg');
                    } else {
                      setItemType('banner_mat');
                      setUnit('sqm');
                    }
                  }}
                >
                  <option value="3d_print">3D Печать</option>
                  <option value="outdoor_ads">Наружная реклама</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ТИП РАСХОДНИКА</label>
                {category === '3d_print' ? (
                  <select className="form-control" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                    <option value="filament">Пластик (нить)</option>
                  </select>
                ) : (
                  <select className="form-control" value={itemType} onChange={(e) => {
                    setItemType(e.target.value);
                    // Match default units
                    if (e.target.value === 'banner_mat' || e.target.value === 'face_mat') setUnit('sqm');
                    else if (e.target.value === 'edge_tape' || e.target.value === 'frame_pipe' || e.target.value === 'side_profile') setUnit('meters');
                    else setUnit('pcs');
                  }}>
                    <option value="banner_mat">Баннерное полотно</option>
                    <option value="eyelet">Люверсы</option>
                    <option value="edge_tape">Лента проварки</option>
                    <option value="frame_pipe">Профильная труба</option>
                    <option value="face_mat">Лицевой материал короба</option>
                    <option value="side_profile">Бортовой профиль</option>
                    <option value="led_module">Светодиодные модули</option>
                    <option value="power_supply">Блоки питания</option>
                  </select>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">КОЛИЧЕСТВО НА СКЛАДЕ</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={stockQuantity} 
                  onChange={(e) => setStockQuantity(Number(e.target.value))} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ЕДИНИЦА ИЗМЕРЕНИЯ</label>
                <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="kg">кг (килограммы)</option>
                  <option value="sqm">м² (кв. метры)</option>
                  <option value="meters">м (пог. метры)</option>
                  <option value="pcs">шт (штуки)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">СТОИМОСТЬ ЗА ЕДИНИЦУ (РУБ) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={pricePerUnit} 
                  onChange={(e) => setPricePerUnit(Number(e.target.value))} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">КРИТИЧЕСКИЙ МИНИМУМ</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={minStockLevel} 
                  onChange={(e) => setMinStockLevel(Number(e.target.value))} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={saving}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
