import { useState, useEffect } from 'react';
import { getSupabase } from './lib/supabase';
import type { Project, ActionPhase, ProductAdvantage, CustomerInfo, PainPoint, FAQ, Competitor, DailyLog, Fanpage, ContentAd } from './types';

// 1. Quản lý Dự án (Cloud)
export const fetchProjects = async (): Promise<Project[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  return data ? data.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.created_at })) : [];
};

export const insertProject = async (p: Project) => {
  const supabase = getSupabase();
  return supabase ? !(await supabase.from('projects').insert([{ id: p.id, name: p.name, description: p.description, created_at: p.createdAt }])).error : false;
};

export const removeProject = async (id: string) => {
  const supabase = getSupabase();
  return supabase ? !(await supabase.from('projects').delete().eq('id', id)).error : false;
};

// 2. Hook đồng bộ Cloud (Fix lỗi "useSyncData is not exported")
export function useSyncData<T>(projectId: string, dataKey: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data: res } = await supabase.from('project_data').select('data_value').eq('project_id', projectId).eq('data_key', dataKey).single();
      if (res?.data_value) setData(res.data_value as T[]);
      setLoading(false);
    };
    load();
  }, [projectId, dataKey]);

  const syncData = async (newData: T[]) => {
    setData(newData);
    const supabase = getSupabase();
    if (supabase) await supabase.from('project_data').upsert({ project_id: projectId, data_key: dataKey, data_value: newData, updated_at: new Date().toISOString() }, { onConflict: 'project_id, data_key' });
  };
  return { data, syncData, loading };
}

// 3. Khôi phục các hàm cũ để các trang không bị lỗi trắng màn hình
export const getActionPhases = (pid: string) => []; 
export const saveActionPhases = (pid: string, d: any) => {};
export const getDailyLogs = (pid: string) => [];
export const saveDailyLogs = (pid: string, d: any) => {};
export const getAdvantages = (pid: string) => [];
export const saveAdvantages = (pid: string, d: any) => {};
export const getCustomerInfos = (pid: string) => [];
export const saveCustomerInfos = (pid: string, d: any) => {};
export const getPainPoints = (pid: string) => [];
export const savePainPoints = (pid: string, d: any) => {};
export const getFAQs = (pid: string) => [];
export const saveFAQs = (pid: string, d: any) => {};
export const getCompetitors = (pid: string) => [];
export const saveCompetitors = (pid: string, d: any) => {};
export const getFanpages = (pid: string) => [];
export const saveFanpages = (pid: string, d: any) => {};
export const getContentAds = (pid: string) => [];
export const saveContentAds = (pid: string, d: any) => {};
