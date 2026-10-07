import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Employe {
  id: number;
  nom: string;
  prenom: string;
}

interface Projet {
  id: number;
  nom: string;
}

interface Affectation {
  id: number;
  employe_id: number;
  projet_id: number;
  role: string;
  date_affectation: string;
  taux_affectation: number;
  employe_nom: string;
  employe_prenom: string;
  projet_nom: string;
}

@Component({
  selector: 'app-affectations',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './affectations.html',
  styleUrl: './affectations.css'
})
export class Affectations implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // FORMULAIRE
  // =========================

  showForm = false;
  modeModification = false;
  affectationOriginalId = 0;

  employeId = 0;
  projetId = 0;
  role = '';
  dateAffectation = '';
  tauxAffectation: number | null = 100;

  // =========================
  // RECHERCHE ET FILTRE
  // =========================

  recherche = '';
  filtreProjet = 'Tous';

  // =========================
  // DONNEES
  // =========================

  employes: Employe[] = [];
  projets: Projet[] = [];
  affectations: Affectation[] = [];

  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {
    this.chargerDonnees();
  }

  async chargerDonnees(): Promise<void> {
    await this.chargerEmployes();
    await this.chargerProjets();
    await this.chargerAffectations();

    this.cdr.markForCheck();
  }

  // =========================
  // EMPLOYES
  // =========================

  async chargerEmployes(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('employes')
        .select('id, nom, prenom')
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement employés :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.employes = data ?? [];

    console.log('👥 Employés chargés :', this.employes);

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
  // AFFECTATIONS
  // =========================

  async chargerAffectations(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('affectations')
        .select('*')
        .order('date_affectation', { ascending: false })
        .order('id', { ascending: false });

    if (error) {
      console.error('Erreur chargement affectations :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.affectations = (data ?? []).map((affectation: any) => {

      const employe = this.employes.find(
        e => e.id === affectation.employe_id
      );

      const projet = this.projets.find(
        p => p.id === affectation.projet_id
      );

      return {
        ...affectation,
        employe_nom: employe?.nom ?? 'Inconnu',
        employe_prenom: employe?.prenom ?? '',
        projet_nom: projet?.nom ?? 'Inconnu'
      };
    });

    console.log('🔗 Affectations chargées :', this.affectations);

    this.cdr.markForCheck();
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.affectationOriginalId = 0;

    this.employeId = 0;
    this.projetId = 0;
    this.role = '';

    this.dateAffectation =
      new Date().toISOString().split('T')[0];

    this.tauxAffectation = 100;

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.affectationOriginalId = 0;

    this.employeId = 0;
    this.projetId = 0;
    this.role = '';
    this.dateAffectation = '';
    this.tauxAffectation = 100;

    this.cdr.markForCheck();
  }

  // =========================
  // AJOUTER / MODIFIER
  // =========================

  async enregistrerAffectation(): Promise<void> {

    if (
      this.employeId === 0 ||
      this.projetId === 0 ||
      !this.dateAffectation
    ) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (
      this.tauxAffectation === null ||
      this.tauxAffectation < 0 ||
      this.tauxAffectation > 100
    ) {
      alert(
        'Le taux d’affectation doit être compris entre 0 et 100.'
      );
      return;
    }

    const donnees = {
      employe_id: this.employeId,
      projet_id: this.projetId,
      role: this.role.trim(),
      date_affectation: this.dateAffectation,
      taux_affectation: this.tauxAffectation
    };

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('affectations')
          .update(donnees)
          .eq('id', this.affectationOriginalId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Affectation modifiée avec succès.');

    } else {

      // =========================
      // AJOUT
      // =========================

      const { error } =
        await this.supabaseService.supabase
          .from('affectations')
          .insert(donnees);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Affectation ajoutée avec succès.');
    }

    await this.chargerAffectations();

    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER
  // =========================

  modifierAffectation(affectation: Affectation): void {

    this.modeModification = true;
    this.showForm = true;

    this.affectationOriginalId = affectation.id;
    this.employeId = affectation.employe_id;
    this.projetId = affectation.projet_id;
    this.role = affectation.role ?? '';
    this.dateAffectation =
      affectation.date_affectation ?? '';
    this.tauxAffectation =
      affectation.taux_affectation ?? 100;

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerAffectation(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer cette affectation ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('affectations')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Affectation supprimée avec succès.');

    await this.chargerAffectations();

    this.cdr.markForCheck();
  }

  // =========================
  // FILTRE
  // =========================

  get affectationsFiltrees(): Affectation[] {

    const recherche =
      this.recherche.toLowerCase().trim();

    return this.affectations.filter((affectation) => {

      const correspondRecherche =
        recherche === '' ||
        (affectation.employe_nom ?? '')
          .toLowerCase()
          .includes(recherche) ||
        (affectation.employe_prenom ?? '')
          .toLowerCase()
          .includes(recherche) ||
        (affectation.projet_nom ?? '')
          .toLowerCase()
          .includes(recherche) ||
        (affectation.role ?? '')
          .toLowerCase()
          .includes(recherche);

      const correspondProjet =
        this.filtreProjet === 'Tous' ||
        affectation.projet_nom === this.filtreProjet;

      return correspondRecherche && correspondProjet;
    });
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalAffectations(): number {
    return this.affectations.length;
  }

  get employesAffectes(): number {
    return new Set(
      this.affectations.map(a => a.employe_id)
    ).size;
  }

  get projetsAvecAffectations(): number {
    return new Set(
      this.affectations.map(a => a.projet_id)
    ).size;
  }

  get tauxMoyen(): number {

    if (this.affectations.length === 0) {
      return 0;
    }

    const total =
      this.affectations.reduce(
        (somme, affectation) =>
          somme +
          Number(
            affectation.taux_affectation || 0
          ),
        0
      );

    return total / this.affectations.length;
  }
}
