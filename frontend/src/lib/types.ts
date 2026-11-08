// Doit rester synchronisé avec le CHECK constraint de commandes.status (backend/database.sql)
export type OrderStatus =
  | "registered"
  | "validated"
  | "purchased"
  | "in_china"
  | "shipped"
  | "in_transit"
  | "arrived_benin"
  | "delivering"
  | "delivered"
  | "refused";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  registered: "Commande enregistrée",
  validated: "Commande confirmée",
  purchased: "Achat effectué",
  in_china: "En Chine / en préparation",
  shipped: "Expédié depuis la Chine",
  in_transit: "En transit vers le Bénin",
  arrived_benin: "Arrivé au Bénin",
  delivering: "En cours de livraison",
  delivered: "Colis livré",
  refused: "Commande refusée",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  registered: "bg-info text-info-foreground",
  validated: "bg-success text-success-foreground",
  purchased: "bg-accent text-accent-foreground",
  in_china: "bg-accent text-accent-foreground",
  shipped: "bg-accent text-accent-foreground",
  in_transit: "bg-info text-info-foreground",
  arrived_benin: "bg-success text-success-foreground",
  delivering: "bg-warning text-warning-foreground",
  delivered: "bg-success text-success-foreground",
  refused: "bg-destructive text-destructive-foreground",
};

// Doit rester synchronisé avec le CHECK constraint de colis.status (backend/database.sql)
export type ColisStatus =
  | "recu"
  | "en_attente"
  | "emballe"
  | "en_transit"
  | "arrive_agence"
  | "en_livraison"
  | "livre"
  | "retourne"
  | "perdu";

export const COLIS_STATUS_LABELS: Record<ColisStatus, string> = {
  recu: "Reçu",
  en_attente: "En attente",
  emballe: "Emballé",
  en_transit: "En transit",
  arrive_agence: "Arrivé en agence",
  en_livraison: "En cours de livraison",
  livre: "Livré",
  retourne: "Retourné",
  perdu: "Perdu",
};

export const COLIS_STATUS_COLORS: Record<ColisStatus, string> = {
  recu: "bg-info text-info-foreground",
  en_attente: "bg-warning text-warning-foreground",
  emballe: "bg-accent text-accent-foreground",
  en_transit: "bg-info text-info-foreground",
  arrive_agence: "bg-success text-success-foreground",
  en_livraison: "bg-warning text-warning-foreground",
  livre: "bg-success text-success-foreground",
  retourne: "bg-destructive text-destructive-foreground",
  perdu: "bg-destructive text-destructive-foreground",
};

export type PackageType = "document" | "small" | "medium" | "large" | "fragile" | "special";

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  document: "Document",
  small: "Petit colis",
  medium: "Colis moyen",
  large: "Grand colis",
  fragile: "Fragile",
  special: "Spécial",
};

export const DELIVERY_MODES: Record<string, string> = {
  standard: "Standard",
  express: "Express",
  maritime: "Maritime",
  aerien: "Aérien",
};

export const PAYMENT_METHODS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
  card: "Carte bancaire",
};

export interface Order {
  id: string;
  trackingNumber: string;
  clientName: string;
  clientPhone: string;
  addressFrom: string;
  addressTo: string;
  packageType: PackageType;
  weight: number;
  volume: number;
  price: number;
  tax: number;
  status: OrderStatus;
  agentId?: string;
  agentName?: string;
  product: string;
  quantity: number;
  productLink?: string;
  deliveryMode: string;
  city: string;
  estimatedArrival?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  description: string;
  timestamp: string;
  changedByName?: string | null;
}

export type UserRole = "admin" | "agent" | "client";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}
