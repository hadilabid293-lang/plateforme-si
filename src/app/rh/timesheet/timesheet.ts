import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Employe {
  id: number;
  nom: string;
  prenom: string;
}

interface TimesheetEntry {
  id: number;
  employe_id: number;
  date: string;
  employe: string;
  projet: string;
  heures: number;
  description: string;
}

@Component({
  selector: 'app-timesheet',
  imports: [FormsModule],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css'
})
export class Timesheet implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  showForm = false;
  modeModification = false;
  timesheetOriginalId = 0;

  date = '';
  employeId = 0;
  projet = 'Projet ERP';
  heures: number | null = null;
  description = '';

  recherche = '';
  filtreProjet = 'Tous';

  employes: Employe[] = [];
  timesheets: TimesheetEntry[] = [];

  ngOnInit(): void {
    this.chargerDonnees();
  }

  // ==============================
  // CHARGEMENT DES DONNÉES
  // ==============================

  async chargerDonnees(): Promise<void> {
    await this.chargerEmployes();
    await this.chargerTimesheets();
  }

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

    // Force Angular à mettre à jour l'affichage
    this.cdr.markForCheck();
  }

  async chargerTimesheets(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('timesheets')
        .select('*')
        .order('date_timesheet', { ascending: false })
        .order('id', { ascending: false });

    if (error) {
      console.error('Erreur chargement timesheets :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.timesheets = (data ?? []).map((row: any) => {

      const employe = this.employes.find(
        e => e.id === row.employe_id
      );

      return {
        id: row.id,
        employe_id: row.employe_id,
        date: row.date_timesheet,
        employe: employe
          ? `${employe.nom} ${employe.prenom}`
          : 'Inconnu',
        projet: row.projet,
        heures: Number(row.heures),
        description: row.description ?? ''
      };

    });

    // Force Angular à mettre à jour l'affichage
    this.cdr.markForCheck();
  }

  // ==============================
  // FORMULAIRE
  // ==============================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.timesheetOriginalId = 0;

    this.date = new Date().toISOString().slice(0, 10);
    this.employeId = 0;
    this.projet = 'Projet ERP';
    this.heures = null;
    this.description = '';

    this.cdr.markForCheck();
  }

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.timesheetOriginalId = 0;

    this.cdr.markForCheck();
  }

  // ==============================
  // AJOUT / MODIFICATION
  // ==============================

  async enregistrerTimesheet(): Promise<void> {

    // Vérification des champs obligatoires
    if (
      !this.date ||
      !this.employeId ||
      !this.projet ||
      this.heures === null ||
      this.heures <= 0
    ) {
      alert('Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    // ==============================
    // MODIFICATION
    // ==============================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('timesheets')
          .update({
            employe_id: this.employeId,
            date_timesheet: this.date,
            projet: this.projet,
            heures: this.heures,
            description: this.description.trim()
          })
          .eq('id', this.timesheetOriginalId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Saisie Timesheet modifiée avec succès.');

    }

    // ==============================
    // AJOUT
    // ==============================

    else {

      const nouvelleEntree = {
        employe_id: this.employeId,
        date_timesheet: this.date,
        projet: this.projet,
        heures: this.heures,
        description: this.description.trim()
      };

      const { error } =
        await this.supabaseService.supabase
          .from('timesheets')
          .insert(nouvelleEntree);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Saisie Timesheet ajoutée avec succès.');
    }

    // Recharger les données après ajout/modification
    await this.chargerTimesheets();

    // Fermer le formulaire
    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // ==============================
  // MODIFIER
  // ==============================

  modifierTimesheet(entry: TimesheetEntry): void {

    this.modeModification = true;
    this.showForm = true;

    this.timesheetOriginalId = entry.id;

    this.date = entry.date;
    this.employeId = entry.employe_id;
    this.projet = entry.projet;
    this.heures = entry.heures;
    this.description = entry.description;

    this.cdr.markForCheck();
  }

  // ==============================
  // SUPPRIMER
  // ==============================

  async supprimerTimesheet(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer cette saisie ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('timesheets')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Saisie supprimée avec succès.');

    // Recharger la liste
    await this.chargerTimesheets();

    this.cdr.markForCheck();
  }

  // ==============================
  // RECHERCHE + FILTRE
  // ==============================

  get timesheetsFiltres(): TimesheetEntry[] {

    const recherche = this.recherche
      .toLowerCase()
      .trim();

    return this.timesheets.filter(entry => {

      const correspondRecherche =
        entry.employe
          .toLowerCase()
          .includes(recherche);

      const correspondProjet =
        this.filtreProjet === 'Tous' ||
        entry.projet === this.filtreProjet;

      return correspondRecherche && correspondProjet;
    });
  }

  // ==============================
  // STATISTIQUES
  // ==============================

  get totalHeures(): number {

    return this.timesheets.reduce(
      (total, entry) => total + entry.heures,
      0
    );
  }

  get nombreSaisies(): number {

    return this.timesheets.length;
  }

  get nombreProjets(): number {

    return new Set(
      this.timesheets.map(entry => entry.projet)
    ).size;
  }

  get moyenneHeures(): number {

    if (this.timesheets.length === 0) {
      return 0;
    }

    return Math.round(
      (this.totalHeures / this.timesheets.length) * 10
    ) / 10;
  }
}
