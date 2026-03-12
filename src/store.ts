import { useState, useEffect } from 'react';
import { getSupabase } from './lib/supabase';
import type { Project } from './types';

// ==========================================
// 1. DỮ LIỆU DỰ ÁN CỐT LÕI
// ==========================================
export const fetchProjects = async (): Promise<Project[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.created_at }));
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
// 2. HỆ THỐNG ĐỒNG BỘ CLOUD TỰ ĐỘNG (JSONB)
// ==========================================
export const fetchProjectData = async <T>(pid: string, key: string): Promise<T[] | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('project_data')
    .select('data_value')
    .eq('project_id', pid)
    .eq('data_key', key)
    .single();

  if (error || !data) return null;
  return data.data_value as T[];
};

export const saveProjectData = async <T>(pid: string, key: string, items: T[]) => {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from('project_data')
    .upsert({
      project_id: pid,
      data_key: key,
      data_value: items,
      updated_at: new Date().toISOString()
    }, { onConflict: 'project_id, data_key' });
};

// ==========================================
// 3. REACT HOOK: DÙNG CHO MỌI TRANG CON
// ==========================================
export function useSyncData<T>(projectId: string, dataKey: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(true);

  // Tự động tải dữ liệu từ Cloud khi vào trang
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchProjectData<T>(projectId, dataKey).then(res => {
      if (isMounted) {
        setData(res !== null ? res : initialValue);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [projectId, dataKey]);

  // Cập nhật giao diện lập tức & lưu ngầm lên Cloud
  const syncData = async (newData: T[]) => {
    setData(newData); 
    await saveProjectData(projectId, dataKey, newData);
  };

  return { data, syncData, loading };
}
