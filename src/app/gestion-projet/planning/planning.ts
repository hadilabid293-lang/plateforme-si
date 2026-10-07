import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Projet {
  id: number;
  nom: string;
}

interface PlanningItem {
  id: number;
  projet_id: number;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  responsable: string;
  projet_nom: string;
}

@Component({
  selector: 'app-planning',
  imports: [FormsModule],
  templateUrl: './planning.html',
  styleUrl: './planning.css'
})
export class Planning implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  showForm = false;
  modeModification = false;
  planningOriginalId = 0;

  projetId = 0;
  titre = '';
  description = '';
  dateDebut = '';
  dateFin = '';
  statut = 'Planifié';
  responsable = '';

  recherche = '';
  filtreStatut = 'Tous';

  projets: Projet[] = [];
  plannings: PlanningItem[] = [];

  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {
    this.chargerDonnees();
  }

  async chargerDonnees(): Promise<void> {
    await this.chargerProjets();
    await this.chargerPlannings();

    this.cdr.markForCheck();
  }

  // =========================
  // PROJETS
  // =========================

  async chargerProjets(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('projets')
        .select('id, nom')
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement projets :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.projets = data ?? [];

    console.log('📋 Projets chargés :', this.projets);

    this.cdr.markForCheck();
  }

  // =========================
  // PLANNINGS
  // =========================

  async chargerPlannings(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('planifications')
        .select('*')
        .order('date_debut', { ascending: true })
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement plannings :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.plannings = (data ?? []).map((p: any) => {

      const projet = this.projets.find(
        projetItem => projetItem.id === p.projet_id
      );

      return {
        id: p.id,
        projet_id: p.projet_id,
        titre: p.titre,
        description: p.description ?? '',
        date_debut: p.date_debut,
        date_fin: p.date_fin,
        statut: p.statut,
        responsable: p.responsable ?? '',
        projet_nom: projet?.nom ?? 'Inconnu'
      };
    });

    console.log('📅 Plannings chargés :', this.plannings);

    this.cdr.markForCheck();
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.planningOriginalId = 0;

    this.projetId = 0;
    this.titre = '';
    this.description = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.statut = 'Planifié';
    this.responsable = '';

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.planningOriginalId = 0;

    this.projetId = 0;
    this.titre = '';
    this.description = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.statut = 'Planifié';
    this.responsable = '';

    this.cdr.markForCheck();
  }

  // =========================
  // AJOUTER / MODIFIER
  // =========================

  async enregistrerPlanning(): Promise<void> {

    if (
      !this.projetId ||
      !this.titre.trim() ||
      !this.dateDebut ||
      !this.dateFin
    ) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (this.dateFin < this.dateDebut) {
      alert(
        'La date de fin doit être supérieure ou égale à la date de début.'
      );
      return;
    }

    const donnees = {
      projet_id: this.projetId,
      titre: this.titre.trim(),
      description: this.description.trim(),
      date_debut: this.dateDebut,
      date_fin: this.dateFin,
      statut: this.statut,
      responsable: this.responsable.trim()
    };

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('planifications')
          .update(donnees)
          .eq('id', this.planningOriginalId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Planning modifié avec succès.');

    } else {

      // =========================
      // AJOUT
      // =========================

      const { error } =
        await this.supabaseService.supabase
          .from('planifications')
          .insert(donnees);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Planning ajouté avec succès.');
    }

    await this.chargerPlannings();

    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER
  // =========================

  modifierPlanning(planning: PlanningItem): void {

    this.modeModification = true;
    this.showForm = true;

    this.planningOriginalId = planning.id;

    this.projetId = planning.projet_id;
    this.titre = planning.titre ?? '';
    this.description = planning.description ?? '';
    this.dateDebut = planning.date_debut ?? '';
    this.dateFin = planning.date_fin ?? '';
    this.statut = planning.statut ?? 'Planifié';
    this.responsable = planning.responsable ?? '';

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerPlanning(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer ce planning ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('planifications')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Planning supprimé avec succès.');

    await this.chargerPlannings();

    this.cdr.markForCheck();
  }

  // =========================
  // FILTRE
  // =========================

  get planningsFiltres(): PlanningItem[] {

    const recherche = this.recherche
      .toLowerCase()
      .trim();

    return this.plannings.filter((planning) => {

      const correspondRecherche =
        (planning.titre ?? '')
          .toLowerCase()
          .includes(recherche) ||

        (planning.description ?? '')
          .toLowerCase()
          .includes(recherche) ||

        (planning.projet_nom ?? '')
          .toLowerCase()
          .includes(recherche) ||

        (planning.responsable ?? '')
          .toLowerCase()
          .includes(recherche);

      const correspondStatut =
        this.filtreStatut === 'Tous' ||
        planning.statut === this.filtreStatut;

      return correspondRecherche && correspondStatut;
    });
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalPlannings(): number {
    return this.plannings.length;
  }

  get planningsPlanifies(): number {
    return this.plannings.filter(
      planning => planning.statut === 'Planifié'
    ).length;
  }

  get planningsEnCours(): number {
    return this.plannings.filter(
      planning => planning.statut === 'En cours'
    ).length;
  }

  get planningsTermines(): number {
    return this.plannings.filter(
      planning => planning.statut === 'Terminé'
    ).length;
  }
}
