import { useState, useEffect } from 'react';
import { getSupabase } from './lib/supabase';
import type { Project } from './types';

// 1. Quản lý dự án
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.created_at }));
  } catch (err) { return []; }
};

export const insertProject = async (project: Project) => {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('projects').insert([{
    id: project.id, name: project.name, description: project.description, created_at: project.createdAt
  }]);
  return !error;
};

export const removeProject = async (id: string) => {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return !error;
};

// 2. Hook Đồng bộ Cloud (Sửa lỗi 406)
export const fetchProjectData = async <T>(pid: string, key: string): Promise<T[] | null> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('project_data')
      .select('data_value')
      .eq('project_id', pid)
      .eq('data_key', key)
      .maybeSingle(); // CHỐT CHẶN SỬA LỖI 406

    if (error) return null;
    return data?.data_value ? (data.data_value as T[]) : null;
  } catch (err) { return null; }
};

export const saveProjectData = async <T>(pid: string, key: string, items: T[]) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('project_data').upsert({
      project_id: pid,
      data_key: key,
      data_value: items,
      updated_at: new Date().toISOString()
    }, { onConflict: 'project_id, data_key' });
  } catch (err) { console.error("Lỗi lưu:", err); }
};

export function useSyncData<T>(projectId: string, dataKey: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchProjectData<T>(projectId, dataKey).then(res => {
      if (isMounted) {
        setData(Array.isArray(res) ? res : initialValue);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [projectId, dataKey]);

  const syncData = async (newData: T[]) => {
    setData(newData); 
    await saveProjectData(projectId, dataKey, newData);
  };

  return { data, syncData, loading };
}

// 3. Khôi phục các hàm rỗng để fix lỗi Build Vercel
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
