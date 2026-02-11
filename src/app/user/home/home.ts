import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { VideoService } from '../../shared/services/video-service/video-service';
import { WatchlistService } from '../../shared/services/watchlist-service/watchlist-service';
import { NotificationService } from '../../shared/services/notification-service/notification-service';
import { UtilityService } from '../../shared/services/utility-service/utility-service';
import { MediaService } from '../../shared/services/media-service/media-service';
import { DialogService } from '../../shared/services/dialog-service/dialog-service';
import { ErrorHandlerService } from '../../shared/services/error-handler-service/error-handler-service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  allVideos: any[] = [];
  filteredVideos: any[] = [];
  featuredVideos: any[] = [];

  loading: boolean = true;
  loadingMore: boolean = false;
  error: boolean = false;
  featuredLoading: boolean = true;
  hasMoreVideos: boolean = true;

  searchQuery: string = '';

  currentSlideIndex: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  totalElement: number = 0;
  totalPages: number = 0;

  private searchSubject = new Subject<String>();
  private sliderInterval: any;
  private savedScrollPosition: number = 0;

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private notification: NotificationService,
    private videoService: VideoService,
    private watchlistService: WatchlistService,
    public mediaService: MediaService,
    public utilityService: UtilityService,
  ) {}

  ngOnInit(): void {
    this.loadFeaturedVideos();
    this.loadVideos();
    this.initializeSearchDebounce();
    this.stopSlider();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.preformSearch();
      });
  }

  loadFeaturedVideos() {
    this.featuredLoading = true;
    this.videoService.getFeaturedVideos().subscribe({
      next: (videos: any) => {
        this.featuredVideos = videos;
        this.featuredLoading = false;

        if (this.featuredVideos.length > 1) {
          this.startSlider();
        }
      },
      error: (err) => {
        this.featuredLoading = false;
        this.errorHandler.handle(err, 'Error loading featured videos.');
      },
    });
  }

  private startSlider() {
    this.sliderInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopSlider() {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  nextSlide() {
    if (this.featuredVideos.length > 0) {
      this.currentSlideIndex =
        (this.currentSlideIndex + 1) % this.featuredVideos.length;
    }
  }

  prevSlide() {
    if (this.featuredVideos.length > 0) {
      this.currentSlideIndex =
        (this.currentSlideIndex - 1 + this.featuredVideos.length) %
        this.featuredVideos.length;
    }
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
    this.stopSlider();

    if (this.featuredVideos.length > 1) {
      this.startSlider();
    }
  }

  getCurrentFeaturedVideo() {
    return this.featuredVideos[this.currentSlideIndex] || null;
  }

  loadVideos(page: number = 0) {
    this.error = false;
    this.currentPage = 0;
    this.allVideos = [];
    this.filteredVideos = [];

    const search = this.searchQuery.trim() || undefined;
    const isSearching = !!search;

    this.loading = true;

    this.videoService
      .getPublishedVideos(page, this.pageSize, search)
      .subscribe({
        next: (res: any) => {
          this.allVideos = res.content;
          this.filteredVideos = res.content;
          this.currentPage = res.number;
          this.totalElement = res.totalElements;
          this.totalPages = res.totalPages;
          this.hasMoreVideos = this.currentPage < this.totalPages - 1;
          this.loading = false;

          if (isSearching && this.savedScrollPosition > 0) {
            setTimeout(() => {
              window.scrollTo({
                top: this.savedScrollPosition,
                behavior: 'auto',
              });
              this.savedScrollPosition = 0;
            }, 0);
          }
        },
        error: (err) => {
          console.error('Error loading videos', err);
          this.error = true;
          this.loading = false;
          this.savedScrollPosition = 0;
        },
      });
  }

  loadMoreVideos() {
    if (this.loadingMore || !this.hasMoreVideos) return;

    this.loadingMore = true;

    const nextPage = this.currentPage + 1;
    const search = this.searchQuery.trim() || undefined;

    this.videoService
      .getPublishedVideos(nextPage, this.pageSize, search)
      .subscribe({
        next: (res: any) => {
          this.allVideos = [...this.allVideos, ...res.content];
          this.filteredVideos = [...this.filteredVideos, ...res.content];
          this.currentPage = res.number;
          this.hasMoreVideos = this.currentPage < this.totalPages - 1;
          this.loadingMore = false;
        },
        error: (err) => {
          this.notification.error('Failed to load more videos.');
          this.loadingMore = false;
        },
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  private preformSearch() {
    this.savedScrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;
    this.currentPage = 0;
    this.loadVideos();
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 0;
    this.savedScrollPosition = 0;
    this.loadVideos();
  }

  isInWatchlist(video: any): boolean {
    return video.isInWatchlist === true;
  }

  toggleWatchlistVideo(video: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const videoId = video.id!;
    const isInList = this.isInWatchlist(video);

    if (isInList) {
      video.isInWatchlist = false;
      this.watchlistService.removeFromWatchlist(videoId).subscribe({
        next: () => {
          this.notification.success('Removed from My Favorites.');
        },
        error: (err) => {
          video.isInWatchlist = true;
          this.errorHandler.handle(
            err,
            'Failed to remove from My Favorites. Please try again.',
          );
        },
      });
    } else {
      video.isInWatchlist = true;
      this.watchlistService.addToWatchlist(videoId).subscribe({
        next: () => {
          this.notification.success('Added to My Favorites.');
        },
        error: (err) => {
          video.isInWatchlist = true;
          this.errorHandler.handle(
            err,
            'Failed to add to My Favorites. Please try again.',
          );
        },
      });
    }
  }

  getPosterUrl(video: any) {
    return (
      this.mediaService.getMediaUrl(video, 'image', {
        userCache: true,
      }) || ''
    );
  }

  playVideo(video: any) {
    this.dialogService.openVideoPlayer(video);
  }

  formatDuration(seconds: number | undefined): string {
    return this.utilityService.formatDuration(seconds);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    if (
      scrollPosition >= pageHeight - 200 &&
      !this.loadingMore &&
      !this.loading &&
      this.hasMoreVideos
    ) {
      this.loadMoreVideos();
    }
  }
}
