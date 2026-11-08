// Client HTTP vers le backend Express (port 3001)

const BASE = "/api"; // proxy Vite → http://localhost:3001

// "Se souvenir de moi" : coché (par défaut) => localStorage (survit à la fermeture du navigateur),
// décoché => sessionStorage (effacé à la fermeture de l'onglet/navigateur).
export function getToken(): string | null {
  return localStorage.getItem("ct_token") || sessionStorage.getItem("ct_token");
}
export function saveToken(t: string, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  storage.setItem("ct_token", t);
  other.removeItem("ct_token");
}
export function clearToken() {
  localStorage.removeItem("ct_token");
  localStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_token");
  sessionStorage.removeItem("ct_user");
}
export function saveUser(u: ApiUser, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  storage.setItem("ct_user", JSON.stringify(u));
  other.removeItem("ct_user");
}
export function getSavedUser(): ApiUser | null {
  try { return JSON.parse(localStorage.getItem("ct_user") || sessionStorage.getItem("ct_user") || "null"); } catch { return null; }
}
/** Dans quel stockage la session courante vit — utile pour re-sauvegarder l'utilisateur au même endroit après une mise à jour. */
export function isRemembered(): boolean {
  return !!localStorage.getItem("ct_token");
}

/**
 * Jeton invalide/expiré/compte supprimé : le serveur répond 401. On purge la session et on
 * renvoie vers /login une seule fois, au lieu de laisser l'app marteler l'API avec un jeton mort.
 */
