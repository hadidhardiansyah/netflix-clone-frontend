import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  landingForm!: FormGroup;
  year = new Date().getFullYear();

  reasons = [
    {
      title: 'Enjoy on your TV',
      text: 'Watch on smart TVs, Playstation, xbox, players and more.',
      icon: 'tv',
    },
    {
      title: 'Download your shows to watch offline',
      text: 'Save yout favorites easily and always have something to watch.',
      icon: 'file_download',
    },
    {
      title: 'Watch everywhere',
      text: 'Stream unlimited movies and TV shows on your phone, tablet, laptop and TV.',
      icon: 'devices',
    },
    {
      title: 'Create profiles for kids',
      text: 'Send kids on adventures in a space made just for them - free with your membership.',
      icon: 'face',
    },
  ];

  faqs = [
    {
      question: 'What is Netflix Clone?',
      answer:
        'Netflix Clone is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries and more.',
    },
    {
      question: 'How much does Netflix Clone cost?',
      answer: 'Plan start at $10 a month. No extra costs, no contracts.',
    },
    {
      question: 'Where can I watch?',
      answer:
        'Watch anywhere, anytime. Sign in with your account to watch on the web or on devices like smartphones, tablets, smart TVs and more.',
    },
    {
      question: 'How do I cancel?',
      answer:
        'You can cancel yoir membership online in two clicks. There are no cancellation fees - start or stop your account anytime.',
    },
    {
      question: 'What can I watch in Netflix Clone?',
      answer:
        'A hug library of feature films, documentaries, anime, TV shows, Netflix Clone originals and more.',
    },
    {
      question: 'Is Netflix Clone good for kids?',
      answer:
        'The Kids experience includes family-friendly entertainment with parental controls to restrict content by maturity rating.',
    },
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.landingForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  login() {
    this.router.navigate(['/login']);
  }

  getStarted() {
    this.router.navigate(['/signup'], {
      queryParams: { email: this.landingForm.value.email },
    });
  }
}
