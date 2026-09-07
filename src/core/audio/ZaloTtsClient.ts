/**
 * src/core/audio/ZaloTtsClient.ts
 * 
 * Client gọi Zalo AI Text-to-Speech API trực tiếp từ trình duyệt
 * Sử dụng giọng Nữ Bắc Ngọc Huyền (Speaker ID: 2), tốc độ 0.9x cho trẻ Lớp 1
 */

export interface ZaloTtsResponse {
  error_code: number;
  error_message: string;
  data?: {
    url: string;
  };
}

export class ZaloTtsClient {
  private static instance: ZaloTtsClient;
  private endpoint = 'https://api.zalo.ai/v1/tts/synthesize';
  private defaultApiKey = 'yVryikwVR8F9V5ei1C6b0yT5k17XE59P';
  private speakerId = '2'; // Nữ Bắc Ngọc Huyền
  private speed = '0.9';

  private constructor() {}

  public static getInstance(): ZaloTtsClient {
    if (!ZaloTtsClient.instance) {
      ZaloTtsClient.instance = new ZaloTtsClient();
    }
    return ZaloTtsClient.instance;
  }

  public getApiKey(): string {
    if (typeof localStorage !== 'undefined') {
      const savedKey = localStorage.getItem('zalo_tts_api_key');
      if (savedKey && savedKey.trim()) return savedKey.trim();
    }
    return this.defaultApiKey;
  }

  public setApiKey(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zalo_tts_api_key', key.trim());
    }
  }

  /**
   * Tổng hợp âm thanh từ một từ hoặc cụm từ tiếng Việt qua Zalo AI TTS
   * @param text Từ cần phát âm (ví dụ: "cánh đồng", "bông hoa")
   * @returns URL file mp3 tải từ Zalo AI
   */
  public async synthesizeText(text: string): Promise<string> {
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('Văn bản rỗng, không thể tổng hợp âm thanh.');
    }

    const apiKey = this.getApiKey();
    const params = new URLSearchParams({
      input: cleanText,
      speaker_id: this.speakerId,
      speed: this.speed,
      encode_type: '1', // mp3
    });

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Zalo AI API HTTP error: ${response.status} ${response.statusText}`);
    }

    const resData = (await response.json()) as ZaloTtsResponse;

    if (resData.error_code !== 0 || !resData.data?.url) {
      throw new Error(`Zalo AI TTS thất bại: ${resData.error_message} (mã: ${resData.error_code})`);
    }

    return resData.data.url;
  }

  /**
   * Tải dữ liệu nhị phân ArrayBuffer của âm thanh từ Zalo AI
   * @param text Từ cần tổng hợp
   */
  public async fetchAudioBuffer(text: string): Promise<ArrayBuffer> {
    const audioUrl = await this.synthesizeText(text);
    const audioRes = await fetch(audioUrl);

    if (!audioRes.ok) {
      throw new Error(`Không thể tải file âm thanh từ URL: ${audioUrl}`);
    }

    return await audioRes.arrayBuffer();
  }
}

export const zaloTtsClient = ZaloTtsClient.getInstance();
