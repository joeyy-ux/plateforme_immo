
import SuppressionBien from "./dashboard_users/pages/SuppressionBien";

import { Routes, Route, Navigate } from "react-router-dom";
// Authentification pages
import Inscription from "./authentifications/pages/inscription";
import Verification from "./authentifications/pages/verif";
import Connexion from "./authentifications/pages/connexion";
import Oubli from "./authentifications/pages/oubli_mdp";
import Reset from "./authentifications/pages/reset_mdp";
import Confirmation from "./authentifications/pages/confirmation";
import Home from "./Home"; // Ajout de la page d'accueil
import DashboardLayout from "./dashboard_users/layout/dashboardLayout";
import Accueil from "./dashboard_users/pages/accueil";
import ProfilAgence from "./dashboard_users/pages/profilAgence";
import ProfilDemarcheur from "./dashboard_users/pages/profilDemarcheur";
import ProfilProprio from "./dashboard_users/pages/profilProprio";
import PublierAnnonce from "./dashboard_users/pages/publieForm";
import MesAnnonces from "./dashboard_users/pages/MesAnnonces";
import AnnonceDetail from "./dashboard_users/pages/AnnonceDetail";
import Parametres from "./dashboard_users/pages/Parametres";
import Historique from "./dashboard_users/pages/Historique";
import HistoriqueDetail from "./dashboard_users/pages/HistoriqueDetail";
import ModifierBien from "./dashboard_users/pages/ModifierBien";
import Contrat from "./dashboard_users/pages/contrat";
import Notifications from "./dashboard_users/pages/Notifications";
import Rejoindre from "./rejoindre_plateforme";

// Admin dashboard
import AdminLayout from "./dashboard_admin/layout/adminLayout";
import AccueilAdmin from "./dashboard_admin/pages/Accueil";
import InscriptionsIncompletes from "./dashboard_admin/pages/InscriptionsIncompletes";
import UtilisateursEnAttente from "./dashboard_admin/pages/UtilisateursEnAttente";
import UtilisateursActifs from "./dashboard_admin/pages/UtilisateursActifs";
import UtilisateurDetail from "./dashboard_admin/pages/UtilisateurDetail";
import GestionBiens from "./dashboard_admin/pages/GestionBiens";
import GestionBienDetail from "./dashboard_admin/pages/GestionBienDetail";
import DemandesVisite from "./dashboard_admin/pages/DemandesVisite";
import Transactions from "./dashboard_admin/pages/Transactions";

// Pages de complétion de profil (si tu as une page dédiée)
// import CompleterProfil from "./dashboard_users/pages/completerProfil";


function App() {
  return (
    <Routes>
      {/* Page d'accueil par défaut */}
      <Route path="/" element={<Home />} />
      <Route path="/rejoindre" element={<Rejoindre />} />
      {/* --- Authentification --- */}
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/verif" element={<Verification />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/oubli_mdp" element={<Oubli />} />
      <Route path="/reset_mdp" element={<Reset />} />
      <Route path="/confirmation" element={<Confirmation />} />

      {/* --- Dashboard (routes imbriquées) --- */}
      <Route path="/dashboard" element={<DashboardLayout />}> 
        <Route index element={<Accueil />} />
        <Route path="accueil" element={<Accueil />} />
          <Route path="annonces" element={<MesAnnonces />} />
          <Route path="annonces/:id" element={<AnnonceDetail />} />
          <Route path="annonces/:id/modifier" element={<ModifierBien />} />
          <Route path="annonces/:id/supprimer" element={<SuppressionBien />} />
          <Route path="historique_annonce" element={<Historique />} />
          <Route path="historique_annonce/:id" element={<HistoriqueDetail />} />
          
          <Route path="publie_annonce" element={<PublierAnnonce />} />
          <Route path="notification" element={<Notifications />} />
          
          <Route path="parametre" element={<Parametres />} />
          <Route path="contrat" element={<Contrat />} />
          {/* autres routes dashboard/* ici si nécessaire */}
      </Route>
      {/* import AnnonceDetail déplacé en haut du fichier */}
      <Route path="/profil_agence" element={<ProfilAgence />} />
      <Route path="/profil_demarcheur" element={<ProfilDemarcheur />} />
      <Route path="/profil_proprio" element={<ProfilProprio />} />
      {/* <Route path="/completer_profil" element={<CompleterProfil />} /> */}

      {/* --- Redirection par défaut vers la connexion --- */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AccueilAdmin />} />
        <Route path="accueil" element={<AccueilAdmin />} />
        <Route path="inscriptions-incompletes" element={<InscriptionsIncompletes />} />
        <Route path="utilisateurs-en-attente" element={<UtilisateursEnAttente />} />
        <Route path="utilisateurs-actifs" element={<UtilisateursActifs />} />
        <Route path="utilisateur/:id" element={<UtilisateurDetail />} />
        <Route path="gestion-biens" element={<GestionBiens />} />
        <Route path="gestion-biens/:id" element={<GestionBienDetail />} />
        <Route path="demandes-visite" element={<DemandesVisite />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
