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
import Checklist from './pages/checklist/Checklist';
import AcquisitionChecklist from './pages/acquisition/AcquisitionChecklist';
import RepairsList from './pages/repairs/RepairsList';
import PartsList from './pages/parts/PartsList';
import ExternalPhotos from './pages/photos/ExternalPhotos';
import InternalPhotos from './pages/photos/InternalPhotos';
import VehicleList from './pages/manager/VehicleList';
import VehicleDetail from './pages/manager/VehicleDetail';
import VehiclePhotos from './pages/manager/VehiclePhotos';

setupIonicReact();

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

  return (
    <IonApp>
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
              <Redirect to="/login" />
            )}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
