import { useState, useEffect } from 'react';
import type { Project, Task, ActionPhase, ProductAdvantage, CustomerInfo, PainPoint, FAQ, Competitor, DailyLog, Fanpage, ContentAd } from './types';

const KEYS = {
  projects: 'pm_projects',
  tasks: 'pm_tasks',
  actionPhases: 'pm_actionphases',
  advantages: 'pm_advantages',
  customerInfos: 'pm_customerinfos',
  painPoints: 'pm_painpoints',
  faqs: 'pm_faqs',
  competitors: 'pm_competitors',
  dailyLogs: 'pm_dailylogs',
  fanpageChecks: 'pm_fanpage',
  contentAds: 'pm_contentads',
};

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Entity functions
export const getProjects = (): Project[] => load(KEYS.projects);
export const saveProjects = (p: Project[]) => save(KEYS.projects, p);
export const getActionPhases = (pid: string): ActionPhase[] => load<ActionPhase>(`${KEYS.actionPhases}_${pid}`);
export const saveActionPhases = (pid: string, phases: ActionPhase[]) => save(`${KEYS.actionPhases}_${pid}`, phases);
export const getDailyLogs = (pid: string): DailyLog[] => load<DailyLog>(KEYS.dailyLogs).filter(d => d.projectId === pid);
export const saveDailyLogs = (pid: string, items: DailyLog[]) => {
  const all = load<DailyLog>(KEYS.dailyLogs).filter(d => d.projectId !== pid);
  save(KEYS.dailyLogs, [...all, ...items]);
};
export const getAdvantages = (pid: string) => load<ProductAdvantage>(KEYS.advantages).filter(a => a.projectId === pid);
export const saveAdvantages = (pid: string, items: any[]) => save(KEYS.advantages, [...load<any>(KEYS.advantages).filter(a => a.projectId !== pid), ...items]);
export const getCustomerInfos = (pid: string) => load<CustomerInfo>(KEYS.customerInfos).filter(c => c.projectId === pid);
export const saveCustomerInfos = (pid: string, items: any[]) => save(KEYS.customerInfos, [...load<any>(KEYS.customerInfos).filter(c => c.projectId !== pid), ...items]);
export const getPainPoints = (pid: string) => load<PainPoint>(KEYS.painPoints).filter(p => p.projectId === pid);
export const savePainPoints = (pid: string, items: any[]) => save(KEYS.painPoints, [...load<any>(KEYS.painPoints).filter(p => p.projectId !== pid), ...items]);
export const getFAQs = (pid: string) => load<FAQ>(KEYS.faqs).filter(f => f.projectId === pid);
export const saveFAQs = (pid: string, items: any[]) => save(KEYS.faqs, [...load<any>(KEYS.faqs).filter(f => f.projectId !== pid), ...items]);
export const getCompetitors = (pid: string) => load<Competitor>(KEYS.competitors).filter(c => c.projectId === pid);
export const saveCompetitors = (pid: string, items: any[]) => save(KEYS.competitors, [...load<any>(KEYS.competitors).filter(c => c.projectId !== pid), ...items]);
export const getFanpages = (pid: string) => load<Fanpage>(KEYS.fanpageChecks).filter(f => f.projectId === pid);
export const saveFanpages = (pid: string, items: any[]) => save(KEYS.fanpageChecks, [...load<any>(KEYS.fanpageChecks).filter(f => f.projectId !== pid), ...items]);
export const getContentAds = (pid: string) => load<ContentAd>(KEYS.contentAds).filter(c => c.projectId === pid);
export const saveContentAds = (pid: string, items: any[]) => save(KEYS.contentAds, [...load<any>(KEYS.contentAds).filter(c => c.projectId !== pid), ...items]);

// Generic Hook to fix build error
export function useSyncData<T>(projectId: string, table: string, defaultData: T[]) {
  const [data, setData] = useState<T[]>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `${table}_${projectId}`;
    const raw = localStorage.getItem(key);
    if (raw) setData(JSON.parse(raw));
    setLoading(false);
  }, [projectId, table]);

  const syncData = async (newData: T[]) => {
    setData(newData);
    localStorage.setItem(`${table}_${projectId}`, JSON.stringify(newData));
  };

  return { data, syncData, loading };
}