function handleUnauthorized() {
  const hadToken = !!getToken();
  clearToken();
  if (hadToken && typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    handleUnauthorized();
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Session expirée, veuillez vous reconnecter");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data as T;
}

/** Sérialise un objet de paramètres en query string, en ignorant les valeurs vides/undefined. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const api = {
  upload: {
    image: async (file: File, category: "profile" | "produits" | "courses"): Promise<{ url: string }> => {
      const token = getToken();
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${BASE}/upload/${category}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      return data;
    },
  },
  auth: {
    login: (email: string, password: string) =>
      req<{ token: string; user: ApiUser }>("/auth/login", {
        method: "POST", body: JSON.stringify({ email, password }),
      }),
    register: (full_name: string, email: string, password: string, phone?: string) =>
      req<{ token: string; user: ApiUser }>("/auth/register", {
        method: "POST", body: JSON.stringify({ full_name, email, password, phone }),
      }),
    me: () => req<ApiUser>("/auth/me"),
    updateMe: (d: { full_name?: string; phone?: string; current_password?: string; new_password?: string }) =>
      req<ApiUser>("/auth/me", { method: "PATCH", body: JSON.stringify(d) }),
  },
  commandes: {
    list: () => req<Commande[]>("/commandes"),
    listPaginated: (params: { search?: string; agent_id?: string; status?: string; date_from?: string; date_to?: string; page: number; limit?: number }) =>
      req<PaginatedResponse<Commande>>(`/commandes${toQuery(params)}`),
    get: (id: string) => req<Commande>(`/commandes/${id}`),
    create: (d: Partial<Commande> & { affiliate_code?: string; product_id?: string }) =>
      req<Commande>("/commandes", { method: "POST", body: JSON.stringify(d) }),
    update: (id: string, d: Partial<Commande>) =>
      req<Commande>(`/commandes/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
    delete: (id: string) =>
      req<{ message: string }>(`/commandes/${id}`, { method: "DELETE" }),
  },
  tracking: {
    public: (num: string) => req<TrackingRow[]>(`/tracking/${num}`),
    history: (commandeId: string) => req<TrackingEvent[]>(`/tracking/history/${commandeId}`),
    addEvent: (commande_id: string, status: string, description?: string) =>
      req<TrackingEvent>("/tracking/history", {
        method: "POST", body: JSON.stringify({ commande_id, status, description }),
      }),
    subscribe: (tracking_number: string, email: string) =>
      req<{ message: string }>("/tracking/subscribe", {
        method: "POST", body: JSON.stringify({ tracking_number, email }),
      }),
  },
  agents: {
    list: () => req<ApiUser[]>("/agents"),
    listPaginated: (params: { page: number; limit?: number }) =>
      req<PaginatedResponse<ApiUser>>(`/agents${toQuery(params)}`),
    updateRole: (id: string, role: string) =>
      req<{ message: string }>(`/agents/${id}/role`, {
        method: "PATCH", body: JSON.stringify({ role }),
      }),
    updateStatus: (id: string, status: "active" | "suspended") =>
      req<{ message: string }>(`/agents/${id}/status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      }),
    commandes: (id: string) => req<Commande[]>(`/agents/${id}/commandes`),
    stats: (id: string) => req<AgentStats>(`/agents/${id}/stats`),
    activity: (id: string) => req<AgentActivity[]>(`/agents/${id}/activity`),
  },
  colis: {
    list: () => req<Colis[]>("/colis"),
    listPaginated: (params: { search?: string; status?: string; page: number; limit?: number }) =>
      req<PaginatedResponse<Colis>>(`/colis${toQuery(params)}`),
    get: (id: string) => req<Colis>(`/colis/${id}`),
    create: (d: { commande_id: string; weight?: number; dimensions?: string; destination?: string; carrier?: string; photo_url?: string }) =>
      req<Colis>("/colis", { method: "POST", body: JSON.stringify(d) }),
    update: (id: string, d: Partial<Colis> & { description?: string }) =>
      req<Colis>(`/colis/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
    history: (colisId: string) => req<ColisEvent[]>(`/colis/history/${colisId}`),
  },
  produits: {
    list: () => req<Produit[]>("/produits"),
    listPaginated: (params: { search?: string; status?: string; scope?: "mine" | "global"; page: number; limit?: number }) =>
      req<PaginatedResponse<Produit>>(`/produits${toQuery(params)}`),
    get: (id: string) => req<Produit>(`/produits/${id}`),
    create: (d: Partial<Produit>) =>
      req<Produit>("/produits", { method: "POST", body: JSON.stringify(d) }),
    update: (id: string, d: Partial<Produit>) =>
      req<Produit>(`/produits/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
    delete: (id: string) =>
      req<{ message: string }>(`/produits/${id}`, { method: "DELETE" }),
    marketplace: () => req<Produit[]>("/produits/marketplace"),
    getPublic: (id: string) => req<Produit>(`/produits/marketplace/${id}`),
  },
  affiliate: {
    generateLink: (product_id: string) =>
      req<{ link: AffiliateLink; authRefresh: { token: string; user: ApiUser } | null }>("/affiliate/links", {
        method: "POST", body: JSON.stringify({ product_id }),
      }),
    myLinks: () => req<MyAffiliateLink[]>("/affiliate/links/mine"),
    resolve: (code: string) => req<AffiliateResolvedProduct>(`/affiliate/resolve/${code}`),
    agentsSummary: () => req<AgentCommissionSummary[]>("/affiliate/agents/summary"),
    payAgent: (agentId: string) =>
      req<{ paid_count: number; total_paid: number }>(`/affiliate/agents/${agentId}/pay`, { method: "POST" }),
  },
  digimarket: {
    getMe: () => req<DigiMarketProfile | null>("/digimarket/me"),
    create: (d: DigiMarketApplication) =>
      req<DigiMarketProfile>("/digimarket/me", { method: "POST", body: JSON.stringify(d) }),
    update: (d: Partial<DigiMarketApplication>) =>
      req<DigiMarketProfile>("/digimarket/me", { method: "PATCH", body: JSON.stringify(d) }),
    listApplications: (status?: string) =>
      req<DigiMarketProfile[]>(`/digimarket${toQuery({ status })}`),
    updateApplicationStatus: (id: string, status: "active" | "rejected") =>
      req<DigiMarketProfile>(`/digimarket/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  taxes: {
    getRate: () => req<{ rate: number; default_commission_rate: number }>("/taxes/rate"),
    setRate: (d: { rate?: number; default_commission_rate?: number }) =>
      req<{ rate: number; default_commission_rate: number }>("/taxes/rate", { method: "PATCH", body: JSON.stringify(d) }),
    getTransportRates: () => req<TransportOption[]>("/taxes/transport-rates"),
    setTransportRates: (rates: TransportOption[]) =>
      req<TransportOption[]>("/taxes/transport-rates", { method: "PATCH", body: JSON.stringify({ rates }) }),
  },
  users: {
    list: () => req<ApiUser[]>("/users"),
    listPaginated: (params: { search?: string; role?: string; page: number; limit?: number }) =>
      req<PaginatedResponse<ApiUser>>(`/users${toQuery(params)}`),
    updateStatus: (id: string, status: "active" | "suspended") =>
      req<{ message: string }>(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  categories: {
    list: () => req<Category[]>("/categories"),
    listPaginated: (params: { search?: string; page: number; limit?: number }) =>
      req<PaginatedResponse<Category>>(`/categories${toQuery(params)}`),
    create: (name: string) => req<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) }),
    update: (id: string, name: string) =>
      req<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
    delete: (id: string) => req<{ message: string }>(`/categories/${id}`, { method: "DELETE" }),
  },
  activity: {
    list: () => req<ActivityEntry[]>("/activity"),
    listPaginated: (params: { search?: string; type?: string; agent_id?: string; page: number; limit?: number }) =>
      req<PaginatedResponse<ActivityEntry>>(`/activity${toQuery(params)}`),
  },
  courses: {
    list: () => req<Course[]>("/courses"),
    listPaginated: (params: { page: number; limit?: number }) =>
      req<PaginatedResponse<Course>>(`/courses${toQuery(params)}`),
    get: (id: string) => req<CourseDetail>(`/courses/${id}`),
    create: (d: Partial<Course>) => req<Course>("/courses", { method: "POST", body: JSON.stringify(d) }),
    update: (id: string, d: Partial<Course>) =>
      req<Course>(`/courses/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
    delete: (id: string) => req<{ message: string }>(`/courses/${id}`, { method: "DELETE" }),
    addLesson: (courseId: string, d: Partial<Lesson>) =>
      req<Lesson>(`/courses/${courseId}/lessons`, { method: "POST", body: JSON.stringify(d) }),
    updateLesson: (lessonId: string, d: Partial<Lesson>) =>
      req<Lesson>(`/courses/lessons/${lessonId}`, { method: "PATCH", body: JSON.stringify(d) }),
    deleteLesson: (lessonId: string) =>
      req<{ message: string }>(`/courses/lessons/${lessonId}`, { method: "DELETE" }),
    completeLesson: (courseId: string, lessonId: string, quiz_score?: number) =>
      req<{ completed: boolean; certified: boolean }>(`/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: "POST", body: JSON.stringify({ quiz_score }),
      }),
    myCertificates: () => req<Certificate[]>("/courses/certificates/me"),
  },
  notifications: {
    list: () => req<Notification[]>("/notifications"),
    listPaginated: (params: { unread?: boolean; page: number; limit?: number }) =>
      req<PaginatedResponse<Notification>>(
        `/notifications${toQuery({ ...params, unread: params.unread ? "true" : undefined })}`
      ),
    unreadCount: () => req<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) => req<Notification>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => req<{ message: string }>("/notifications/read-all", { method: "PATCH" }),
  },
  clients: {
    listPaginated: (params: { search?: string; page: number; limit?: number }) =>
      req<PaginatedResponse<ClientSummary>>(`/clients${toQuery(params)}`),
    orders: (phone: string) => req<Commande[]>(`/clients/${encodeURIComponent(phone)}/orders`),
  },
};

// ── Types ──────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "agent" | "client";
  status?: "active" | "suspended";
  phone?: string | null;
  created_at?: string;
}

export interface AgentStats {
  clicks: number;
  orders_count: number;
  delivered_count: number;
  commission_due: number;
  commission_paid: number;
}

export interface AgentActivity {
  id: string;
  tracking_number: string;
  product: string;
  status: string;
  price: number;
  commission_amount: number | null;
  commission_paid_at: string | null;
  created_at: string;
}

export interface Commande {
  id: string;
  tracking_number: string;
  client_id?: string | null;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  address_from: string;
  address_to: string;
  package_type: string;
  weight: number;
  volume: number;
  price: number;
  tax: number;
  transport_cost: number;
  product: string;
  quantity: number;
  product_link?: string | null;
  delivery_mode: string;
  city: string;
  notes?: string | null;
  status: string;
  agent_id?: string | null;
  agent_name?: string | null;
  affiliate_link_id?: string | null;
  commission_amount?: number | null;
  estimated_arrival?: string | null;
  created_at: string;
  updated_at: string;
}

// Les champs marqués « privé » ne sont renvoyés qu'à l'admin, l'agent responsable ou le client
// propriétaire connecté — un visiteur anonyme ne voit que statuts, dates, ville, mode et poids.
export interface TrackingRow {
  tracking_number: string;
  client_name?: string; // privé
  address_from?: string; // privé
  address_to?: string; // privé
  package_type: string;
  status: string;
  price?: number; // privé
  tax?: number; // privé
  weight: number;
  volume: number;
  delivery_mode: string;
  city: string;
  order_created_at: string;
  estimated_arrival?: string | null;
  event_status?: string | null;
  event_description?: string | null;
  event_date?: string | null;
  colis_status?: string | null;
  colis_carrier?: string | null;
  colis_destination?: string | null;
  colis_photo_url?: string | null;
}

export interface TrackingEvent {
  id: string;
  commande_id: string;
  status: string;
  description: string;
  changed_by?: string | null;
  changed_by_name?: string | null;
  created_at?: string;
}

export interface Colis {
  id: string;
  commande_id: string;
  tracking_number: string;
  status: string;
  photo_url?: string | null;
  weight: number;
  dimensions?: string | null;
  destination?: string | null;
  carrier?: string | null;
  agent_id?: string | null;
  agent_name?: string | null;
  created_at: string;
  updated_at: string;
  // champs joints depuis la commande liée
  commande_tracking_number: string;
  client_name: string;
  client_phone: string;
  commande_status: string;
}

export interface ColisEvent {
  id: string;
  colis_id: string;
  status: string;
  description: string;
  changed_by?: string | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface Produit {
  id: string;
  user_id: string;
  owner_name: string;
  name: string;
  normalized_name: string;
  description?: string | null;
  category?: string | null;
  default_quantity: number;
  default_price: number;
  product_link?: string | null;
  usage_count: number;
  is_global: boolean;
  stock_quantity: number;
  weight: number;
  dimensions?: string | null;
  tax: number;
  commission_rate?: number | null;
  status: "active" | "hidden";
  main_image_url?: string | null;
  images: string[];
  transport_options: TransportOption[];
  created_at: string;
  updated_at: string;
}

export interface TransportOption {
  mode: string;
  rate_per_kg: number;
  delay_min_days: number;
  delay_max_days: number;
}

export interface AffiliateLink {
  id: string;
  code: string;
  product_id: string;
  agent_id: string;
  clicks: number;
  created_at: string;
}

export interface MyAffiliateLink {
  id: string;
  code: string;
  clicks: number;
  created_at: string;
  product_id: string;
  product_name: string;
  default_price: number;
  main_image_url?: string | null;
  orders_count: number;
  delivered_count: number;
  pending_count: number;
  total_due: number;
  total_paid: number;
}

export interface AgentCommissionSummary {
  agent_id: string;
  full_name: string;
  email: string;
  total_due: number;
  total_paid: number;
}

export interface AffiliateResolvedProduct extends Produit {
  code: string;
  agent_id: string;
}

export interface DigiMarketApplication {
  id_card_url: string;
  id_card_number: string;
  selfie_url: string;
  country: string;
  city: string;
  address: string;
  occupation: string;
  motivation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface DigiMarketProfile extends DigiMarketApplication {
  id: string;
  user_id: string;
  status: "pending" | "active" | "rejected" | "suspended";
  full_name?: string;
  email?: string;
  phone?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  type: "commande" | "colis";
  ref_id: string;
  ref: string;
  status: string;
  description: string;
  created_at: string;
  changed_by_name?: string | null;
  agent_id?: string | null;
  agent_name?: string | null;
}

export interface ClientSummary {
  phone: string;
  name: string;
  orders_count: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
  has_account: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  type: "video" | "pdf" | "quiz";
  content_url: string | null;
  quiz_data: QuizQuestion[] | null;
  position: number;
  created_at: string;
  completed_at?: string | null;
  quiz_score?: number | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_free: boolean;
  price: number;
  status: "draft" | "published";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lesson_count: number;
  completed_count: number;
  certified: boolean;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
}

export interface Certificate {
  id: string;
  issued_at: string;
  course_id: string;
  course_title: string;
}

export interface Notification {
  id: string;
  user_id: string;
  commande_id: string | null;
  tracking_number: string | null;
  title: string;
  message: string;
  status: string;
  is_read: boolean;
  created_at: string;
}

