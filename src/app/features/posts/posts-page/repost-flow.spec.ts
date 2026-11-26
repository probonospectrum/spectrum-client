import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { PostsPage } from './posts-page';
import { PostService, RepostToggleResult, SpectrumPost } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { SettingsService } from '../../../core/services/account/settings.service';

describe('Feed repost flow', () => {
  it('updates repost metadata without reloading cards or dropping other loaded pages', () => {
    const response = new Subject<RepostToggleResult>();
    const service = { suggestions: [], toggleServerRepost: vi.fn(() => response), getFeed: vi.fn() };
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: PostService, useValue: service },
      { provide: UserService, useValue: { getCurrentUser: () => ({ _id: 'viewer' }) } },
      { provide: SettingsService, useValue: {} },
    ] });
    TestBed.overrideComponent(PostsPage, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(PostsPage);
    const page = fixture.componentInstance;
    const post = { id: 'original', reposts: 2, reposted: false, likes: 7, liked: true, comments: 3, saved: true } as SpectrumPost;
    const otherPagePost = { id: 'loaded-on-next-page', reposts: 0 } as SpectrumPost;
    page.allPosts.set([post, otherPagePost]);
    page.toggleRepost(post);
    page.toggleRepost(post);
    expect(service.toggleServerRepost).toHaveBeenCalledTimes(1);
    expect(page.repostPendingIds().has(post.id)).toBe(true);
    response.next({ post: { ...post, reposts: 3, reposted: true }, reposted: true });
    response.complete();
    expect(service.getFeed).not.toHaveBeenCalled();
    expect(page.allPosts()[0]).toBe(post);
    expect(page.allPosts()[1]).toBe(otherPagePost);
    expect(post).toMatchObject({ reposts: 3, reposted: true, likes: 7, liked: true, saved: true, comments: 3 });
    expect(page.repostPendingIds().size).toBe(0);
    fixture.destroy();
  });
});
