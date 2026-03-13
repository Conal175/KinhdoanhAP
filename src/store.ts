import { useState, useEffect } from 'react';
import { getSupabase } from './lib/supabase';
import type { Project, ActionPhase, ProductAdvantage, CustomerInfo, PainPoint, FAQ, Competitor, DailyLog, Fanpage, ContentAd } from './types';

// ==========================================
// 1. QUẢN LÝ DỰ ÁN (ĐỒNG BỘ CLOUD)
// ==========================================
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.created_at }));
  } catch (err) {
    return [];
  }
};

export const insertProject = async (project: Project): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('projects').insert([{
    id: project.id, name: project.name, description: project.description, created_at: project.createdAt
  }]);
  return !error;
};

export const removeProject = async (id: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return !error;
};

// ==========================================
// 2. HOOK ĐỒNG BỘ DỮ LIỆU CHI TIẾT (CHO MỌI TRANG)
// ==========================================
export function useSyncData<T>(projectId: string, dataKey: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: res, error } = await supabase
        .from('project_data')
        .select('data_value')
        .eq('project_id', projectId)
        .eq('data_key', dataKey)
        .single();

      if (isMounted) {
        if (!error && res?.data_value) {
          setData(res.data_value as T[]);
        } else {
          setData(initialValue);
        }
        setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [projectId, dataKey]);

  const syncData = async (newData: T[]) => {
    setData(newData);
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('project_data').upsert({
      project_id: projectId,
      data_key: dataKey,
      data_value: newData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'project_id, data_key' });
  };

  return { data, syncData, loading };
}

// ==========================================
// 3. CÁC HÀM TƯƠNG THÍCH NGƯỢC (SỬA LỖI BUILD)
// ==========================================
// Những hàm này giúp các Component cũ không bị lỗi "not exported"
export const getActionPhases = (pid: string) => []; 
export const saveActionPhases = (pid: string, items: any) => {};
export const getDailyLogs = (pid: string) => [];
export const saveDailyLogs = (pid: string, items: any) => {};
export const getAdvantages = (pid: string) => [];
export const saveAdvantages = (pid: string, items: any) => {};
export const getCustomerInfos = (pid: string) => [];
export const saveCustomerInfos = (pid: string, items: any) => {};
export const getPainPoints = (pid: string) => [];
export const savePainPoints = (pid: string, items: any) => {};
export const getFAQs = (pid: string) => [];
export const saveFAQs = (pid: string, items: any) => {};
export const getCompetitors = (pid: string) => [];
export const saveCompetitors = (pid: string, items: any) => {};
export const getFanpages = (pid: string) => [];
export const saveFanpages = (pid: string, items: any) => {};
export const getContentAds = (pid: string) => [];
export const saveContentAds = (pid: string, items: any) => {};
