import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Supabase } from '../services/supabase';

interface Projet {
  id: number;
  nom: string;
  budget: number;
  consomme: number;
  progression: number;
  statut: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  chiffreAffaires = 0;
  pourcentageConsomme = 0;
  avancementMoyen = 0;
  totalEmployes = 0;

  projets: Projet[] = [];

  congesEnAttente = 0;
  presentsAujourdHui = 0;
  absentsAujourdHui = 0;

  ngOnInit(): void {
    this.chargerDashboard();
  }

  async chargerDashboard(): Promise<void> {
    await this.chargerProjets();
    await this.chargerEmployes();
    await this.chargerConges();
    await this.chargerPointages();

    this.cdr.markForCheck();
  }

  // =========================
  // PROJETS
  // =========================

  async chargerProjets(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('projets')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
      console.error('Erreur chargement projets Dashboard :', error);
      return;
    }

    this.projets = (data ?? []).map((projet: any) => ({
      id: projet.id,
      nom: projet.nom ?? '',
      budget: Number(projet.budget ?? 0),
      consomme: Number(projet.consomme ?? 0),
      progression: Number(projet.progression ?? 0),
      statut: projet.statut ?? 'Planifié'
    }));

    // Chiffre d'affaires = total des budgets
    this.chiffreAffaires = this.projets.reduce(
      (total, projet) => total + projet.budget,
      0
    );

    // Consommé
    const totalConsomme = this.projets.reduce(
      (total, projet) => total + projet.consomme,
      0
    );

    if (this.chiffreAffaires > 0) {
      this.pourcentageConsomme = Math.round(
        (totalConsomme / this.chiffreAffaires) * 100
      );
    } else {
      this.pourcentageConsomme = 0;
    }

    // Avancement moyen
    if (this.projets.length > 0) {
      const totalProgression = this.projets.reduce(
        (total, projet) => total + projet.progression,
        0
      );

      this.avancementMoyen = Math.round(
        totalProgression / this.projets.length
      );
    } else {
      this.avancementMoyen = 0;
    }

    this.cdr.markForCheck();
  }

  // =========================
  // EMPLOYÉS
  // =========================

  async chargerEmployes(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('employes')
        .select('id');

    if (error) {
      console.error('Erreur chargement employés Dashboard :', error);
      return;
    }

    this.totalEmployes = data?.length ?? 0;

    this.cdr.markForCheck();
  }

  // =========================
  // CONGÉS
  // =========================

  async chargerConges(): Promise<void> {

    const { data, error } =
      await this.supabaseService.supabase
        .from('conges')
        .select('id, statut');

    if (error) {
      console.error('Erreur chargement congés Dashboard :', error);
      return;
    }

    this.congesEnAttente = (data ?? []).filter(
      (conge: any) => conge.statut === 'En attente'
    ).length;

    this.cdr.markForCheck();
  }

  // =========================
  // POINTAGES
  // =========================

  async chargerPointages(): Promise<void> {

    const aujourdHui = new Date()
      .toISOString()
      .split('T')[0];

    const { data, error } =
      await this.supabaseService.supabase
        .from('pointages')
        .select('id, statut, date_pointage')
        .eq('date_pointage', aujourdHui);

    if (error) {
      console.error('Erreur chargement pointages Dashboard :', error);
      return;
    }

    this.presentsAujourdHui = (data ?? []).filter(
      (pointage: any) => pointage.statut === 'Présent'
    ).length;

    this.absentsAujourdHui = (data ?? []).filter(
      (pointage: any) => pointage.statut === 'Absent'
    ).length;

    this.cdr.markForCheck();
  }

  // =========================
  // FORMATAGE
  // =========================

  formatMontant(montant: number): string {
    return montant.toLocaleString('fr-FR') + ' DT';
  }

  getPourcentageProjet(projet: Projet): number {
    return Math.min(
      Math.max(Number(projet.progression ?? 0), 0),
      100
    );
  }

  get projetsEnCours(): Projet[] {
    return this.projets.filter(
      projet => projet.statut === 'En cours'
    );
  }
}
