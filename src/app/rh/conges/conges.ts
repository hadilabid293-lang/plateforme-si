import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Employe {
  id: number;
  nom: string;
  prenom: string;
}

interface Conge {
  id: number;
  employe_id: number;
  employe: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  motif: string;
  statut: string;
}

@Component({
  selector: 'app-conges',
  imports: [FormsModule],
  templateUrl: './conges.html',
  styleUrl: './conges.css'
})
export class Conges implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // AFFICHAGE DU FORMULAIRE
  // =========================

  showForm = false;

  // =========================
  // MODE MODIFICATION
  // =========================

  modeModification = false;
  congeOriginalId = 0;

  // =========================
  // CHAMPS DU FORMULAIRE
  // =========================

  employe = '';
  employeId = 0;

  type = 'Congé annuel';
  dateDebut = '';
  dateFin = '';
  motif = '';

  // =========================
  // LISTES
  // =========================

  conges: Conge[] = [];
  employes: Employe[] = [];

  // =========================
  // RECHERCHE / FILTRE
  // =========================

  recherche = '';
  filtreStatut = 'Tous';

  // =========================
  // INITIALISATION
  // =========================

  ngOnInit(): void {
    this.chargerDonnees();
  }

  async chargerDonnees(): Promise<void> {
    await this.chargerEmployes();
    await this.chargerConges();
  }

  // =========================
  // CHARGER LES EMPLOYÉS
  // =========================

  async chargerEmployes(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('employes')
        .select('id, nom, prenom')
        .order('nom', { ascending: true });

    if (error) {
      console.error('Erreur chargement employés :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.employes = data ?? [];

    // Actualiser l'affichage Angular
    this.cdr.markForCheck();
  }

  // =========================
  // CHARGER LES CONGÉS
  // =========================

  async chargerConges(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('conges')
        .select('*')
        .order('date_debut', { ascending: false })
        .order('id', { ascending: false });

    if (error) {
      console.error('Erreur chargement congés :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.conges = (data ?? []).map((conge: any) => {

      const employe = this.employes.find(
        e => e.id === conge.employe_id
      );

      return {
        id: conge.id,
        employe_id: conge.employe_id,

        employe: employe
          ? `${employe.nom} ${employe.prenom}`
          : 'Inconnu',

        type: conge.type_conge,

        dateDebut: conge.date_debut,

        dateFin: conge.date_fin,

        nombreJours: this.calculerNombreJours(
          conge.date_debut,
          conge.date_fin
        ),

        motif: conge.motif ?? '',

        statut: conge.statut
      };
    });

    console.log('📋 Congés chargés :', this.conges);

    // Actualiser l'affichage Angular
    this.cdr.markForCheck();
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.congeOriginalId = 0;

    this.employe = '';
    this.employeId = 0;
    this.type = 'Congé annuel';
    this.dateDebut = '';
    this.dateFin = '';
    this.motif = '';

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.congeOriginalId = 0;

    this.employe = '';
    this.employeId = 0;
    this.type = 'Congé annuel';
    this.dateDebut = '';
    this.dateFin = '';
    this.motif = '';

    this.cdr.markForCheck();
  }

  // =========================
  // CALCUL NOMBRE DE JOURS
  // =========================

  calculerNombreJours(
    dateDebut: string,
    dateFin: string
  ): number {

    if (!dateDebut || !dateFin) {
      return 0;
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    const difference =
      fin.getTime() - debut.getTime();

    const jours =
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1;

    return jours > 0 ? jours : 0;
  }

  calculerJours(): number {

    return this.calculerNombreJours(
      this.dateDebut,
      this.dateFin
    );
  }

  // =========================
  // AJOUTER / MODIFIER
  // =========================

  async ajouterConge(): Promise<void> {

    if (
      !this.employeId ||
      !this.dateDebut ||
      !this.dateFin
    ) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    const nombreJours = this.calculerJours();

    if (nombreJours <= 0) {
      alert(
        'La date de fin doit être après ou égale à la date de début.'
      );
      return;
    }

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('conges')
          .update({
            employe_id: this.employeId,
            type_conge: this.type,
            date_debut: this.dateDebut,
            date_fin: this.dateFin,
            motif: this.motif
          })
          .eq('id', this.congeOriginalId);

      if (error) {
        console.error('Erreur modification :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Demande de congé modifiée avec succès.');
    }

    // =========================
    // AJOUT
    // =========================

    else {

      const nouveauConge = {
        employe_id: this.employeId,
        type_conge: this.type,
        date_debut: this.dateDebut,
        date_fin: this.dateFin,
        motif: this.motif,
        statut: 'En attente'
      };

      const { error } =
        await this.supabaseService.supabase
          .from('conges')
          .insert(nouveauConge);

      if (error) {
        console.error('Erreur ajout :', error);
        alert('Erreur Supabase : ' + error.message);
        return;
      }

      alert('Demande de congé ajoutée avec succès.');
    }

    await this.chargerConges();

    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER UNE DEMANDE
  // =========================

  modifierConge(conge: Conge): void {

    this.modeModification = true;
    this.showForm = true;

    this.congeOriginalId = conge.id;

    this.employeId = conge.employe_id;
    this.employe = conge.employe;

    this.type = conge.type;
    this.dateDebut = conge.dateDebut;
    this.dateFin = conge.dateFin;
    this.motif = conge.motif;

    this.cdr.markForCheck();
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerConge(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer cette demande de congé ?'
    );

    if (!confirmation) {
      return;
    }

    const { error } =
      await this.supabaseService.supabase
        .from('conges')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erreur suppression :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    alert('Demande de congé supprimée avec succès.');

    await this.chargerConges();

    this.cdr.markForCheck();
  }

  // =========================
  // APPROUVER
  // =========================

  async approuverConge(id: number): Promise<void> {

    const { error } =
      await this.supabaseService.supabase
        .from('conges')
        .update({
          statut: 'Approuvé'
        })
        .eq('id', id);

    if (error) {
      console.error('Erreur approbation :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    await this.chargerConges();

    this.cdr.markForCheck();
  }

  // =========================
  // REFUSER
  // =========================

  async refuserConge(id: number): Promise<void> {

    const { error } =
      await this.supabaseService.supabase
        .from('conges')
        .update({
          statut: 'Refusé'
        })
        .eq('id', id);

    if (error) {
      console.error('Erreur refus :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    await this.chargerConges();

    this.cdr.markForCheck();
  }

  // =========================
  // FILTRAGE
  // =========================

  get congesFiltres(): Conge[] {

    const recherche =
      this.recherche.toLowerCase().trim();

    return this.conges.filter(conge => {

      const correspondRecherche =
        conge.employe
          .toLowerCase()
          .includes(recherche);

      const correspondStatut =
        this.filtreStatut === 'Tous' ||
        conge.statut === this.filtreStatut;

      return (
        correspondRecherche &&
        correspondStatut
      );
    });
  }

  // =========================
  // STATISTIQUES
  // =========================

  get totalDemandes(): number {
    return this.conges.length;
  }

  get demandesEnAttente(): number {

    return this.conges.filter(
      conge => conge.statut === 'En attente'
    ).length;
  }

  get demandesApprouvees(): number {

    return this.conges.filter(
      conge => conge.statut === 'Approuvé'
    ).length;
  }

  get demandesRefusees(): number {

    return this.conges.filter(
      conge => conge.statut === 'Refusé'
    ).length;
  }
}
