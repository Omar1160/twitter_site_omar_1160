import { Component, signal } from '@angular/core';
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

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  contactForm!: FormGroup;
  callForm!: FormGroup;
  activeFilter: 'longform' | 'shortform' = 'longform';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
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
  }

  setFilter(filter: 'longform' | 'shortform'): void {
    this.activeFilter = filter;
  }

  onCallFormSubmit(): void {
    if (this.callForm.invalid) {
      this.callForm.markAllAsTouched();
      return;
    }
    // Scroll to Calendly so creator can pick a time
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
