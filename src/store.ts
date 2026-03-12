import { getSupabase } from './lib/supabase';
import type { Project, Task, ActionPhase, ProductAdvantage, CustomerInfo, PainPoint, FAQ, Competitor, DailyLog, Fanpage, ContentAd, MediaFolder } from './types';

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
  mediaFolders: 'pm_mediafolders',
};

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ==========================================
// SUPABASE: PROJECTS (Đã đồng bộ lên Cloud)
// ==========================================
export const fetchProjects = async (): Promise<Project[]> => {
  const supabase = getSupabase();
  if (!supabase) return load(KEYS.projects);
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Lỗi tải dự án:', error);
    return load(KEYS.projects);
  }
  
  return data.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.created_at
  }));
};

export const insertProject = async (project: Project): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    const all = load<Project>(KEYS.projects);
    save(KEYS.projects, [project, ...all]);
    return true;
  }

  const { error } = await supabase
    .from('projects')
    .insert([{
      id: project.id,
      name: project.name,
      description: project.description,
      created_at: project.createdAt
    }]);

  if (error) {
    console.error('Lỗi tạo dự án:', error);
    return false;
  }
  return true;
};

export const removeProject = async (id: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    const all = load<Project>(KEYS.projects);
    save(KEYS.projects, all.filter(p => p.id !== id));
    return true;
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    console.error('Lỗi xóa dự án:', error);
    return false;
  }
  return true;
};

// ==========================================
// LOCAL STORAGE: CÁC DỮ LIỆU KHÁC (Tạm giữ)
// ==========================================

// Tasks
export const getTasks = (projectId: string): Task[] =>
  load<Task>(KEYS.tasks).filter(t => t.projectId === projectId);
export const getAllTasks = (): Task[] => load(KEYS.tasks);
export const saveTasks = (tasks: Task[]) => save(KEYS.tasks, tasks);
export const saveTasksForProject = (projectId: string, tasks: Task[]) => {
  const all = load<Task>(KEYS.tasks).filter(t => t.projectId !== projectId);
  save(KEYS.tasks, [...all, ...tasks]);
};

// Product Advantages
export const getAdvantages = (pid: string): ProductAdvantage[] =>
  load<ProductAdvantage>(KEYS.advantages).filter(a => a.projectId === pid);
export const saveAdvantages = (pid: string, items: ProductAdvantage[]) => {
  const all = load<ProductAdvantage>(KEYS.advantages).filter(a => a.projectId !== pid);
  save(KEYS.advantages, [...all, ...items]);
};

// Customer Infos
export const getCustomerInfos = (pid: string): CustomerInfo[] =>
  load<CustomerInfo>(KEYS.customerInfos).filter(c => c.projectId === pid);
export const saveCustomerInfos = (pid: string, items: CustomerInfo[]) => {
  const all = load<CustomerInfo>(KEYS.customerInfos).filter(c => c.projectId !== pid);
  save(KEYS.customerInfos, [...all, ...items]);
};

// Pain Points
export const getPainPoints = (pid: string): PainPoint[] =>
  load<PainPoint>(KEYS.painPoints).filter(p => p.projectId === pid);
export const savePainPoints = (pid: string, items: PainPoint[]) => {
  const all = load<PainPoint>(KEYS.painPoints).filter(p => p.projectId !== pid);
  save(KEYS.painPoints, [...all, ...items]);
};

// FAQs
export const getFAQs = (pid: string): FAQ[] =>
  load<FAQ>(KEYS.faqs).filter(f => f.projectId === pid);
export const saveFAQs = (pid: string, items: FAQ[]) => {
  const all = load<FAQ>(KEYS.faqs).filter(f => f.projectId !== pid);
  save(KEYS.faqs, [...all, ...items]);
};

// Competitors
export const getCompetitors = (pid: string): Competitor[] =>
  load<Competitor>(KEYS.competitors).filter(c => c.projectId === pid);
export const saveCompetitors = (pid: string, items: Competitor[]) => {
  const all = load<Competitor>(KEYS.competitors).filter(c => c.projectId !== pid);
  save(KEYS.competitors, [...all, ...items]);
};

// Daily Logs
export const getDailyLogs = (pid: string): DailyLog[] =>
  load<DailyLog>(KEYS.dailyLogs).filter(d => d.projectId === pid);
export const saveDailyLogs = (pid: string, items: DailyLog[]) => {
  const all = load<DailyLog>(KEYS.dailyLogs).filter(d => d.projectId !== pid);
  save(KEYS.dailyLogs, [...all, ...items]);
};

// Fanpages (with embedded checklist)
export const getFanpages = (pid: string): Fanpage[] =>
  load<Fanpage>(KEYS.fanpageChecks).filter(f => f.projectId === pid);
export const saveFanpages = (pid: string, items: Fanpage[]) => {
  const all = load<Fanpage>(KEYS.fanpageChecks).filter(f => f.projectId !== pid);
  save(KEYS.fanpageChecks, [...all, ...items]);
};

// Content Ads
export const getContentAds = (pid: string): ContentAd[] =>
  load<ContentAd>(KEYS.contentAds).filter(c => c.projectId === pid);
export const saveContentAds = (pid: string, items: ContentAd[]) => {
  const all = load<ContentAd>(KEYS.contentAds).filter(c => c.projectId !== pid);
  save(KEYS.contentAds, [...all, ...items]);
};

// Action Phases
export const getActionPhases = (pid: string): ActionPhase[] => {
  const key = `${KEYS.actionPhases}_${pid}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
export const saveActionPhases = (pid: string, phases: ActionPhase[]) => {
  const key = `${KEYS.actionPhases}_${pid}`;
  localStorage.setItem(key, JSON.stringify(phases));
};

// Media Folders
export const getMediaFolders = (pid: string): MediaFolder[] =>
  load<MediaFolder>(KEYS.mediaFolders).filter(f => f.projectId === pid);
export const saveMediaFolders = (pid: string, items: MediaFolder[]) => {
  const all = load<MediaFolder>(KEYS.mediaFolders).filter(f => f.projectId !== pid);
  save(KEYS.mediaFolders, [...all, ...items]);
};
