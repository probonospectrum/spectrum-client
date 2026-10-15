import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CommentSection } from './comment-section';
import { PostService, SpectrumComment } from '../../../core/services/posts/post.service';
import { UserService, LoggedUser } from '../../../core/services/user/user.service';
describe('Institutional reply controls', () => {
  const representative = {
    _id: 'representative',
    name: 'Ana',
    occurrenceRole: 'RESPONSIBLE_AGENCY',
    occurrenceAgencyId: 'agency',
    agencyRegistrationStatus: 'APPROVED',
  } as LoggedUser;
  const citizenComment = {
    id: 'parent',
    authorId: 'citizen',
    authorName: 'Bruno',
    content: 'Quando será realizada a vistoria?',
    dateLabel: '',
    likes: 0,
    dislikes: 0,
    liked: false,
    disliked: false,
  } as SpectrumComment;
  let create: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    create = vi
      .fn()
      .mockReturnValue(
        of({
          ...citizenComment,
          id: 'reply',
          parentCommentId: 'parent',
          officialAgencyId: 'agency',
          officialAgencyName: 'Obras',
        }),
      );
    TestBed.configureTestingModule({
      imports: [CommentSection],
      providers: [
        {
          provide: PostService,
          useValue: { loadComments: () => of([citizenComment]), createComment: create },
        },
        { provide: UserService, useValue: { getCurrentUser: () => representative, currentUser: () => representative } },
      ],
    });
  });
  function fixtureFor(user: LoggedUser, agencyId = 'agency') {
    const fixture = TestBed.createComponent(CommentSection);
    fixture.componentRef.setInput('postId', 'post');
    fixture.componentRef.setInput('currentUser', user);
    fixture.componentRef.setInput('responsibleAgencyId', agencyId);
    fixture.detectChanges();
    return fixture;
  }
  it('lets a related approved agency answer a specific citizen comment and uses the server badge', () => {
    const fixture = fixtureFor(representative);
    const page = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Responder como órgão público');
    page.startReply(citizenComment);
    page.newComment = 'A vistoria está agendada para amanhã.';
    page.addComment();
    expect(create).toHaveBeenCalledWith(
      'post',
      'A vistoria está agendada para amanhã.',
      representative,
      'parent',
    );
    expect(page.comments[0]).toMatchObject({
      parentCommentId: 'parent',
      officialAgencyName: 'Obras',
    });
    expect(page.replyTarget).toBeNull();
  });
  it('hides official response controls for citizens, pending accounts and unrelated institutions', () => {
    for (const [user, agencyId] of [
      [{ ...representative, occurrenceRole: 'USER' }, 'agency'],
      [{ ...representative, agencyRegistrationStatus: 'PENDING' }, 'agency'],
      [representative, 'other'],
    ] as const) {
      const fixture = fixtureFor(user as LoggedUser, agencyId);
      expect(fixture.componentInstance.canOfficialReply).toBe(false);
      expect(fixture.nativeElement.textContent).not.toContain('Responder como órgão público');
      fixture.destroy();
    }
  });
});
