import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonLoading,
  IonCard,
  IonCardContent,
  IonCardHeader,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { valuationService } from '../../services/valuationService';
import { apiService } from '../../services/api';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await valuationService.login(email.trim(), password);
      
      // El backend siempre retorna: { status: 200/401/etc, message: "...", data: {...} }
      // valuationService.login ya maneja errores y retorna response.data del backend
      // Así que response = { status: 200, message: "...", data: { token: "...", user: {...} } }
      
      if (response && response.status === 200 && response.data?.token) {
        const token = response.data.token;
        const user = response.data.user;
        const role = response.data.role; // El rol viene directamente en response.data.role
        apiService.setToken(token);
        
        // Guardar usuario y rol en localStorage para detectar el rol
        if (user) {
          const userData = {
            ...user,
            role: role // Agregar el rol al objeto usuario
          };
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Determinar la ruta según el rol del usuario
        let redirectPath = '/valuations'; // Por defecto para valuator
        if (role === 'manager' || role === 'marketing') {
          redirectPath = '/manager/vehicles';
        }
        
        // Pequeño delay para asegurar que el token se guarde
        setTimeout(() => {
          history.push(redirectPath);
          // Forzar recarga si la navegación no funciona
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              window.location.href = redirectPath;
            }
          }, 1000);
        }, 100);
      } else {
        // Error del backend (401, etc)
        const errorMsg = response?.message || 'Error al iniciar sesión';
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Error de conexión. Verifica tu conexión a internet y que la API esté disponible.');
      } else if (err.response?.status === 401) {
        setError('Credenciales incorrectas');
      } else {
        setError(err.response?.data?.message || err.message || 'Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="login-container">
          <IonCard className="login-card">
            <IonCardHeader>
              <div className="logo-container">
                <img src="/logo.svg" alt="ABCars Logo" className="logo" />
              </div>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem>
                  <IonLabel position="stacked">Correo electrónico</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value!)}
                    required
                    autocomplete="email"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Contraseña</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    required
                    autocomplete="current-password"
                  />
                </IonItem>

                {error && (
                  <div className="error-message" style={{ color: 'red', marginTop: '16px' }}>
                    {error}
                  </div>
                )}

                <IonButton
                  expand="block"
                  type="submit"
                  className="ion-margin-top"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </IonButton>

                <p className="inventory-link">
                  <a onClick={() => history.push('/inventory')}>Ver inventario público</a>
                </p>
              </form>
            </IonCardContent>
          </IonCard>
        </div>

        <IonLoading isOpen={loading} message="Iniciando sesión..." />
      </IonContent>
    </IonPage>
  );
};

export default Login;

