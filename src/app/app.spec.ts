import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the public shell when signed out', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.public-shell')).toBeTruthy();
    expect(compiled.querySelector('.app-shell')).toBeNull();
  });

  it('should render the brand in the app shell when signed in', async () => {
    localStorage.setItem('chsistem.token', 'test-token');
    localStorage.setItem(
      'chsistem.user',
      JSON.stringify({
        _id: 'u1',
        name: 'Test Admin',
        email: 'test@chsistem.com',
        role: 'admin',
        active: true,
      })
    );

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-shell')).toBeTruthy();
    expect(compiled.querySelector('.brand')?.textContent).toContain('CHsistem');
  });
});
