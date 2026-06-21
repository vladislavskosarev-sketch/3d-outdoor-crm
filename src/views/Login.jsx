import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clearSupabaseConfig } from '../supabaseClient';
import { KeyRound, Mail, User, ShieldAlert, LogOut, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, signup } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) throw new Error('Пожалуйста, введите ваше полное имя.');
        await signup(email.trim(), password, fullName.trim());
        setSuccessMsg('Регистрация успешна! Теперь администратор должен подтвердить ваш аккаунт.');
        setIsRegister(false);
        // Clear fields
        setEmail('');
        setPassword('');
        setFullName('');
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      console.error('Auth error detail:', err);
      let msg = 'Произошла ошибка при аутентификации.';
      if (err) {
        if (err.message && err.message !== '{}') {
          msg = err.message;
        } else if (err.error_description) {
          msg = err.error_description;
        } else if (typeof err === 'object') {
          msg = JSON.stringify(err);
        } else {
          msg = String(err);
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Вы уверены, что хотите сбросить настройки подключения к базе данных?')) {
      clearSupabaseConfig();
      window.location.reload();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100vh',
      background: '#070a13'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>
            PrintPulse <span style={{ color: 'var(--primary)' }}>CRM</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {isRegister ? 'Создайте учетную запись сотрудника' : 'Войдите в личный кабинет'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: 'var(--error)',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <ShieldAlert size={16} />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            color: 'var(--success)',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">ФИО СОТРУДНИКА</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dark)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '40px' }}
                  placeholder="Иван Иванов"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dark)' }} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '40px' }}
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ПАРОЛЬ</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              isRegister ? 'Зарегистрироваться' : 'Войти в систему'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '13px', color: 'var(--secondary)' }}
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccessMsg('');
            }}
            disabled={loading}
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Создать новый аккаунт сотрудника'}
          </button>
        </div>

        <div style={{ 
          marginTop: '28px', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <button
            onClick={handleResetConfig}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              color: 'var(--text-dark)',
              borderColor: 'transparent'
            }}
            disabled={loading}
          >
            Сбросить настройки Базы Данных
          </button>
        </div>
      </div>
    </div>
  );
}
