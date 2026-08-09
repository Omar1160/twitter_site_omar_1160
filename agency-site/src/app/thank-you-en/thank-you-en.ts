import { Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-thank-you-en',
  imports: [RouterLink],
  templateUrl: './thank-you-en.html',
  styleUrl: '../thank-you/thank-you.scss',
})
export class ThankYouEn implements OnInit {
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.title.setTitle('Thank You — Leadrix');
  }
}
