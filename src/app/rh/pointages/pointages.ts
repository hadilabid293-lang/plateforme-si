import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Employe {
  id: number;
  nom: string;
  prenom: string;
}

interface Pointage {
  id: number;
  employe_id: number;
  date_pointage: string;
  heure_arrivee: string | null;
  heure_depart: string | null;
  statut: string;
  created_at?: string;
  employe_nom?: string;
  employe_prenom?: string;
}

@Component({
  selector: 'app-pointages',
  imports: [FormsModule],
  templateUrl: './pointages.html',
  styleUrl: './pointages.css'
})
export class Pointages implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  pointages: Pointage[] = [];
  employes: Employe[] = [];

  showForm = false;
  modeModification = false;
  pointageId: number | null = null;

  recherche = '';
  statutFiltre = 'Tous';

  employe_id: number | null = null;
  date_pointage = '';
  heure_arrivee = '';
  heure_depart = '';
  statut = 'Présent';

  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {
    this.chargerDonnees();
  }

  // =========================
  // CHARGER LES DONNÉES
  // =========================

  async chargerDonnees(): Promise<void> {
    await this.chargerEmployes();
    await this.chargerPointages();
  }

  // =========================
  // CHARGER LES EMPLOYÉS
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

    this.cdr.markForCheck();
  }

  // =========================
  // CHARGER LES POINTAGES
  // =========================

  async chargerPointages(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('pointages')
        .select('*')
        .order('date_pointage', { ascending: false })
        .order('id', { ascending: false });

    if (error) {
      console.error('Erreur chargement pointages :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.pointages = (data ?? []).map((pointage: any) => {

      const employe = this.employes.find(
        e => e.id === pointage.employe_id
      );

      return {
        ...pointage,
        employe_nom: employe?.nom ?? 'Inconnu',
        employe_prenom: employe?.prenom ?? ''
      };
    });

    this.cdr.markForCheck();
  }

  // =========================
  // RECHERCHE + FILTRE
  // =========================

  get pointagesFiltres(): Pointage[] {

    const recherche = this.recherche
      .toLowerCase()
      .trim();

    return this.pointages.filter(pointage => {

      const nomComplet =
        `${pointage.employe_prenom ?? ''} ${pointage.employe_nom ?? ''}`
          .toLowerCase();

      const correspondRecherche =
        nomComplet.includes(recherche);

      const correspondStatut =
        this.statutFiltre === 'Tous' ||
        pointage.statut === this.statutFiltre;

      return correspondRecherche && correspondStatut;
    });
  }

  // =========================
  // DATE AUJOURD'HUI
  // =========================

  get dateAujourdhui(): string {
    return new Date().toISOString().split('T')[0];
  }

  // =========================
  // POINTAGES AUJOURD'HUI
  // =========================

  get pointagesAujourdhui(): Pointage[] {

    return this.pointages.filter(
      p => p.date_pointage === this.dateAujourdhui
    );
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalEmployes(): number {
    return this.employes.length;
  }

  get presents(): number {
    return this.pointagesAujourdhui.filter(
      p => p.statut === 'Présent'
    ).length;
  }

  get retards(): number {
    return this.pointagesAujourdhui.filter(
      p => p.statut === 'Retard'
    ).length;
  }

  get absents(): number {
    return this.pointagesAujourdhui.filter(
      p => p.statut === 'Absent'
    ).length;
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.pointageId = null;

    this.employe_id = null;
    this.date_pointage = this.dateAujourdhui;
    this.heure_arrivee = '';
    this.heure_depart = '';
    this.statut = 'Présent';

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.pointageId = null;

    this.employe_id = null;
    this.date_pointage = '';
    this.heure_arrivee = '';
    this.heure_depart = '';
    this.statut = 'Présent';

    this.cdr.markForCheck();
  }

  // =========================
  // AJOUTER / MODIFIER
  // =========================

  async enregistrerPointage(): Promise<void> {

    if (
      !this.employe_id ||
      !this.date_pointage ||
      !this.statut
    ) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    const pointageData = {
      employe_id: this.employe_id,
      date_pointage: this.date_pointage,
      heure_arrivee: this.heure_arrivee || null,
      heure_depart: this.heure_depart || null,
      statut: this.statut
    };

    // =========================
    // MODIFICATION
    // =========================

    if (
      this.modeModification &&
      this.pointageId !== null
    ) {

      const { error } =
        await this.supabaseService.supabase
          .from('pointages')
          .update(pointageData)
          .eq('id', this.pointageId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Pointage modifié avec succès.');

    }

    // =========================
    // AJOUT
    // =========================

    else {

      const { error } =
        await this.supabaseService.supabase
          .from('pointages')
          .insert(pointageData);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Pointage ajouté avec succès.');
    }

    // Recharger les données
    await this.chargerPointages();

    // Fermer le formulaire
    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER
  // =========================

  modifierPointage(pointage: Pointage): void {

    this.modeModification = true;
    this.showForm = true;

    this.pointageId = pointage.id;

    this.employe_id = pointage.employe_id;
    this.date_pointage = pointage.date_pointage;
    this.heure_arrivee = pointage.heure_arrivee ?? '';
    this.heure_depart = pointage.heure_depart ?? '';
    this.statut = pointage.statut;

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerPointage(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer ce pointage ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('pointages')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Pointage supprimé avec succès.');

    // Recharger la liste
    await this.chargerPointages();

    this.cdr.markForCheck();
  }
}
