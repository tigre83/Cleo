import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Client } from '../types';

export function useAuth() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('cleo_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setClient(data);
    } catch {
      localStorage.removeItem('cleo_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cleo_token', data.token);
    setClient(data.client);
  };

  const register = async (email: string, password: string, company_name: string) => {
    const { data } = await api.post('/auth/register', { email, password, company_name });
    localStorage.setItem('cleo_token', data.token);
    setClient(data.client);
  };

  const logout = () => {
    localStorage.removeItem('cleo_token');
    setClient(null);
  };

  return { client, loading, login, register, logout, refresh: fetchProfile };
}
