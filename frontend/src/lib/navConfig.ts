import {
  LayoutDashboard, Package, Users, BarChart3, ShoppingBag,
  Boxes, Tag, Percent, UserCog, History, Contact, GraduationCap, Link as LinkIcon, IdCard, type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  icon: LucideIcon;
  href: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export const isNavGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

export const adminNav: NavEntry[] = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Commandes", icon: Package, href: "/orders" },
  {
    label: "Catalogue", icon: Tag, items: [
      { label: "Produits", icon: Tag, href: "/produits" },
      { label: "Catégories", icon: Tag, href: "/categories" },
      { label: "Taxes & Commission", icon: Percent, href: "/taxes" },
    ],
  },
  {
    label: "Équipe", icon: Users, items: [
      { label: "Agents", icon: Users, href: "/agents" },
      { label: "Demandes", icon: IdCard, href: "/demandes-agents" },
      { label: "Clients", icon: Contact, href: "/clients" },
      { label: "Utilisateurs", icon: UserCog, href: "/users" },
    ],
  },
  {
    label: "Analytics", icon: BarChart3, items: [
      { label: "Statistiques", icon: BarChart3, href: "/stats" },
      { label: "Journal d'activité", icon: History, href: "/activity" },
    ],
  },
  { label: "Formation", icon: GraduationCap, href: "/formation" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Mes affiliations", icon: LinkIcon, href: "/affiliation" },
];

export const agentNav: NavEntry[] = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Commandes", icon: Package, href: "/orders" },
  { label: "Produits", icon: Tag, href: "/produits" },
  { label: "Clients", icon: Contact, href: "/clients" },
  { label: "Statistiques", icon: BarChart3, href: "/stats" },
  { label: "Formation", icon: GraduationCap, href: "/formation" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Mes affiliations", icon: LinkIcon, href: "/affiliation" },
];

export const clientNav: NavEntry[] = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Mes commandes", icon: Package, href: "/orders" },
  { label: "Mes colis", icon: Boxes, href: "/colis" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Devenir agent", icon: IdCard, href: "/digimarket" },
];

export function navFor(isAdmin: boolean, isAgent: boolean): NavEntry[] {
  return isAdmin ? adminNav : isAgent ? agentNav : clientNav;
}

/** Libellé de la page courante pour la navbar, à partir du chemin. */
export function pageTitleFor(pathname: string, entries: NavEntry[]): string {
  for (const entry of entries) {
    if (isNavGroup(entry)) {
      const match = entry.items.find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)));
      if (match) return match.label;
    } else if (pathname === entry.href || (entry.href !== "/dashboard" && entry.href !== "/tracking" && pathname.startsWith(entry.href))) {
      return entry.label;
    }
  }
  return "ColiTrack";
}
