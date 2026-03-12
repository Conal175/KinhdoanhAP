import { useState, useEffect } from 'react';
import { getSupabase } from './lib/supabase';
import type { Project } from './types';

// ==========================================
// 1. DỮ LIỆU DỰ ÁN CỐT LÕI
// ==========================================
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    // CHỐT CHẶN 1: Nếu có lỗi hoặc data bị rỗng (null), lập tức trả về mảng rỗng
    if (error || !data) return [];
    
    return data.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.created_at }));
  } catch (err) {
    console.error("Lỗi fetchProjects:", err);
    return []; // Trả về mảng rỗng để chống sập web
  }
};

export const insertProject = async (project: Project): Promise<boolean> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('projects').insert([{
      id: project.id, name: project.name, description: project.description, created_at: project.createdAt
    }]);
    return !error;
  } catch (err) {
    return false;
  }
};

export const removeProject = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
};

// ==========================================
// 2. HỆ THỐNG ĐỒNG BỘ CLOUD TỰ ĐỘNG (JSONB)
// ==========================================
export const fetchProjectData = async <T>(pid: string, key: string): Promise<T[] | null> => {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('project_data')
      .select('data_value')
      .eq('project_id', pid)
      .eq('data_key', key)
      .single();

    // CHỐT CHẶN 2: Bảo vệ dữ liệu chi tiết dự án
    if (error || !data || !data.data_value) return null;
    return data.data_value as T[];
  } catch (err) {
    return null;
  }
};

export const saveProjectData = async <T>(pid: string, key: string, items: T[]) => {
  try {
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
  } catch (err) {
    console.error("Lỗi saveProjectData:", err);
  }
};

// ==========================================
// 3. REACT HOOK: DÙNG CHO MỌI TRANG CON
// ==========================================
export function useSyncData<T>(projectId: string, dataKey: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchProjectData<T>(projectId, dataKey).then(res => {
      if (isMounted) {
        // CHỐT CHẶN 3: Đảm bảo dữ liệu đẩy ra giao diện luôn là dạng danh sách (Array)
        const safeData = Array.isArray(res) ? res : initialValue;
        setData(safeData);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setData(initialValue);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [projectId, dataKey]);

  const syncData = async (newData: T[]) => {
    const safeData = Array.isArray(newData) ? newData : [];
    setData(safeData); 
    await saveProjectData(projectId, dataKey, safeData);
  };

  return { data, syncData, loading };
}
