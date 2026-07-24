'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { fetchDegreeDays, ModelData } from '../../lib/weather';

if (typeof Highcharts === 'object') {
  Highcharts.setOptions({
    lang: { months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'], shortMonths: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'] }
  });
}

interface Alarm { id: string; threshold: number; email: string; active: boolean; lastTriggeredDate?: string; }
interface AlarmLog { id: string; date: string; action: string; details: string; }

const ALARM_COLORS = ['#ff9800', '#9c27b0', '#00bcd4', '#4caf50', '#e91e63', '#795548', '#607d8b'];

export default function ModelPage() {
  const [model, setModel] = useState<ModelData | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmLogs, setAlarmLogs] = useState<AlarmLog[]>([]);

  const [activeTab, setActiveTab] = useState<'bilancio' | 'allarmi'>('bilancio');
  const [subTab, setSubTab] = useState<'gestione' | 'registro'>('gestione');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [yearInput, setYearInput] = useState<string>(currentYear.toString());

  const [showForm, setShowForm] = useState(false);
  const [newThreshold, setNewThreshold] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const DD_ONE_PERCENT = 3.56;

  useEffect(() => {
    setModel(null);
    fetchDegreeDays(selectedYear).then(setModel);
  }, [selectedYear]);

  useEffect(() => {
    const storedAlarms = localStorage.getItem('vineyard_alarms');
    const storedLogs = localStorage.getItem('vineyard_logs');
    if (storedAlarms) setAlarms(JSON.parse(storedAlarms));
    if (storedLogs) setAlarmLogs(JSON.parse(storedLogs));
  }, []);

  // 3. Salvataggio Allarmi nel LocalStorage (Isolato)
  useEffect(() => {
    localStorage.setItem('vineyard_alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem('vineyard_logs', JSON.stringify(alarmLogs));
  }, [alarmLogs]);

  useEffect(() => {
    if (!model || selectedYear !== currentYear) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let alarmsUpdated = false;

    const newAlarms = alarms.map(alarm => {
      if (alarm.active && model.todayDD >= alarm.threshold && alarm.lastTriggeredDate !== todayStr) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: alarm.email,
            threshold: alarm.threshold,
            currentDD: model.todayDD,
            year: currentYear
          })
        })
        .then(res => res.json())
        .then(() => logAction('EMAIL INVIATA', `Avviso anno ${currentYear} (soglia ${alarm.threshold} DD) inviato a ${alarm.email}`))
        .catch(err => console.error("Errore email", err));

        alarmsUpdated = true;
        return { ...alarm, lastTriggeredDate: todayStr };
      }
      return alarm;
    });

    if (alarmsUpdated) setAlarms(newAlarms);
  }, [model, selectedYear, currentYear, alarms]);

  const logAction = (action: string, details: string) => {
    const newLog: AlarmLog = { id: Date.now().toString(), date: new Date().toLocaleString(), action, details };
    setAlarmLogs(prev => [newLog, ...prev]);
  };

  const handleResetAll = () => {
    if (window.confirm("Sei sicuro di voler cancellare tutti gli allarmi e la cronologia dal browser?")) {
      localStorage.removeItem('vineyard_alarms');
      localStorage.removeItem('vineyard_logs');
      setAlarms([]);
      setAlarmLogs([]);
      setErrorMsg('');
    }
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYearInput(val);

    if (val.length === 4) {
      const parsedYear = parseInt(val);
      if (!isNaN(parsedYear)) {
        if (parsedYear > currentYear) {
          setErrorMsg(`Non è possibile selezionare anni futuri. L'anno massimo disponibile è il ${currentYear}.`);
          return;
        }
        if (parsedYear < 1940) {
          setErrorMsg(`L'archivio meteorologico globale parte dal 1940. Impossibile simulare anni precedenti.`);
          return;
        }
        setErrorMsg('');
        setSelectedYear(parsedYear);
      }
    }
  };

  const getChartOptions = (): Highcharts.Options => {
    if (!model || model.data.length === 0) return {};

    const minX = new Date(model.data[0].date).getTime();
    const maxX = new Date(model.data[model.data.length - 1].date).getTime();

    const sordidusSeries: Highcharts.SeriesLineOptions = {
      type: 'line',
      name: 'A.Brevis - Soglia 30%',
      color: '#0d6efd',
      dashStyle: 'ShortDot',
      lineWidth: 2,
      marker: { enabled: false },
      data: [
        {
          x: minX,
          y: 106.8,
          dataLabels: {
            enabled: true,
            format: 'A.Brevis - Soglia 30%',
            align: 'left',
            verticalAlign: 'bottom',
            x: 10,
            y: -2,
            crop: false,
            overflow: 'allow',
            style: { fontSize: '11px', fontWeight: 'bold', color: '#0d6efd', textOutline: 'none' }
          }
        },
        { x: maxX, y: 106.8 }
      ],
      zIndex: 3
    };

    const userAlarmsSeries: Highcharts.SeriesLineOptions[] = alarms.filter(a => a.active).map((a, index) => {
      const color = ALARM_COLORS[index % ALARM_COLORS.length];
      const pct = Math.round(a.threshold / DD_ONE_PERCENT);
      const labelText = `User Alarm - Soglia ${pct}%`;

      return {
        type: 'line',
        name: labelText,
        color: color,
        dashStyle: 'ShortDash',
        lineWidth: 2,
        marker: { enabled: false },
        data: [
          {
            x: minX,
            y: a.threshold,
            dataLabels: {
              enabled: true,
              format: labelText,
              align: 'left',
              verticalAlign: 'bottom',
              x: 10,
              y: -2,
              crop: false,
              overflow: 'allow',
              style: { fontSize: '11px', fontWeight: 'bold', color: color, textOutline: 'none' }
            }
          },
          { x: maxX, y: a.threshold }
        ],
        zIndex: 3
      };
    });

    return {
      chart: { type: 'spline', height: 500 },
      title: { text: `Gradi Giorno A. Brevis (${selectedYear})`, style: { fontWeight: 'bold' } },
      xAxis: {
        type: 'datetime', dateTimeLabelFormats: { month: '%b 1' }, tickInterval: 30 * 24 * 3600 * 1000,
        plotLines: selectedYear === currentYear ? [{
          color: 'red',
          width: 2,
          value: new Date().setHours(0, 0, 0, 0),
          label: { text: 'Today', align: 'left', y: -10, style: { color: 'red', fontWeight: 'bold' } },
          zIndex: 4
        }] : []
      },
      yAxis: {
        title: { text: '' }, min: 0, max: Math.max(1000, ...alarms.map(a => a.threshold + 100)), tickInterval: 250,
      },
      series: [
        { type: 'spline', name: 'Gradi giorno cumulati', data: model.data.map(d => [new Date(d.date).getTime(), d.cumulativeDD]), color: '#dc3545', lineWidth: 2, marker: { enabled: false }, zIndex: 5 },
        sordidusSeries,
        ...userAlarmsSeries
      ],
      legend: { enabled: true, verticalAlign: 'bottom', layout: 'horizontal' },
      credits: { enabled: false },
      tooltip: { shared: true }
    };
  };

  const handleAddAlarm = () => {
    if (!newThreshold || !newEmail) {
      return setErrorMsg('Compilare sia il campo Soglia che il campo Email.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return setErrorMsg('Inserire un indirizzo email valido (es. nome@dominio.com).');
    }

    const val = parseFloat(newThreshold);
    if (isNaN(val) || val <= 0) {
      return setErrorMsg('Inserire un valore numerico valido per la soglia.');
    }

    setAlarms([...alarms, { id: Date.now().toString(), threshold: val, email: newEmail, active: true }]);
    logAction('INSERITO', `Creata soglia ${val} DD per email: ${newEmail}`);
    setNewThreshold(''); setNewEmail(''); setShowForm(false); setErrorMsg('');
  };

  const toggleAlarm = (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;
    setAlarms(alarms.map(al => al.id === id ? { ...al, active: !al.active } : al));
    logAction(alarm.active ? 'DISATTIVATO' : 'ATTIVATO', `Soglia ${alarm.threshold} DD`);
  };

  const deleteAlarm = (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (alarm?.active) return setErrorMsg("Disattivare l'allarme prima di eliminarlo.");
    setAlarms(alarms.filter(a => a.id !== id));
    if (alarm) logAction('ELIMINATO', `Soglia ${alarm.threshold} DD eliminata definitivamente`);
    setErrorMsg('');
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="mb-4">
        <Link href="/" className="text-decoration-none text-secondary small mb-2 d-inline-block">&larr; Torna alla Mappa</Link>
        <h6 className="fw-bold mb-3">Modello relativo al periodo</h6>
        <div className="d-flex align-items-center border rounded px-3 py-2 bg-white shadow-sm" style={{ width: 'fit-content' }}>
          <i className="bi bi-calendar me-2 text-secondary"></i>
          <input
            type="number"
            max={currentYear}
            min={1940}
            className="border-0 bg-transparent text-secondary fw-bold"
            value={yearInput}
            onChange={handleYearInputChange}
            style={{ outline: 'none', width: '70px' }}
            placeholder="Anno"
          />
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger py-2 mb-3">{errorMsg}</div>}

      <ul className="nav nav-tabs border-bottom-0">
        <li className="nav-item">
          <button className={`nav-link border-0 border-bottom pb-3 ${activeTab === 'bilancio' ? 'active text-primary fw-bold border-primary border-2' : 'text-secondary'}`} onClick={() => setActiveTab('bilancio')} style={{ backgroundColor: 'transparent' }}><i className="bi bi-bar-chart-line me-2"></i>Bilancio</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link border-0 border-bottom pb-3 ${activeTab === 'allarmi' ? 'active text-primary fw-bold border-primary border-2' : 'text-secondary'}`} onClick={() => setActiveTab('allarmi')} style={{ backgroundColor: 'transparent' }}><i className="bi bi-bell me-2"></i>Allarmi</button>
        </li>
      </ul>

      <div className="card shadow-sm border rounded-3 p-4 bg-white" style={{ minHeight: '600px' }}>
        {activeTab === 'bilancio' && (
          <div>
            {!model ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
                <div className="text-secondary fw-semibold"><div className="spinner-border spinner-border-sm me-2" role="status"></div>Caricamento dati meteo {selectedYear}...</div>
              </div>
            ) : ( <HighchartsReact highcharts={Highcharts} options={getChartOptions()} /> )}
          </div>
        )}

        {activeTab === 'allarmi' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <div className="d-flex gap-4 cursor-pointer">
                <span className="px-3 py-2 rounded" style={{ backgroundColor: subTab === 'gestione' ? '#fff0f0' : 'transparent', color: subTab === 'gestione' ? '#ff4d4f' : '#6c757d', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setSubTab('gestione')}>Gestione allarmi</span>
                <span className="px-3 py-2 rounded" style={{ backgroundColor: subTab === 'registro' ? '#f8f9fa' : 'transparent', color: subTab === 'registro' ? '#212529' : '#6c757d', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => setSubTab('registro')}>Registro allarmi</span>
              </div>

              {(alarms.length > 0 || alarmLogs.length > 0) && (
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={handleResetAll}
                  title="Svuota il LocalStorage"
                >
                  <i className="bi bi-trash3"></i> Reset
                </button>
              )}
            </div>

            {subTab === 'gestione' && (
              <>
                <p className="text-secondary small mb-3">Inserisci e gestisci le tue soglie di allarme personalizzate.</p>
                {!showForm && (<button className="btn btn-primary rounded-3 px-3 py-2 mb-4 shadow-sm" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg fs-5"></i></button>)}

                {showForm && (
                  <div className="mb-5 border-bottom pb-4 bg-light p-3 rounded">
                    <div className="row align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Soglia (Gradi-Giorno)</label>
                        <input type="number" className="form-control" placeholder="Es. 150" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Email di Avviso</label>
                        <input type="email" className="form-control" placeholder="es. nome@dominio.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                      </div>
                      <div className="col-md-5 d-flex gap-2">
                        <button className="btn btn-primary px-4 shadow-sm" onClick={handleAddAlarm}>Salva</button>
                        <button className="btn btn-outline-secondary px-4" onClick={() => setShowForm(false)}>Annulla</button>
                      </div>
                    </div>
                  </div>
                )}

                <table className="table table-hover mt-2">
                  <thead className="border-bottom">
                    <tr className="small text-dark fw-bold">
                      <th className="pb-3">Soglia (DD)</th>
                      <th className="pb-3">Email di Avviso</th>
                      <th className="pb-3">Stato</th>
                      <th className="pb-3 text-end">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alarms.length === 0 && (<tr><td colSpan={4} className="text-secondary text-center pt-4">Nessun Allarme Configurato</td></tr>)}
                    {alarms.map(a => {
                      const pct = Math.round(a.threshold / DD_ONE_PERCENT);
                      return (
                      <tr key={a.id}>
                        <td className="align-middle fw-semibold text-secondary">{a.threshold}</td>
                        <td className="align-middle text-secondary">{a.email}</td>
                        <td className="align-middle"><span className={`badge ${a.active ? 'bg-success' : 'bg-secondary'}`}>{a.active ? 'Attivo' : 'Disattivato'}</span></td>
                        <td className="align-middle text-end">
                          <button className={`btn btn-sm me-2 ${a.active ? 'btn-outline-warning' : 'btn-outline-success'}`} onClick={() => toggleAlarm(a.id)}>{a.active ? 'Disattiva' : 'Attiva'}</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAlarm(a.id)}><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </>
            )}

            {subTab === 'registro' && (
              <>
                <p className="text-secondary small mb-3">Cronologia di tutte le operazioni effettuate sugli allarmi.</p>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="table table-striped table-sm mt-2">
                    <thead>
                      <tr className="small text-dark fw-bold">
                        <th>Data e Ora</th>
                        <th>Azione</th>
                        <th>Dettagli</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alarmLogs.length === 0 && (<tr><td colSpan={3} className="text-secondary text-center pt-4">Nessun log disponibile</td></tr>)}
                      {alarmLogs.map(log => (
                        <tr key={log.id}>
                          <td className="text-secondary small align-middle">{log.date}</td>
                          <td className="align-middle"><span className={`badge ${log.action === 'INSERITO' ? 'bg-primary' : log.action === 'ELIMINATO' ? 'bg-danger' : log.action === 'ATTIVATO' ? 'bg-success' : log.action === 'EMAIL INVIATA' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>{log.action}</span></td>
                          <td className="text-secondary small align-middle">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}