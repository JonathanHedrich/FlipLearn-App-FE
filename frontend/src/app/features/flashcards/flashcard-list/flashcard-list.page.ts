import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronDownOutline,
  createOutline,
  folderOutline,
  heartOutline,
  heartSharp,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';

import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

type SetTheme = 'blue' | 'purple' | 'green' | 'orange';
type MainFilter = 'all' | 'favorites' | 'recent';
type CategoryFilter = 'all' | 'languages' | 'science' | 'programming';

interface FlashcardSet {
  id: number;
  title: string;
  cards: number;
  progress: number;
  category: CategoryFilter;
  favorite: boolean;
  theme: SetTheme;
}

@Component({
  selector: 'app-flashcard-list',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './flashcard-list.page.html',
  styleUrls: ['./flashcard-list.page.scss'],
})
export class FlashcardListPage {
  searchTerm = '';
  activeFilter: MainFilter = 'all';
  activeCategory: CategoryFilter = 'all';

  readonly sets: FlashcardSet[] = [
    {
      id: 1,
      title: 'Spanish Vocabulary',
      cards: 5,
      progress: 72,
      category: 'languages',
      favorite: true,
      theme: 'blue',
    },
    {
      id: 2,
      title: 'Chemistry Basics',
      cards: 4,
      progress: 45,
      category: 'science',
      favorite: false,
      theme: 'purple',
    },
    {
      id: 3,
      title: 'World Capitals',
      cards: 4,
      progress: 90,
      category: 'languages',
      favorite: true,
      theme: 'green',
    },
    {
      id: 4,
      title: 'JavaScript Concepts',
      cards: 3,
      progress: 30,
      category: 'programming',
      favorite: false,
      theme: 'orange',
    },
  ];

  constructor(private readonly router: Router) {
    addIcons({
      addOutline,
      chevronDownOutline,
      createOutline,
      folderOutline,
      heartOutline,
      heartSharp,
      searchOutline,
      timeOutline,
    });
  }

  get filteredSets(): FlashcardSet[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.sets.filter((set) => {
      const matchesSearch =
        query.length === 0 || set.title.toLowerCase().includes(query);

      const matchesMainFilter =
        this.activeFilter === 'all' ||
        (this.activeFilter === 'favorites' && set.favorite) ||
        this.activeFilter === 'recent';

      const matchesCategory =
        this.activeCategory === 'all' || set.category === this.activeCategory;

      return matchesSearch && matchesMainFilter && matchesCategory;
    });
  }

  setMainFilter(filter: MainFilter): void {
    this.activeFilter = filter;
  }

  setCategory(category: CategoryFilter): void {
    this.activeCategory = category;
  }

  toggleFavorite(set: FlashcardSet, event: Event): void {
    event.stopPropagation();
    set.favorite = !set.favorite;
  }

  openCreateSet(): void {
    void this.router.navigateByUrl('/sets/create');
  }

  openEditor(setId: number, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/sets', setId, 'edit']);
  }

  startStudy(setId: number, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/study', setId]);
  }
}
