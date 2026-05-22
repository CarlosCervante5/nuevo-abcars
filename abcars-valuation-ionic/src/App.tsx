import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Pages */
import Login from './pages/auth/Login';
import ValuationList from './pages/valuations/ValuationList';
import ValuationDetail from './pages/valuations/ValuationDetail';
import NewValuation from './pages/valuations/NewValuation';
import QuoteRequest from './pages/valuations/QuoteRequest';
import Checklist from './pages/checklist/Checklist';
import AcquisitionChecklist from './pages/acquisition/AcquisitionChecklist';
import RepairsList from './pages/repairs/RepairsList';
import PartsList from './pages/parts/PartsList';
import ExternalPhotos from './pages/photos/ExternalPhotos';
import InternalPhotos from './pages/photos/InternalPhotos';
import VehicleList from './pages/manager/VehicleList';
import VehicleDetail from './pages/manager/VehicleDetail';
import VehiclePhotos from './pages/manager/VehiclePhotos';
import PublicInventoryList from './pages/inventory/PublicInventoryList';
import PublicVehicleDetail from './pages/inventory/PublicVehicleDetail';
import { connectivityService } from './services/connectivityService';
import { processOfflineQueue } from './services/offlineSync';
import { vehicleImageAiBatchService } from './services/vehicleImageAiBatchService';

setupIonicReact();

function runOfflineSync() {
  if (!localStorage.getItem('auth_token')) return;
  if (!connectivityService.isOnline()) return;
  processOfflineQueue().catch((err) => console.warn('Offline sync error:', err));
}

const App: React.FC = () => {
  // Verificar si hay token guardado y escuchar cambios
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return !!localStorage.getItem('auth_token');
  });
  
  // Escuchar cambios en localStorage para actualizar autenticación
  React.useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('auth_token'));
    };
    
    // Verificar cada vez que cambie localStorage (mismo origen)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    // Verificar periódicamente (cada 500ms) para cambios en la misma ventana
    const interval = setInterval(checkAuth, 500);
    
    // También escuchar eventos de storage (para cambios entre ventanas/pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sincronizar cola offline al recuperar conexión y al montar si hay conexión
  React.useEffect(() => {
    runOfflineSync();
    const unsubscribe = connectivityService.onOnline(runOfflineSync);
    return unsubscribe;
  }, []);

  const [batchToast, setBatchToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const prev = new Map<string, string>();
    vehicleImageAiBatchService.getJobs().forEach((j) => {
      prev.set(j.id, j.status);
    });

    return vehicleImageAiBatchService.subscribe(() => {
      for (const job of vehicleImageAiBatchService.getJobs()) {
        const was = prev.get(job.id);
        if (
          was &&
          (was === 'processing' || was === 'saving') &&
          (job.status === 'completed' || job.status === 'failed')
        ) {
          if (job.status === 'completed') {
            setBatchToast(
              `IA terminada: ${job.saved}/${job.total} foto(s) de ${job.vehicleLabel}`,
            );
          } else {
            setBatchToast(
              job.lastError
                ? `IA falló (${job.vehicleLabel}): ${job.lastError}`
                : `IA falló en ${job.vehicleLabel}`,
            );
          }
        }
        prev.set(job.id, job.status);
      }
    });
  }, []);

  return (
    <IonApp>
      {batchToast ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            padding: '10px 14px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          onClick={() => setBatchToast(null)}
        >
          {batchToast}
        </div>
      ) : null}
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/valuations">
            {isAuthenticated ? <ValuationList /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/new">
            {isAuthenticated ? <NewValuation /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid([0-9a-fA-F-]{36})">
            {isAuthenticated ? <ValuationDetail /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/checklist">
            {isAuthenticated ? <Checklist /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/quote-request">
            {isAuthenticated ? <QuoteRequest /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/acquisition">
            {isAuthenticated ? <AcquisitionChecklist /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/repairs">
            {isAuthenticated ? <RepairsList /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/parts">
            {isAuthenticated ? <PartsList /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/photos/exterior">
            {isAuthenticated ? <ExternalPhotos /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/valuations/:valuationUuid/photos/interior">
            {isAuthenticated ? <InternalPhotos /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/manager/vehicles">
            {isAuthenticated ? <VehicleList /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/manager/vehicles/new">
            {isAuthenticated ? <VehicleDetail /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/manager/vehicles/:vehicleUuid">
            {isAuthenticated ? <VehicleDetail /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/manager/vehicles/:vehicleUuid/photos">
            {isAuthenticated ? <VehiclePhotos /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/inventory">
            <PublicInventoryList />
          </Route>
          <Route exact path="/inventory/:vehicleUuid">
            <PublicVehicleDetail />
          </Route>
          <Route exact path="/">
            {isAuthenticated ? (
              (() => {
                // Intentar detectar el rol del usuario desde localStorage
                try {
                  const userStr = localStorage.getItem('user');
                  if (userStr) {
                    const user = JSON.parse(userStr);
                    const role = user?.role; // El rol está directamente en user.role
                    if (role === 'manager' || role === 'marketing') {
                      return <Redirect to="/manager/vehicles" />;
                    }
                  }
                } catch (e) {
                  // Si hay error, usar ruta por defecto
                }
                return <Redirect to="/valuations" />;
              })()
            ) : (
              <Redirect to="/inventory" />
            )}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
