import { Component } from '@angular/core';

interface Projet {
  id: number;
  nom: string;
  responsable: string;
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
export class DashboardKpi {
  Math = Math;

  // =========================
  // DONNÉES DES PROJETS
  // =========================

  projets: Projet[] = [

    {
      id: 1,
      nom: 'Projet ERP',
      responsable: 'Ahmed Ben Ali',
      budget: 150000,
      consomme: 105000,
      avancement: 80,
      statut: 'En cours'
    },

    {
      id: 2,
      nom: 'Projet Mobile',
      responsable: 'Sarra Trabelsi',
      budget: 100000,
      consomme: 68000,
      avancement: 55,
      statut: 'En cours'
    },

    {
      id: 3,
      nom: 'Projet Web',
      responsable: 'Yassine Mansour',
      budget: 80000,
      consomme: 35000,
      avancement: 35,
      statut: 'En cours'
    },

    {
      id: 4,
      nom: 'Application RH',
      responsable: 'Mariem Ben Salah',
      budget: 70000,
      consomme: 70000,
      avancement: 100,
      statut: 'Terminé'
    }

  ];


  // =========================
  // CHIFFRE D'AFFAIRES
  // =========================

  get chiffreAffaires(): number {

    return this.projets.reduce(
      (total, projet) =>
        total + projet.budget,
      0
    );

  }


  // =========================
  // TOTAL CONSOMMÉ
  // =========================

  get totalConsomme(): number {

    return this.projets.reduce(
      (total, projet) =>
        total + projet.consomme,
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

    return Math.round(
      (this.totalConsomme / this.chiffreAffaires) * 100
    );

  }


  // =========================
  // AVANCEMENT MOYEN
  // =========================

  get avancementMoyen(): number {

    if (this.projets.length === 0) {
      return 0;
    }

    const total = this.projets.reduce(
      (somme, projet) =>
        somme + projet.avancement,
      0
    );

    return Math.round(
      total / this.projets.length
    );

  }


  // =========================
  // NOMBRE DE PROJETS
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
  // BUDGET RESTANT
  // =========================

  get budgetRestant(): number {

    return this.chiffreAffaires - this.totalConsomme;

  }


  // =========================
  // FORMATAGE DU MONTANT
  // =========================

  formatMontant(montant: number): string {

    return montant.toLocaleString('fr-FR') + ' DT';

  }

}
