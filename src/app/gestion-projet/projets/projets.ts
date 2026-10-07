import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Projet {
  id: number;
  nom: string;
  description?: string;
  responsable: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  progression: number;
  statut: string;
}

@Component({
  selector: 'app-projets',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './projets.html',
  styleUrl: './projets.css'
})
export class Projets implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  showForm = false;
  modeModification = false;
  projetOriginalId = 0;

  nom = '';
  description = '';
  responsable = '';
  dateDebut = '';
  dateFin = '';
  budget: number | null = null;
  progression: number | null = 0;
  statut = 'En cours';

  recherche = '';
  filtreStatut = 'Tous';

  projets: Projet[] = [];

  ngOnInit(): void {
    this.chargerProjets();
  }

  // =========================
  // CHARGER LES PROJETS
  // =========================

  async chargerProjets(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('projets')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement projets :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.projets = (data ?? []).map((projet: any) => ({
      id: projet.id,
      nom: projet.nom,
      description: projet.description ?? '',
      responsable: projet.responsable ?? '',
      dateDebut: projet.date_debut,
      dateFin: projet.date_fin ?? '',
      budget: Number(projet.budget ?? 0),
      progression: Number(projet.progression ?? 0),
      statut: projet.statut
    }));

    console.log('📋 Projets chargés :', this.projets);

    // Important avec Angular 22
    this.cdr.markForCheck();
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.projetOriginalId = 0;

    this.nom = '';
    this.description = '';
    this.responsable = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.budget = null;
    this.progression = 0;
    this.statut = 'En cours';

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.projetOriginalId = 0;

    this.cdr.markForCheck();
  }

  // =========================
  // AJOUTER / MODIFIER
  // =========================

  async enregistrerProjet(): Promise<void> {

    if (
      !this.nom.trim() ||
      !this.responsable.trim() ||
      !this.dateDebut ||
      !this.dateFin ||
      this.budget === null
    ) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    if (this.dateFin < this.dateDebut) {
      alert(
        'La date de fin doit être après la date de début.'
      );
      return;
    }

    if (
      this.budget < 0 ||
      this.progression === null ||
      this.progression < 0 ||
      this.progression > 100
    ) {
      alert(
        'Veuillez vérifier le budget et la progression.'
      );
      return;
    }

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('projets')
          .update({
            nom: this.nom.trim(),
            description: this.description.trim(),
            responsable: this.responsable.trim(),
            date_debut: this.dateDebut,
            date_fin: this.dateFin,
            budget: this.budget,
            progression: this.progression,
            statut: this.statut
          })
          .eq('id', this.projetOriginalId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Projet modifié avec succès.');

    } else {

      // =========================
      // AJOUT
      // =========================

      const nouveauProjet = {
        nom: this.nom.trim(),
        description: this.description.trim(),
        responsable: this.responsable.trim(),
        date_debut: this.dateDebut,
        date_fin: this.dateFin,
        budget: this.budget,
        progression: this.progression ?? 0,
        statut: this.statut
      };

      const { error } =
        await this.supabaseService.supabase
          .from('projets')
          .insert(nouveauProjet);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Projet ajouté avec succès.');
    }

    await this.chargerProjets();

    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER UN PROJET
  // =========================

  modifierProjet(projet: Projet): void {

    this.modeModification = true;
    this.showForm = true;

    this.projetOriginalId = projet.id;

    this.nom = projet.nom;
    this.description = projet.description ?? '';
    this.responsable = projet.responsable;
    this.dateDebut = projet.dateDebut;
    this.dateFin = projet.dateFin;
    this.budget = projet.budget;
    this.progression = projet.progression;
    this.statut = projet.statut;

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerProjet(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer ce projet ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('projets')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Projet supprimé avec succès.');

    await this.chargerProjets();

    this.cdr.markForCheck();
  }

  // =========================
  // FILTRAGE
  // =========================

  get projetsFiltres(): Projet[] {

    const recherche = this.recherche
      .toLowerCase()
      .trim();

    return this.projets.filter(projet => {

      const correspondRecherche =
        projet.nom
          .toLowerCase()
          .includes(recherche) ||
        projet.responsable
          .toLowerCase()
          .includes(recherche);

      const correspondStatut =
        this.filtreStatut === 'Tous' ||
        projet.statut === this.filtreStatut;

      return correspondRecherche && correspondStatut;
    });
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalProjets(): number {
    return this.projets.length;
  }

  get projetsEnCours(): number {
    return this.projets.filter(
      projet => projet.statut === 'En cours'
    ).length;
  }

  get projetsTermines(): number {
    return this.projets.filter(
      projet => projet.statut === 'Terminé'
    ).length;
  }

  get budgetTotal(): number {
    return this.projets.reduce(
      (total, projet) => total + projet.budget,
      0
    );
  }

  get progressionMoyenne(): number {

    if (this.projets.length === 0) {
      return 0;
    }

    const total = this.projets.reduce(
      (somme, projet) => somme + projet.progression,
      0
    );

    return Math.round(
      total / this.projets.length
    );
  }
}
