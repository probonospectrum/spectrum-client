import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CommentSection } from './comment-section';
import { PostService, SpectrumComment } from '../../../core/services/posts/post.service';
import { UserService, LoggedUser } from '../../../core/services/user/user.service';

describe('Comment threads and institutional replies', () => {
  const representative = {
    _id: 'representative', name: 'Ana', accountType: 'PUBLIC_AGENCY',
    occurrenceRole: 'RESPONSIBLE_AGENCY', occurrenceAgencyId: 'agency',
    agencyRegistrationStatus: 'APPROVED',
  } as LoggedUser;
  const citizen = { ...representative, accountType: 'CITIZEN', occurrenceRole: 'USER' } as LoggedUser;
  const parent = {
    id: 'parent', authorId: 'citizen', authorName: 'Bruno', content: 'Quando será realizada a vistoria?',
    dateLabel: '', likes: 0, dislikes: 0, liked: false, disliked: false,
  } as SpectrumComment;
  let create: ReturnType<typeof vi.fn>;
  let comments: SpectrumComment[];

  beforeEach(() => {
    comments = [parent];
    create = vi.fn().mockReturnValue(of({
      ...parent, id: 'reply', parentCommentId: 'parent',
      content: 'Vistoria agendada.', officialAgencyId: 'agency', officialAgencyName: 'Obras',
    }));
    TestBed.configureTestingModule({
      imports: [CommentSection],
      providers: [
        { provide: PostService, useValue: { loadComments: () => of(comments), createComment: create } },
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

  it.each([representative, { ...representative, occurrenceRole: 'MODERATOR' } as LoggedUser])(
    'opens the reply composer beneath its parent for an authorized user', async user => {
      const fixture = fixtureFor(user);
      const page = fixture.componentInstance;
      page.newComment = 'Rascunho do comentário comum';
      const parentElement = fixture.nativeElement.querySelector('#comment-parent') as HTMLElement;
      const button = parentElement.querySelector('.comment-section__reply') as HTMLButtonElement;
      expect(button.parentElement?.previousElementSibling?.getAttribute('aria-label')).toBe('Descurtir comentario');
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(parentElement.querySelector('.comment-section__reply-composer')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.comment-section__reply-composer')).toHaveLength(1);
      page.replyText = 'A vistoria está agendada para amanhã.';
      fixture.detectChanges();
      parentElement.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(create).toHaveBeenCalledWith('post', 'A vistoria está agendada para amanhã.', user, 'parent');
      expect(page.newComment).toBe('Rascunho do comentário comum');
      expect(page.replyTarget).toBeNull();
      const elements = fixture.nativeElement.querySelectorAll('.comment-section__item');
      expect([...elements].map((element: any) => element.id)).toEqual(['comment-parent', 'comment-reply']);
      expect(elements[1].classList.contains('comment-section__item--reply')).toBe(true);
      expect(elements[1].querySelector('.comment-section__reply')).toBeNull();
    },
  );

  it.each(['', 'other-agency'])('blocks an approved agency when it is not responsible: %s', agencyId => {
    const fixture = fixtureFor(representative, agencyId);
    const page = fixture.componentInstance;
    expect(page.canOfficialReply).toBe(false);
    fixture.nativeElement.querySelector('.comment-section__reply').click();
    fixture.detectChanges();
    expect(page.replyTarget).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="note"]').textContent).toContain('órgão responsável por esta ocorrência');
    page.replyText = 'Resposta não autorizada';
    page.addReply();
    expect(create).not.toHaveBeenCalled();
  });

  it('allows moderation even without an assigned agency', () => {
    const fixture = fixtureFor({ ...representative, occurrenceRole: 'MODERATOR' }, '');
    expect(fixture.componentInstance.canOfficialReply).toBe(true);
    fixture.nativeElement.querySelector('.comment-section__reply').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.replyTarget?.id).toBe('parent');
  });

  it('keeps replies next to the parent after loading and paginates whole threads', () => {
    comments = [
      { ...parent, id: 'reply', parentCommentId: 'parent' },
      parent,
      { ...parent, id: 'other' },
      { ...parent, id: 'third' },
    ];
    const fixture = fixtureFor(citizen);
    const page = fixture.componentInstance;
    expect(page.visibleComments.map(comment => comment.id)).toEqual(['parent', 'reply', 'other']);
    expect(page.remainingCount).toBe(1);
    page.toggleShowAll();
    expect(page.visibleComments.map(comment => comment.id)).toEqual(['parent', 'reply', 'other', 'third']);
  });

  it('keeps replies visible when their parent was deleted and avoids cycles', () => {
    comments = [{ ...parent, id: 'orphan', parentCommentId: 'deleted' }];
    const fixture = fixtureFor(citizen);
    expect(fixture.componentInstance.visibleComments.map(comment => comment.id)).toEqual(['orphan']);
    fixture.componentInstance.comments = [
      { ...parent, id: 'a', parentCommentId: 'b' },
      { ...parent, id: 'b', parentCommentId: 'a' },
    ];
    expect(fixture.componentInstance.visibleComments).toHaveLength(2);
  });

  it('shows a citizen the explanation on click and provides hover and keyboard help', () => {
    const fixture = fixtureFor(citizen);
    const page = fixture.componentInstance;
    const button = fixture.nativeElement.querySelector('.comment-section__reply') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.title).toBe('');
    expect(button.getAttribute('aria-describedby')).toBe('reply-help-parent');
    expect(fixture.nativeElement.querySelector('[role="note"]').textContent).toContain('comunicação do Spectrum');
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.comment-section__reply-action--open')).not.toBeNull();
    const close = fixture.nativeElement.querySelector('.comment-section__close-help') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fechar aviso');
    close.click();
    fixture.detectChanges();
    expect(page.replyHelpId).toBeNull();
    expect(fixture.nativeElement.querySelector('.comment-section__reply-action--dismissed')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.comment-section__reply-action--open')).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(getComputedStyle(fixture.nativeElement.querySelector('[role="note"]')).display).toBe('none');
    button.click();
    fixture.detectChanges();
    expect(page.dismissedReplyHelpId).toBeNull();
    expect(fixture.nativeElement.querySelector('.comment-section__reply-action--open')).not.toBeNull();
    expect(page.replyTarget).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('explains the restriction for pending institutional accounts', () => {
    const fixture = fixtureFor({ ...representative, agencyRegistrationStatus: 'PENDING' });
    fixture.nativeElement.querySelector('.comment-section__reply').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="note"]').textContent).toContain('vínculo institucional ativo');
    expect(fixture.componentInstance.replyTarget).toBeNull();
  });

  it('does not submit a reply after permission is lost', () => {
    const fixture = fixtureFor(representative);
    const page = fixture.componentInstance;
    page.startReply(parent);
    page.replyText = 'Resposta';
    fixture.componentRef.setInput('currentUser', citizen);
    fixture.detectChanges();
    page.addReply();
    expect(create).not.toHaveBeenCalled();
  });

  it('preserves the reply draft on a backend error and shows its reason', () => {
    const fixture = fixtureFor(representative);
    const page = fixture.componentInstance;
    create.mockReturnValue(throwError(() => ({ error: { message: 'Vínculo institucional inativo.' } })));
    page.startReply(parent);
    page.replyText = 'Resposta em andamento';
    page.addReply();
    expect(page.replyText).toBe('Resposta em andamento');
    expect(page.replyTarget?.id).toBe('parent');
    expect(page.error).toBe('Vínculo institucional inativo.');
    expect(page.saving).toBe(false);
  });

  it('cancels the reply independently of the ordinary comment draft', () => {
    const fixture = fixtureFor(representative);
    const page = fixture.componentInstance;
    page.newComment = 'Comentário comum';
    page.startReply(parent);
    page.replyText = 'Resposta';
    page.cancelReply();
    expect(page.replyTarget).toBeNull();
    expect(page.replyText).toBe('');
    expect(page.newComment).toBe('Comentário comum');
  });
});
