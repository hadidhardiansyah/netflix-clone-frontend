import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {
  RATINGS,
  VIDEO_CATEGORIES,
} from '../../../shared/constants/app.contstants';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { VideoService } from '../../../shared/services/video-service/video-service';
import { NotificationService } from '../../../shared/services/notification-service/notification-service';
import { MediaService } from '../../../shared/services/media-service/media-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorHandlerService } from '../../../shared/services/error-handler-service/error-handler-service';

@Component({
  selector: 'app-manage-video',
  standalone: false,
  templateUrl: './manage-video.html',
  styleUrl: './manage-video.css',
})
export class ManageVideo implements OnInit {
  isSaving: boolean = false;
  videoLoading: boolean = false;
  posterLoading: boolean = false;
  isEditMode: boolean = false;

  uploadProgress = 0;
  posterProgress = 0;

  categoriesAll = VIDEO_CATEGORIES;
  ratings = RATINGS;

  videoForm: any;

  videoPreviewUrl: string | null = null;
  posterPreviewUrl: string | null = null;

  error = '';

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private notification: NotificationService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private mediaService: MediaService,
    public dialogRef: MatDialogRef<ManageVideo>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = data.mode === 'edit';

    this.videoForm = fb.group({
      title: ['', [Validators.required]],
      description: ['', Validators.required],
      year: [
        new Date().getFullYear(),
        Validators.required,
      ],
      rating: ['', Validators.required],
      categories: [[] as string[], [Validators.required, ManageVideo.arrayNotEmpty]],
      duration: [0],
      src: ['', [Validators.required]],
      poster: ['', [Validators.required]],
      published: [false],
    });
  }

  ngOnInit(): void {
    if (this.isEditMode) {
      const video = this.data.video;

      this.videoForm.patchValue({
        title: video.title,
        description: video.description,
        year: video.year,
        rating: video.rating,
        categories: video.categories,
        duration: video.duration,
        src: this.extractUuidFromUrl(video.src),
        poster: this.extractUuidFromUrl(video.poster),
        published: video.published,
      });

      if (video.src) this.loadVideoPreview(video.src);
      if (video.poster) this.loadPosterreview(video.poster);
    }
  }

  static arrayNotEmpty(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value || (Array.isArray(value) && value.length === 0)) {
      return { required: true };
    }

    return null;
  }

  private loadVideoPreview(value: string | null): void {
    this.videoPreviewUrl = this.mediaService.getMediaUrl(value, 'video');
    this.videoLoading = false;
    this.cdr.detectChanges();
  }

  private loadPosterreview(value: string | null): void {
    this.posterPreviewUrl = this.mediaService.getMediaUrl(value, 'image');
    this.posterLoading = false;
    this.cdr.detectChanges();
  }

  private extractUuidFromUrl(value: string | undefined | null): string {
    if (!value) return '';

    if (!value.includes('/')) {
      return value;
    }

    const segments = value.split('/');

    return segments[segments.length - 1] || '';
  }

  onVideoPicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) return;

    const validVideoExtensions = [
      '.mp4',
      '.mkv',
      '.avi',
      '.mov',
      '.wmv',
      '.flv',
      '.webm',
      '.m4v',
      '.3gp',
      '.mpeg',
      '.mpg',
      '.ogg',
    ];
    const fileName = file.name.toLowerCase();

    const hasValidExtension = validVideoExtensions.some((ext) =>
      fileName.endsWith(ext)
    );
    const hasValidMimeType =
      file.type.startsWith('video/') ||
      file.type === 'application/octet-stream';

    if (!hasValidMimeType && !hasValidExtension) {
      this.notification.error(
        'Please select a valid video file(MP4, MKV, etc.)'
      );
      return;
    }

    const localBlobUrl = URL.createObjectURL(file);

    this.videoPreviewUrl = localBlobUrl;

    this.extractDurationFromFile(file);

    this.uploadProgress = 0;

    this.mediaService.uploadFile(file).subscribe({
      next: ({ progress, uuid }) => {
        this.uploadProgress = progress;

        if (uuid) {
          this.videoForm.patchValue({ src: uuid });
          this.notification.success('Video uploaded successfully');
        }
      },
      error: (err) => {
        this.notification.error(
          'Failed to upload video. Please try again.',
          err
        );
        this.uploadProgress = 0;

        if (this.videoPreviewUrl === localBlobUrl) {
          URL.revokeObjectURL(localBlobUrl);

          this.videoPreviewUrl = null;
        }
      },
    });
  }

  onPosterPicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notification.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.posterPreviewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    this.posterProgress = 0;

    this.mediaService.uploadFile(file).subscribe({
      next: ({ progress, uuid }) => {
        this.posterProgress = progress;

        if (uuid) {
          this.videoForm.patchValue({ poster: uuid });
          this.notification.success('Poster uploaded successfully');
        }
      },
      error: (err) => {
        this.notification.error(
          'Failed to upload poster. Please try again.',
          err
        );
        this.posterProgress = 0;
        this.posterPreviewUrl = null;
      },
    });
  }

  private extractDurationFromFile(file: File) {
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    const blobUrl = URL.createObjectURL(file);
    videoElement.src = blobUrl;
    videoElement.onloadedmetadata = () => {
      const duration = isFinite(videoElement.duration)
        ? Math.round(videoElement.duration)
        : 0;

      this.videoForm.patchValue({ duration: duration });
      URL.revokeObjectURL(blobUrl);
    };

    videoElement.onerror = (e) => {
      console.error('Error loading video for duration extraction: ', e);
      URL.revokeObjectURL(blobUrl);
    };
  }

  onSave() {
    this.isSaving = true;

    const rawData = this.videoForm.value as Partial<any>;

    const payload = {
    ...rawData,
    src: rawData['src']?.uuid ? rawData['src'].uuid : rawData['src'],
    poster: rawData['poster']?.uuid ? rawData['poster'].uuid : rawData['poster']
  };

    console.log('Payload Detail:', JSON.stringify(this.videoForm.value, null, 2));

    const op$ = this.isEditMode
      ? this.videoService.updateVideoByAdmin(this.data.video.id, payload)
      : this.videoService.createVideoByAdmin(payload);

    op$.subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.notification.success(res?.message || 'Video saved successfully.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorHandler.handle(
          err,
          'Failed to save video. Please try again.'
        );
      },
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  removeVideo() {
    if (this.videoPreviewUrl && this.videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.videoPreviewUrl);
    }

    this.videoPreviewUrl = null;
    this.videoForm.patchValue({ src: '', duration: 0 });
    this.uploadProgress = 0;
  }

  removePoster() {
    if (this.posterPreviewUrl && this.posterPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.posterPreviewUrl);
    }

    this.posterPreviewUrl = null;
    this.videoForm.patchValue({ poster: '' });
    this.uploadProgress = 0;
  }
}
