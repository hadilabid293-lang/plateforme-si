import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Role {
  id: number;
  nom: string;
  description: string;
  utilisateurs: number;
  statut: string;
}

@Component({
  selector: 'app-roles',
  imports: [FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class Roles implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // FORMULAIRE
  // =========================

  showForm = false;
  modeModification = false;
  roleOriginalId = 0;

  nom = '';
  description = '';
  statut = 'Actif';

  // =========================
  // RECHERCHE / FILTRE
  // =========================

  recherche = '';
  filtreStatut = 'Tous';

  // =========================
  // LISTE DES RÔLES
  // =========================

  roles: Role[] = [];

  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {
    this.chargerRoles();
  }

  // =========================
  // CHARGER LES RÔLES
  // =========================

  async chargerRoles(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('roles')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement rôles :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    const { data: utilisateurs, error: erreurUtilisateurs } =
      await this.supabaseService.supabase
        .from('administration')
        .select('description');

    if (erreurUtilisateurs) {
      console.error(
        'Erreur chargement utilisateurs :',
        erreurUtilisateurs
      );

      alert(
        'Erreur Supabase : ' +
        erreurUtilisateurs.message
      );

      return;
    }

    // =========================
    // COMPTER LES UTILISATEURS
    // PAR RÔLE
    // =========================

    const compteUtilisateurs: {
      [role: string]: number
    } = {};

    (utilisateurs ?? []).forEach((utilisateur: any) => {

      const role =
        utilisateur.description ?? 'Utilisateur';

      compteUtilisateurs[role] =
        (compteUtilisateurs[role] ?? 0) + 1;
    });

    // =========================
    // ASSOCIER LE NOMBRE
    // D'UTILISATEURS À CHAQUE RÔLE
    // =========================

    this.roles = (data ?? []).map((role: any) => ({

      id: role.id,

      nom: role.nom ?? '',

      description: role.description ?? '',

      statut: role.statut ?? 'Actif',

      utilisateurs:
        compteUtilisateurs[role.nom] ?? 0

    }));

    console.log('Rôles chargés :', this.roles);

    // Important avec Angular 22 zoneless
    this.cdr.markForCheck();
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.roleOriginalId = 0;

    this.nom = '';
    this.description = '';
    this.statut = 'Actif';

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.roleOriginalId = 0;

    this.nom = '';
    this.description = '';
    this.statut = 'Actif';

    this.cdr.markForCheck();
  }

  // =========================
  // ENREGISTRER
  // =========================

  async enregistrerRole(): Promise<void> {

    if (
      !this.nom.trim() ||
      !this.statut
    ) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    const donnees = {
      nom: this.nom.trim(),
      description: this.description.trim(),
      statut: this.statut
    };

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('roles')
          .update(donnees)
          .eq('id', this.roleOriginalId);

      if (error) {

        console.error('Erreur modification :', error);

        alert(
          'Erreur Supabase : ' +
          error.message
        );

        return;
      }

      alert('Rôle modifié avec succès.');
    }

    // =========================
    // AJOUT
    // =========================

    else {

      const { error } =
        await this.supabaseService.supabase
          .from('roles')
          .insert(donnees);

      if (error) {

        console.error('Erreur ajout :', error);

        alert(
          'Erreur Supabase : ' +
          error.message
        );

        return;
      }

      alert('Rôle ajouté avec succès.');
    }

    await this.chargerRoles();

    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER
  // =========================

  modifierRole(role: Role): void {

    this.modeModification = true;
    this.showForm = true;

    this.roleOriginalId = role.id;

    this.nom = role.nom;
    this.description = role.description;
    this.statut = role.statut;

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerRole(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer ce rôle ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('roles')
        .delete()
        .eq('id', id);

    if (error) {

      console.error('Erreur suppression :', error);

      alert(
        'Erreur Supabase : ' +
        error.message
      );

      return;
    }

    alert('Rôle supprimé avec succès.');

    await this.chargerRoles();

    this.cdr.markForCheck();
  }

  // =========================
  // FILTRER
  // =========================

  get rolesFiltres(): Role[] {

    const recherche =
      this.recherche.toLowerCase().trim();

    return this.roles.filter((role) => {

      const correspondRecherche =
        role.nom.toLowerCase().includes(recherche) ||
        role.description.toLowerCase().includes(recherche);

      const correspondStatut =
        this.filtreStatut === 'Tous' ||
        role.statut === this.filtreStatut;

      return (
        correspondRecherche &&
        correspondStatut
      );
    });
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalRoles(): number {
    return this.roles.length;
  }

  get rolesActifs(): number {
    return this.roles.filter(
      role => role.statut === 'Actif'
    ).length;
  }

  get rolesInactifs(): number {
    return this.roles.filter(
      role => role.statut === 'Inactif'
    ).length;
  }

  get totalUtilisateurs(): number {
    return this.roles.reduce(
      (total, role) => total + role.utilisateurs,
      0
    );
  }
}