import { allAtelierMaterialArtwork } from '../art/atelierArt';
import { allCourierArtwork } from '../art/courierAssets';
import { allCustomerArtwork } from '../art/customerAssets';
import { allEmployeeArtwork } from '../art/employeeAssets';
import { allFurnitureArtwork } from '../art/furnitureAssets';
import { allProductArtwork } from '../art/productAssets';
import { GAME_AUDIO_URLS } from './audio';
import { CASH_DENOMINATIONS } from './cash';

export interface GamePreloadProgress {
  completed: number;
  total: number;
  ratio: number;
  kind: 'image' | 'audio' | 'font';
}

const imageUrls = Object.freeze([...new Set([
  '/assets/characters/main-character.svg',
  '/assets/ui/qr-payment-pastel.png',
  '/assets/ui/visa-card-pastel.png',
  ...CASH_DENOMINATIONS.map(value => `/assets/ui/cash/display/${value}.webp`),
  ...allFurnitureArtwork,
  ...allCustomerArtwork,
  ...allEmployeeArtwork,
  ...allCourierArtwork,
  ...allAtelierMaterialArtwork,
  ...allProductArtwork,
])]);

const retainedInterfaceImages: HTMLImageElement[] = [];

const loadImage = async (url: string) => {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => reject(new Error(`Không tải được ${url}`)), { once: true });
  });
  if (typeof image.decode === 'function') await image.decode().catch(() => undefined);
  // Keep small interface assets decoded so the first modal paint cannot flash.
  if (url.includes('/assets/ui/cash/display/')) retainedInterfaceImages.push(image);
};

const loadFile = async (url: string) => {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Không tải được ${url} (${response.status})`);
  await response.arrayBuffer();
};

const fontJobs = () => {
  if (!document.fonts) return [] as Array<() => Promise<unknown>>;
  return [
    () => document.fonts.load('400 16px "Paytone One"', 'Cửa hàng thời trang Việt Nam'),
    () => document.fonts.load('700 16px "Nunito Variable"', 'Nội dung drama và đánh giá'),
    () => document.fonts.load('700 22px Mali', 'Tiệm Mây Nhỏ'),
    () => document.fonts.ready,
  ];
};

/** Nạp toàn bộ tài nguyên có URL trước khi cho người chơi nhìn thấy màn hình game. */
export async function preloadGameAssets(onProgress?: (progress: GamePreloadProgress) => void) {
  const jobs = [
    ...imageUrls.map(url => ({ kind: 'image' as const, run: () => loadImage(url) })),
    ...GAME_AUDIO_URLS.map(url => ({ kind: 'audio' as const, run: () => loadFile(url) })),
    ...fontJobs().map(run => ({ kind: 'font' as const, run })),
  ];
  let completed = 0;
  const failures: string[] = [];
  const report = (kind: GamePreloadProgress['kind']) => {
    completed += 1;
    onProgress?.({ completed, total: jobs.length, ratio: completed / jobs.length, kind });
  };

  // Tám worker giữ tốc độ tốt nhưng tránh giải mã hàng trăm ảnh cùng lúc trên iOS.
  let cursor = 0;
  const workers = Array.from({ length: Math.min(8, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        await job.run();
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      } finally {
        report(job.kind);
      }
    }
  });
  await Promise.all(workers);
  return { total: jobs.length, failures };
}
