import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Square, Plus, Trash2, Calendar, AlertCircle, User, Award, X } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [deals, setDeals] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  
  // Add task state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dealId, setDealId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*, profiles(full_name), deals(title)')
        .order('due_date', { ascending: true });
      if (tasksErr) throw tasksErr;
      setTasks(tasksData || []);

      // Fetch deals for dropdown
      const { data: dealsData } = await supabase
        .from('deals')
        .select('id, title')
        .order('created_at', { ascending: false });
      setDeals(dealsData || []);

      // Fetch profiles for assignment
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('role', 'pending')
        .neq('role', 'disabled');
      setProfiles(profilesData || []);

    } catch (err) {
      console.error('Failed to load tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setAssignedTo(user?.id || '');
    setDealId('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Название задачи обязательно.');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        status: 'pending',
        assigned_to: assignedTo || null,
        deal_id: dealId || null,
        created_by: user?.id
      };

      const { error } = await supabase
        .from('tasks')
        .insert([payload]);

      if (error) throw error;

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
      setErrorMsg(err.message || 'Не удалось создать задачу.');
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', task.id);
      
      if (error) throw error;
      
      // Update local state directly for high-end response speed
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('Не удалось изменить статус задачи.');
    }
  };

  const handleDeleteTask = async (id) => {
    if (confirm('Удалить эту задачу?')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setTasks(tasks.filter(t => t.id !== id));
      } catch (err) {
        console.error('Delete task error:', err);
        alert('Не удалось удалить задачу.');
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-title">
          <h1>Задачи и напоминания</h1>
          <p>Планирование текущих дел и звонков клиентам</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Создать задачу
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
            style={{ padding: '8px 16px' }}
          >
            Все ({tasks.length})
          </button>
          <button 
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('pending')}
            style={{ padding: '8px 16px' }}
          >
            В процессе ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button 
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('completed')}
            style={{ padding: '8px 16px' }}
          >
            Выполнены ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>

        {/* Task cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Загрузка задач...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Нет задач в выбранной категории
            </div>
          ) : (
            filteredTasks.map(task => {
              const isOverdue = task.status === 'pending' && task.due_date && new Date(task.due_date) < new Date();
              const isCompleted = task.status === 'completed';

              return (
                <div 
                  key={task.id} 
                  className="glass-card animate-fade-in"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '20px',
                    borderColor: isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)',
                    background: isCompleted ? 'rgba(15, 23, 42, 0.2)' : 'var(--bg-card)'
                  }}
                >
                  {/* Complete Checkbox */}
                  <button 
                    onClick={() => handleToggleStatus(task)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
                  </button>

                  {/* Task details */}
                  <div style={{ flex: 1, opacity: isCompleted ? 0.6 : 1 }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>
                      {task.title}
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {task.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
                      {task.deals && (
                        <span style={{ color: 'var(--secondary)', fontWeight: '500' }}>
                          Сделка: {task.deals.title}
                        </span>
                      )}

                      {task.profiles && (
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          Исполнитель: {task.profiles.full_name}
                        </span>
                      )}

                      {task.due_date && (
                        <span style={{ 
                          color: isOverdue ? 'var(--error)' : 'var(--text-muted)', 
                          fontWeight: isOverdue ? '600' : '400',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Calendar size={12} />
                          Срок: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                          {isOverdue && ' (Просрочено!)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & priority */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <span className={`badge ${
                      task.priority === 'high' ? 'badge-disabled' : 
                      task.priority === 'medium' ? 'badge-pending' : 'badge-technician'
                    }`}>
                      {task.priority === 'high' ? 'Высокий' : 
                       task.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </span>

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 10px', color: 'var(--error)', borderColor: 'transparent' }}
                      onClick={() => handleDeleteTask(task.id)}
                      title="Удалить задачу"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Task Modal */}
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
          <div className="glass-panel animate-fade-in" style={{ width: '480px', border: '1px solid var(--border-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit' }}>Новая задача</h3>
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

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">НАЗВАНИЕ ЗАДАЧИ *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Позвонить клиенту для уточнения чертежа" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ОПИСАНИЕ</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Детали задачи..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">СРОК ВЫПОЛНЕНИЯ</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ПРИОРИТЕТ</label>
                  <select 
                    className="form-control" 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ОТВЕТСТВЕННЫЙ</label>
                  <select 
                    className="form-control" 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Не назначен</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">СВЯЗАННАЯ СДЕЛКА</label>
                  <select 
                    className="form-control" 
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                  >
                    <option value="">Без сделки</option>
                    {deals.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Создать задачу</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
