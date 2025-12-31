import { Component, HostListener, OnInit } from '@angular/core';
import { DialogService } from '../../shared/services/dialog-service/dialog-service';
import { MatTableDataSource } from '@angular/material/table';
import { NotificationService } from '../../shared/services/notification-service/notification-service';
import { VideoService } from '../../shared/services/video-service/video-service';
import { UtilityService } from '../../shared/services/utility-service/utility-service';
import { MediaService } from '../../shared/services/media-service/media-service';
import { ErrorHandlerService } from '../../shared/services/error-handler-service/error-handler-service';

@Component({
  selector: 'app-video-list',
  standalone: false,
  templateUrl: './video-list.html',
  styleUrl: './video-list.css',
})
export class VideoList implements OnInit {
  pageVideos: any = [];

  loading: boolean = false;
  loadingMore: boolean = false;
  hasMoreVideos: boolean = true;

  searchQuery: string = '';

  pageSize: number = 10;
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  totalVideos: number = 0;
  publishedVideos: number = 0;
  totalDurationSeconds: number = 0;

  data = new MatTableDataSource<any>([]);

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private notification: NotificationService,
    private videoService: VideoService,
    public utilityService: UtilityService,
    public mediaService: MediaService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadStatus();
  }

  load() {
    this.loading = true;
    this.currentPage = 0;
    this.pageVideos = [];

    const search = this.searchQuery.trim() || undefined;

    this.videoService
      .getAllAdminVideos(this.currentPage, this.pageSize, search)
      .subscribe({
        next: (res: any) => {
          this.pageVideos = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.currentPage = res.number;
          this.hasMoreVideos = this.currentPage < this.totalPages - 1;
          this.loading = false;
        },
        error: (err) => {
          this.loadingMore = false;
          this.errorHandler.handle(err, 'Failed to load more videos');
        },
      });
  }

  loadMoreVideos() {
    if (this.loadingMore || !this.hasMoreVideos) return;

    this.loadingMore = true;

    const nextPage = this.currentPage + 1;
    const search = this.searchQuery.trim() || undefined;

    this.videoService
      .getAllAdminVideos(nextPage, this.pageSize, search)
      .subscribe({
        next: (res: any) => {
          this.pageVideos = [...this.pageVideos, ...res.content];
          this.currentPage = res.number;
          this.hasMoreVideos = this.currentPage < this.totalPages - 1;
          this.loadingMore = false;
        },
        error: (err) => {
          this.loadingMore = false;
          this.errorHandler.handle(err, 'Failed to load more videos');
        },
      });
  }

  loadStatus() {
    this.videoService.getStatusByAdmin().subscribe({
      next: (res: any) => {
        this.totalVideos = res.totalVideos;
        this.publishedVideos = res.publishedVideos;
        this.totalDurationSeconds = res.totalDuration;
      },
    });
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchQuery = input.value;
    this.currentPage = 0;

    this.load();
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 0;

    this.load();
  }

  play(video: any) {
    this.dialogService.openVideoPlayer(video);
  }

  createNew() {
    const dialogRef = this.dialogService.openVideoFormDialog('create');

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.load();
        this.loadStatus();
      }
    });
  }

  edit(video: any) {
    const dialogRef = this.dialogService.openVideoFormDialog('edit', video);

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.load();
        this.loadStatus();
      }
    });
  }

  remove(video: any) {
    this.dialogService
      .openConfirmation(
        'Delete Video?',
        `Are you sure you want to delete ${video.title}? This action cannot be undone.`,
        'Delete',
        'Cancel',
        'danger'
      )
      .subscribe((res) => {
        if (res) {
          this.loading = true;

          this.videoService.deleteVideoByAdmin(video.id).subscribe({
            next: (res: any) => {
              this.notification.success('Video deleted successfully');
              this.load();
              this.loadStatus();
            },
            error: (err) => {
              this.loading = false;
              this.errorHandler.handle(
                err,
                'Failed to delete video. Please try again.'
              );
            },
          });
        }
      });
  }

  togglePublish(event: any, video: any) {
    const newPublishedState = event.checked;

    this.videoService
      .setPublishedByAdmin(video.id, newPublishedState)
      .subscribe({
        next: (res) => {
          video.published = newPublishedState;

          this.notification.success(
            `Video ${
              video.published ? 'published' : 'unpublished'
            } successfully`
          );

          this.loadStatus();
        },
        error: (err) => {
          video.published = !newPublishedState;
          this.errorHandler.handle(
            err,
            'Failed to update publish status. Please try again.'
          );
        },
      });
  }

  getPublishedCount(): number {
    return this.publishedVideos;
  }

  getTotalDuration(): string {
    const total = this.totalDurationSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatDuration(seconds: number): string {
    return this.utilityService.formatDuration(seconds);
  }

  getPosterUrl(video: any) {
    return this.mediaService.getMediaUrl(video, 'image', {
      userCache: true,
    });
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
