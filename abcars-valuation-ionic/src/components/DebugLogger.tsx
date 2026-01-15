import React, { useEffect, useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { close, bug } from 'ionicons/icons';
import './DebugLogger.css';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  data?: any;
}

class DebugLoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 50;

  addLog(type: 'info' | 'error' | 'success', message: string, data?: any) {
    const log: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notifyListeners();
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }
}

export const debugLogger = new DebugLoggerService();

const DebugLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    // Cargar logs iniciales
    setLogs(debugLogger.getLogs());
    
    const unsubscribe = debugLogger.subscribe((newLogs) => {
      setLogs([...newLogs]);
      // Auto-abrir si hay un error
      if (newLogs.length > 0 && newLogs[0].type === 'error') {
        setIsOpen(true);
        setIsMinimized(false);
      }
    });
    
    return unsubscribe;
  }, []); // Array vacío para que solo se ejecute una vez

  if (!isOpen) {
    return (
      <div className="debug-logger-toggle" onClick={() => setIsOpen(true)}>
        <IonIcon icon={bug} />
        {logs.filter(l => l.type === 'error').length > 0 && (
          <span className="error-badge">{logs.filter(l => l.type === 'error').length}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`debug-logger ${isMinimized ? 'minimized' : ''}`}>
      <div className="debug-logger-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div>
          <IonIcon icon={bug} />
          <span>Debug Logs</span>
          {logs.filter(l => l.type === 'error').length > 0 && (
            <span className="error-count">
              ({logs.filter(l => l.type === 'error').length} errores)
            </span>
          )}
        </div>
        <div className="header-actions">
          <IonButton
            fill="clear"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              debugLogger.clear();
            }}
          >
            Limpiar
          </IonButton>
          <IonButton
            fill="clear"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <IonIcon icon={close} />
          </IonButton>
        </div>
      </div>
      {!isMinimized && (
        <div className="debug-logger-content">
          {logs.length === 0 ? (
            <div className="no-logs">No hay logs aún</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <div className="log-header">
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-type">{log.type.toUpperCase()}</span>
                </div>
                <div className="log-message">{log.message}</div>
                {log.data && (
                  <details className="log-data">
                    <summary>Ver detalles</summary>
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DebugLogger;

