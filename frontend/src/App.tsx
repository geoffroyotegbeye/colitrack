import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { RequireAuth } from "@/components/ProtectedRoute";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { NotificationSocket } from "@/components/NotificationSocket";
import Index from "./pages/Index";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import NewOrderPage from "./pages/NewOrderPage";
import TrackingPage from "./pages/TrackingPage";
import MarketplacePage from "./pages/MarketplacePage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import AffiliationPage from "./pages/AffiliationPage";
import DigiMarketProfilePage from "./pages/DigiMarketProfilePage";
import ProfilePage from "./pages/ProfilePage";
import PaymentsPage from "./pages/PaymentsPage";
import AgentsPage from "./pages/AgentsPage";
import AgentApplicationsPage from "./pages/AgentApplicationsPage";
import StatsPage from "./pages/StatsPage";
import ProcessPage from "./pages/ProcessPage";
import TermsPage from "./pages/TermsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import ColisPage from "./pages/ColisPage";
import ColisDetailPage from "./pages/ColisDetailPage";
import ProductsPage from "./pages/ProductsPage";
import TaxesPage from "./pages/TaxesPage";
import UsersPage from "./pages/UsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import ClientsPage from "./pages/ClientsPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import NotificationsPage from "./pages/NotificationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PwaInstallPrompt />
      <BrowserRouter>
        <AuthProvider>
          <NotificationSocket />
          <CartProvider>
            <Routes>
              {/* ───────── Routes PUBLIQUES (liste blanche — seules pages accessibles sans connexion) ───────── */}
              {/* Authentification */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {/* Boutique publique + commande sans compte */}
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/produit/:id" element={<ProductPage />} />
              <Route path="/p/:code" element={<ProductPage />} />
              <Route path="/panier" element={<CartPage />} />
              {/* Suivi public (statuts/dates seulement) + pages d'information */}
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/terms" element={<TermsPage />} />
              {/* Accueil public */}
              <Route path="/" element={<TrackingPage />} />

              {/* ───────── Tout le reste exige une connexion (verrouillé par défaut) ───────── */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Index />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/new" element={<NewOrderPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/demandes-agents" element={<AgentApplicationsPage />} />
                <Route path="/colis" element={<ColisPage />} />
                <Route path="/colis/:id" element={<ColisDetailPage />} />
                <Route path="/produits" element={<ProductsPage />} />
                <Route path="/taxes" element={<TaxesPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/activity" element={<ActivityLogPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/formation" element={<CoursesPage />} />
                <Route path="/formation/:id" element={<CourseDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/affiliation" element={<AffiliationPage />} />
                <Route path="/digimarket" element={<DigiMarketProfilePage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
