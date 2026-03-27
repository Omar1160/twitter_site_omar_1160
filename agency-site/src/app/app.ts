import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgIf } from '@angular/common';

declare global {
  interface Window {
    Calendly: any;
  }
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, HttpClientModule, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('sales-site');

  readonly processSection = viewChild<ElementRef<HTMLElement>>('processSection');

  /** 0–100: blue line fill */
  lineFillPercent = 0;
  /** Active step index 0..5 */
  activeProcessStep = 0;

  readonly processSteps: {
    title: string;
    description: string;
    image: string;
    clientOnlyLabel?: string;
  }[] = [
    {
      title: 'Research & Strategy',
      description:
        'We analyze your niche, audience and competitors to find content that attracts your ideal clients.',
      image: '/process/step-1.svg',
    },
    {
      title: 'Content Ideas & Planning',
      description:
        'We create video ideas and a content plan focused on growth and lead generation.',
      image: '/process/step-2.svg',
    },
    {
      title: 'Script Writing',
      description:
        'We write scripts with strong hooks and structure to maximize retention.',
      image: '/process/step-3.svg',
    },
    {
      title: 'Recording',
      description:
        'You record content in batches (2–3 hours per month).',
      image: '/process/step-4.svg',
      clientOnlyLabel: 'You only record in batches',
    },
    {
      title: 'Editing & Thumbnails',
      description:
        'We edit, add subtitles, sound effects and design thumbnails for clicks and watch time.',
      image: '/process/step-5.svg',
    },
    {
      title: 'Publishing & Optimization',
      description:
        'We upload, optimize SEO and publish content consistently to grow your channel.',
      image: '/process/step-6.svg',
    },
  ];

  get currentProcessStep() {
    return this.processSteps[this.activeProcessStep];
  }

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  contactForm!: FormGroup;
  callForm!: FormGroup;
  activeFilter: 'longform' | 'shortform' = 'longform';

  private readonly destroyRef = inject(DestroyRef);
  private processScrollRaf = 0;
  private processStepCooldownUntil = 0;
  private touchLastY = 0;
  private touchLastX = 0;
  /** Vinger begon in de process-sectie (voor betrouwbare touch-lock) */
  private processTouchGestureActive = false;
  /** Telt naar-beneden scroll-intent (wiel); reset na elke stap zodat je niet kunt overslaan */
  private wheelDownAccum = 0;
  /** Telt verticale swipe in één gesture (touch) */
  private touchSwipeAccum = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      channelUrl: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
    this.callForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });

    afterNextRender(() => {
      this.registerProcessScrollCapture();
      this.applyProcessStepVisuals();
      this.cdr.detectChanges();
    });
  }

  /** Wheel / touch: page scrollt niet door tot stap 6; swipe stapt door de flow */
  private registerProcessScrollCapture(): void {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const onWheel = (e: WheelEvent) => this.onProcessWheel(e);
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });

    const onTouchStart = (e: TouchEvent) => this.onProcessTouchStart(e);
    const onTouchMove = (e: TouchEvent) => this.onProcessTouchMove(e);
    const onTouchEnd = (e: TouchEvent) => this.onProcessTouchEnd(e);
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });

    this.destroyRef.onDestroy(() => {
      document.removeEventListener('wheel', onWheel, { capture: true } as AddEventListenerOptions);
      document.removeEventListener('touchstart', onTouchStart, { capture: true } as AddEventListenerOptions);
      document.removeEventListener('touchmove', onTouchMove, { capture: true } as AddEventListenerOptions);
      document.removeEventListener('touchend', onTouchEnd, { capture: true } as AddEventListenerOptions);
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true } as AddEventListenerOptions);
    });
  }

  private wheelTargetShouldIgnore(e: Event): boolean {
    const el = e.target;
    if (!(el instanceof Node)) {
      return false;
    }
    const host = el instanceof Element ? el : el.parentElement;
    if (!host) {
      return false;
    }
    return !!host.closest('textarea, input, select, [contenteditable="true"], iframe');
  }

  /** Muis / touch moet binnen de hele “How we work”-sectie vallen (niet alleen op de image). */
  private pointerInsideProcessSection(clientX: number, clientY: number): boolean {
    const section = this.processSection()?.nativeElement;
    if (!section) {
      return false;
    }
    const r = section.getBoundingClientRect();
    return (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.top &&
      clientY <= r.bottom
    );
  }

  /** Wheel-target zit in de sectie (ook als clientX/Y soms 0 zijn). */
  private wheelEventOverProcessSection(e: WheelEvent): boolean {
    const section = this.processSection()?.nativeElement;
    if (!section) {
      return false;
    }
    const t = e.target;
    if (t instanceof Node && section.contains(t)) {
      return true;
    }
    return this.pointerInsideProcessSection(e.clientX, e.clientY);
  }

  /** Sectie staat minstens deels in beeld — lock geldt overal op het donkere vlak (screenshot-gebied). */
  private processScrollCaptureActive(): boolean {
    const el = this.processSection()?.nativeElement;
    if (!el) {
      return false;
    }
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return r.bottom > 4 && r.top < vh - 4;
  }

  /** Tot en met stap 5 (index 0–4): pagina niet verder naar beneden */
  private processBlocksPageScrollDown(): boolean {
    return this.processScrollCaptureActive() && this.activeProcessStep < this.processSteps.length - 1;
  }

  /** `touch-action: none` op de sectie + template binding */
  protected isProcessTouchLocked(): boolean {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return this.processBlocksPageScrollDown();
  }

  private onProcessWheel(e: WheelEvent): void {
    if (this.wheelTargetShouldIgnore(e)) {
      return;
    }
    if (!this.processScrollCaptureActive()) {
      return;
    }
    if (!this.wheelEventOverProcessSection(e)) {
      return;
    }
    if (!this.processBlocksPageScrollDown()) {
      return;
    }

    let dy = e.deltaY;
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      dy *= 16;
    }
    if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      dy *= window.innerHeight * 0.35;
    }

    /* Omhoog: geen lock */
    if (dy <= 0) {
      this.wheelDownAccum = 0;
      return;
    }

    e.preventDefault();

    const now = performance.now();
    if (now < this.processStepCooldownUntil) {
      return;
    }

    /*
     * Accumulator: snelle grote scroll wordt tot één stap afgebroken (geen overslaan).
     * Pas na drempel: +1 stap, accum leeg, lange pauze.
     */
    const STEP_WHEEL_ACCUM = 52;
    this.wheelDownAccum += dy;
    if (this.wheelDownAccum < STEP_WHEEL_ACCUM) {
      return;
    }

    this.wheelDownAccum = 0;
    this.advanceProcessStepOneAndNudge();
  }

  /** Kleine scroll naar beneden + UI — max. één stap per aanroep */
  private advanceProcessStepOneAndNudge(): void {
    const n = this.processSteps.length;
    if (this.activeProcessStep >= n - 1) {
      return;
    }
    this.activeProcessStep += 1;
    this.bumpProcessCooldown(580);
    this.applyProcessStepVisuals();
    this.nudgePageAfterProcessStep();
    this.cdr.detectChanges();
  }

  private nudgePageAfterProcessStep(): void {
    const px = 16;
    requestAnimationFrame(() => {
      window.scrollBy({ top: px, left: 0, behavior: 'auto' });
    });
  }

  private onProcessTouchStart(e: TouchEvent): void {
    this.processTouchGestureActive = false;
    this.touchSwipeAccum = 0;
    if (!this.processScrollCaptureActive() || e.touches.length !== 1) {
      return;
    }
    const t = e.touches[0];
    if (!this.pointerInsideProcessSection(t.clientX, t.clientY)) {
      return;
    }
    this.processTouchGestureActive = true;
    this.touchLastY = t.clientY;
    this.touchLastX = t.clientX;
  }

  private onProcessTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.processTouchGestureActive = false;
    }
  }

  private onProcessTouchMove(e: TouchEvent): void {
    if (this.wheelTargetShouldIgnore(e)) {
      return;
    }
    if (!this.processTouchGestureActive || e.touches.length !== 1) {
      return;
    }
    if (!this.processScrollCaptureActive()) {
      return;
    }

    const t = e.touches[0];
    const y = t.clientY;
    const x = t.clientX;
    const dy = this.touchLastY - y;
    const dx = x - this.touchLastX;
    const n = this.processSteps.length;
    const last = n - 1;

    /*
     * Duidelijke horizontale beweging: browser niet alles blokkeren (links/rechts).
     */
    if (Math.abs(dx) > Math.abs(dy) * 1.15 && Math.abs(dx) > 12) {
      this.touchLastY = y;
      this.touchLastX = x;
      return;
    }

    const inside = this.pointerInsideProcessSection(x, y);

    if (inside && this.processBlocksPageScrollDown() && dy > 0) {
      e.preventDefault();
    }

    const now = performance.now();
    if (!inside || !this.processBlocksPageScrollDown()) {
      this.touchLastY = y;
      this.touchLastX = x;
      return;
    }

    const now2 = performance.now();
    /* Tijdens cooldown geen accumulatie — voorkomt overslaan na snelle swipe */
    if (now2 >= this.processStepCooldownUntil && dy > 0) {
      this.touchSwipeAccum += dy;
    }

    if (now2 < this.processStepCooldownUntil) {
      this.touchLastY = y;
      this.touchLastX = x;
      return;
    }

    const STEP_TOUCH_ACCUM = 44;
    if (this.touchSwipeAccum < STEP_TOUCH_ACCUM) {
      this.touchLastY = y;
      this.touchLastX = x;
      return;
    }

    this.touchSwipeAccum = 0;
    this.advanceProcessStepOneAndNudge();

    this.touchLastY = y;
    this.touchLastX = x;
  }

  private bumpProcessCooldown(ms = 500): void {
    this.processStepCooldownUntil = performance.now() + ms;
  }

  private applyProcessStepVisuals(): void {
    const n = this.processSteps.length;
    this.lineFillPercent = n <= 1 ? 100 : (this.activeProcessStep / (n - 1)) * 100;
    const section = this.processSection()?.nativeElement;
    if (section) {
      this.syncProcessRailGeometry(section);
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  scheduleProcessSync(): void {
    if (this.processScrollRaf !== 0) {
      return;
    }
    this.processScrollRaf = requestAnimationFrame(() => {
      this.processScrollRaf = 0;
      this.syncProcessOnScrollOrResize();
      this.cdr.detectChanges();
    });
  }

  /** Rail-meting + reset stappen als de sectie uit beeld verdwijnt */
  private syncProcessOnScrollOrResize(): void {
    const section = this.processSection()?.nativeElement;
    if (!section) {
      return;
    }
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -40 || r.top > vh + 80) {
      this.activeProcessStep = 0;
      this.applyProcessStepVisuals();
    }
    this.syncProcessRailGeometry(section);
  }

  private syncProcessRailGeometry(section: HTMLElement): void {
    const col = section.querySelector('.process-col-left') as HTMLElement | null;
    const dots = section.querySelectorAll<HTMLElement>('.process-step-dot');
    if (!col || dots.length < 2) {
      return;
    }
    const cRect = col.getBoundingClientRect();
    const firstR = dots[0].getBoundingClientRect();
    const lastR = dots[dots.length - 1].getBoundingClientRect();
    const firstStart = firstR.bottom - cRect.top;
    const lastEnd = lastR.top - cRect.top;
    const railH = Math.max(0, lastEnd - firstStart);
    col.style.setProperty('--process-rail-top', `${firstStart}px`);
    col.style.setProperty('--process-rail-height', `${railH}px`);
  }

  setFilter(filter: 'longform' | 'shortform'): void {
    this.activeFilter = filter;
  }

  onCallFormSubmit(): void {
    if (this.callForm.invalid) {
      this.callForm.markAllAsTouched();
      return;
    }
    document.querySelector('.calendly-inline-widget')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = '';

    this.http.post<void>('http://localhost:8080/api/contact', this.contactForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Something went wrong. Please try again later.';
      },
    });
  }
}
