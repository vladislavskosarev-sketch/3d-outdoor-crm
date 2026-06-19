import React, { useState, useEffect } from 'react';
import { getSupabaseConfig, updateSupabaseConfig, clearSupabaseConfig } from '../supabaseClient';
import { 
  Save, 
  RefreshCw, 
  Database, 
  Settings as SettingsIcon, 
  Info, 
  Check, 
  AlertTriangle,
  Flame,
  Layout,
  HardDrive
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('calculators');
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', text: '' }

  // 3D defaults
  const [matRatePla, setMatRatePla] = useState(1500);
  const [matRatePetg, setMatRatePetg] = useState(1800);
  const [matRateAbs, setMatRateAbs] = useState(1700);
  const [matRateTpu, setMatRateTpu] = useState(3500);
  const [matRateNylon, setMatRateNylon] = useState(4000);
  const [printerPrice, setPrinterPrice] = useState(40000);
  const [printerLifespan, setPrinterLifespan] = useState(8000);
  const [printerPower, setPrinterPower] = useState(350);
  const [electricityRate, setElectricityRate] = useState(6);
  const [postRate, setPostRate] = useState(300);
  const [markup, setMarkup] = useState(50);

  // Outdoor defaults
  const [matSqmRate, setMatSqmRate] = useState(600);
  const [weldRate, setWeldRate] = useState(100);
  const [eyeletPrice, setEyeletPrice] = useState(15);
  const [frameRate, setFrameRate] = useState(300);
  const [profileRate, setProfileRate] = useState(800);
  const [ledPrice, setLedPrice] = useState(45);
  const [powerSupplyPrice, setPowerSupplyPrice] = useState(1200);
  const [designFee, setDesignFee] = useState(2000);
  const [outdoorMarkup, setOutdoorMarkup] = useState(50);

  // Supabase states
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');

  // Load defaults from localStorage
  useEffect(() => {
    // 3D
    setMatRatePla(Number(localStorage.getItem('default_calc_mat_rate_pla')) || 1500);
    setMatRatePetg(Number(localStorage.getItem('default_calc_mat_rate_petg')) || 1800);
    setMatRateAbs(Number(localStorage.getItem('default_calc_mat_rate_abs')) || 1700);
    setMatRateTpu(Number(localStorage.getItem('default_calc_mat_rate_tpu')) || 3500);
    setMatRateNylon(Number(localStorage.getItem('default_calc_mat_rate_nylon')) || 4000);
    setPrinterPrice(Number(localStorage.getItem('default_calc_printer_price')) || 40000);
    setPrinterLifespan(Number(localStorage.getItem('default_calc_printer_lifespan')) || 8000);
    setPrinterPower(Number(localStorage.getItem('default_calc_printer_power')) || 350);
    setElectricityRate(Number(localStorage.getItem('default_calc_electricity_rate')) || 6);
    setPostRate(Number(localStorage.getItem('default_calc_post_rate')) || 300);
    setMarkup(Number(localStorage.getItem('default_calc_markup')) || 50);

    // Outdoor
    setMatSqmRate(Number(localStorage.getItem('default_calc_mat_sqm_rate')) || 600);
    setWeldRate(Number(localStorage.getItem('default_calc_weld_rate')) || 100);
    setEyeletPrice(Number(localStorage.getItem('default_calc_eyelet_price')) || 15);
    setFrameRate(Number(localStorage.getItem('default_calc_frame_rate')) || 300);
    setProfileRate(Number(localStorage.getItem('default_calc_profile_rate')) || 800);
    setLedPrice(Number(localStorage.getItem('default_calc_led_price')) || 45);
    setPowerSupplyPrice(Number(localStorage.getItem('default_calc_power_supply_price')) || 1200);
    setDesignFee(Number(localStorage.getItem('default_calc_design_fee')) || 2000);
    setOutdoorMarkup(Number(localStorage.getItem('default_calc_outdoor_markup')) || 50);

    // Database
    const cfg = getSupabaseConfig();
    setDbUrl(cfg.url || '');
    setDbKey(cfg.key || '');
  }, []);

  const handleSaveCalculators = (e) => {
    e.preventDefault();
    try {
      // 3D
      localStorage.setItem('default_calc_mat_rate_pla', matRatePla);
      localStorage.setItem('default_calc_mat_rate_petg', matRatePetg);
      localStorage.setItem('default_calc_mat_rate_abs', matRateAbs);
      localStorage.setItem('default_calc_mat_rate_tpu', matRateTpu);
      localStorage.setItem('default_calc_mat_rate_nylon', matRateNylon);
      localStorage.setItem('default_calc_printer_price', printerPrice);
      localStorage.setItem('default_calc_printer_lifespan', printerLifespan);
      localStorage.setItem('default_calc_printer_power', printerPower);
      localStorage.setItem('default_calc_electricity_rate', electricityRate);
      localStorage.setItem('default_calc_post_rate', postRate);
      localStorage.setItem('default_calc_markup', markup);

      // Outdoor
      localStorage.setItem('default_calc_mat_sqm_rate', matSqmRate);
      localStorage.setItem('default_calc_weld_rate', weldRate);
      localStorage.setItem('default_calc_eyelet_price', eyeletPrice);
      localStorage.setItem('default_calc_frame_rate', frameRate);
      localStorage.setItem('default_calc_profile_rate', profileRate);
      localStorage.setItem('default_calc_led_price', ledPrice);
      localStorage.setItem('default_calc_power_supply_price', powerSupplyPrice);
      localStorage.setItem('default_calc_design_fee', designFee);
      localStorage.setItem('default_calc_outdoor_markup', outdoorMarkup);

      showStatus('success', 'Настройки калькуляторов сохранены успешно');
    } catch (err) {
      showStatus('error', 'Ошибка сохранения: ' + err.message);
    }
  };

  const handleSaveDatabase = (e) => {
    e.preventDefault();
    if (!dbUrl.trim() || !dbKey.trim()) {
      showStatus('error', 'URL и Ключ API не могут быть пустыми');
      return;
    }
    try {
      updateSupabaseConfig(dbUrl.trim(), dbKey.trim());
      showStatus('success', 'Подключение к базе данных обновлено. Перезагрузка...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showStatus('error', 'Ошибка подключения: ' + err.message);
    }
  };

  const handleResetDatabase = () => {
    if (confirm('Вы уверены, что хотите сбросить подключение к базе данных? Вам потребуется заново настроить подключение.')) {
      clearSupabaseConfig();
      showStatus('success', 'Подключение сброшено. Перезагрузка...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const triggerUpdateCheck = () => {
    if (window.electronAPI && window.electronAPI.checkForUpdates) {
      window.electronAPI.checkForUpdates();
    } else {
      alert('Интерфейс проверки обновлений недоступен в данной среде.');
    }
  };

  const showStatus = (type, text) => {
    setSaveStatus({ type, text });
    setTimeout(() => {
      setSaveStatus(null);
    }, 4000);
  };

  return (
    <div style={{ padding: '0 0 40px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="view-header">
        <div className="view-title">
          <h1>Настройки системы</h1>
          <p>Управление конфигурацией калькуляторов, базой данных и обновлениями</p>
        </div>
      </div>

      <div style={{ padding: '32px', display: 'flex', gap: '32px', flex: 1 }}>
        {/* Left Side Tab Navigation */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('calculators')}
            className={`btn ${activeTab === 'calculators' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%' }}
          >
            <SettingsIcon size={16} />
            Калькуляторы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`btn ${activeTab === 'database' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%' }}
          >
            <Database size={16} />
            База данных
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`btn ${activeTab === 'updates' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%' }}
          >
            <RefreshCw size={16} />
            Обновления
          </button>
        </div>

        {/* Right Side Content Pane */}
        <div style={{ flex: 1 }} className="glass-panel">
          {saveStatus && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              color: saveStatus.type === 'success' ? 'var(--success)' : 'var(--error)'
            }} className="animate-fade-in">
              {saveStatus.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
              {saveStatus.text}
            </div>
          )}

          {activeTab === 'calculators' && (
            <form onSubmit={handleSaveCalculators}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px', fontFamily: 'Outfit', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Параметры калькуляторов по умолчанию
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* 3D Printing Column */}
                <div>
                  <h3 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={16} /> 3D Печать
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Цена PLA (руб/кг)</label>
                        <input type="number" className="form-control" value={matRatePla} onChange={e => setMatRatePla(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Цена PETG (руб/кг)</label>
                        <input type="number" className="form-control" value={matRatePetg} onChange={e => setMatRatePetg(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Цена ABS (руб/кг)</label>
                        <input type="number" className="form-control" value={matRateAbs} onChange={e => setMatRateAbs(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Цена TPU (руб/кг)</label>
                        <input type="number" className="form-control" value={matRateTpu} onChange={e => setMatRateTpu(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Цена Nylon (руб/кг)</label>
                      <input type="number" className="form-control" value={matRateNylon} onChange={e => setMatRateNylon(Number(e.target.value))} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Цена принтера (руб)</label>
                        <input type="number" className="form-control" value={printerPrice} onChange={e => setPrinterPrice(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Срок службы (часов)</label>
                        <input type="number" className="form-control" value={printerLifespan} onChange={e => setPrinterLifespan(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Мощность (Вт)</label>
                        <input type="number" className="form-control" value={printerPower} onChange={e => setPrinterPower(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Тариф эл-ва (руб/кВтч)</label>
                        <input type="number" step="0.1" className="form-control" value={electricityRate} onChange={e => setElectricityRate(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Работа (руб/час)</label>
                        <input type="number" className="form-control" value={postRate} onChange={e => setPostRate(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Наценка по умолч. (%)</label>
                        <input type="number" className="form-control" value={markup} onChange={e => setMarkup(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outdoor Signage Column */}
                <div>
                  <h3 style={{ fontSize: '15px', color: 'var(--secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layout size={16} /> Наружная Реклама
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Баннер (руб/кв.м)</label>
                        <input type="number" className="form-control" value={matSqmRate} onChange={e => setMatSqmRate(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Сварка шва (руб/м)</label>
                        <input type="number" className="form-control" value={weldRate} onChange={e => setWeldRate(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Люверс (руб/шт)</label>
                        <input type="number" className="form-control" value={eyeletPrice} onChange={e => setEyeletPrice(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Металлокаркас (руб/м)</label>
                        <input type="number" className="form-control" value={frameRate} onChange={e => setFrameRate(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Профиль короба (руб/м)</label>
                        <input type="number" className="form-control" value={profileRate} onChange={e => setProfileRate(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Светодиод (руб/шт)</label>
                        <input type="number" className="form-control" value={ledPrice} onChange={e => setLedPrice(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Блок питания (руб/шт)</label>
                        <input type="number" className="form-control" value={powerSupplyPrice} onChange={e => setPowerSupplyPrice(Number(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Монтаж/Дизайн (руб)</label>
                        <input type="number" className="form-control" value={designFee} onChange={e => setDesignFee(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Наценка по умолч. (%)</label>
                      <input type="number" className="form-control" value={outdoorMarkup} onChange={e => setOutdoorMarkup(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Сохранить настройки
                </button>
              </div>
            </form>
          )}

          {activeTab === 'database' && (
            <form onSubmit={handleSaveDatabase}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px', fontFamily: 'Outfit', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Подключение к Базе Данных Supabase
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Supabase URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://your-project.supabase.co"
                    value={dbUrl}
                    onChange={e => setDbUrl(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Адрес REST API вашего проекта Supabase
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Anon API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="your-anon-key..."
                    value={dbKey}
                    onChange={e => setDbKey(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Публичный API ключ для анонимного доступа
                  </span>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: 'var(--warning)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Внимание:</strong> Изменение настроек подключения базы данных приведет к перезапуску приложения и переподключению к новому серверу. Убедитесь, что таблицы БД инициализированы скриптом миграции.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleResetDatabase} className="btn btn-secondary" style={{ color: 'var(--error)' }}>
                  Сбросить к заводским
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Сохранить и перезапустить
                </button>
              </div>
            </form>
          )}

          {activeTab === 'updates' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '24px', fontFamily: 'Outfit', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Система и Обновления
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <Info size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, fontFamily: 'Outfit' }}>
                      3D & AD CRM Desktop
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Текущая версия приложения: <strong>v1.0.2</strong>
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Автоматические обновления</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Программа автоматически проверяет наличие новых версий на GitHub при запуске. Если доступна новая версия, приложение скачает её в фоновом режиме и предложит установить. Вы также можете запустить проверку вручную.
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={triggerUpdateCheck}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px' }}
                  >
                    <RefreshCw size={16} /> Проверить наличие обновлений
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
