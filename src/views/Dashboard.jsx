import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Printer, 
  CheckSquare, 
  DollarSign, 
  AlertCircle, 
  Clock, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalDeals: 0,
    pipelineValue: 0,
    activePrints: 0,
    pendingTasks: 0,
    receivedPayments: 0,
    outstandingDebt: 0,
    netMargin: 0,
    scrapLosses: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [printerQueue, setPrinterQueue] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [criticalStocks, setCriticalStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Fetch Deals Stats with new payment & outsourcing fields
      const { data: deals, error: dealsErr } = await supabase
        .from('deals')
        .select('cost, stage, deal_type, prepayment, is_outsourced, contractor_cost, scrap_cost');
      
      if (dealsErr) throw dealsErr;

      let totalValue = 0;
      let activeDealsCount = 0;
      let totalReceivedPayments = 0;
      let totalOutstandingDebt = 0;
      let totalNetMargin = 0;
      let totalScrapLosses = 0;
      const stages = {};
      
      deals?.forEach(deal => {
        const dealCost = Number(deal.cost || 0);
        const dealPrepayment = Number(deal.prepayment || 0);
        const dealContractorCost = deal.is_outsourced ? Number(deal.contractor_cost || 0) : 0;
        const dealScrapCost = Number(deal.scrap_cost || 0);

        // Active pipeline calculations (excluding closed deals)
        if (deal.stage !== 'closed_won' && deal.stage !== 'closed_lost') {
          activeDealsCount++;
          totalValue += dealCost;
          totalOutstandingDebt += Math.max(0, dealCost - dealPrepayment);
        }

        // Total payments received (from all deals)
        totalReceivedPayments += dealPrepayment;

        // Total scrap losses (from all active/won deals)
        if (deal.stage !== 'closed_lost') {
          totalScrapLosses += dealScrapCost;
          totalNetMargin += (dealCost - dealContractorCost - dealScrapCost);
        }

        stages[deal.stage] = (stages[deal.stage] || 0) + 1;
      });

      // 2. Fetch Active Prints
      const { data: activePrintsData, error: printsErr } = await supabase
        .from('jobs_3d_print')
        .select('*')
        .in('status', ['queued', 'printing']);

      if (printsErr) throw printsErr;

      // 3. Fetch Pending Tasks
      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*, deals(title)')
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(5);

      if (tasksErr) throw tasksErr;

      // 4. Fetch Inventory Items for critical stock alerts
      const { data: invData } = await supabase
        .from('inventory_items')
        .select('name, stock_quantity, min_stock_level, unit');

      const criticalItems = invData?.filter(item => 
        Number(item.stock_quantity) <= Number(item.min_stock_level || 0)
      ) || [];

      setStats({
        totalDeals: activeDealsCount,
        pipelineValue: totalValue,
        activePrints: activePrintsData?.length || 0,
        pendingTasks: tasksData?.length || 0,
        receivedPayments: totalReceivedPayments,
        outstandingDebt: totalOutstandingDebt,
        netMargin: totalNetMargin,
        scrapLosses: totalScrapLosses,
      });
      setRecentTasks(tasksData || []);
      setPrinterQueue(activePrintsData || []);
      setStageCounts(stages);
      setCriticalStocks(criticalItems);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up realtime channel to refresh when deals, prints or tasks modify
    const dealsChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, loadDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs_3d_print' }, loadDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
    };
  }, []);

  const getStagePercent = (stage) => {
    const total = Object.values(stageCounts).reduce((a, b) => a + b, 0) || 1;
    return Math.round(((stageCounts[stage] || 0) / total) * 100);
  };

  return (
    <div style={{ padding: '32px' }} className="animate-fade-in">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>
            <Sparkles size={16} />
            <span>Панель управления</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'Outfit' }}>
            Привет, {profile?.full_name || 'Коллега'}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Система работает в штатном режиме. Все данные синхронизированы в реальном времени.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={loadDashboardData}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Обновление...' : 'Обновить данные'}
        </button>
      </div>

      {/* Critical Stock Alert Banner */}
      {profile && (profile.role === 'admin' || profile.role === 'manager') && criticalStocks.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontWeight: '700', fontSize: '15px' }}>
            <AlertCircle size={20} />
            <span>Внимание: Критические остатки на складе!</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {criticalStocks.map((item, idx) => (
              <span key={idx} className="badge" style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: '600'
              }}>
                {item.name}: {item.stock_quantity} {item.unit} (мин. {item.min_stock_level})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* KPI 1: Active Deals */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--primary)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Активные сделки</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit' }}>{stats.totalDeals}</div>
          </div>
        </div>

        {/* KPI 2: Pipeline Budget */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--secondary)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Бюджет воронки</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit' }}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stats.pipelineValue)}
            </div>
          </div>
        </div>

        {/* KPI 3: Prepayments Received */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <DollarSign size={24} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Получено предоплат</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit', color: 'var(--success)' }}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stats.receivedPayments)}
            </div>
          </div>
        </div>

        {/* KPI 4: Outstanding Debt */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--error)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Дебиторский долг</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit', color: 'var(--error)' }}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stats.outstandingDebt)}
            </div>
          </div>
        </div>

        {/* KPI 5: Net Margin */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.25)',
            color: '#10b981',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Чистая прибыль</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit', color: '#10b981' }}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stats.netMargin)}
            </div>
          </div>
        </div>

        {/* KPI 6: Scrap Losses */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--error)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Потери от брака</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit', color: 'var(--error)' }}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stats.scrapLosses)}
            </div>
          </div>
        </div>

        {/* KPI 6: Pending Tasks */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--warning)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Задачи к выполнению</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', fontFamily: 'Outfit' }}>{stats.pendingTasks}</div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left column: Pipelines & Printing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Funnel Progress */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', fontFamily: 'Outfit' }}>Конверсия и Воронка продаж</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Входящие лиды (Lead)</span>
                  <span style={{ fontWeight: '600' }}>{stageCounts['lead'] || 0} шт ({getStagePercent('lead')}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getStagePercent('lead')}%`, height: '100%', background: 'var(--secondary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>В переговорах (Negotiation)</span>
                  <span style={{ fontWeight: '600' }}>{stageCounts['negotiation'] || 0} шт ({getStagePercent('negotiation')}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getStagePercent('negotiation')}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>В производстве (Production)</span>
                  <span style={{ fontWeight: '600' }}>{stageCounts['in_production'] || 0} шт ({getStagePercent('in_production')}%)</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getStagePercent('in_production')}%`, height: '100%', background: 'var(--warning)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Успешно завершены (Closed-Won)</span>
                  <span style={{ color: 'var(--success)', fontWeight: '600' }}>{stageCounts['closed_won'] || 0} шт</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getStagePercent('closed_won')}%`, height: '100%', background: 'var(--success)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Active 3D Print Queue */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', fontFamily: 'Outfit' }}>
              Активная 3D-печать ({printerQueue.length})
            </h3>
            {printerQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                <Clock size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>Нет запущенных заданий печати</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {printerQueue.map(job => (
                  <div key={job.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{job.printer_name} • <span style={{ color: 'var(--primary)' }}>{job.material_type} ({job.color})</span></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Вес: {job.weight_grams}г | Время: {job.print_time_hours}ч
                      </div>
                    </div>
                    <span className={`badge ${job.status === 'printing' ? 'badge-manager' : 'badge-pending'}`}>
                      {job.status === 'printing' ? 'Печать...' : 'В очереди'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Tasks & Reminders */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', fontFamily: 'Outfit' }}>Ближайшие задачи</h3>
          
          {recentTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              <CheckSquare size={32} style={{ marginBottom: '8px', opacity: 0.5, color: 'var(--success)' }} />
              <div>Все задачи выполнены!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} style={{
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                      <span className={`badge ${
                        task.priority === 'high' ? 'badge-disabled' : 
                        task.priority === 'medium' ? 'badge-pending' : 'badge-technician'
                      }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {task.priority === 'high' ? 'Высокий' : 
                         task.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.description}</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--secondary)' }}>
                        Сделка: {task.deals?.title || 'Без сделки'}
                      </span>
                      
                      {task.due_date && (
                        <span style={{ 
                          color: isOverdue ? 'var(--error)' : 'var(--text-dark)', 
                          fontWeight: isOverdue ? '600' : '400',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isOverdue && <AlertCircle size={10} />}
                          До: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
