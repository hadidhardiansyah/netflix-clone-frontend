import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { DialogService } from '../../shared/services/dialog-service/dialog-service';
import { ErrorHandlerService } from '../../shared/services/error-handler-service/error-handler-service';
import { NotificationService } from '../../shared/services/notification-service/notification-service';
import { VideoService } from '../../shared/services/video-service/video-service';
import { WatchlistService } from '../../shared/services/watchlist-service/watchlist-service';
import { MediaService } from '../../shared/services/media-service/media-service';
import { UtilityService } from '../../shared/services/utility-service/utility-service';

@Component({
  selector: 'app-my-favorites',
  standalone: false,
  templateUrl: './my-favorites.html',
  styleUrl: './my-favorites.css',
})
export class MyFavorites implements OnInit, OnDestroy {
  allVideos: any[] = [];
  filteredVideos: any[] = [];

  loading: boolean = true;
  loadingMore: boolean = false;
  error: boolean = false;
  hasMoreVideos: boolean = true;

  searchQuery: string = '';

  currentPage: number = 0;
  pageSize: number = 10;
  totalElement: number = 0;
  totalPages: number = 0;

  private searchSubject = new Subject<String>();

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
    this.loadVideos();
    this.initializeSearchDebounce();
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

  loadVideos(page: number = 0) {
    this.error = false;
    this.currentPage = 0;
    this.allVideos = [];
    this.filteredVideos = [];

    const search = this.searchQuery.trim() || undefined;

    this.loading = true;

    this.watchlistService.getWatchlist(page, this.pageSize, search).subscribe({
      next: (res: any) => {
        this.allVideos = res.content;
        this.filteredVideos = res.content;
        this.currentPage = res.number;
        this.totalElement = res.totalElements;
        this.totalPages = res.totalPages;
        this.hasMoreVideos = this.currentPage < this.totalPages - 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading videos', err);
        this.error = true;
        this.loading = false;
      },
    });
  }

  loadMoreVideos() {
    if (this.loadingMore || !this.hasMoreVideos) return;

    this.loadingMore = true;

    const nextPage = this.currentPage + 1;
    const search = this.searchQuery.trim() || undefined;

    this.watchlistService
      .getWatchlist(nextPage, this.pageSize, search)
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
    this.currentPage = 0;
    this.loadVideos();
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadVideos();
  }

  toggleWatchlist(video: any, event: Event) {
    if (event) {
      event.stopPropagation();
    }

    const videoId = video.id!;

    this.watchlistService.removeFromWatchlist(videoId).subscribe({
      next: () => {
        this.allVideos = this.allVideos.filter((v: any) => v.id !== videoId);
        this.filteredVideos = this.filteredVideos.filter(
          (v: any) => v.id !== videoId,
        );
        this.notification.success('Removed from My Favorites.');
      },
      error: (err) => {
        this.errorHandler.handle(
          err,
          'Failed to remove from My Favorites. Please try again.',
        );
      },
    });
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
