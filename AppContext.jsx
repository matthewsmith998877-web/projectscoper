import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../utils/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [roles,  setRoles]  = useState([]);
  const [tasks,  setTasks]  = useState([]);
  const [scopes, setScopes] = useState([]);

  // hoursGrid: { "roleId|taskId": hours }
  const [hoursGrid, setHoursGrid] = useState({});

  // Current scope metadata (used across Scoping + Summary pages)
  const [scopeMeta, setScopeMeta] = useState({
    id: null,
    name: '',
    clientName: '',
    projectTimeline: '',
    preparedBy: '',
    projectDescription: '',
    currency: '£',
    status: 'draft',
    projectNameManuallyEdited: false,
  });

  // ── LOADERS ────────────────────────────────────────────────────────────────
  const loadRoles = useCallback(async () => {
    const data = await api.get('/api/roles');
    setRoles(data);
    return data;
  }, []);

  const loadTasks = useCallback(async () => {
    const data = await api.get('/api/tasks');
    setTasks(data);
    return data;
  }, []);

  const loadScopes = useCallback(async () => {
    const data = await api.get('/api/scopes');
    setScopes(data);
    return data;
  }, []);

  // ── HOURS GRID HELPERS ─────────────────────────────────────────────────────
  function getHours(roleId, taskId) {
    return parseFloat(hoursGrid[`${roleId}|${taskId}`]) || 0;
  }

  function setHours(roleId, taskId, value) {
    setHoursGrid(prev => ({
      ...prev,
      [`${roleId}|${taskId}`]: parseFloat(value) || 0,
    }));
  }

  function clearGrid() {
    setHoursGrid({});
    setScopeMeta({
      id: null,
      name: '',
      clientName: '',
      projectTimeline: '',
      preparedBy: '',
      projectDescription: '',
      currency: '£',
      status: 'draft',
      projectNameManuallyEdited: false,
    });
  }

  // Build hours array for API submission
  function buildHoursArray() {
    return Object.entries(hoursGrid)
      .map(([key, hours]) => {
        const [roleId, taskId] = key.split('|').map(Number);
        return { role_id: roleId, task_id: taskId, hours };
      })
      .filter(h => h.hours > 0);
  }

  // Load a saved scope into the grid
  function loadScopeIntoGrid(scope) {
    const grid = {};
    (scope.hours || []).forEach(h => {
      grid[`${h.role_id}|${h.task_id}`] = h.hours;
    });
    setHoursGrid(grid);
    setScopeMeta({
      id: scope.id,
      name: scope.name || '',
      clientName: scope.client_name || '',
      projectTimeline: scope.project_timeline || '',
      preparedBy: scope.prepared_by || '',
      projectDescription: scope.project_description || '',
      currency: scope.currency || '£',
      status: scope.status || 'draft',
      projectNameManuallyEdited: false,
    });
  }

  // ── SCOPE META ─────────────────────────────────────────────────────────────
  function updateScopeMeta(fields) {
    setScopeMeta(prev => ({ ...prev, ...fields }));
  }

  // ── ADMIN: ROLES ───────────────────────────────────────────────────────────
  async function addRole(name, chargeout_rate, cost_rate) {
    const role = await api.post('/api/roles', { name, chargeout_rate, cost_rate });
    setRoles(prev => [...prev, role]);
    return role;
  }

  async function deleteRole(id) {
    await api.delete(`/api/roles/${id}`);
    setRoles(prev => prev.filter(r => r.id !== id));
  }

  // ── ADMIN: TASKS ───────────────────────────────────────────────────────────
  async function addTask(name) {
    const task = await api.post('/api/tasks', { name });
    setTasks(prev => [...prev, task]);
    return task;
  }

  async function deleteTask(id) {
    await api.delete(`/api/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // ── SCOPES ─────────────────────────────────────────────────────────────────
  async function saveScope() {
    const hours = buildHoursArray();
    const payload = {
      name:                scopeMeta.name || 'Unnamed Scope',
      client_name:         scopeMeta.clientName || null,
      project_timeline:    scopeMeta.projectTimeline || null,
      prepared_by:         scopeMeta.preparedBy || null,
      project_description: scopeMeta.projectDescription || null,
      currency:            scopeMeta.currency || '£',
      status:              'draft',
      hours,
    };

    let saved;
    if (scopeMeta.id) {
      saved = await api.put(`/api/scopes/${scopeMeta.id}`, payload);
      setScopes(prev => prev.map(s => s.id === saved.id ? saved : s));
    } else {
      saved = await api.post('/api/scopes', payload);
      setScopes(prev => [saved, ...prev]);
      setScopeMeta(prev => ({ ...prev, id: saved.id }));
    }
    return saved;
  }

  async function deleteScope(id) {
    await api.delete(`/api/scopes/${id}`);
    setScopes(prev => prev.filter(s => s.id !== id));
    if (scopeMeta.id === id) clearGrid();
  }

  return (
    <AppContext.Provider value={{
      roles, tasks, scopes,
      hoursGrid, getHours, setHours, clearGrid, buildHoursArray,
      scopeMeta, updateScopeMeta,
      loadRoles, loadTasks, loadScopes,
      loadScopeIntoGrid,
      addRole, deleteRole,
      addTask, deleteTask,
      saveScope, deleteScope,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
