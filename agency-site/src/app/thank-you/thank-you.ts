import { Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-thank-you',
  imports: [RouterLink],
  templateUrl: './thank-you.html',
  styleUrl: './thank-you.scss',
})
export class ThankYou implements OnInit {
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.title.setTitle('Bedankt — Leadrix');
  }
}
