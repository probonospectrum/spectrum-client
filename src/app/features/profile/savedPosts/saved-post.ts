import { Component } from '@angular/core';
import { SavedPostsService } from '../../../core/services/posts/savedPost.service';
import { PostCard } from '../../../shared/components/post-card/post-card';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-saved-posts',
  imports: [PostCard,RouterLink],
  templateUrl: './saved-Post.html',
  styleUrl:'./saved-Post.scss'
})
export class SavedPostsComponent {
  posts;
  constructor(private savedPostsService: SavedPostsService) {
    this.posts = this.savedPostsService.savedPosts;
}

  
}