import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function OrdersColisTabs({ active }: { active: "orders" | "colis" }) {
  const tabClass = (tab: "orders" | "colis") => cn(
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
    active === tab ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
  );
  return (
    <div className="flex gap-2">
      <Link to="/orders" className={tabClass("orders")}>Commandes</Link>
      <Link to="/colis" className={tabClass("colis")}>Colis</Link>
    </div>
  );
}
