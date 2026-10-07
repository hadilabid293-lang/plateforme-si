
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

interface Employe {
  id: number;
  created_at?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_embauche: string;
  poste: string;
  departement: string;
  statut: string;
}

@Component({
  selector: 'app-employes',
  imports: [FormsModule],
  templateUrl: './employes.html',
  styleUrl: './employes.css'
})
export class Employes implements OnInit {

  constructor(
    private supabaseService: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  showForm = false;
  modeModification = false;
  emailOriginal = '';

  recherche = '';
  statutFiltre = 'Tous';

  nom = '';
  prenom = '';
  email = '';
  telephone = '';
  date_embauche = '';
  poste = '';
  departement = '';

  employes: Employe[] = [];

  private idEmployeModification: number | null = null;

  ngOnInit(): void {
    this.chargerEmployes();
  }

  // =========================
  // CHARGER LES EMPLOYÉS
  // =========================

  async chargerEmployes(): Promise<void> {

    console.log('🔵 Chargement des employés...');

    const { data, error } =
      await this.supabaseService.supabase
        .from('employes')
        .select('*')
        .order('id', { ascending: true });

    console.log('📦 DATA :', data);
    console.log('❌ ERROR :', error);

    if (error) {
      console.error('Erreur SELECT :', error);
      alert('Erreur Supabase : ' + error.message);
      return;
    }

    this.employes = (data ?? []) as Employe[];

    console.log('👥 Employés chargés :', this.employes);

    // Informe Angular que les données ont changé
    this.cdr.markForCheck();
  }

  // =========================
  // RECHERCHE + FILTRE
  // =========================

  get employesFiltres(): Employe[] {

    const recherche = this.recherche
      .toLowerCase()
      .trim();

    return this.employes.filter((employe) => {

      const correspondRecherche =
        (employe.nom ?? '').toLowerCase().includes(recherche) ||
        (employe.prenom ?? '').toLowerCase().includes(recherche) ||
        (employe.email ?? '').toLowerCase().includes(recherche) ||
        (employe.telephone ?? '').toLowerCase().includes(recherche) ||
        (employe.poste ?? '').toLowerCase().includes(recherche) ||
        (employe.departement ?? '').toLowerCase().includes(recherche);

      const correspondStatut =
        this.statutFiltre === 'Tous' ||
        employe.statut === this.statutFiltre;

      return correspondRecherche && correspondStatut;
    });
  }

  // =========================
  // OUVRIR FORMULAIRE
  // =========================

  ouvrirFormulaire(): void {

    this.showForm = true;
    this.modeModification = false;
    this.emailOriginal = '';

    this.resetForm();

    this.cdr.markForCheck();
  }

  // =========================
  // FERMER FORMULAIRE
  // =========================

  fermerFormulaire(): void {

    this.showForm = false;
    this.modeModification = false;
    this.emailOriginal = '';

    this.resetForm();

    this.cdr.markForCheck();
  }

  // =========================
  // AJOUTER / MODIFIER
  // =========================

  async ajouterEmploye(): Promise<void> {

    console.log('NOM:', this.nom);
    console.log('PRENOM:', this.prenom);
    console.log('EMAIL:', this.email);
    console.log('TELEPHONE:', this.telephone);
    console.log('DATE:', this.date_embauche);
    console.log('POSTE:', this.poste);
    console.log('DEPARTEMENT:', this.departement);

    if (
      !this.nom.trim() ||
      !this.prenom.trim() ||
      !this.email.trim() ||
      !this.telephone.trim() ||
      !this.date_embauche ||
      !this.poste.trim() ||
      !this.departement
    ) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    // =========================
    // MODIFICATION
    // =========================

    if (this.modeModification) {

      const { error } =
        await this.supabaseService.supabase
          .from('employes')
          .update({
            nom: this.nom.trim(),
            prenom: this.prenom.trim(),
            email: this.email.trim(),
            telephone: this.telephone.trim(),
            date_embauche: this.date_embauche,
            poste: this.poste.trim(),
            departement: this.departement
          })
          .eq('id', this.getIdEmployeEnModification());

      if (error) {

        console.error('Erreur modification :', error);

        alert('Erreur Supabase : ' + error.message);

        return;
      }

      alert('Employé modifié avec succès.');

    }

    // =========================
    // AJOUT
    // =========================

    else {

      const nouvelEmploye = {
        nom: this.nom.trim(),
        prenom: this.prenom.trim(),
        email: this.email.trim(),
        telephone: this.telephone.trim(),
        date_embauche: this.date_embauche,
        poste: this.poste.trim(),
        departement: this.departement,
        statut: 'Actif'
      };

      console.log('Nouvel employé :', nouvelEmploye);

      const { error } =
        await this.supabaseService.supabase
          .from('employes')
          .insert(nouvelEmploye);

      if (error) {

        console.error('Erreur ajout :', error);

        alert('Erreur Supabase : ' + error.message);

        return;
      }

      alert('Employé ajouté avec succès.');
    }

    // Recharger les données après ajout/modification
    await this.chargerEmployes();

    // Fermer le formulaire
    this.fermerFormulaire();

    this.cdr.markForCheck();
  }

  // =========================
  // ID EMPLOYÉ EN MODIFICATION
  // =========================

  getIdEmployeEnModification(): number {

    if (this.idEmployeModification === null) {
      throw new Error('Aucun employé sélectionné.');
    }

    return this.idEmployeModification;
  }

  // =========================
  // SUPPRIMER
  // =========================

  async supprimerEmploye(id: number): Promise<void> {

    const confirmation = confirm(
      'Voulez-vous vraiment supprimer cet employé ?'
    );

    if (!confirmation) {
      return;
    }

    console.log('Suppression employé ID:', id);

    const { error } =
      await this.supabaseService.supabase
        .from('employes')
        .delete()
        .eq('id', id);

    if (error) {

      console.error('Erreur suppression :', error);

      alert('Erreur Supabase : ' + error.message);

      return;
    }

    alert('Employé supprimé avec succès.');

    // Recharger la liste
    await this.chargerEmployes();

    this.cdr.markForCheck();
  }

  // =========================
  // MODIFIER
  // =========================

  modifierEmploye(employe: Employe): void {

    console.log('Modification employé:', employe);

    this.modeModification = true;
    this.showForm = true;

    this.idEmployeModification = employe.id;
    this.emailOriginal = employe.email;

    this.nom = employe.nom ?? '';
    this.prenom = employe.prenom ?? '';
    this.email = employe.email ?? '';
    this.telephone = employe.telephone ?? '';
    this.date_embauche = employe.date_embauche ?? '';
    this.poste = employe.poste ?? '';
    this.departement = employe.departement ?? '';

    this.cdr.markForCheck();
  }

  // =========================
  // RESET FORMULAIRE
  // =========================

  resetForm(): void {

    this.nom = '';
    this.prenom = '';
    this.email = '';
    this.telephone = '';
    this.date_embauche = '';
    this.poste = '';
    this.departement = '';
    this.idEmployeModification = null;
  }
}







