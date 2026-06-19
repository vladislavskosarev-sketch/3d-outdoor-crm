import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Printer, Image, Check, AlertTriangle, Play, CheckCircle2, RotateCcw, Clock } from 'lucide-react';

export default function ProductionQueue() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('3d_print'); // 3d_print, outdoor_ads
  const [printJobs, setPrintJobs] = useState([]);
  const [outdoorJobs, setOutdoorJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (activeTab === '3d_print') {
        const { data, error } = await supabase
          .from('jobs_3d_print')
          .select('*, deals(title)')
          .order('status', { ascending: true })
          .order('printer_name', { ascending: true });
        
        if (error) throw error;
        setPrintJobs(data || []);
      } else {
        const { data, error } = await supabase
          .from('jobs_outdoor_ads')
          .select('*, deals(title)')
          .order('status', { ascending: true });
        
        if (error) throw error;
        setOutdoorJobs(data || []);
      }
    } catch (err) {
      console.error('Failed to load production jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();

    // Subscribe to realtime changes in jobs
    const channel = supabase
      .channel('production-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs_3d_print' }, loadJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs_outdoor_ads' }, loadJobs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const updatePrintStatus = async (jobId, nextStatus) => {
    try {
      const { error } = await supabase
        .from('jobs_3d_print')
        .update({ status: nextStatus })
        .eq('id', jobId);

      if (error) throw error;
      
      // Update local state for fast UI response
      setPrintJobs(printJobs.map(job => job.id === jobId ? { ...job, status: nextStatus } : job));
    } catch (err) {
      console.error('Update print status error:', err);
      alert('Ошибка при обновлении статуса печати.');
    }
  };

  const updateOutdoorStatus = async (jobId, nextStatus) => {
    try {
      const { error } = await supabase
        .from('jobs_outdoor_ads')
        .update({ status: nextStatus })
        .eq('id', jobId);

      if (error) throw error;
      
      // Update local state
      setOutdoorJobs(outdoorJobs.map(job => job.id === jobId ? { ...job, status: nextStatus } : job));
    } catch (err) {
      console.error('Update outdoor status error:', err);
      alert('Ошибка при обновлении статуса производства рекламы.');
    }
  };

  const getPrintBadgeClass = (status) => {
    switch (status) {
      case 'printing': return 'badge-manager';
      case 'finished': return 'badge-technician';
      case 'failed': return 'badge-disabled';
      case 'post_processing': return 'badge-admin';
      default: return 'badge-pending';
    }
  };

  const getPrintStatusLabel = (status) => {
    switch (status) {
      case 'queued': return 'В очереди';
      case 'printing': return 'Печатается';
      case 'finished': return 'Завершено';
      case 'failed': return 'Брак / Ошибка';
      case 'post_processing': return 'Постобработка';
      default: return status;
    }
  };

  const getOutdoorBadgeClass = (status) => {
    switch (status) {
      case 'printing': return 'badge-manager';
      case 'assembly': return 'badge-admin';
      case 'installation': return 'badge-pending';
      case 'completed': return 'badge-technician';
      default: return 'badge-disabled';
    }
  };

  const getOutdoorStatusLabel = (status) => {
    switch (status) {
      case 'design': return 'Дизайн/Макет';
      case 'printing': return 'Печать баннера/деталей';
      case 'assembly': return 'Сборка конструкции';
      case 'installation': return 'Монтаж на объекте';
      case 'completed': return 'Сдано заказчику';
      default: return status;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-title">
          <h1>Производственная очередь</h1>
          <p>Специализированная панель мониторинга печати и сборки конструкций</p>
        </div>
        
        {/* Toggle queue tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('3d_print')}
            className="btn"
            style={{ 
              background: activeTab === '3d_print' ? 'var(--primary)' : 'transparent',
              color: 'white',
              padding: '6px 14px',
              fontSize: '13px'
            }}
          >
            <Printer size={14} />
            3D Печать
          </button>
          <button
            onClick={() => setActiveTab('outdoor_ads')}
            className="btn"
            style={{ 
              background: activeTab === 'outdoor_ads' ? 'var(--primary)' : 'transparent',
              color: 'white',
              padding: '6px 14px',
              fontSize: '13px'
            }}
          >
            <Image size={14} />
            Наружная реклама
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Загрузка производственной очереди...
          </div>
        ) : activeTab === '3d_print' ? (
          /* 3D Print Queue Tab */
          printJobs.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Очередь 3D печати пуста. Сделки с типом "3D печать" появятся здесь после оформления.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {printJobs.map(job => (
                <div key={job.id} className="glass-panel animate-fade-in" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  borderColor: job.status === 'printing' ? 'var(--secondary)' : 
                               job.status === 'failed' ? 'var(--error)' : 'var(--border-color)',
                  background: job.status === 'printing' ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-panel)'
                }}>
                  {/* Job Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Outfit' }}>{job.printer_name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Сделка: <b>{job.deals?.title || 'Без названия'}</b>
                      </p>
                    </div>
                    <span className={`badge ${getPrintBadgeClass(job.status)}`}>
                      {getPrintStatusLabel(job.status)}
                    </span>
                  </div>

                  {/* Print Parameters Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <div>Пластик: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{job.material_type}</span></div>
                    <div>Цвет: <span style={{ fontWeight: '600' }}>{job.color}</span></div>
                    <div>Вес детали: <span style={{ fontWeight: '600' }}>{job.weight_grams}г</span></div>
                    <div>Время печати: <span style={{ fontWeight: '600' }}>{job.print_time_hours}ч</span></div>
                  </div>

                  {/* Settings JSON summary */}
                  {job.settings_json && Object.keys(job.settings_json).length > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.entries(job.settings_json).map(([key, val]) => (
                        <span key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fast Action Buttons for Technicians */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: 'auto', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--border-color)',
                    justifyContent: 'flex-end'
                  }}>
                    {job.status === 'queued' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--secondary)', borderColor: 'rgba(6, 182, 212, 0.2)' }}
                        onClick={() => updatePrintStatus(job.id, 'printing')}
                      >
                        <Play size={12} /> Запустить печать
                      </button>
                    )}

                    {job.status === 'printing' && (
                      <>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => updatePrintStatus(job.id, 'failed')}
                        >
                          <AlertTriangle size={12} /> Брак / Ошибка
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                          onClick={() => updatePrintStatus(job.id, 'post_processing')}
                        >
                          <Check size={12} /> Готово
                        </button>
                      </>
                    )}

                    {job.status === 'post_processing' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => updatePrintStatus(job.id, 'finished')}
                      >
                        <CheckCircle2 size={12} /> Сдать менеджеру
                      </button>
                    )}

                    {job.status === 'failed' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => updatePrintStatus(job.id, 'queued')}
                      >
                        <RotateCcw size={12} /> В очередь
                      </button>
                    )}

                    {job.status === 'finished' && (
                      <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Печать завершена успешно!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Outdoor Ads Construction Tab */
          outdoorJobs.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Очередь наружной рекламы пуста. Сделки с типом "Наружная реклама" появятся здесь после оформления.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {outdoorJobs.map(job => (
                <div key={job.id} className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Outfit' }}>{job.ad_type}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Сделка: <b>{job.deals?.title || 'Без названия'}</b>
                      </p>
                    </div>
                    <span className={`badge ${getOutdoorBadgeClass(job.status)}`}>
                      {getOutdoorStatusLabel(job.status)}
                    </span>
                  </div>

                  {/* Outdoor Job Specifications */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <div>Размеры: <span style={{ fontWeight: '600' }}>{job.width_m}м × {job.height_m}м (Площадь: {Number(job.width_m * job.height_m).toFixed(2)} м²)</span></div>
                    <div>Материалы: <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>{job.materials_used || 'Не указаны'}</span></div>
                    
                    {job.mounting_required && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
                        <div style={{ color: 'var(--warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Требуется монтаж на объекте!
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Адрес: {job.installation_address || 'Не указан'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fast Action Buttons for Outdoor Assembly */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: 'auto', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--border-color)',
                    justifyContent: 'flex-end'
                  }}>
                    {job.status === 'design' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => updateOutdoorStatus(job.id, 'printing')}
                      >
                        Запустить в печать
                      </button>
                    )}

                    {job.status === 'printing' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--primary)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
                        onClick={() => updateOutdoorStatus(job.id, 'assembly')}
                      >
                        Передать на сборку
                      </button>
                    )}

                    {job.status === 'assembly' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => updateOutdoorStatus(job.id, job.mounting_required ? 'installation' : 'completed')}
                      >
                        {job.mounting_required ? 'Отправить на монтаж' : 'Собрано. Завершить'}
                      </button>
                    )}

                    {job.status === 'installation' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success)' }}
                        onClick={() => updateOutdoorStatus(job.id, 'completed')}
                      >
                        Монтаж завершен. Сдать работу
                      </button>
                    )}

                    {job.status === 'completed' && (
                      <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Производство рекламы завершено!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
