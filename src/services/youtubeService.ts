import { YouTubeChannelProfile, YouTubeUploadConfig } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

// Provisioned OAuth Client ID from Google Cloud / AI Studio OAuth setup
const YOUTUBE_OAUTH_CLIENT_ID = '449866922318-4lvk09ko6k84gtamusjg28got8oa4r0i.apps.googleusercontent.com';
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

class YouTubeService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private tokenClient: any = null;
  private channelProfile: YouTubeChannelProfile | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const stored = sessionStorage.getItem('bm_yt_token');
      const exp = sessionStorage.getItem('bm_yt_token_exp');
      if (stored && exp && Date.now() < Number(exp)) {
        this.accessToken = stored;
        this.tokenExpiresAt = Number(exp);
      }
    } catch {
      // Ignored
    }
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiresAt;
  }

  public getAccessToken(): string | null {
    if (this.isAuthenticated()) {
      return this.accessToken;
    }
    return null;
  }

  public async connectAccount(): Promise<{ success: boolean; channel?: YouTubeChannelProfile; error?: string }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
        resolve({
          success: false,
          error: 'Google Identity Services SDK is loading. Please retry in a few seconds.',
        });
        return;
      }

      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: YOUTUBE_OAUTH_CLIENT_ID,
          scope: YOUTUBE_SCOPES,
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              const tokenStr: string = tokenResponse.access_token;
              this.accessToken = tokenStr;
              const expiresIn = Number(tokenResponse.expires_in || 3599);
              this.tokenExpiresAt = Date.now() + expiresIn * 1000;
              try {
                sessionStorage.setItem('bm_yt_token', tokenStr);
                sessionStorage.setItem('bm_yt_token_exp', String(this.tokenExpiresAt));
              } catch {}

              // Fetch channel details
              const profile = await this.fetchChannelProfile();
              this.channelProfile = profile;
              resolve({ success: true, channel: profile || undefined });
            } else {
              resolve({
                success: false,
                error: tokenResponse?.error_description || 'Authorization was cancelled by user.',
              });
            }
          },
          error_callback: (nonOAuthError: any) => {
            resolve({
              success: false,
              error: nonOAuthError?.message || 'Google OAuth failed to initialize.',
            });
          },
        });

        // Request access token
        this.tokenClient.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        resolve({
          success: false,
          error: err.message || 'Failed to trigger Google YouTube authentication.',
        });
      }
    });
  }

  public async fetchChannelProfile(): Promise<YouTubeChannelProfile | null> {
    if (!this.accessToken) return null;

    try {
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          this.disconnect();
        }
        return null;
      }

      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const profile: YouTubeChannelProfile = {
          id: item.id,
          title: item.snippet?.title || 'YouTube Creator',
          customUrl: item.snippet?.customUrl,
          avatarUrl: item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.high?.url,
          subscriberCount: item.statistics?.subscriberCount,
          videoCount: item.statistics?.videoCount,
        };
        this.channelProfile = profile;
        return profile;
      }
      return null;
    } catch (e) {
      console.warn('Failed to fetch YouTube channel profile:', e);
      return null;
    }
  }

  public getCachedProfile(): YouTubeChannelProfile | null {
    return this.channelProfile;
  }

  public disconnect() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.channelProfile = null;
    try {
      sessionStorage.removeItem('bm_yt_token');
      sessionStorage.removeItem('bm_yt_token_exp');
    } catch {}
  }

  /**
   * Upload video blob to YouTube Data API v3 with progress updates
   */
  public async uploadVideo(
    videoBlob: Blob,
    config: YouTubeUploadConfig,
    onProgress: (percent: number, status: string) => void
  ): Promise<{ success: boolean; videoId?: string; videoUrl?: string; error?: string }> {
    if (!this.isAuthenticated() || !this.accessToken) {
      return {
        success: false,
        error: 'YouTube account is not connected. Please authenticate with Google first.',
      };
    }

    onProgress(5, 'Preparing video package and metadata...');

    try {
      const metadata = {
        snippet: {
          title: config.title.slice(0, 100),
          description: config.description.slice(0, 5000),
          tags: config.tags || ['BrainMateAI', 'AI', 'Technology'],
          categoryId: '28', // Science & Technology
        },
        status: {
          privacyStatus: config.privacy || 'private', // Defaults to private for safety
          selfDeclaredMadeForKids: config.madeForKids || false,
          embeddable: true,
        },
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataString = JSON.stringify(metadata);

      // Create multipart body
      const metaHeader = 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
      const mediaHeader = `Content-Type: ${videoBlob.type || 'video/webm'}\r\n\r\n`;

      const metaBlob = new Blob([delimiter, metaHeader, metadataString, delimiter, mediaHeader], {
        type: 'text/plain',
      });
      const endBlob = new Blob([closeDelimiter], { type: 'text/plain' });

      const combinedBody = new Blob([metaBlob, videoBlob, endBlob], {
        type: `multipart/related; boundary=${boundary}`,
      });

      onProgress(15, 'Establishing upload stream to YouTube...');

      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          'POST',
          'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status'
        );

        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(15 + (event.loaded / event.total) * 75);
            onProgress(percentComplete, `Uploading video data: ${Math.round((event.loaded / 1024 / 1024) * 10) / 10} MB transmitted`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(95, 'Processing video on YouTube servers...');
            try {
              const resData = JSON.parse(xhr.responseText);
              const videoId = resData.id;
              const videoUrl = `https://youtu.be/${videoId}`;
              onProgress(100, 'Video uploaded successfully!');
              resolve({
                success: true,
                videoId,
                videoUrl,
              });
            } catch {
              resolve({
                success: true,
                videoId: 'uploaded',
                videoUrl: 'https://studio.youtube.com',
              });
            }
          } else {
            let errorMsg = `YouTube upload error (HTTP ${xhr.status})`;
            try {
              const errData = JSON.parse(xhr.responseText);
              if (errData?.error?.message) {
                errorMsg = errData.error.message;
              }
            } catch {}
            onProgress(0, `Upload failed: ${errorMsg}`);
            resolve({
              success: false,
              error: errorMsg,
            });
          }
        };

        xhr.onerror = () => {
          onProgress(0, 'Network communication error during YouTube upload.');
          resolve({
            success: false,
            error: 'Network failure during YouTube upload. Please check your internet connection.',
          });
        };

        xhr.send(combinedBody);
      });
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unexpected exception during YouTube upload.',
      };
    }
  }
}

export const youtubeService = new YouTubeService();
