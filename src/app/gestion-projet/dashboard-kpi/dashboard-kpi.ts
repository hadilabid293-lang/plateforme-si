import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Supabase } from '../../services/supabase';

interface ProjetKpi {
  id: number;
  nom: string;
  chefProjet: string;
  budget: number;
  consomme: number;
  avancement: number;
  statut: string;
}

@Component({
  selector: 'app-dashboard-kpi',
  imports: [],
  templateUrl: './dashboard-kpi.html',
  styleUrl: './dashboard-kpi.css'
})
export class DashboardKpi implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // DONNÉES
  // =========================

  chiffreAffaires = 0;
  totalConsomme = 0;
  avancementMoyen = 0;

  projets: ProjetKpi[] = [];

  // =========================
  // INITIALISATION
  // =========================

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

      console.error('Erreur chargement Dashboard :', error);

      alert('Erreur Supabase : ' + error.message);

      return;
    }

    this.projets = (data ?? []).map((projet: any) => {

      return {
        id: projet.id,
        nom: projet.nom ?? '',
        chefProjet: projet.responsable ?? '-',
        budget: Number(projet.budget ?? 0),
        consomme: Number(projet.consomme ?? 0),
        avancement: Number(projet.progression ?? 0),
        statut: projet.statut ?? 'Planifié'
      };

    });

    console.log('📊 Projets KPI chargés :', this.projets);

    this.calculerKpi();

    // Rafraîchir l'affichage après le chargement Supabase
    this.cdr.markForCheck();
  }

  // =========================
  // CALCUL DES KPI
  // =========================

  calculerKpi(): void {

    // Budget total
    this.chiffreAffaires = this.projets.reduce(
      (total, projet) => total + projet.budget,
      0
    );

    // Budget consommé
    this.totalConsomme = this.projets.reduce(
      (total, projet) => total + projet.consomme,
      0
    );

    // Avancement moyen
    if (this.projets.length === 0) {

      this.avancementMoyen = 0;

    } else {

      const totalAvancement = this.projets.reduce(
        (total, projet) => total + projet.avancement,
        0
      );

      this.avancementMoyen = Math.round(
        totalAvancement / this.projets.length
      );
    }

    this.cdr.markForCheck();
  }

  // =========================
  // BUDGET RESTANT
  // =========================

  get budgetRestant(): number {

    return Math.max(
      this.chiffreAffaires - this.totalConsomme,
      0
    );

  }

  // =========================
  // POURCENTAGE CONSOMMÉ
  // =========================

  get pourcentageConsomme(): number {

    if (this.chiffreAffaires === 0) {

      return 0;

    }

    return Math.min(
      Math.round(
        (this.totalConsomme / this.chiffreAffaires) * 100
      ),
      100
    );

  }

  // =========================
  // NOMBRE TOTAL DE PROJETS
  // =========================

  get totalProjets(): number {

    return this.projets.length;

  }

  // =========================
  // PROJETS EN COURS
  // =========================

  get projetsEnCours(): number {

    return this.projets.filter(
      projet => projet.statut === 'En cours'
    ).length;

  }

  // =========================
  // PROJETS TERMINÉS
  // =========================

  get projetsTermines(): number {

    return this.projets.filter(
      projet => projet.statut === 'Terminé'
    ).length;

  }

  // =========================
  // FORMAT MONTANT
  // =========================

  formatMontant(montant: number): string {

    return montant.toLocaleString('fr-FR') + ' DT';

  }

  // =========================
  // POURCENTAGE D'UN PROJET
  // =========================

  getPourcentageProjet(projet: ProjetKpi): number {

    if (projet.budget === 0) {

      return 0;

    }

    return Math.round(
      (projet.consomme / projet.budget) * 100
    );

  }

}
