import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: string;
  statut: string;
  derniereConnexion: string;
}

@Component({
  selector: 'app-administration',
  imports: [FormsModule],
  templateUrl: './administration.html',
  styleUrl: './administration.css'
})
export class Administration implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // FORMULAIRE
  // =========================

  showForm = false;
  modeModification = false;
  utilisateurOriginalId = 0;

  nom = '';
  email = '';
  role = 'Utilisateur';
  statut = 'Actif';

  // =========================
  // RECHERCHE / FILTRE
  // =========================

  recherche = '';
  filtreRole = 'Tous';
  filtreStatut = 'Tous';

  // =========================
  // LISTE DES UTILISATEURS
  // =========================

  utilisateurs: Utilisateur[] = [];

  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {
    this.chargerUtilisateurs();
  }

  // =========================
  // CHARGER UTILISATEURS
  // =========================

  async chargerUtilisateurs(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('administration')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement utilisateurs :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.utilisateurs = (data ?? []).map((utilisateur: any) => ({
      id: utilisateur.id,
      nom: utilisateur.parametre ?? '',
      email: utilisateur.valeur ?? '',
      role: utilisateur.description ?? 'Utilisateur',
      statut: utilisateur.statut ?? 'Actif',
      derniereConnexion: 'Jamais'
    }));

    console.log('Utilisateurs chargés :', this.utilisateurs);

    // Important avec Angular 22 zoneless
    this.cdr.markForCheck();
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.utilisateurOriginalId = 0;

    this.nom = '';
    this.email = '';
    this.role = 'Utilisateur';
    this.statut = 'Actif';

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.utilisateurOriginalId = 0;

    this.nom = '';
    this.email = '';
    this.role = 'Utilisateur';
    this.statut = 'Actif';

    this.cdr.markForCheck();
  }

  // =========================
  // ENREGISTRER
  // =========================

  async enregistrerUtilisateur(): Promise<void> {

    if (
      !this.nom.trim() ||
      !this.email.trim() ||
      !this.role ||
      !this.statut
    ) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const donnees = {
      parametre: this.nom.trim(),
      valeur: this.email.trim(),
      description: this.role,
      statut: this.statut
    };

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('administration')
          .update(donnees)
          .eq('id', this.utilisateurOriginalId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Utilisateur modifié avec succès.');

    }

    // =========================
    // AJOUT
    // =========================

    else {

      const { error } =
        await this.supabaseService.supabase
          .from('administration')
          .insert(donnees);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Utilisateur ajouté avec succès.');
    }

    await this.chargerUtilisateurs();

    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER
  // =========================

  modifierUtilisateur(utilisateur: Utilisateur): void {

    this.modeModification = true;
    this.showForm = true;

    this.utilisateurOriginalId = utilisateur.id;

    this.nom = utilisateur.nom;
    this.email = utilisateur.email;
    this.role = utilisateur.role;
    this.statut = utilisateur.statut;

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerUtilisateur(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer cet utilisateur ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('administration')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Utilisateur supprimé avec succès.');

    await this.chargerUtilisateurs();

    this.cdr.markForCheck();
  }

  // =========================
  // FILTRER
  // =========================

  get utilisateursFiltres(): Utilisateur[] {

    const recherche = this.recherche.toLowerCase().trim();

    return this.utilisateurs.filter((utilisateur) => {

      const correspondRecherche =
        utilisateur.nom.toLowerCase().includes(recherche) ||
        utilisateur.email.toLowerCase().includes(recherche);

      const correspondRole =
        this.filtreRole === 'Tous' ||
        utilisateur.role === this.filtreRole;

      const correspondStatut =
        this.filtreStatut === 'Tous' ||
        utilisateur.statut === this.filtreStatut;

      return (
        correspondRecherche &&
        correspondRole &&
        correspondStatut
      );
    });
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalUtilisateurs(): number {
    return this.utilisateurs.length;
  }

  get utilisateursActifs(): number {
    return this.utilisateurs.filter(
      utilisateur => utilisateur.statut === 'Actif'
    ).length;
  }

  get utilisateursInactifs(): number {
    return this.utilisateurs.filter(
      utilisateur => utilisateur.statut === 'Inactif'
    ).length;
  }

  get administrateurs(): number {
    return this.utilisateurs.filter(
      utilisateur => utilisateur.role === 'Administrateur'
    ).length;
  }
}