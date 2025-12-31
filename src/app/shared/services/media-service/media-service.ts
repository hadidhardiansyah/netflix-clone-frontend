import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { AuthService } from '../auth-service/auth-service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = environment.apiUrl + '/files';
  private imageCache = new Map<string, string>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  uploadFile(file: File): Observable<{ progress: number; uuid?: string }> {
    const formData = new FormData();

    formData.append('file', file);

    const isVideo = file.type.startsWith('video/');
    const uplaodUrl = isVideo
      ? `${this.apiUrl}/upload/video`
      : `${this.apiUrl}/upload/image`;
    const req = new HttpRequest('POST', uplaodUrl, formData, {
      reportProgress: true,
    });

    return this.http.request(req).pipe(
      map((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(
            (100 * event.loaded) / (event.total || 1)
          );

          return { progress };
        } else if (event.type === HttpEventType.Response) {
          const body = event.body as any;

          return { progress: 100, uuid: body };
        }

        return { progress: 0 };
      })
    );
  }

  getMediaUrl(
    mediaValue: any,
    type: 'image' | 'video',
    option?: {
      userCache?: boolean;
    }
  ): string | null {
    let value = mediaValue;

    if (type === 'image' && mediaValue && typeof mediaValue === 'object' && mediaValue.poster) {
      value = mediaValue.poster;
    }

    if (!value) {
      return null;
    }

    let uuid = value;

    if (value.includes(`/${type}/`)) {
      uuid = value.substring(value.lastIndexOf('/') + 1);
    }

    if (option?.userCache && type === 'image' && this.imageCache.has(uuid)) {
      return this.imageCache.get(uuid)!;
    }

    if (uuid.startsWith('blob:') || uuid.startsWith('data:')) {
      return uuid;
    }

    const token = this.authService.getToken();

    if (!token) {
      console.log(`No token found for ${type} loading`);

      return null;
    }

    const authenticatedUrl = `${this.apiUrl}/${type}/${uuid}?token=${encodeURIComponent(token)}`;

    if (option?.userCache && type === 'image') {
      this.imageCache.set(uuid, authenticatedUrl);
    }

    return authenticatedUrl;
  }
}
