import { Injectable, signal } from '@angular/core';
import { SpectrumPost } from '../../../core/services/posts/post.service';

@Injectable({ providedIn: 'root' }) //isso pra fazer ficar visivel pra todos os arquivos
export class SavedPostsService {
  private saved = signal<SpectrumPost[]>([]);

  savedPosts = this.saved.asReadonly();

  //é aqui que tem que alterar quando for conectar o backEnd de verdade (em cada um dos campos)
  isSaved(postId: string): boolean {
    return this.saved().some(p => p.id === postId);
  }

  save(post: SpectrumPost): void {
    if (!this.isSaved(post.id)) {
      this.saved.update(posts => [...posts, post]);
    }
  }

  unsave(postId: string): void {
    this.saved.update(posts => posts.filter(p => p.id !== postId));
  }
}