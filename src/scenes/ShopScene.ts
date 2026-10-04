import Phaser from 'phaser';
import { characterSvg, furnitureSvg, getCustomerArchetype, heartSvg, isWallArtAsset, roomSvg, roomSvgBounds, svgUrl } from '../art/svg';
import { EMPLOYEE_APPEARANCE_COUNT, employeeArtwork } from '../art/employeeAssets';
import { customerArtwork } from '../art/customerAssets';
import { COURIER_APPEARANCE_COUNT, courierArtwork } from '../art/courierAssets';
import { externalFurnitureArtwork } from '../art/furnitureAssets';
import { customers, furniture, products } from '../data/catalog';
import type { GameStore } from '../systems/store';
import { activeCustomer, activeEmployees, activeVisit, canPlace, customerNeedsAdvice, isWallFurnitureId, landExpansion, landSize, nextLandExpansion, randomBrowseThought } from '../systems/rules';
import type { PlacedFurniture, SaleResult, Customer } from '../types';
import { lookupCustomer } from '../systems/customerGen';
import { gameDate } from '../systems/calendar';

export const toWorld = (x: number, y: number) => ({ x: 500 + (x - y) * 56, y: 225 + (x + y) * 28 });
const furnitureFootprint = (item: PlacedFurniture) => {
  const definition = furniture.find(candidate => candidate.id === item.id);
  if (!definition) return { width: 1, height: 1 };
  return item.rotation % 2
    ? { width: definition.height, height: definition.width }
    : { width: definition.width, height: definition.height };
};
const furnitureAnchor = (item: PlacedFurniture) => {
  const footprint = furnitureFootprint(item);
  return toWorld(item.x + footprint.width / 2, item.y + footprint.height / 2);
};
const toFurnitureGrid = (item: PlacedFurniture, x: number, y: number) => {
  const footprint = furnitureFootprint(item);
  const gridX = ((x - 500) / 56 + (y - 225) / 28) / 2;
  const gridY = ((y - 225) / 28 - (x - 500) / 56) / 2;
  return {
    x: Math.round(gridX - footprint.width / 2),
    y: Math.round(gridY - footprint.height / 2),
  };
};
const toWallGrid = (item: PlacedFurniture, x: number, y: number) => {
  const vx = item.rotation === 1 ? -56 : 56;
  const vy = 28;
  const distance = ((x - 500) * vx + (y - 225) * vy) / (vx * vx + vy * vy);
  const span = furniture.find(definition => definition.id === item.id)?.width ?? 1;
  const slot = Math.round(distance - span / 2);
  return item.rotation === 1 ? { x: 0, y: slot } : { x: slot, y: 0 };
};
const shopSignTextureKey = (side: 'left' | 'right', name: string) => {
  const hash = Array.from(name).reduce((value, char) => Math.imul(value ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0, 2166136261);
  return `f-shop-sign-${side}-${hash.toString(36)}`;
};

// Every visible pixel belongs to the furniture hit area. Fully transparent
// padding remains click-through so nearby furniture can still be selected.
const FURNITURE_HIT_ALPHA_TOLERANCE = 1;
const PRIMARY_CUSTOMER_SCALE = 0.5;
const SECONDARY_CUSTOMER_SCALE = 0.46;
const STAFF_SCALE = 0.5;
const COURIER_SCALE = 0.5;
const SHOP_ZOOM_MIN = 0.7;
const SHOP_ZOOM_MAX = 1.6;
const CENTERED_FURNITURE_ART = new Set([
  'rack', 'shoe-shelf', 'bag-stand', 'table',
  'wall-rack', 'shoe-cabinet', 'bag-cabinet', 'lux-rack', 'couture-rack',
  'glass-showcase', 'global-showcase', 'atelier-island', 'jewel-shoe-wall',
  'flowers', 'plant', 'mannequin', 'monstera-plant', 'beanbag', 'vinyl-player',
  'coffee-corner', 'counter', 'sofa',
  'coquette-mirror', 'wavy-mirror', 'mirror', 'tulip-lamp', 'perfume-table',
  'champagne-sofa', 'runway-mannequin',
  'fitting',
]);
const SMALL_IMPORTED_FURNITURE_ART = new Set([
  'flowers', 'plant', 'mannequin', 'monstera-plant', 'beanbag', 'vinyl-player',
  'coquette-mirror', 'wavy-mirror', 'mirror', 'tulip-lamp', 'perfume-table',
]);
const LARGE_IMPORTED_MIRROR_ART = new Set(['coquette-mirror', 'wavy-mirror', 'mirror']);
const IMPORTED_RUG_ART = new Set(['atelier-rug', 'heart-rug', 'checkered-rug']);
const IMPORTED_WALL_ART = new Set([
  'blush-blinds', 'botanical-print', 'shoe-sketch-print', 'parfum-print', 'runway-print',
  'fashion-print', 'gallery-print', 'ribbon-sign', 'lightbox-sign', 'neon-sign',
]);
// Chỉnh riêng độ cao đồ treo tường: số dương = dịch lên, số âm = dịch xuống.
const IMPORTED_WALL_LIFT: Partial<Record<string, number>> = {
  // Mỗi giá trị bù cho khoảng trong suốt khác nhau trong PNG để tâm phần
  // nhìn thấy của biển trùng với tâm theo chiều cao của bức tường.
  'ribbon-sign': 36,
  'lightbox-sign': 40,
  'neon-sign': 47,
};
// The imported furniture PNGs share a 360x460 canvas and their floor-contact
// line is normalized to y=440. Use that exact point as the ground anchor.
const CENTERED_FURNITURE_ORIGIN = { x: .5, y: 440 / 460 };
const SHOP_SIGN_FONT_SCALE = 0.9;

const shopSignTextLayout = (name: string) => {
  const normalized = (name.trim() || 'My Little Boutique').normalize('NFC');
  const words = normalized.split(/\s+/);
  let lines = [normalized];
  if (normalized.length > 13) {
    if (words.length > 1) {
      let splitAt = 1;
      let smallestDifference = Number.POSITIVE_INFINITY;
      for (let index = 1; index < words.length; index++) {
        const difference = Math.abs(words.slice(0, index).join(' ').length - words.slice(index).join(' ').length);
        if (difference < smallestDifference) {
          smallestDifference = difference;
          splitAt = index;
        }
      }
      lines = [words.slice(0, splitAt).join(' '), words.slice(splitAt).join(' ')];
    } else {
      const middle = Math.ceil(normalized.length / 2);
      lines = [normalized.slice(0, middle), normalized.slice(middle)];
    }
  }
  const longest = Math.max(...lines.map(line => line.length));
  const baseFontSize = longest > 20 ? 14 : longest > 16 ? 17 : longest > 12 ? 20 : 24;
  return { lines, fontSize: Math.round(baseFontSize * SHOP_SIGN_FONT_SCALE) };
};

/* Danh sách câu thoại & cảm thán dễ thương của chủ shop (Retro Anime Boutique) */
const OWNER_IDLE_CHATS_PREP = [
  'Đã là ủi phẳng phiu mấy mẫu váy mới rồi nè~',
  'Góc này bày thêm vài bộ đồ nữa là chuẩn boutique xinh!',
  'Hôm nay thời tiết đẹp quá, chuẩn bị mở tiệm thôi nào~',
  'Tủ đồ hôm nay toàn mẫu hot trend ưng bụng ghê!',
  'Boutique thơm phức mùi tinh dầu dịu nhẹ ghê á~',
  'Sẵn sàng tràn đầy năng lượng cho ngày mới rồi nè!',
  'Ước gì hôm nay mở bán cháy hàng luôn hihi~',
  'Ngắm góc shop nhỏ này hoài không thấy chán luôn á!',
];

const OWNER_IDLE_CHATS_WAITING = [
  'Khách yêu ơi, shop mở cửa rồi nè, ghé vào chơi đi nào~',
  'Đang đứng ngóng khách yêu đây, hôm nay nhiều đồ xinh lắm!',
  'Ủa sao giờ này tiệm vẫn vắng ta, mau ghé ủng hộ em đi~',
  'Hôm nay phong cách Y2K với Pastel đang lên ngôi đó nha~',
  'Đứng ngóng khách ghé mở bát may mắn nè!',
  'Hôm nay ai ghé mình sẽ tư vấn bộ outfit đỉnh chóp nhất!',
  'Có ai ghé thử mấy mẫu áo baby tee mới về không ta~',
  'Shop mát rượi, đồ xinh xắn đang đợi các nàng thơ nè~',
];

const OWNER_WELCOME_CHATS = [
  'Dạ em chào chị iu, cứ tự nhiên ngắm đồ nha ạ~',
  'Chào bạn nha! Cần tư vấn phối đồ cứ ới mình nhen~',
  'Woa, bạn khách này mặc đồ có gu quá đi mất!',
  'Chào mừng bạn đến với My Little Boutique xinh xắn!',
  'Hôm nay shop có nhiều mẫu mới hợp phong cách bạn lắm á!',
];

const OWNER_ADVICE_CHATS = [
  'Chào bạn, mình sẵn sàng phối một set thật hợp gu nè!',
  'Bạn cần tư vấn phải không? Chạm vào bạn để mình cùng chọn đồ nha.',
  'Để mình xem phong cách bạn đang tìm rồi phối thử vài món nhé!',
];

const OWNER_BROWSE_CHATS = [
  'Chào bạn nha, cứ tự nhiên xem những món đang trưng bày nhé!',
  'Bạn cứ chọn đồ thoải mái, cần gì cứ gọi mình nha.',
  'Mẫu mới đều đang ở trên kệ đó, bạn thử xem nha!',
];

const OWNER_SALE_SUCCESS_CHATS = [
  'Cảm ơn bạn iu nhiều nha, mặc lên bao xinh xỉu luôn!',
  'Hợp với bạn cực kỳ luôn á, nhớ ghé lại shop nha!',
  'Hihi khách có gu phối đồ đỉnh thật sự luôn nè!',
];

const OWNER_SALE_LEAVE_CHATS = [
  'Không sao nè, lần tới sẽ có nhiều mẫu mới hợp gu bạn hơn!',
  'Hẹn gặp lại bạn lần sau nha, shop luôn chào đón bạn!',
];

export class ShopScene extends Phaser.Scene {
  private store: GameStore;
  private pieces = new Map<string, Phaser.GameObjects.Image>();
  private avatar?: Phaser.GameObjects.Container;
  private speechBubbleContainer?: Phaser.GameObjects.Container;
  private speechBubbleGfx?: Phaser.GameObjects.Graphics;
  private speechBubbleText?: Phaser.GameObjects.Text;
  private secondaryCustomers = new Map<string, { container: Phaser.GameObjects.Container; chat: Phaser.GameObjects.Container }>();
  private customerPositions = new Map<string, { x: number; y: number }>();
  private customerTextureAssignments = new Map<string, string>();
  private primaryVisitUid = '';
  private customerActionTimer?: Phaser.Time.TimerEvent;
  private customerWalkTween?: Phaser.Tweens.Tween;
  private customerId = '';
  private room!: Phaser.GameObjects.Image;
  private grid!: Phaser.GameObjects.Graphics;
  private landExpandButtons: Phaser.GameObjects.Container[] = [];
  private pendingSvgTextures = new Set<string>();
  private furnitureVisualOrigins = new Map<string, { x: number; y: number }>();
  private renderedLandLevel = -1;
  private renderedDefaultLamp?: boolean;
  private renderedGridSize = -1;
  private selected?: string;
  private edit = false;
  private departing = false;
  private focusCallback: () => void;
  private selectCallback: (uid?: string) => void;
  private unsubscribe?: () => void;
  private resizeObserver?: ResizeObserver;
  private dragGhost?: Phaser.GameObjects.Graphics;
  private selectionArrows?: Phaser.GameObjects.Graphics;
  private selectionPulseTween?: Phaser.Tweens.Tween;
  private selectionPulseImage?: Phaser.GameObjects.Image;
  private selectionPulseUid?: string;
  private zoomed = false;
  private departureTimer?: Phaser.Time.TimerEvent;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private camStartX = 0;
  private camStartY = 0;
  private hasPanned = false;
  private pinchDist = 0;
  private pinchZoom = 1;
  private pinchPointerIds: [number, number] | undefined;
  private panPointerId = -1;
  private activeTouchPointerIds = new Set<number>();
  private activeNativeTouchPointerIds = new Set<number>();
  private gestureEpoch = 0;
  private isDraggingPiece = false;
  private furnitureGesturePointerId = -1;
  private furnitureGestureUid?: string;
  private furnitureDragPointerId = -1;
  private furnitureDragUid?: string;
  private selectionClearBlockedUntil = 0;
  private currentTab = 'shop';
  private readonly coarsePointer = typeof window !== 'undefined'
    && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  private tapTolerance(pointer?: Phaser.Input.Pointer) {
    const nativeEvent = pointer?.event as PointerEvent | undefined;
    return nativeEvent?.pointerType === 'touch' || this.coarsePointer ? 14 : 8;
  }
  private pointerIsCoveredByUi(pointer: Phaser.Input.Pointer) {
    const nativeEvent = pointer.event as PointerEvent | undefined;
    if (!nativeEvent || typeof nativeEvent.clientX !== 'number' || typeof nativeEvent.clientY !== 'number') return false;
    const topElement = document.elementFromPoint(nativeEvent.clientX, nativeEvent.clientY);
    const canvas = this.game.canvas;
    return !!topElement && topElement !== canvas && !canvas.contains(topElement);
  }
  private furniturePixelHitTest = (_hitArea: unknown, x: number, y: number, gameObject: Phaser.GameObjects.GameObject) => {
    const image = gameObject as Phaser.GameObjects.Image;
    const width = image.frame.width;
    const height = image.frame.height;
    if (x < 0 || y < 0 || x >= width || y >= height) return false;

    // Phaser has already converted the pointer through camera, position,
    // rotation, scale, parent and origin transforms. flipX / flipY only change
    // the rendered UVs, so mirror the texture coordinates here as well.
    const textureX = image.flipX ? width - 1 - x : x;
    const textureY = image.flipY ? height - 1 - y : y;
    const alpha = this.textures.getPixelAlpha(
      Math.floor(textureX),
      Math.floor(textureY),
      image.texture.key,
      image.frame.name,
    );
    return alpha !== null && alpha >= FURNITURE_HIT_ALPHA_TOLERANCE;
  };
  private furnitureDragHitTest = () => true;
  setSaleSpeed(speed: 1 | 2 | 4) {
    if (this.time) this.time.timeScale = speed;
    if (this.tweens) this.tweens.timeScale = speed;
  }
  private owner?: Phaser.GameObjects.Image;
  private ownerMoveTween?: Phaser.Tweens.Tween;
  private ownerIdleTween?: Phaser.Tweens.Tween;
  private ownerWalkTween?: Phaser.Tweens.Tween;
  private ownerSpeechBubble?: Phaser.GameObjects.Container;
  private ownerSpeechGfx?: Phaser.GameObjects.Graphics;
  private ownerSpeechText?: Phaser.GameObjects.Text;
  private ownerThoughtTimer?: Phaser.Time.TimerEvent;
  private ownerHideTimer?: Phaser.Time.TimerEvent;
  private ownerMusicNoteTimer?: Phaser.Time.TimerEvent;
  private ownerQueuedSpeechTimer?: Phaser.Time.TimerEvent;
  private ownerMusicNotesUntil = 0;
  private staffAvatars = new Map<string, Phaser.GameObjects.Container>();
  private staffWorkLabels = new Map<string, Phaser.GameObjects.Text>();
  private onlineShippers = new Map<string, Phaser.GameObjects.Container>();

  constructor(store: GameStore, focus: () => void, select: (uid?: string) => void, private onlineOrderCallback: (orderId: string) => void = () => { }, private musicPlayerCallback: () => void = () => { }) {
    super('ShopScene'); this.store = store; this.focusCallback = focus; this.selectCallback = select;
  }
  setTab(tab: string) {
    this.currentTab = tab;
    this.input.enabled = (tab === 'shop' || tab === 'decor');
    this.updateLandExpansionButtons();
    if (this.scene.isActive()) this.refreshStaff();
  }
  preserveSelectionForUiAction() {
    this.selectionClearBlockedUntil = Date.now() + 180;
  }
  releasePointerGesture() {
    const wasDraggingPiece = this.isDraggingPiece;
    this.isPanning = false;
    this.hasPanned = false;
    this.pinchDist = 0;
    this.pinchPointerIds = undefined;
    this.panPointerId = -1;
    this.activeTouchPointerIds.clear();
    this.activeNativeTouchPointerIds.clear();
    this.gestureEpoch++;
    this.furnitureGesturePointerId = -1;
    this.furnitureGestureUid = undefined;
    this.furnitureDragPointerId = -1;
    this.furnitureDragUid = undefined;
    this.isDraggingPiece = false;
    // Phaser documents resetPointers specifically for cases where DOM UI or a
    // third-party component steals the matching pointer-up event. Without it,
    // pointer2 can remain down and the next one-finger drag becomes a pinch.
    this.input?.resetPointers();
    if (wasDraggingPiece) {
      this.dragGhost?.clear();
      for (const piece of this.pieces.values()) {
        piece.setAlpha(1);
        if (piece.input) {
          piece.input.hitAreaCallback = this.furniturePixelHitTest;
          piece.input.enabled = this.store.state.phase !== 'open' || piece.getData('furnitureId') === 'vinyl-player';
        }
      }
      if (this.scene.isActive()) this.refreshFurniture();
    }
  }
  focusTutorialFurniture(uid: string) {
    const image = this.pieces.get(uid);
    if (!image || !this.cameras?.main) return false;
    this.cameras.main.pan(image.x, image.y - 18, 280, 'Sine.easeInOut');
    return true;
  }
  preload() {
    this.load.on('progress', (ratio: number) => {
      window.dispatchEvent(new CustomEvent<number>('game-asset-progress', { detail: ratio }));
    });
    // One furniture cell is split into two visible floor tiles in roomSvg,
    // so each land tier adds exactly two floor tiles along every edge.
    for (let level = 0; level < landExpansion.length; level++) {
      this.load.svg(`room-${level}`, svgUrl(roomSvg(landExpansion[level].size, true)));
      this.load.svg(`room-${level}-no-default-lamp`, svgUrl(roomSvg(landExpansion[level].size, false)));
    }
    for (const f of furniture) {
      if (isWallArtAsset(f.art)) {
        // Biển tên phụ thuộc webfont và tên shop hiện tại; tạo texture sau khi font sẵn sàng.
        if (f.art === 'shop-sign') continue;
        const rightKey = f.art === 'shop-sign' ? shopSignTextureKey('right', this.store.state.shopName) : `f-${f.art}-right`;
        const leftKey = f.art === 'shop-sign' ? shopSignTextureKey('left', this.store.state.shopName) : `f-${f.art}-left`;
        const artwork = externalFurnitureArtwork(f.art);
        if (artwork) {
          if (!this.textures.exists(rightKey)) this.load.image(rightKey, artwork);
          if (!this.textures.exists(leftKey)) this.load.image(leftKey, artwork);
        } else {
          if (!this.textures.exists(rightKey)) this.load.svg(rightKey, svgUrl(furnitureSvg(f.art, 'right', this.store.state.shopName)));
          if (!this.textures.exists(leftKey)) this.load.svg(leftKey, svgUrl(furnitureSvg(f.art, 'left', this.store.state.shopName)));
        }
      } else if (!this.textures.exists(`f-${f.art}`)) {
        const artwork = externalFurnitureArtwork(f.art);
        if (artwork) this.load.image(`f-${f.art}`, artwork);
        else this.load.svg(`f-${f.art}`, svgUrl(furnitureSvg(f.art)));
      }
    }
    for (const c of customers) {
      const artwork = customerArtwork(c.id);
      if (artwork) this.load.image(`c-${c.id}`, artwork);
      else this.load.svg(`c-${c.id}`, svgUrl(characterSvg(c)));
      const happyArtwork = customerArtwork(c.id, 'happy');
      if (happyArtwork) this.load.image(`c-${c.id}-happy`, happyArtwork);
    }
    const ownerAsset = '/assets/characters/main-character.svg';
    const ownerTextureSize = { width: 147, height: 160 };
    this.load.svg('owner', ownerAsset, ownerTextureSize);
    this.load.svg('owner-pc', ownerAsset, ownerTextureSize);
    for (let appearance = 0; appearance < EMPLOYEE_APPEARANCE_COUNT; appearance++) this.load.image(`staff-photo-${appearance}`, employeeArtwork(appearance));
    for (let variant = 0; variant < COURIER_APPEARANCE_COUNT; variant++) this.load.image(`courier-photo-${variant}`, courierArtwork(variant));
    this.load.svg('heart', svgUrl(heartSvg()));
  }
  create() {
    this.input.setTopOnly(true);
    const landLevel = Math.max(0, Math.min(landExpansion.length - 1, this.store.state.landLevel ?? 0));
    const roomBounds = roomSvgBounds(landExpansion[landLevel].size);
    const showDefaultLamp = !this.store.state.layout.some(item => item.id === 'crystal-chandelier');
    const roomTexture = showDefaultLamp ? `room-${landLevel}` : `room-${landLevel}-no-default-lamp`;
    this.renderedDefaultLamp = showDefaultLamp;
    this.room = this.add.image(roomBounds.x, 0, roomTexture).setOrigin(0, 0).setDepth(-1000);
    const selectionSurface = this.add.rectangle(500, 380, 1100, 760, 0xffffff, 0).setDepth(-999).setInteractive();
    let surfaceDownX = 0, surfaceDownY = 0;
    selectionSurface.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      surfaceDownX = pointer.x;
      surfaceDownY = pointer.y;
    });
    selectionSurface.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (Date.now() < this.selectionClearBlockedUntil) return;
      if (this.currentTab !== 'shop' || this.edit || this.hasPanned) return;
      if (Phaser.Math.Distance.Between(surfaceDownX, surfaceDownY, pointer.x, pointer.y) >= this.tapTolerance(pointer)) return;
      if (this.selected) {
        this.selected = undefined;
        this.selectCallback(undefined);
        this.refreshFurniture();
      }
    });
    this.grid = this.add.graphics().setDepth(-500).setVisible(false);
    this.dragGhost = this.add.graphics().setDepth(999);
    this.selectionArrows = this.add.graphics().setDepth(1250);
    this.drawGrid();
    this.refresh();
    this.time.addEvent({
      // Advice dots only change every 420 ms. Matching that cadence avoids
      // repeatedly measuring chat bounds between visible updates.
      delay: 420, loop: true, callback: () => {
        this.updateAdviceWaitingState();
        this.reflowCustomerChats();
      }
    });
    this.updateOwnerPosition(false);
    this.setupOwnerSpeechBubble();
    this.startOwnerChatter();
    this.startOwnerMusicNotes();
    this.unsubscribe = this.store.subscribe(event => {
      if (event.type === 'change') {
        if (this.store.state.phase === 'open' && (this.selected || this.edit)) {
          this.selected = undefined;
          this.edit = false;
          this.grid?.setVisible(false);
          this.selectionArrows?.clear();
          this.selectCallback(undefined);
          this.moveModeChangeCallback?.(false);
          this.updateLandExpansionButtons();
        }
        this.drawGrid();
        this.refreshFurniture();
        this.refreshOnlineShippers();
      }
      if (event.type === 'customer') this.refreshCustomer();
      if (event.type === 'sale') this.animateSale(event.result);
      if (event.type === 'change' && this.store.state.phase !== 'open') this.clearCustomer();
    });
    this.input.on('dragstart', (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!this.edit) return;
      const uid = obj.getData('uid') as string;
      // The first piece that starts moving owns the drag until it is released.
      // Phaser can emit dragstart before an Image's pointerdown callback on
      // emulated touch input, so ownership is established here.
      if (this.isDraggingPiece) return;
      if (this.pinchPointerIds || this.activeTouchPointerIds.size > 1) {
        this.input.setDragState(pointer, 0);
        return;
      }
      this.isDraggingPiece = true;
      this.furnitureGesturePointerId = pointer.id;
      this.furnitureDragPointerId = pointer.id;
      this.furnitureDragUid = uid;
      this.isPanning = false;
      this.pinchDist = 0;
      this.pinchPointerIds = undefined;
      this.panPointerId = -1;
      this.stopSelectionPulse();
      this.selectionArrows?.clear();
      obj.setData('dragCell', undefined);
      if (this.selected !== uid) {
        this.selected = uid;
        this.selectCallback(uid);
        this.moveModeChangeCallback?.(true, uid);
      }
      // Phaser performs hit tests for every enabled interactive image on each
      // pointer move. While dragging, only the active piece needs input.
      for (const [pieceUid, piece] of this.pieces) {
        if (pieceUid !== uid && piece.input) piece.input.enabled = false;
      }
      // Once Phaser has captured the drag, alpha hit-testing is unnecessary.
      // Replace it temporarily with a constant callback to avoid texture reads
      // on every pointer move.
      if (obj.input) obj.input.hitAreaCallback = this.furnitureDragHitTest;
      const draggingWallItem = isWallFurnitureId(obj.getData('furnitureId'));
      obj.setAlpha(.75).setDepth(draggingWallItem ? -600 : 1000);
    });
    this.input.on('drag', (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => {
      if (!this.edit || !this.isDraggingPiece || pointer.id !== this.furnitureDragPointerId
        || obj.getData('uid') !== this.furnitureDragUid) return;
      const p = this.store.state.layout.find(p => p.uid === obj.getData('uid'));
      if (!p) return;
      const wallLift = obj.getData('wallLift') ?? 0;
      const wallMounted = isWallFurnitureId(p.id);
      const floorEndOffset = wallMounted ? 0 : this.furnitureFloorEndOffset(p);
      const rawCell = wallMounted ? toWallGrid(p, x, y + wallLift) : toFurnitureGrid(p, x, y - floorEndOffset);
      const placement = wallMounted
        ? { cell: rawCell, valid: canPlace(this.store.state.layout, { ...p, ...rawCell }, this.store.state.landLevel) }
        : this.resolveFloorPlacement(p, rawCell, x, y - floorEndOffset);
      const { cell, valid } = placement;
      // Floor furniture follows the pointer every frame. Grid validation and
      // preview drawing below only run when the pointer enters another cell.
      if (!wallMounted) obj.setPosition(x, y);
      else {
        const vx = p.rotation === 1 ? -56 : 56;
        const vy = 28;
        const span = furniture.find(definition => definition.id === p.id)?.width ?? 1;
        const pointerDistance = ((x - 500) * vx + (y + wallLift - 225) * vy) / (vx * vx + vy * vy);
        const centerDistance = Phaser.Math.Clamp(pointerDistance, span / 2, landSize(this.store.state) - span / 2);
        const anchor = p.rotation === 1 ? toWorld(0, centerDistance) : toWorld(centerDistance, 0);
        obj.setPosition(anchor.x, anchor.y - wallLift);
      }
      const previousCell = obj.getData('dragCell') as { x: number; y: number } | undefined;
      if (previousCell?.x === cell.x && previousCell.y === cell.y) return;
      obj.setData('dragCell', cell);
      this.drawGhost({ ...p, ...cell }, valid);
    });
    this.input.on('dragend', (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!this.edit || !this.isDraggingPiece || pointer.id !== this.furnitureDragPointerId
        || obj.getData('uid') !== this.furnitureDragUid) return;
      this.isDraggingPiece = false;
      if (this.furnitureDragPointerId === pointer.id) this.furnitureDragPointerId = -1;
      this.furnitureDragUid = undefined;
      if (this.furnitureGesturePointerId === pointer.id) {
        this.furnitureGesturePointerId = -1;
        this.furnitureGestureUid = undefined;
      }
      const p = this.store.state.layout.find(piece => piece.uid === obj.getData('uid'));
      const cell = obj.getData('dragCell') ?? (p && isWallFurnitureId(p.id)
        ? toWallGrid(p, obj.x, obj.y + (obj.getData('wallLift') ?? 0))
        : p ? toFurnitureGrid(p, obj.x, obj.y - this.furnitureFloorEndOffset(p)) : { x: 0, y: 0 });
      const moved = this.store.moveFurniture(obj.getData('uid'), cell.x, cell.y);
      obj.setData('dragCell', undefined);
      obj.setAlpha(1);
      if (obj.input) obj.input.hitAreaCallback = this.furniturePixelHitTest;
      this.dragGhost?.clear();
      // A successful move commits synchronously and the store subscriber has
      // already refreshed the scene. Invalid drops need a manual snap-back.
      if (!moved) this.refreshFurniture();
      for (const piece of this.pieces.values()) {
        if (piece.input) piece.input.enabled = this.store.state.phase !== 'open' || piece.getData('furnitureId') === 'vinyl-player';
      }
    });

    // Camera Pan (Drag shop qua lại) & Pinch/Wheel Zoom - cho phép cả khi ở chế độ di chuyển (miễn là không kéo trúng món đồ)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.currentTab !== 'shop') return;
      const nativeEvent = pointer.event as PointerEvent | undefined;
      // Phaser may expose a TouchEvent without pointerType on iOS Safari.
      // A coarse device is therefore treated as touch unless it explicitly
      // reports a mouse pointer.
      const isTouch = nativeEvent?.pointerType === 'touch'
        || (this.coarsePointer && nativeEvent?.pointerType !== 'mouse');
      if (isTouch) {
        // The browser is the source of truth for a new touch sequence. If it
        // marks this contact primary, any ids still held by Phaser are stale.
        if (nativeEvent?.isPrimary) {
          this.activeTouchPointerIds.clear();
          this.activeNativeTouchPointerIds.clear();
          this.pinchDist = 0;
          this.pinchPointerIds = undefined;
        }
        this.activeTouchPointerIds.add(pointer.id);
        this.activeNativeTouchPointerIds.add(nativeEvent?.pointerId ?? pointer.id);
        this.gestureEpoch++;
      }
      // An active furniture drag owns the gesture. A stationary furniture
      // touch may still become a deliberate two-finger pinch below.
      if (this.isDraggingPiece) {
        this.isPanning = false;
        this.pinchDist = 0;
        this.pinchPointerIds = undefined;
        this.panPointerId = -1;
        return;
      }
      const first = this.input.pointer1;
      const second = this.input.pointer2;
      const hasExactTouchPair = isTouch
        && this.activeTouchPointerIds.size === 2
        && first.isDown
        && second.isDown
        && this.activeTouchPointerIds.has(first.id)
        && this.activeTouchPointerIds.has(second.id);
      if (hasExactTouchPair) {
        this.isPanning = false;
        this.panPointerId = -1;
        this.furnitureGesturePointerId = -1;
        this.furnitureGestureUid = undefined;
        this.furnitureDragPointerId = -1;
        this.furnitureDragUid = undefined;
        this.pinchPointerIds = [first.id, second.id];
        this.pinchDist = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
        this.pinchZoom = this.cameras.main.zoom;
        return;
      }
      if (isTouch && this.activeTouchPointerIds.size !== 1) return;
      if (this.furnitureGesturePointerId >= 0) return;
      this.isPanning = true;
      this.panPointerId = pointer.id;
      this.hasPanned = false;
      this.panStartX = pointer.x;
      this.panStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX;
      this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.currentTab !== 'shop') return;
      if (this.isDraggingPiece) {
        this.isPanning = false;
        this.pinchDist = 0;
        this.pinchPointerIds = undefined;
        this.panPointerId = -1;
        return;
      }
      if (this.pinchPointerIds && this.pinchDist > 0) {
        const first = this.input.pointer1;
        const second = this.input.pointer2;
        const pinchStillValid = this.activeTouchPointerIds.size === 2
          && first.isDown
          && second.isDown
          && this.pinchPointerIds.includes(first.id)
          && this.pinchPointerIds.includes(second.id);
        if (!pinchStillValid) {
          this.pinchDist = 0;
          this.pinchPointerIds = undefined;
          return;
        }
        const d = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
        const z = Phaser.Math.Clamp(this.pinchZoom * (d / this.pinchDist), SHOP_ZOOM_MIN, SHOP_ZOOM_MAX);
        const centerX = (first.x + second.x) / 2;
        const centerY = (first.y + second.y) / 2;
        const before = this.cameras.main.getWorldPoint(centerX, centerY);
        this.cameras.main.setZoom(z);
        const after = this.cameras.main.getWorldPoint(centerX, centerY);
        this.cameras.main.scrollX += before.x - after.x;
        this.cameras.main.scrollY += before.y - after.y;
        return;
      }
      if (this.furnitureGesturePointerId >= 0) return;
      if (!this.isPanning || this.isDraggingPiece || pointer.id !== this.panPointerId) return;
      const pointerDx = pointer.x - this.panStartX;
      const pointerDy = pointer.y - this.panStartY;
      const dx = pointerDx / this.cameras.main.zoom;
      const dy = pointerDy / this.cameras.main.zoom;
      if (Math.hypot(pointerDx, pointerDy) > this.tapTolerance(pointer)) this.hasPanned = true;
      if (this.hasPanned) {
        const { x: limitX, y: limitY } = this.cameraPanLimits();
        const nextX = Phaser.Math.Clamp(this.camStartX - dx, -limitX, limitX);
        const nextY = Phaser.Math.Clamp(this.camStartY - dy, -limitY, limitY);
        this.cameras.main.setScroll(nextX, nextY);
      }
    });

    const stopPan = (pointer?: Phaser.Input.Pointer) => {
      if (pointer) {
        this.activeTouchPointerIds.delete(pointer.id);
      } else {
        this.activeTouchPointerIds.clear();
      }
      this.isPanning = false;
      this.pinchDist = 0;
      this.pinchPointerIds = undefined;
      this.panPointerId = -1;
      if (!pointer || pointer.id === this.furnitureGesturePointerId) {
        this.furnitureGesturePointerId = -1;
        this.furnitureGestureUid = undefined;
      }
      if (!pointer || pointer.id === this.furnitureDragPointerId) {
        this.furnitureDragPointerId = -1;
        this.furnitureDragUid = undefined;
      }
      setTimeout(() => { this.hasPanned = false; }, 50);
    };
    this.input.on('pointerup', stopPan);
    this.input.on('pointerupoutside', stopPan);
    // GAME_OUT does not provide a Phaser Pointer as its first argument. Passing
    // it to stopPan left old touch ids behind and caused false two-finger zooms.
    this.input.on('gameout', () => this.releasePointerGesture());

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (this.currentTab !== 'shop' || this.isDraggingPiece || this.furnitureGesturePointerId >= 0) return;
      const targetZoom = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.00115, SHOP_ZOOM_MIN, SHOP_ZOOM_MAX);
      const before = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.cameras.main.setZoom(targetZoom);
      const after = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.cameras.main.scrollX += before.x - after.x;
      this.cameras.main.scrollY += before.y - after.y;
    });
    const parent = document.getElementById('game-canvas');
    if (parent) { this.resizeObserver = new ResizeObserver(() => this.scale.refresh()); this.resizeObserver.observe(parent); }
    const finishNativeTouchGesture = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && !this.coarsePointer) return;
      this.activeNativeTouchPointerIds.delete(event.pointerId);
      const finishedEpoch = this.gestureEpoch;
      // Run after Phaser's dragend / pointerup pipeline. If a new finger has
      // already started, its newer epoch protects it from this cleanup.
      requestAnimationFrame(() => {
        if (finishedEpoch === this.gestureEpoch && this.activeNativeTouchPointerIds.size === 0) {
          this.releasePointerGesture();
        }
      });
    };
    const cancelNativeGesture = () => this.releasePointerGesture();
    this.game.canvas.addEventListener('pointercancel', cancelNativeGesture, { capture: true, passive: true });
    window.addEventListener('pointerup', finishNativeTouchGesture, { passive: true });
    window.addEventListener('pointercancel', finishNativeTouchGesture, { passive: true });
    window.addEventListener('blur', cancelNativeGesture, { passive: true });
    document.addEventListener('visibilitychange', cancelNativeGesture, { passive: true });
    this.events.once('shutdown', () => {
      this.unsubscribe?.();
      this.resizeObserver?.disconnect();
      this.game.canvas.removeEventListener('pointercancel', cancelNativeGesture, true);
      window.removeEventListener('pointerup', finishNativeTouchGesture);
      window.removeEventListener('pointercancel', finishNativeTouchGesture);
      window.removeEventListener('blur', cancelNativeGesture);
      document.removeEventListener('visibilitychange', cancelNativeGesture);
    });
    this.game.events.emit('shop-ready');
  }
  private drawGrid() {
    this.drawLandFloor();
    const size = landSize(this.store.state);
    if (size === this.renderedGridSize) return;
    this.renderedGridSize = size;
    this.grid.clear();
    this.grid.lineStyle(1, 0xe8c0e8, .35);
    for (let i = 0; i <= size; i++) {
      const a = toWorld(i, 0), b = toWorld(i, size), c = toWorld(0, i), d = toWorld(size, i);
      this.grid.lineBetween(a.x, a.y, b.x, b.y); this.grid.lineBetween(c.x, c.y, d.x, d.y);
    }
  }
  private drawLandFloor() {
    const level = Math.max(0, Math.min(landExpansion.length - 1, this.store.state.landLevel ?? 0));
    const showDefaultLamp = !this.store.state.layout.some(item => item.id === 'crystal-chandelier');
    if (level !== this.renderedLandLevel || showDefaultLamp !== this.renderedDefaultLamp) {
      this.renderedLandLevel = level;
      this.renderedDefaultLamp = showDefaultLamp;
      const roomBounds = roomSvgBounds(landExpansion[level].size);
      const roomTexture = showDefaultLamp ? `room-${level}` : `room-${level}-no-default-lamp`;
      this.room?.setTexture(roomTexture).setPosition(roomBounds.x, 0);
      this.cameras.main.setZoom(Math.max(SHOP_ZOOM_MIN, 1 - level * .07));
    }
    this.updateLandExpansionButtons();
  }
  private createLandExpansionButtons() {
    this.landExpandButtons = ['trái', 'phải'].map(side => {
      const background = this.add.graphics();
      background.fillStyle(0x7b3b68, .15).fillRoundedRect(-59, -15, 118, 38, 9);
      background.fillStyle(0xfffbfd, .98).fillRoundedRect(-59, -20, 118, 38, 9);
      background.lineStyle(1.6, 0xe99bc8, 1).strokeRoundedRect(-59, -20, 118, 38, 9);
      background.fillStyle(0xffdced, 1).fillCircle(-43, -1, 13);
      background.lineStyle(1, 0xffffff, .9).strokeCircle(-43, -1, 10);
      const holdFill = this.add.graphics();
      const expandMark = this.add.graphics();
      expandMark.lineStyle(1.8, 0xd13b91, 1);
      expandMark.lineBetween(-49, -7, -44, -7); expandMark.lineBetween(-49, -7, -49, -2);
      expandMark.lineBetween(-37, -7, -42, -7); expandMark.lineBetween(-37, -7, -37, -2);
      expandMark.lineBetween(-49, 5, -44, 5); expandMark.lineBetween(-49, 5, -49, 0);
      expandMark.lineBetween(-37, 5, -42, 5); expandMark.lineBetween(-37, 5, -37, 0);
      const title = this.add.text(-24, -16, 'Mở rộng', { fontFamily: "'Nunito', Arial", fontSize: '11px', fontStyle: 'bold', color: '#63234f' });
      const price = this.add.text(-24, 0, '', { fontFamily: "'Nunito', Arial", fontSize: '9px', fontStyle: 'bold', color: '#c03b84' });
      const button = this.add.container(0, 0, [background, holdFill, expandMark, title, price]).setDepth(880).setSize(126, 48);
      // Vùng bấm rộng hơn hình hiển thị để nút dễ thao tác ở mọi mức zoom.
      // Chỉ dùng một hitbox độc lập để tránh container và zone tranh sự kiện với nhau.
      const hitArea = this.add.zone(0, 0, 190, 92).setOrigin(.5).setDepth(2000).setInteractive({ useHandCursor: true });
      button.setData('priceText', price);
      button.setData('side', side);
      button.setData('hitArea', hitArea);
      const idleTitle = title.text;
      const holdState = { progress: 0 };
      let holdTween: Phaser.Tweens.Tween | undefined;
      let completed = false;
      let holding = false;
      let holdStartX = 0;
      let holdStartY = 0;
      let holdCameraX = 0;
      let holdCameraY = 0;
      const drawHoldProgress = () => {
        holdFill.clear();
        if (holdState.progress <= 0) return;
        holdFill.fillStyle(0xf06bad, .26);
        holdFill.fillRoundedRect(-56, -17, 112 * holdState.progress, 32, 7);
      };
      const resetHold = () => {
        if (completed) return;
        holding = false;
        holdTween?.stop();
        holdTween = undefined;
        holdState.progress = 0;
        drawHoldProgress();
        title.setText(idleTitle);
        price.setAlpha(1);
        this.tweens.killTweensOf(button);
        this.tweens.add({ targets: button, scale: 1, duration: 100 });
      };
      const beginShopDrag = (pointer: Phaser.Input.Pointer) => {
        if (!holding || Phaser.Math.Distance.Between(holdStartX, holdStartY, pointer.x, pointer.y) <= 10) return;
        resetHold();
        this.isPanning = true;
        this.hasPanned = true;
        this.panStartX = holdStartX;
        this.panStartY = holdStartY;
        this.camStartX = holdCameraX;
        this.camStartY = holdCameraY;
      };
      hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        this.selectionClearBlockedUntil = Date.now() + 220;
        this.isPanning = false;
        event.stopPropagation();
        completed = false;
        holding = true;
        holdStartX = pointer.x;
        holdStartY = pointer.y;
        holdCameraX = this.cameras.main.scrollX;
        holdCameraY = this.cameras.main.scrollY;
        holdTween?.stop();
        holdState.progress = 0;
        title.setText('Gi\u1eef 0%');
        price.setAlpha(.48);
        this.tweens.killTweensOf(button);
        this.tweens.add({ targets: button, scale: .97, duration: 90 });
        holdTween = this.tweens.add({
          targets: holdState,
          progress: 1,
          duration: 2000,
          ease: 'Linear',
          onUpdate: () => {
            drawHoldProgress();
            title.setText(`Gi\u1eef ${Math.round(holdState.progress * 100)}%`);
          },
          onComplete: () => {
            completed = true;
            holding = false;
            holdTween = undefined;
            drawHoldProgress();
            const expanded = this.store.expandLand();
            title.setText(expanded ? '\u0110\u00e3 m\u1edf r\u1ed9ng' : idleTitle);
            this.tweens.add({ targets: button, scale: expanded ? 1.07 : 1, duration: 110, yoyo: expanded });
            this.time.delayedCall(260, () => {
              completed = false;
              resetHold();
            });
          },
        });
      });
      hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => beginShopDrag(pointer));
      hitArea.on('pointerup', resetHold);
      hitArea.on('pointerupoutside', resetHold);
      hitArea.on('pointerover', () => {
        if (!holdTween && !completed) this.tweens.add({ targets: button, scale: 1.04, duration: 100 });
      });
      hitArea.on('pointerout', (pointer: Phaser.Input.Pointer) => {
        beginShopDrag(pointer);
        resetHold();
      });
      return button;
    });
  }
  private updateLandExpansionButtons() {
    if (!this.landExpandButtons.length) return;
    const next = nextLandExpansion(this.store.state);
    const visible = !!next && this.store.state.phase !== 'open' && this.currentTab === 'shop' && !this.edit;
    const size = landSize(this.store.state);
    const left = toWorld(0, size), right = toWorld(size, 0), front = toWorld(size, size);
    const positions = [
      { x: (left.x + front.x) / 2 - 50, y: (left.y + front.y) / 2 + 60 },
      { x: (right.x + front.x) / 2 + 50, y: (right.y + front.y) / 2 + 60 },
    ];
    this.landExpandButtons.forEach((button, index) => {
      const edgeAngle = Phaser.Math.DegToRad(index === 0 ? 26.565 : -26.565);
      button.setPosition(positions[index].x, positions[index].y).setRotation(edgeAngle).setVisible(visible).setAlpha(next && this.store.state.money < next.cost ? .52 : 1);
      const hitArea = button.getData('hitArea') as Phaser.GameObjects.Zone;
      hitArea?.setPosition(positions[index].x, positions[index].y).setRotation(edgeAngle).setVisible(visible);
      if (hitArea?.input) hitArea.input.enabled = visible;
      const price = button.getData('priceText') as Phaser.GameObjects.Text;
      price?.setText(next ? `${next.cost.toLocaleString('vi-VN')}₫` : '');
    });
  }
  private drawGhost(p: PlacedFurniture, valid: boolean) {
    if (isWallFurnitureId(p.id)) {
      const span = furniture.find(definition => definition.id === p.id)?.width ?? 1;
      const start = p.rotation === 1 ? toWorld(0, p.y) : toWorld(p.x, 0);
      const end = p.rotation === 1 ? toWorld(0, p.y + span) : toWorld(p.x + span, 0);
      const lower = 2;
      const upper = lower + 116;
      const points = [
        new Phaser.Geom.Point(start.x, start.y - lower),
        new Phaser.Geom.Point(end.x, end.y - lower),
        new Phaser.Geom.Point(end.x, end.y - upper),
        new Phaser.Geom.Point(start.x, start.y - upper),
      ];
      this.dragGhost?.clear().fillStyle(valid ? 0x68ddb8 : 0xe870a0, .24).fillPoints(points, true).lineStyle(2, valid ? 0x38b890 : 0xc04878).strokePoints(points, true);
      return;
    }
    const def = furniture.find(f => f.id === p.id)!;
    const w = p.rotation ? def.height : def.width, h = p.rotation ? def.width : def.height;
    const points = [toWorld(p.x, p.y), toWorld(p.x + w, p.y), toWorld(p.x + w, p.y + h), toWorld(p.x, p.y + h)];
    this.dragGhost?.clear().fillStyle(valid ? 0x68ddb8 : 0xe870a0, .4).fillPoints(points, true).lineStyle(2, valid ? 0x38b890 : 0xc04878).strokePoints(points, true);
  }

  private resolveFloorPlacement(item: PlacedFurniture, preferred: { x: number; y: number }, pointerX: number, pointerY: number) {
    const isValid = (cell: { x: number; y: number }) => canPlace(
      this.store.state.layout,
      { ...item, ...cell },
      this.store.state.landLevel,
    );
    if (isValid(preferred)) return { cell: preferred, valid: true };

    // A 2x1 fixture can round to the occupied side of a grid boundary even
    // while most of its visible base is above the free neighbouring cell.
    // Snap only to genuinely valid immediate neighbours that remain close to
    // the finger, so collision and the reserved entrance still stay intact.
    const offsets = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: -1 }, { x: 1, y: 1 },
    ];
    const candidate = offsets
      .map(offset => ({ x: preferred.x + offset.x, y: preferred.y + offset.y }))
      .filter(isValid)
      .map(cell => ({ cell, distance: Phaser.Math.Distance.Between(pointerX, pointerY, furnitureAnchor({ ...item, ...cell }).x, furnitureAnchor({ ...item, ...cell }).y) }))
      .filter(entry => entry.distance <= 76)
      .sort((a, b) => a.distance - b.distance)[0];
    return candidate ? { cell: candidate.cell, valid: true } : { cell: preferred, valid: false };
  }

  private furnitureHasOpaquePixelAtWorld(image: Phaser.GameObjects.Image, worldX: number, worldY: number) {
    if (!image.visible || image.alpha <= 0) return false;
    const local = image.getWorldTransformMatrix().applyInverse(worldX, worldY);
    let x = local.x + image.displayOriginX;
    let y = local.y + image.displayOriginY;
    const width = image.frame.width;
    const height = image.frame.height;
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    if (image.flipX) x = width - 1 - x;
    if (image.flipY) y = height - 1 - y;
    const alpha = this.textures.getPixelAlpha(Math.floor(x), Math.floor(y), image.texture.key, image.frame.name);
    return alpha !== null && alpha >= FURNITURE_HIT_ALPHA_TOLERANCE;
  }

  private selectionArrowDistance(anchor: Phaser.Math.Vector2, outward: Phaser.Math.Vector2) {
    const perpendicular = new Phaser.Math.Vector2(-outward.y, outward.x);
    for (const distance of [34, 48, 62, 76, 90, 104, 118]) {
      let clear = true;
      // Keep the whole floating arrow clear of every painted pixel, including
      // the selected furniture itself. This lets oversized artwork extend well
      // beyond its logical floor footprint without being covered by controls.
      for (let forward = -16; forward <= 16 && clear; forward += 4) {
        for (let lateral = -14; lateral <= 14; lateral += 4) {
          const point = anchor.clone()
            .add(outward.clone().scale(distance + forward))
            .add(perpendicular.clone().scale(lateral));
          for (const piece of this.pieces.values()) {
            if (this.furnitureHasOpaquePixelAtWorld(piece, point.x, point.y)) {
              clear = false;
              break;
            }
          }
          if (!clear) break;
        }
      }
      if (clear) return distance;
    }
    return undefined;
  }

  private drawSelectionArrows(p: PlacedFurniture) {
    const graphics = this.selectionArrows;
    if (!graphics || !this.edit || this.selected !== p.uid) return;
    const drawArrow = (anchor: Phaser.Math.Vector2, outward: Phaser.Math.Vector2) => {
      const direction = outward.clone().normalize();
      const distance = this.selectionArrowDistance(anchor, direction);
      if (distance === undefined) return;
      const perpendicular = new Phaser.Math.Vector2(-direction.y, direction.x);
      const center = anchor.clone().add(direction.clone().scale(distance));
      const point = (forward: number, lateral: number) => center.clone()
        .add(direction.clone().scale(forward))
        .add(perpendicular.clone().scale(lateral));
      const arrow = [
        point(16, 0),
        point(2, 13),
        point(2, 6),
        point(-14, 6),
        point(-14, -6),
        point(2, -6),
        point(2, -13),
      ];
      const shadow = arrow.map(vertex => new Phaser.Geom.Point(vertex.x, vertex.y + 3));

      graphics.fillStyle(0x762052, .24).fillPoints(shadow, true);
      graphics.fillStyle(0xff77b9, 1).fillPoints(arrow, true);
      graphics.lineStyle(4, 0xffffff, .96).strokePoints(arrow, true);
      graphics.lineStyle(2, 0x84245d, 1).strokePoints(arrow, true);
      const shineStart = point(-10, -2.5);
      const shineEnd = point(-1, -2.5);
      graphics.lineStyle(2, 0xffdced, .9).lineBetween(shineStart.x, shineStart.y, shineEnd.x, shineEnd.y);
    };

    if (isWallFurnitureId(p.id)) {
      const span = furniture.find(definition => definition.id === p.id)?.width ?? 1;
      const startPoint = p.rotation === 1 ? toWorld(0, p.y) : toWorld(p.x, 0);
      const endPoint = p.rotation === 1 ? toWorld(0, p.y + span) : toWorld(p.x + span, 0);
      const start = new Phaser.Math.Vector2(startPoint.x, startPoint.y - 64);
      const end = new Phaser.Math.Vector2(endPoint.x, endPoint.y - 64);
      const along = end.clone().subtract(start).normalize();
      const moves = p.rotation === 1
        ? [{ anchor: start, outward: along.clone().negate(), x: p.x, y: p.y - 1 }, { anchor: end, outward: along, x: p.x, y: p.y + 1 }]
        : [{ anchor: start, outward: along.clone().negate(), x: p.x - 1, y: p.y }, { anchor: end, outward: along, x: p.x + 1, y: p.y }];
      for (const move of moves) {
        if (canPlace(this.store.state.layout, { ...p, x: move.x, y: move.y }, this.store.state.landLevel)) {
          drawArrow(move.anchor, move.outward);
        }
      }
      return;
    }

    const footprint = furnitureFootprint(p);
    const corners = [
      toWorld(p.x, p.y),
      toWorld(p.x + footprint.width, p.y),
      toWorld(p.x + footprint.width, p.y + footprint.height),
      toWorld(p.x, p.y + footprint.height),
    ];
    const centerPoint = furnitureAnchor(p);
    const center = new Phaser.Math.Vector2(centerPoint.x, centerPoint.y);
    const moves = [
      { x: p.x, y: p.y - 1 },
      { x: p.x + 1, y: p.y },
      { x: p.x, y: p.y + 1 },
      { x: p.x - 1, y: p.y },
    ];
    for (let index = 0; index < corners.length; index++) {
      const move = moves[index];
      if (!canPlace(this.store.state.layout, { ...p, ...move }, this.store.state.landLevel)) continue;
      const next = corners[(index + 1) % corners.length];
      const midpoint = new Phaser.Math.Vector2((corners[index].x + next.x) / 2, (corners[index].y + next.y) / 2);
      const outward = midpoint.clone().subtract(center).normalize();
      drawArrow(midpoint, outward);
    }
  }
  refresh() { this.refreshFurniture(); this.refreshCustomer(); this.refreshOnlineShippers(); }

  /** Stop tweens on a container and every child before releasing the objects. */
  private destroyAnimatedContainer(container: Phaser.GameObjects.Container) {
    const stopTree = (target: Phaser.GameObjects.GameObject) => {
      this.tweens.killTweensOf(target);
      if (target instanceof Phaser.GameObjects.Container) {
        for (const child of [...target.list]) stopTree(child);
      }
    };
    stopTree(container);
    container.destroy();
  }

  private cameraPanLimits() {
    const expandedCells = Math.max(0, landSize(this.store.state) - landExpansion[0].size);
    const extraZoom = Math.max(0, this.cameras.main.zoom - 1);
    // Each land cell extends the diamond by 56 px horizontally and 28 px vertically.
    // Include that growth in the drag range so expanded corners remain reachable,
    // especially when Scale.ENVELOP crops the canvas on wide screens.
    return {
      x: 320 + expandedCells * 56 + extraZoom * 260,
      y: 220 + expandedCells * 36 + extraZoom * 190,
    };
  }

  private moveModeChangeCallback?: (active: boolean, uid?: string) => void;
  setMoveModeCallback(cb: (active: boolean, uid?: string) => void) {
    this.moveModeChangeCallback = cb;
  }

  setMoveMode(active: boolean, uid?: string) {
    this.edit = active;
    if (!active) {
      this.releasePointerGesture();
    }
    this.grid?.setVisible(active);
    this.updateLandExpansionButtons();
    this.selected = active ? (uid ?? this.selected) : undefined;
    if (active && uid) {
      const img = this.pieces.get(uid);
      if (img) {
        this.tweens.add({ targets: img, scaleY: 0.78, duration: 110, yoyo: true, ease: 'Sine.easeInOut' });
      }
    }
    this.selectCallback(this.selected);
    this.moveModeChangeCallback?.(active, this.selected);
    if (this.scene.isActive()) this.refreshFurniture();
  }

  startFurniturePlacement(uid: string) {
    this.setMoveMode(true, uid);
    const image = this.pieces.get(uid);
    if (image) this.cameras.main.pan(image.x, image.y, 280, 'Sine.easeInOut');
  }

  setEdit(value: boolean) {
    this.setMoveMode(value);
  }

  private stopSelectionPulse() {
    this.selectionPulseTween?.stop();
    this.selectionPulseImage?.setAlpha(1);
    this.selectionPulseTween = undefined;
    this.selectionPulseImage = undefined;
    this.selectionPulseUid = undefined;
  }

  private syncSelectionPulse() {
    const uid = this.edit && !this.isDraggingPiece ? this.selected : undefined;
    const image = uid ? this.pieces.get(uid) : undefined;
    if (!uid || !image) {
      this.stopSelectionPulse();
      return;
    }
    if (this.selectionPulseUid === uid && this.selectionPulseImage === image && this.selectionPulseTween) return;
    this.stopSelectionPulse();
    this.selectionPulseUid = uid;
    this.selectionPulseImage = image;
    this.selectionPulseTween = this.tweens.add({
      targets: image,
      alpha: { from: 1, to: .62 },
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private refreshFurniture() {
    this.selectionArrows?.clear();
    for (const [uid, img] of this.pieces) if (!this.store.state.layout.some(p => p.uid === uid)) {
      if (this.selectionPulseUid === uid) this.stopSelectionPulse();
      img.destroy(); this.pieces.delete(uid);
    }
    for (const p of this.store.state.layout) {
      const f = furniture.find(f => f.id === p.id)!;
      const wallMounted = isWallArtAsset(f.art);
      const wallSide = p.rotation === 1 ? 'left' : 'right';
      const textureKey = f.art === 'shop-sign'
        ? shopSignTextureKey(wallSide, this.store.state.shopName)
        : wallMounted ? `f-${f.art}-${wallSide}` : `f-${f.art}`;
      if (f.art === 'shop-sign' && !this.textures.exists(textureKey)) this.ensureShopSignTexture(textureKey, wallSide);
      const wallSpan = f.width;
      const anchor = wallMounted
        ? p.rotation === 1 ? toWorld(0, p.y + wallSpan / 2) : toWorld(p.x + wallSpan / 2, 0)
        : furnitureAnchor(p);
      const isWallSign = ['shop-sign', 'ribbon-sign', 'neon-sign', 'lightbox-sign'].includes(f.art);
      const wallLift = wallMounted ? (IMPORTED_WALL_LIFT[f.art] ?? (isWallSign ? -20 : 25)) : 0;
      const pos = { x: anchor.x, y: anchor.y - wallLift + (wallMounted ? 0 : this.furnitureFloorEndOffset(p)) };
      let img = this.pieces.get(p.uid);
      if (!img) {
        if (!this.textures.exists(textureKey)) continue;
        const scale = IMPORTED_RUG_ART.has(f.art) ? .65
          : IMPORTED_WALL_ART.has(f.art) ? .47
          : LARGE_IMPORTED_MIRROR_ART.has(f.art) ? .38
          : SMALL_IMPORTED_FURNITURE_ART.has(f.art) ? .29
          : CENTERED_FURNITURE_ART.has(f.art) && f.art !== 'table' ? .47
            : f.art === 'table' ? .425
          : f.art === 'atelier-rug' ? 1.45
          : ['shop-sign', 'ribbon-sign', 'neon-sign', 'lightbox-sign'].includes(f.art) ? 1.12
            : f.art === 'fashion-print' ? .76
              : f.art === 'gallery-print' ? 1.02
                : ['botanical-print', 'runway-print', 'parfum-print', 'shoe-sketch-print'].includes(f.art) ? .72 : .85;
        // Furniture textures have generous transparent viewboxes. Use the actual
        // rendered alpha mask and ignore faint shadows/antialiasing around the art.
        const visualOrigin = this.furniturePlacementOrigin(f.art, textureKey, wallMounted);
        img = this.add.image(pos.x, pos.y, textureKey).setOrigin(visualOrigin.x, visualOrigin.y).setScale(scale).setInteractive({
          hitArea: {},
          hitAreaCallback: this.furniturePixelHitTest,
          useHandCursor: true,
        });
        img.setData('uid', p.uid); this.input.setDraggable(img); this.pieces.set(p.uid, img);
        let downX = 0, downY = 0, downTime = 0;
        let tapHandled = false;
        let longPressTimer: Phaser.Time.TimerEvent | undefined;
        let longPressPointer: Phaser.Input.Pointer | undefined;

        img.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (this.currentTab !== 'shop' || this.pointerIsCoveredByUi(pointer)) return;
          if (this.edit) {
            if (this.isDraggingPiece && (pointer.id !== this.furnitureDragPointerId || p.uid !== this.furnitureDragUid)) return;
            this.furnitureGesturePointerId = pointer.id;
            this.furnitureGestureUid = p.uid;
            this.isPanning = false;
            this.pinchDist = 0;
          }
          downX = pointer.x; downY = pointer.y; downTime = Date.now();
          tapHandled = false;

          if (this.edit) {
            // Đã ở chế độ di chuyển: Chạm vào món đồ để chọn
            if (this.selected !== p.uid) {
              this.selected = p.uid;
              this.selectCallback(p.uid);
              this.moveModeChangeCallback?.(true, p.uid);
              this.refreshFurniture();
            }
            return;
          }

          // Nhấn giữ khi shop đóng để vào thẳng chế độ di chuyển món đồ này.
          if (this.store.state.phase === 'open') return;
          longPressPointer = pointer;
          longPressTimer?.remove(false);
          longPressTimer = this.time.delayedCall(500, () => {
            const activePointer = longPressPointer;
            const moved = !activePointer || Phaser.Math.Distance.Between(downX, downY, activePointer.x, activePointer.y) > this.tapTolerance(activePointer);
            if (moved || this.hasPanned || this.currentTab !== 'shop' || this.store.state.phase === 'open') return;
            this.selectionClearBlockedUntil = Date.now() + 350;
            this.setMoveMode(true, p.uid);
          });
        });

        img.on('pointermove', (pointer: Phaser.Input.Pointer) => {
          if (longPressTimer && Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y) > this.tapTolerance(pointer)) {
            longPressTimer.remove(false);
            longPressTimer = undefined;
          }
        });

        const finishFurnitureTap = (pointer: Phaser.Input.Pointer) => {
          if (tapHandled) return;
          tapHandled = true;
          longPressTimer?.remove(false);
          longPressTimer = undefined;
          longPressPointer = undefined;
          if (Date.now() < this.selectionClearBlockedUntil || this.pointerIsCoveredByUi(pointer)) return;
          const isDialogOpen = document.querySelector<HTMLDialogElement>('#game-dialog')?.open;
          if (this.currentTab !== 'shop' || this.edit || isDialogOpen) return;
          const dist = Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y);
          const elapsed = Date.now() - downTime;
          if (dist < this.tapTolerance(pointer) && elapsed < (this.coarsePointer ? 700 : 500) && !this.hasPanned) {
            if (p.id === 'vinyl-player') {
              this.musicPlayerCallback();
              return;
            }
            const nextSelected = this.selected === p.uid ? undefined : p.uid;
            this.selected = nextSelected;
            this.selectCallback(nextSelected);
            this.refreshFurniture();
          }
        };
        img.on('pointerup', finishFurnitureTap);
        img.on('pointerupoutside', finishFurnitureTap);

        img.on('pointerout', () => {
          longPressTimer?.remove(false);
          longPressTimer = undefined;
          longPressPointer = undefined;
        });
      }
      const isRug = ['atelier-rug', 'heart-rug', 'checkered-rug'].includes(f.art);
      // Tranh và biển hiệu thuộc mặt tường nên luôn nằm sau mọi nội thất đặt sàn.
      // Khoảng nhỏ theo tọa độ chỉ giữ thứ tự ổn định giữa các món treo tường.
      const renderDepth = wallMounted ? -620 + anchor.y / 10000
        : isRug ? -480 + anchor.y / 1000
          : anchor.y;
      img.setData('furnitureId', p.id);
      img.setData('wallLift', wallLift);
      if (this.textures.exists(textureKey)) {
        img.setTexture(textureKey);
        const visualOrigin = this.furniturePlacementOrigin(f.art, textureKey, wallMounted);
        img.setOrigin(visualOrigin.x, visualOrigin.y);
      }
      const flipImportedWall = wallMounted && IMPORTED_WALL_ART.has(f.art) && p.rotation === 1;
      img.setPosition(pos.x, pos.y).setDepth(renderDepth).setFlipX(flipImportedWall || (!wallMounted && p.rotation === 1));
      // Trong giờ bán, toàn bộ nội thất được khóa để thao tác chạm chỉ dành cho khách hàng.
      if (img.input) img.input.enabled = this.store.state.phase !== 'open' || p.id === 'vinyl-player';
      if (this.selected === p.uid) {
        img.setTint(this.edit ? 0xffc840 : 0xffb6dc);
      } else if (this.edit) {
        img.setTint(0xb8f0d8);
      } else {
        img.clearTint();
      }
      img.input!.draggable = this.edit;
      if (this.selected === p.uid) this.drawSelectionArrows(p);
    }
    this.syncSelectionPulse();
    this.updateOwnerPosition(true);
    this.refreshStaff();
  }

  /**
   * SVG viewboxes deliberately leave room for tall decorations, so their
   * geometric centre is often not the centre of the painted furniture. Find
   * the opaque horizontal bounds once and anchor the visible base—not the
   * empty SVG padding—to the centre of its logical floor footprint.
   */
  private furnitureVisualOrigin(textureKey: string) {
    const cached = this.furnitureVisualOrigins.get(textureKey);
    if (cached) return cached;
    const frame = this.textures.getFrame(textureKey);
    const width = Math.max(1, frame?.width ?? 180);
    const height = Math.max(1, frame?.height ?? 230);
    let minX = width;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if ((this.textures.getPixelAlpha(x, y, textureKey) ?? 0) < FURNITURE_HIT_ALPHA_TOLERANCE) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    const origin = maxX >= minX
      ? {
          x: Phaser.Math.Clamp(((minX + maxX) / 2) / width, .2, .8),
          // Most isometric assets place their feet around 90% of the viewbox.
          // Respect shorter art while ignoring soft shadows below the feet.
          y: Phaser.Math.Clamp(Math.min(height * .91, maxY - height * .04) / height, .65, .94),
        }
      : { x: .5, y: .87 };
    this.furnitureVisualOrigins.set(textureKey, origin);
    return origin;
  }

  private furniturePlacementOrigin(art: string, textureKey: string, wallMounted: boolean) {
    if (wallMounted) return IMPORTED_WALL_ART.has(art) ? { x: .5, y: 400 / 460 } : { x: .5, y: .87 };
    if (IMPORTED_RUG_ART.has(art)) return { x: .5, y: .5 };
    if (CENTERED_FURNITURE_ART.has(art)) return CENTERED_FURNITURE_ORIGIN;
    return this.furnitureVisualOrigin(textureKey);
  }

  private furnitureFloorEndOffset(item: PlacedFurniture) {
    const definition = furniture.find(candidate => candidate.id === item.id);
    if (!definition || !CENTERED_FURNITURE_ART.has(definition.art)) return 0;
    const footprint = furnitureFootprint(item);
    // Each isometric grid step adds 28px vertically. From the footprint centre
    // to its lowest/front edge is half the combined width and height.
    return (footprint.width + footprint.height) * 14;
  }

  private staffFloorSpots(count: number) {
    const size = landSize(this.store.state);
    const center = (size - 1) / 2;
    const cells: { x: number; y: number }[] = [];
    for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) {
      const point = { x: x + .5, y: y + .5 };
      const blocked = this.store.state.layout.some(item => {
        if (isWallFurnitureId(item.id) || ['atelier-rug', 'heart-rug', 'checkered-rug'].includes(item.id)) return false;
        const occupied = furnitureFootprint(item);
        return point.x > item.x - .2 && point.x < item.x + occupied.width + .2
          && point.y > item.y - .2 && point.y < item.y + occupied.height + .2;
      });
      if (!blocked) cells.push(point);
    }
    cells.sort((a, b) => {
      const distanceA = Math.abs(a.x - center) + Math.abs(a.y - center);
      const distanceB = Math.abs(b.x - center) + Math.abs(b.y - center);
      return distanceA - distanceB || a.y - b.y || a.x - b.x;
    });
    const chosen: { x: number; y: number }[] = [];
    for (const cell of cells) {
      const world = toWorld(cell.x, cell.y);
      if (chosen.every(other => Phaser.Math.Distance.Between(other.x, other.y, world.x, world.y) >= 90)) chosen.push(world);
      if (chosen.length >= count) break;
    }
    return chosen;
  }

  private refreshStaff() {
    if (!this.scene.isActive()) return;
    const activeStaff = activeEmployees(this.store.state)
      .sort((a, b) => (b.service + b.persuasion) - (a.service + a.persuasion));
    const stockStaff = this.store.state.phase === 'open'
      ? activeStaff.filter(employee => (employee.assignment ?? 'service') === 'stock')
      : [];
    const working = activeStaff.filter(employee => !stockStaff.includes(employee));
    const workingIds = new Set(working.map(employee => employee.uid));
    for (const [uid, avatar] of this.staffAvatars) {
      if (workingIds.has(uid)) continue;
      this.destroyAnimatedContainer(avatar);
      this.staffAvatars.delete(uid);
    }
    const stockIds = new Set(stockStaff.map(employee => employee.uid));
    for (const [uid, label] of this.staffWorkLabels) {
      if (stockIds.has(uid)) continue;
      this.tweens.killTweensOf(label);
      label.destroy();
      this.staffWorkLabels.delete(uid);
    }
    const stockAnchor = toWorld(landSize(this.store.state) - .75, .75);
    stockStaff.forEach((employee, index) => {
      let label = this.staffWorkLabels.get(employee.uid);
      if (!label) {
        label = this.add.text(stockAnchor.x, stockAnchor.y + index * 18, `${employee.name} · Đang làm tại kho`, {
          fontFamily: 'Nunito Variable, Arial, sans-serif',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#286ea9',
          align: 'center',
        }).setOrigin(.5).setResolution(2).setStroke('#fffdfb', 3).setShadow(0, 2, 'rgba(42,58,91,.4)', 3, true, true);
        this.tweens.add({ targets: label, alpha: { from: .76, to: 1 }, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.staffWorkLabels.set(employee.uid, label);
      }
      label.setText(`${employee.name} · Đang làm tại kho`)
        .setPosition(stockAnchor.x, stockAnchor.y + index * 18)
        .setDepth(stockAnchor.y + 80 + index)
        .setVisible(this.currentTab === 'shop');
    });
    const homeSpots = this.staffFloorSpots(working.length);
    const patrolSpots = this.staffFloorSpots(Math.max(6, working.length * 3));
    const adviceVisits = this.store.state.phase === 'open'
      ? this.store.state.activeVisits.filter(visit => visit.mode === 'advice' && !!visit.assignedStaffUid)
      : [];
    const patrolStep = Math.floor(Math.max(0, 300 - this.store.state.dayTimer) / 7);
    working.forEach((employee, index) => {
      const home = homeSpots[index] ?? toWorld(2.5 + index, 3.5);
      const assignedVisit = adviceVisits.find(visit => visit.assignedStaffUid === employee.uid);
      const customerTarget = assignedVisit ? this.staffCustomerTarget(assignedVisit.uid, index) : undefined;
      const patrol = patrolSpots.length
        ? patrolSpots[(index * 2 + patrolStep) % patrolSpots.length]
        : home;
      const spot = customerTarget ?? (this.store.state.phase === 'open' ? patrol : home);
      const targetKey = customerTarget
        ? `assist:${assignedVisit?.uid ?? employee.uid}`
        : this.store.state.phase === 'open' ? `patrol:${patrolStep}:${index}` : `home:${index}`;
      const assignment = employee.assignment ?? 'service';
      const activity = customerTarget
        ? `${employee.name} · Đang tư vấn khách`
        : assignment === 'cashier'
          ? `${employee.name} · Thu ngân`
          : `${employee.name} · Tư vấn`;
      let avatar = this.staffAvatars.get(employee.uid);
      if (!avatar) {
        const appearance = ((Math.trunc(employee.appearance) % EMPLOYEE_APPEARANCE_COUNT) + EMPLOYEE_APPEARANCE_COUNT) % EMPLOYEE_APPEARANCE_COUNT;
        const sprite = this.add.image(0, 0, `staff-photo-${appearance}`).setOrigin(.5, 1).setScale(STAFF_SCALE);
        const label = this.add.text(0, -106.5, employee.name, {
          fontFamily: 'Nunito Variable, Arial, sans-serif', fontSize: '8px', fontStyle: 'bold', color: '#7b315f',
          align: 'center',
        }).setOrigin(.5).setResolution(2).setStroke('#fffdfb', 3).setShadow(0, 2, 'rgba(78,39,70,.42)', 3, true, true);
        avatar = this.add.container(home.x, home.y, [sprite, label]).setDepth(home.y - 1);
        avatar.setData('staffSprite', sprite).setData('staffLabel', label);
        this.tweens.add({ targets: label, alpha: { from: .78, to: 1 }, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.staffAvatars.set(employee.uid, avatar);
      }
      const staffSprite = avatar.getData('staffSprite') as Phaser.GameObjects.Image | undefined;
      if (staffSprite) staffSprite.setScale(STAFF_SCALE);
      const label = avatar.getData('staffLabel') as Phaser.GameObjects.Text | undefined;
      if (label) label.setY(-106.5);
      label?.setText(activity);
      this.moveStaffTo(avatar, spot, targetKey, index);
      avatar.setVisible(this.store.state.phase === 'open' && this.currentTab === 'shop');
    });
  }

  private staffCustomerTarget(visitUid: string, staffIndex: number) {
    const primary = visitUid === this.primaryVisitUid && this.avatar
      ? { x: this.avatar.getData('customerTargetX') ?? this.avatar.x, y: this.avatar.getData('customerTargetY') ?? this.avatar.y }
      : undefined;
    const secondary = this.secondaryCustomers.get(visitUid)?.container;
    const remembered = this.customerPositions.get(visitUid);
    const customer = primary ?? (secondary ? {
      x: secondary.getData('customerTargetX') ?? secondary.x,
      y: secondary.getData('customerTargetY') ?? secondary.y,
    } : remembered);
    if (!customer) return;
    const offsets = [
      { x: -68, y: 14 }, { x: 68, y: 14 },
      { x: -54, y: -22 }, { x: 54, y: -22 },
    ];
    const offset = offsets[staffIndex % offsets.length];
    return {
      x: Phaser.Math.Clamp(customer.x + offset.x, 165, 835),
      y: Phaser.Math.Clamp(customer.y + offset.y, 285, 535),
    };
  }

  private moveStaffTo(avatar: Phaser.GameObjects.Container, target: { x: number; y: number }, targetKey: string, index: number) {
    const sameTarget = avatar.getData('staffTargetKey') === targetKey
      && Math.abs((avatar.getData('staffBaseX') ?? target.x) - target.x) < 3
      && Math.abs((avatar.getData('staffBaseY') ?? target.y) - target.y) < 3;
    if (sameTarget) {
      avatar.setDepth(avatar.y - 1);
      return;
    }
    const sprite = avatar.getData('staffSprite') as Phaser.GameObjects.Image | undefined;
    const distance = Phaser.Math.Distance.Between(avatar.x, avatar.y, target.x, target.y);
    this.tweens.killTweensOf(avatar);
    if (sprite) {
      this.tweens.killTweensOf(sprite);
      sprite.setFlipX(target.x < avatar.x);
      sprite.setAngle(0).setScale(STAFF_SCALE);
    }
    avatar.setData('staffTargetKey', targetKey).setData('staffBaseX', target.x).setData('staffBaseY', target.y);
    if (distance < 5) {
      avatar.setPosition(target.x, target.y).setDepth(target.y - 1);
      this.startStaffIdle(avatar, index);
      return;
    }
    const duration = Phaser.Math.Clamp(distance * 3.1, 420, 1250);
    if (sprite) this.tweens.add({ targets: sprite, scaleY: STAFF_SCALE * .93, angle: { from: -2, to: 2 }, duration: 130, yoyo: true, repeat: Math.max(1, Math.floor(duration / 260)) });
    this.tweens.add({
      targets: avatar, x: target.x, y: target.y, duration, ease: 'Sine.inOut',
      onUpdate: () => avatar.setDepth(avatar.y - 1),
      onComplete: () => {
        sprite?.setAngle(0).setScale(STAFF_SCALE);
        avatar.setPosition(target.x, target.y).setDepth(target.y - 1);
        this.startStaffIdle(avatar, index);
      },
    });
  }

  private startStaffIdle(avatar: Phaser.GameObjects.Container, index: number) {
    const baseY = avatar.getData('staffBaseY') ?? avatar.y;
    this.tweens.add({ targets: avatar, y: baseY - 2.5, duration: 1250 + index * 130, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
  private ensureShopSignTexture(key: string, side: 'left' | 'right') {
    if (this.textures.exists(key) || this.pendingSvgTextures.has(key)) return;
    this.pendingSvgTextures.add(key);
    const shopName = this.store.state.shopName;
    const source = new Image();
    source.onload = async () => {
      try { await source.decode(); } catch { /* onload đã xác nhận ảnh có thể dùng */ }
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 230;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        const { lines, fontSize } = shopSignTextLayout(shopName);
        context.save();
        context.transform(.9, side === 'left' ? -.45 : .45, 0, 1, 9, side === 'left' ? 46 : -35);
        context.translate(-12, 0);
        context.font = `700 ${fontSize}px Mali, "Arial Rounded MT Bold", Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.lineJoin = 'round';
        context.strokeStyle = '#fff9fc';
        context.lineWidth = 4.5;
        context.fillStyle = '#873568';
        context.shadowColor = 'rgba(123, 56, 101, .24)';
        context.shadowBlur = 1.8;
        context.shadowOffsetX = 1.5;
        context.shadowOffsetY = 3;
        lines.forEach((line, index) => {
          const y = lines.length === 1 ? 108 : 98 + index * 24;
          context.strokeText(line, 90, y);
          context.fillText(line, 90, y);
        });
        context.restore();
      }
      if (!this.textures.exists(key)) {
        if (context) this.textures.addCanvas(key, canvas);
        else this.textures.addImage(key, source);
      }
      this.pendingSvgTextures.delete(key);
      if (this.scene.isActive()) this.refreshFurniture();
    };
    source.onerror = () => this.pendingSvgTextures.delete(key);
    const loadAfterFonts = async () => {
      try {
        await document.fonts.load('700 24px Mali');
        await document.fonts.ready;
      } catch { /* SVG vẫn có font tiếng Việt nhúng làm dự phòng */ }
      // Safari iOS does not reliably expose fonts embedded in an SVG loaded as
      // an image. The SVG supplies the art; the shop name is painted on canvas.
      source.src = svgUrl(furnitureSvg('shop-sign', side, shopName, false));
    };
    void loadAfterFonts();
  }
  private customerForId(id: string) {
    return customers.find(customer => customer.id === id) ?? lookupCustomer(id);
  }
  private customerEntrance(lane = 0) {
    const expansion = Math.max(0, landSize(this.store.state) - landExpansion[0].size);
    const floorShift = expansion * 56;
    const laneOffsets = [0, -20, 20, -40, 40];
    const laneX = laneOffsets[lane % laneOffsets.length];
    const arrivalCells = [
      { x: 3 + expansion, y: 4 + expansion },
      { x: 2 + expansion, y: 4 + expansion },
      { x: 4 + expansion, y: 3 + expansion },
      { x: 2 + expansion, y: 3 + expansion },
      { x: 4 + expansion, y: 4 + expansion },
    ];
    const arrivalCell = arrivalCells.find(point => !this.store.state.layout.some(item => {
      if (isWallFurnitureId(item.id) || ['atelier-rug', 'heart-rug', 'checkered-rug'].includes(item.id)) return false;
      const footprint = furnitureFootprint(item);
      return point.x + .5 > item.x && point.x + .5 < item.x + footprint.width
        && point.y + .5 > item.y && point.y + .5 < item.y + footprint.height;
    }));
    const freeInside = arrivalCell ? toWorld(arrivalCell.x + .5, arrivalCell.y + .5) : undefined;
    return {
      spawn: { x: 522 + laneX, y: 594 + floorShift + Math.abs(laneX) * .18 },
      inside: {
        x: (freeInside?.x ?? 426) + laneX * .35,
        y: (freeInside?.y ?? 442 + floorShift) + Math.abs(laneX) * .1,
      },
      outside: { x: 548 + laneX, y: 645 + floorShift + Math.abs(laneX) * .18 },
    };
  }
  private shoppingTarget(customer: Customer, salt: string) {
    const hash = Array.from(`${customer.id}:${salt}`).reduce((value, char) => Math.imul(value ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0, 2166136261);
    const fixtures = this.store.state.layout.flatMap(placed => {
      const definition = furniture.find(item => item.id === placed.id);
      if (!definition?.display || !placed.displayItems?.length) return [];
      const displayed = placed.displayItems.map(id => products.find(product => product.id === id)).filter(Boolean);
      const relevance = displayed.reduce((score, product) => {
        if (!product) return score;
        return score + (customer.styles.includes(product.style) ? 5 : 0)
          + (customer.colors.includes(product.colorName) ? 3 : 0)
          + (customer.preferredCategories?.includes(product.category) ? 3 : 0);
      }, 0);
      return [{ placed, relevance: relevance + Math.min(3, displayed.length) }];
    }).sort((a, b) => b.relevance - a.relevance);
    const fixture = fixtures.length ? fixtures[hash % Math.min(3, fixtures.length)].placed : undefined;
    if (!fixture) return { x: 385 + hash % 61, y: 412 + (hash >>> 8) % 33 };

    const footprint = furnitureFootprint(fixture);
    const size = landSize(this.store.state);
    const possible = [
      { x: fixture.x + footprint.width / 2, y: fixture.y + footprint.height + .42 },
      { x: fixture.x + footprint.width + .42, y: fixture.y + footprint.height / 2 },
      { x: fixture.x - .42, y: fixture.y + footprint.height / 2 },
      { x: fixture.x + footprint.width / 2, y: fixture.y - .42 },
    ];
    const ordered = possible.slice(hash % possible.length).concat(possible.slice(0, hash % possible.length));
    const free = ordered.find(point => point.x >= .35 && point.y >= .35 && point.x <= size - .35 && point.y <= size - .35 &&
      !this.store.state.layout.some(other => {
        if (other.uid === fixture.uid || isWallFurnitureId(other.id) || ['atelier-rug', 'heart-rug', 'checkered-rug'].includes(other.id)) return false;
        const occupied = furnitureFootprint(other);
        return point.x > other.x - .12 && point.x < other.x + occupied.width + .12 && point.y > other.y - .12 && point.y < other.y + occupied.height + .12;
      })) ?? possible[0];
    const world = toWorld(Phaser.Math.Clamp(free.x, .35, size - .35), Phaser.Math.Clamp(free.y, .35, size - .35));
    return { x: world.x, y: world.y + 7 };
  }
  private spacedCustomerTarget(target: { x: number; y: number }, uid: string) {
    const occupied: { x: number; y: number }[] = [];
    if (this.avatar && this.primaryVisitUid !== uid && !this.departing) occupied.push({
      x: this.avatar.getData('customerTargetX') ?? this.avatar.x,
      y: this.avatar.getData('customerTargetY') ?? this.avatar.y,
    });
    for (const [otherUid, entry] of this.secondaryCustomers) {
      if (otherUid !== uid) occupied.push({
        x: entry.container.getData('customerTargetX') ?? entry.container.x,
        y: entry.container.getData('customerTargetY') ?? entry.container.y,
      });
    }
    for (const staff of this.staffAvatars.values()) occupied.push({ x: staff.x, y: staff.y });
    const offsets = [
      { x: 0, y: 0 },
      { x: 56, y: 28 }, { x: -56, y: 28 },
      { x: 56, y: -28 }, { x: -56, y: -28 },
      { x: 112, y: 0 }, { x: -112, y: 0 },
      { x: 0, y: 56 }, { x: 0, y: -56 },
    ];
    const isClear = (point: { x: number; y: number }) => occupied.every(other => {
      const dx = (point.x - other.x) / 76;
      const dy = (point.y - other.y) / 48;
      return dx * dx + dy * dy >= 1;
    });
    const option = offsets.map(offset => ({ x: target.x + offset.x, y: target.y + offset.y }))
      .find(point => point.x >= 170 && point.x <= 830 && point.y >= 270 && point.y <= 535 && isClear(point));
    return option ?? target;
  }
  private reflowCustomerChats() {
    type ChatEntry = { chat: Phaser.GameObjects.Container; baseX: number; baseY: number };
    const chats: ChatEntry[] = [];
    if (this.speechBubbleContainer?.visible && this.avatar) {
      chats.push({
        chat: this.speechBubbleContainer,
        baseX: this.speechBubbleContainer.getData('baseX') ?? this.speechBubbleContainer.x,
        baseY: this.speechBubbleContainer.getData('baseY') ?? this.speechBubbleContainer.y,
      });
    }
    for (const entry of this.secondaryCustomers.values()) chats.push({ chat: entry.chat, baseX: 0, baseY: 0 });
    // A single bubble cannot overlap another bubble. Avoid getBounds(),
    // sorting and rectangle allocation during the common one-customer case.
    if (chats.length < 2) {
      const entry = chats[0];
      if (entry) entry.chat.setPosition(entry.baseX, entry.baseY);
      return;
    }
    chats.sort((a, b) => {
      const parentA = a.chat.parentContainer;
      const parentB = b.chat.parentContainer;
      return (parentA?.x ?? 0) - (parentB?.x ?? 0);
    });

    const placed: Phaser.Geom.Rectangle[] = [];
    const offsets = [
      { x: 0, y: 0 }, { x: 0, y: -34 },
      { x: -38, y: -18 }, { x: 38, y: -18 },
      { x: -58, y: -5 }, { x: 58, y: -5 },
      { x: 0, y: -62 },
    ];
    for (const entry of chats) {
      let chosen = offsets[0];
      for (const offset of offsets) {
        entry.chat.setPosition(entry.baseX + offset.x, entry.baseY + offset.y);
        const bounds = entry.chat.getBounds();
        const padded = new Phaser.Geom.Rectangle(bounds.x - 4, bounds.y - 3, bounds.width + 8, bounds.height + 6);
        if (padded.left < 18 || padded.right > 982 || padded.top < 18 || placed.some(other => Phaser.Geom.Intersects.RectangleToRectangle(padded, other))) continue;
        chosen = offset;
        break;
      }
      entry.chat.setPosition(entry.baseX + chosen.x, entry.baseY + chosen.y);
      const bounds = entry.chat.getBounds();
      placed.push(new Phaser.Geom.Rectangle(bounds.x - 4, bounds.y - 3, bounds.width + 8, bounds.height + 6));
    }
  }

  private drawDashedLine(graphics: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, dash = 4, gap = 3) {
    const length = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    if (!length) return;
    const dx = (x2 - x1) / length;
    const dy = (y2 - y1) / length;
    for (let position = 0; position < length; position += dash + gap) {
      const end = Math.min(length, position + dash);
      graphics.lineBetween(x1 + dx * position, y1 + dy * position, x1 + dx * end, y1 + dy * end);
    }
  }

  private strokeDashedBubble(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, radius = 7, color = 0x493746, pointerGap = 0) {
    const right = x + width;
    const bottom = y + height;
    graphics.lineStyle(1.6, color, .9);
    this.drawDashedLine(graphics, x + radius, y, right - radius, y);
    this.drawDashedLine(graphics, right, y + radius, right, bottom - radius);
    if (pointerGap) {
      const center = x + width / 2;
      this.drawDashedLine(graphics, right - radius, bottom, center + pointerGap, bottom);
      this.drawDashedLine(graphics, center - pointerGap, bottom, x + radius, bottom);
    } else {
      this.drawDashedLine(graphics, right - radius, bottom, x + radius, bottom);
    }
    this.drawDashedLine(graphics, x, bottom - radius, x, y + radius);
    const corners = [
      [x + radius, y + radius, Math.PI, Math.PI * 1.5],
      [right - radius, y + radius, Math.PI * 1.5, Math.PI * 2],
      [right - radius, bottom - radius, 0, Math.PI * .5],
      [x + radius, bottom - radius, Math.PI * .5, Math.PI],
    ] as const;
    for (const [cx, cy, start, end] of corners) {
      graphics.beginPath();
      graphics.arc(cx, cy, radius, start, end);
      graphics.strokePath();
    }
  }
  private updateAdviceWaitingState() {
    if (this.store.state.phase !== 'open') return;
    const dots = '.'.repeat(1 + Math.floor(this.time.now / 420) % 3);
    const focused = activeVisit(this.store.state);
    if (focused?.mode === 'advice' && this.speechBubbleContainer?.visible && this.speechBubbleText) {
      const employee = focused.assignedStaffUid
        ? this.store.state.employees.find(candidate => candidate.uid === focused.assignedStaffUid)
        : undefined;
      const nextText = employee
        ? `Đang được hỗ trợ${dots}\nSắp hoàn tất`
        : `Chờ tư vấn${dots} ${focused.patience}s\nChạm để hỗ trợ`;
      if (this.speechBubbleText.text !== nextText) this.speechBubbleText.setText(nextText);
      this.speechBubbleText.setColor(!employee && focused.patience <= 10 ? '#d7194a' : '#7952a6');
    }
    for (const [uid, entry] of this.secondaryCustomers) {
      const visit = this.store.state.activeVisits.find(candidate => candidate.uid === uid);
      if (visit?.mode !== 'advice') continue;
      const label = entry.chat.list[1] as Phaser.GameObjects.Text | undefined;
      if (!label) continue;
      const employee = visit.assignedStaffUid
        ? this.store.state.employees.find(candidate => candidate.uid === visit.assignedStaffUid)
        : undefined;
      const nextText = employee ? `Được hỗ trợ${dots}` : `Chờ tư vấn${dots} ${visit.patience}s`;
      if (label.text !== nextText) label.setText(nextText);
      label.setColor(!employee && visit.patience <= 10 ? '#d7194a' : '#7952a6');
    }
  }

  private refreshSecondaryCustomers() {
    // Trong lúc khách chính đang đi ra, khách kế tiếp vẫn phải đứng nguyên trong shop.
    // Chỉ chuyển họ thành nhân vật chính sau khi animation rời cửa hàng hoàn tất.
    const focusedUid = this.departing ? this.primaryVisitUid : activeVisit(this.store.state)?.uid;
    const waiting = this.store.state.activeVisits.filter(visit => visit.uid !== focusedUid);
    const activeUids = new Set(waiting.map(visit => visit.uid));
    const allVisitUids = new Set(this.store.state.activeVisits.map(visit => visit.uid));
    for (const [uid, entry] of this.secondaryCustomers) {
      if (activeUids.has(uid)) continue;
      // Keep the position only while this visit is being promoted to the
      // focused customer. Completed/walked-out visits must not grow the maps
      // for the rest of a long sale day.
      if (allVisitUids.has(uid)) this.customerPositions.set(uid, { x: entry.container.x, y: entry.container.y });
      else {
        this.customerPositions.delete(uid);
        this.customerTextureAssignments.delete(uid);
      }
      this.destroyAnimatedContainer(entry.container);
      this.secondaryCustomers.delete(uid);
    }
    const positions = [
      { x: 535, y: 430 },
      { x: 350, y: 414 },
      { x: 585, y: 386 },
      { x: 305, y: 455 },
    ];
    waiting.forEach((visit, index) => {
      const customer = this.customerForId(visit.customerId);
      if (!customer) return;
      const desiredTarget = visit.mode === 'browse' ? this.shoppingTarget(customer, visit.uid) : positions[index % positions.length];
      const target = this.spacedCustomerTarget(desiredTarget, visit.uid);
      const entrance = this.customerEntrance(index + 1);
      let entry = this.secondaryCustomers.get(visit.uid);
      if (!entry) {
        const sprite = this.add.image(0, 0, this.getCustomerTextureKey(customer, false, visit.uid)).setScale(SECONDARY_CUSTOMER_SCALE).setOrigin(.5, 1);
        const bubble = this.add.graphics();
        const bubbleWidth = visit.mode === 'advice' ? 82 : 76;
        const bubbleFill = visit.mode === 'advice' ? 0xfff8dd : 0xffffff;
        bubble.fillStyle(bubbleFill, .56).fillRoundedRect(-bubbleWidth / 2, -132, bubbleWidth, 27, 7);
        this.strokeDashedBubble(bubble, -bubbleWidth / 2, -132, bubbleWidth, 27, 7, 0x493746, 6);
        bubble.fillStyle(bubbleFill, .56).fillTriangle(-6, -106, 6, -106, 0, -97);
        bubble.lineStyle(1.6, 0x493746, .9);
        this.drawDashedLine(bubble, -6, -106, 0, -97, 3, 2);
        this.drawDashedLine(bubble, 0, -97, 6, -106, 3, 2);
        const label = this.add.text(visit.mode === 'advice' ? 3 : 0, -118.5, visit.mode === 'advice' ? `Chờ tư vấn... ${visit.patience}s` : `${customer.name} · xem đồ`, {
          fontFamily: 'Nunito, Arial, sans-serif', fontSize: '7px', fontStyle: 'bold', color: visit.mode === 'advice' && visit.patience <= 10 ? '#d7194a' : visit.mode === 'advice' ? '#7952a6' : '#4675a1', stroke: '#fffdfb', strokeThickness: 2, align: 'center', wordWrap: { width: bubbleWidth - 12 },
        }).setOrigin(.5).setResolution(2);
        const chat = this.add.container(0, 0, [bubble, label]);
        const remembered = this.customerPositions.get(visit.uid);
        const container = this.add.container(remembered?.x ?? entrance.spawn.x, remembered?.y ?? entrance.spawn.y, [sprite, chat]).setDepth(remembered?.y ?? entrance.spawn.y).setSize(104, 170).setInteractive({ useHandCursor: visit.mode === 'advice' });
        container.setData('customerTargetX', remembered?.x ?? target.x).setData('customerTargetY', remembered?.y ?? target.y);
        let downX = 0, downY = 0;
        container.on('pointerdown', (pointer: Phaser.Input.Pointer) => { downX = pointer.x; downY = pointer.y; });
        container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          if (this.edit || Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y) >= 8) return;
          this.store.focusCustomer(visit.uid);
          if (visit.mode === 'advice') this.focusCallback();
        });
        entry = { container, chat };
        this.secondaryCustomers.set(visit.uid, entry);
        if (remembered) {
          container.setDepth(container.y);
        } else {
          this.tweens.add({
            targets: container, x: target.x, y: target.y, duration: 850 + index * 100, ease: 'Sine.inOut',
            onUpdate: () => {
              container.setDepth(container.y);
              this.customerPositions.set(visit.uid, { x: container.x, y: container.y });
            },
            onComplete: () => this.customerPositions.set(visit.uid, { x: container.x, y: container.y }),
          });
        }
      } else {
        entry.container.setDepth(entry.container.y);
        this.customerPositions.set(visit.uid, { x: entry.container.x, y: entry.container.y });
      }
    });
  }
  private refreshOnlineShippers() {
    const orders = this.store.state.phase === 'open' ? this.store.state.onlineOrders : [];
    const activeIds = new Set(orders.map(order => order.id));
    for (const [orderId, container] of this.onlineShippers) {
      if (activeIds.has(orderId)) continue;
      this.destroyAnimatedContainer(container);
      this.onlineShippers.delete(orderId);
    }
    const spots = [
      toWorld(6.2, 4.3), toWorld(5.65, 4.85), toWorld(6.45, 5.15),
      toWorld(5.15, 5.35), toWorld(6.75, 3.7),
    ];
    orders.forEach((order, index) => {
      const existing = this.onlineShippers.get(order.id);
      if (existing) { existing.setDepth(existing.y + 4); return; }
      const spot = spots[index % spots.length];
      const courierVariant = ((Math.trunc(order.courierVariant) % COURIER_APPEARANCE_COUNT) + COURIER_APPEARANCE_COUNT) % COURIER_APPEARANCE_COUNT;
      const sprite = this.add.image(0, 0, `courier-photo-${courierVariant}`).setScale(COURIER_SCALE).setOrigin(.5, 1);
      const bubble = this.add.graphics();
      bubble.fillStyle(0xeafff9, .56).fillRoundedRect(-47, -132, 94, 31, 9);
      this.strokeDashedBubble(bubble, -47, -132, 94, 31, 9, 0x493746, 6);
      bubble.fillStyle(0xeafff9, .56).fillTriangle(-6, -101, 6, -101, 0, -92);
      bubble.lineStyle(1.6, 0x493746, .9);
      this.drawDashedLine(bubble, -6, -101, 0, -92, 3, 2);
      this.drawDashedLine(bubble, 0, -92, 6, -101, 3, 2);
      const label = this.add.text(0, -116.5, `ĐƠN ONLINE #${index + 1}\nChạm để giao hàng`, {
        fontFamily: 'Nunito, Arial, sans-serif', fontSize: '7px', fontStyle: 'bold', color: '#293a3a', stroke: '#ffffff', strokeThickness: 2, align: 'center', lineSpacing: 1,
      }).setOrigin(.5).setResolution(2);
      const container = this.add.container(spot.x, spot.y, [sprite, bubble, label]).setDepth(spot.y + 4).setSize(100, 170).setInteractive(new Phaser.Geom.Rectangle(0, -85, 100, 170), Phaser.Geom.Rectangle.Contains);
      container.input!.cursor = 'pointer';
      let downX = 0, downY = 0;
      container.on('pointerdown', (pointer: Phaser.Input.Pointer) => { downX = pointer.x; downY = pointer.y; });
      container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.edit || this.hasPanned || Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y) >= 8) return;
        this.onlineOrderCallback(order.id);
      });
      this.onlineShippers.set(order.id, container);
      container.setScale(.2).setAlpha(0);
      this.tweens.add({ targets: container, scale: 1, alpha: 1, duration: 330, ease: 'Back.easeOut' });
      this.tweens.add({ targets: sprite, y: -3, duration: 1050 + index * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
  }

  private clearCustomer() {
    this.departureTimer?.remove(false); this.departureTimer = undefined;
    this.customerActionTimer?.remove(false); this.customerActionTimer = undefined;
    this.customerWalkTween?.stop(); this.customerWalkTween = undefined;
    this.departing = false;
    if (this.avatar) { this.destroyAnimatedContainer(this.avatar); this.avatar = undefined; }
    this.primaryVisitUid = '';
    this.customerId = '';
    if (this.store.state.phase !== 'open') {
      for (const entry of this.secondaryCustomers.values()) this.destroyAnimatedContainer(entry.container);
      this.secondaryCustomers.clear();
      this.customerPositions.clear();
      this.customerTextureAssignments.clear();
    }
  }

  private showSpeechBubble(text: string, type: 'thought' | 'advice' | 'buy' | 'leave') {
    if (!this.avatar || !this.speechBubbleGfx || !this.speechBubbleText || !this.speechBubbleContainer) return;
    this.speechBubbleText.setText(text);

    const sprite = this.avatar.list[0] as Phaser.GameObjects.Image;
    // Anchor the bubble at the crown, in the same local coordinates as the sprite.
    // Scaling the pop animation around this point keeps the pointer on the head.
    const headY = sprite.y - sprite.displayHeight * sprite.originY + 4 * sprite.scaleY - 2;
    this.speechBubbleContainer.setData('baseX', sprite.x).setData('baseY', headY).setPosition(sprite.x, headY);
    const padX = 6;
    const padY = 3;
    const textW = this.speechBubbleText.width;
    const textH = this.speechBubbleText.height;
    const boxW = Math.max(52, textW + padX * 2);
    const boxH = Math.max(18, textH + padY * 2);
    const boxX = -boxW / 2;
    const boxY = -10 - boxH;
    if (type === 'advice') {
      this.speechBubbleGfx.setInteractive(new Phaser.Geom.Rectangle(boxX - 4, boxY - 4, boxW + 8, boxH + 8), Phaser.Geom.Rectangle.Contains);
      this.speechBubbleGfx.input!.cursor = 'pointer';
    } else {
      this.speechBubbleGfx.disableInteractive();
    }

    this.speechBubbleGfx.clear();

    const bg = type === 'advice' ? 0xfff8d9 : type === 'buy' ? 0xeaffef : type === 'leave' ? 0xffe9ed : 0xffffff;
    const textColor = type === 'advice' ? '#7952a6' : type === 'buy' ? '#214f34' : type === 'leave' ? '#662b38' : '#35263b';
    this.speechBubbleGfx.fillStyle(bg, .56);
    this.speechBubbleGfx.fillRoundedRect(boxX, boxY, boxW, boxH, 8);
    this.strokeDashedBubble(this.speechBubbleGfx, boxX, boxY, boxW, boxH, 8, 0x493746, 6);
    this.speechBubbleGfx.fillStyle(bg, .56).fillTriangle(-6, -11, 6, -11, 0, 0);
    this.speechBubbleGfx.lineStyle(1.6, 0x493746, .9);
    this.drawDashedLine(this.speechBubbleGfx, -6, -11, 0, 0, 3, 2);
    this.drawDashedLine(this.speechBubbleGfx, 0, 0, 6, -11, 3, 2);
    this.speechBubbleText.setColor(textColor).setStroke('#fffdfb', 2);

    this.speechBubbleText.setPosition(0, boxY + boxH / 2);
    this.speechBubbleContainer.setVisible(true);
    this.tweens.killTweensOf(this.speechBubbleContainer);
    this.speechBubbleContainer.setScale(0.94);
    this.tweens.add({
      targets: this.speechBubbleContainer,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut'
    });
    this.reflowCustomerChats();
  }

  /** Lấy texture key cho khách hàng (hỗ trợ cả khách static lẫn procedural) */
  private getCustomerTextureKey(c: Customer, happy = false, visitUid?: string): string {
    const suffix = happy ? '-happy' : '';
    const exactKey = `c-${c.id}${suffix}`;
    if (this.textures.exists(exactKey)) return exactKey;
    if (visitUid) {
      let assigned = this.customerTextureAssignments.get(visitUid);
      if (!assigned) {
        const used = new Set(this.customerTextureAssignments.values());
        for (const active of this.store.state.activeVisits) {
          const activeCustomer = this.customerForId(active.customerId);
          if (active.uid !== visitUid && activeCustomer && this.textures.exists(`c-${activeCustomer.id}`)) used.add(`c-${activeCustomer.id}`);
        }
        const hash = Array.from(c.id).reduce((value, char) => Math.imul(value ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0, 2166136261);
        for (let offset = 0; offset < customers.length; offset++) {
          const candidate = `c-${customers[(hash + offset) % customers.length].id}`;
          if (!used.has(candidate)) { assigned = candidate; break; }
        }
        assigned ??= `c-${customers[hash % customers.length].id}`;
        this.customerTextureAssignments.set(visitUid, assigned);
      }
      if (this.textures.exists(`${assigned}${suffix}`)) return `${assigned}${suffix}`;
      if (this.textures.exists(assigned)) return assigned;
    }
    const archetype = getCustomerArchetype(c);
    const archKey = `c-${archetype}${suffix}`;
    if (this.textures.exists(archKey)) return archKey;
    const fallbackWithMood = `c-lily${suffix}`;
    return this.textures.exists(fallbackWithMood) ? fallbackWithMood : 'c-lily';
  }

  /** Return the same visual identity used by the in-shop Phaser sprite. */
  customerVisualForVisit(c: Customer, visitUid: string): Customer {
    const textureKey = this.getCustomerTextureKey(c, false, visitUid);
    const customerId = textureKey.startsWith('c-') ? textureKey.slice(2).replace(/-happy$/, '') : '';
    return customers.find(customer => customer.id === customerId) ?? c;
  }

  refreshCustomer() {
    if (this.departing) { this.refreshSecondaryCustomers(); this.refreshStaff(); return; }
    const c = activeCustomer(this.store.state);
    const visit = activeVisit(this.store.state);
    const key = c ? `${this.store.state.day}-${visit?.uid ?? `${this.store.state.customerIndex}-${c.id}`}` : '';
    if (key === this.customerId) {
      this.refreshSecondaryCustomers();
      this.refreshStaff();
      return;
    }
    if (this.avatar && this.primaryVisitUid) this.customerPositions.set(this.primaryVisitUid, { x: this.avatar.x, y: this.avatar.y });
    for (const [uid, entry] of this.secondaryCustomers) this.customerPositions.set(uid, { x: entry.container.x, y: entry.container.y });
    const rememberedPosition = visit ? this.customerPositions.get(visit.uid) : undefined;
    const entrance = this.customerEntrance();
    this.clearCustomer(); this.customerId = key;
    this.primaryVisitUid = visit?.uid ?? '';
    if (!c) { this.refreshSecondaryCustomers(); this.refreshStaff(); return; }

    // Chủ shop tương tác chào đón khách khi khách ghé boutique
    const welcomePool = this.store.state.customerMode === 'advice' ? OWNER_ADVICE_CHATS : OWNER_BROWSE_CHATS;
    const welcome = welcomePool[Math.floor(Math.random() * welcomePool.length)];
    this.time.delayedCall(350, () => {
      if (this.avatar && !this.departing) {
        this.showOwnerSpeech(welcome, 3600);
      }
    });

    const sprite = this.add.image(0, 0, this.getCustomerTextureKey(c, false, visit?.uid)).setScale(PRIMARY_CUSTOMER_SCALE).setOrigin(.5, 1);

    this.speechBubbleGfx = this.add.graphics();
    let badgeDownX = 0, badgeDownY = 0, badgeDownTime = 0;
    this.speechBubbleGfx.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      badgeDownX = pointer.x; badgeDownY = pointer.y; badgeDownTime = Date.now();
    });
    this.speechBubbleGfx.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (Phaser.Math.Distance.Between(badgeDownX, badgeDownY, pointer.x, pointer.y) < 8 &&
        Date.now() - badgeDownTime < 350 && !this.hasPanned && !this.edit && !this.departing &&
        customerNeedsAdvice(this.store.state, c)) this.focusCallback();
    });
    this.speechBubbleText = this.add.text(0, 0, '', {
      fontFamily: 'Nunito, Arial, sans-serif',
      fontSize: '7.5px',
      fontStyle: 'bold',
      color: '#35263b',
      stroke: '#fffdfb',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 94 }
    }).setOrigin(.5, .5).setResolution(2);
    this.speechBubbleContainer = this.add.container(0, 0, [this.speechBubbleGfx, this.speechBubbleText]);
    this.speechBubbleContainer.setVisible(false);

    // Phaser adds the container display origin before testing the hit area.
    this.avatar = this.add.container(rememberedPosition?.x ?? entrance.spawn.x, rememberedPosition?.y ?? entrance.spawn.y, [sprite, this.speechBubbleContainer]).setDepth(rememberedPosition?.y ?? entrance.spawn.y).setSize(88, 154).setInteractive(new Phaser.Geom.Rectangle(0, -77, 88, 154), Phaser.Geom.Rectangle.Contains);
    this.avatar.setData('customerTargetX', rememberedPosition?.x ?? entrance.inside.x).setData('customerTargetY', rememberedPosition?.y ?? entrance.inside.y);
    this.avatar.input!.cursor = customerNeedsAdvice(this.store.state, c) ? 'pointer' : 'default';

    let avatarDownX = 0, avatarDownY = 0, avatarDownTime = 0;
    this.avatar.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      avatarDownX = pointer.x; avatarDownY = pointer.y; avatarDownTime = Date.now();
    });
    this.avatar.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const dist = Phaser.Math.Distance.Between(avatarDownX, avatarDownY, pointer.x, pointer.y);
      const elapsed = Date.now() - avatarDownTime;
      if (dist < 8 && elapsed < 350 && !this.hasPanned) {
        if (!this.edit && !this.departing && customerNeedsAdvice(this.store.state, c)) this.focusCallback();
      }
    });

    const finishArrival = () => {
      if (!this.avatar) return;
      this.customerPositions.set(visit?.uid ?? '', { x: this.avatar.x, y: this.avatar.y });
      this.tweens.add({ targets: this.avatar, y: this.avatar.y - 3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.handleCustomerBrowsingOrAdvice(c);
    };
    if (rememberedPosition) {
      finishArrival();
    } else {
      this.tweens.add({
        targets: this.avatar,
        x: entrance.inside.x,
        y: entrance.inside.y,
        duration: 1300,
        ease: 'Sine.inOut',
        onUpdate: () => {
          if (!this.avatar) return;
          this.avatar.setDepth(this.avatar.y);
          if (visit) this.customerPositions.set(visit.uid, { x: this.avatar.x, y: this.avatar.y });
        },
        onComplete: finishArrival,
      });
      this.tweens.add({ targets: sprite, angle: { from: -3, to: 3 }, duration: 170, yoyo: true, repeat: 6, onComplete: () => sprite.setAngle(0) });
    }
    this.refreshSecondaryCustomers();
    this.refreshStaff();
  }

  private handleCustomerBrowsingOrAdvice(c: Customer) {
    if (!this.avatar || this.departing) return;
    const needsAdvice = customerNeedsAdvice(this.store.state, c);

    if (needsAdvice) {
      // Khách cần tư vấn outfit: Hiện bong bóng gợi ý
      const visit = activeVisit(this.store.state);
      this.showSpeechBubble(`Chờ tư vấn... ${visit?.patience ?? this.store.state.patience}s\nChạm để hỗ trợ`, 'advice');
      return;
    }

    // Khách tự chọn quần áo như khách ngoài đời:
    // Bước 1: Cảm thán / suy nghĩ ngẫu nhiên khi bước vào dạo shop
    const thought = randomBrowseThought(this.store.state, c);
    this.showSpeechBubble(`Đang tự chọn đồ\n${thought}`, 'thought');

    // Bước 2: Sau 2.2 giây, khách bước nhẹ sang một góc kệ đồ ngắm nghía
    this.customerActionTimer = this.time.delayedCall(2200, () => {
      if (!this.avatar || this.departing) return;
      const visit = activeVisit(this.store.state);
      const target = this.spacedCustomerTarget(this.shoppingTarget(c, visit?.uid ?? this.customerId), visit?.uid ?? this.customerId);
      this.avatar.setData('customerTargetX', target.x).setData('customerTargetY', target.y);
      const sprite = this.avatar.list[0] as Phaser.GameObjects.Image;

      this.customerWalkTween = this.tweens.add({
        targets: sprite,
        scaleY: PRIMARY_CUSTOMER_SCALE * 0.91,
        duration: 120,
        yoyo: true,
        repeat: 5,
        ease: 'Sine.easeInOut'
      });

      this.tweens.killTweensOf(this.avatar);
      this.tweens.add({
        targets: this.avatar,
        x: target.x,
        y: target.y,
        duration: 850,
        ease: 'Sine.inOut',
        onUpdate: () => {
          if (!this.avatar) return;
          this.avatar.setDepth(this.avatar.y);
          if (visit) this.customerPositions.set(visit.uid, { x: this.avatar.x, y: this.avatar.y });
        },
        onComplete: () => {
          if (this.avatar && !this.departing) this.tweens.add({ targets: this.avatar, y: this.avatar.y - 3, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        },
      });
    });
  }

  private customerLeaveShop(avatar: Phaser.GameObjects.Container) {
    const exit = this.customerEntrance().outside;
    this.tweens.killTweensOf(avatar);
    this.tweens.add({
      targets: avatar,
      x: exit.x,
      y: exit.y,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.inOut',
      onComplete: () => {
        if (this.avatar === avatar) {
          if (this.primaryVisitUid) {
            this.customerPositions.delete(this.primaryVisitUid);
            this.customerTextureAssignments.delete(this.primaryVisitUid);
          }
          this.destroyAnimatedContainer(avatar);
          this.avatar = undefined;
          this.customerId = '';
        }
        this.departing = false;
        this.refreshCustomer();
      }
    });
  }

  private animateSale(result: SaleResult) {
    if (result.visitUid && result.visitUid !== this.primaryVisitUid) {
      const entry = this.secondaryCustomers.get(result.visitUid);
      if (entry) {
        this.secondaryCustomers.delete(result.visitUid);
        this.customerPositions.delete(result.visitUid);
        const { container } = entry;
        const sprite = container.list[0] as Phaser.GameObjects.Image;
        sprite.setTexture(this.getCustomerTextureKey(result.customer, result.success, result.visitUid));
        if (result.success) this.burst(container.x, container.y - 70, result.viral);
        const exit = this.customerEntrance().outside;
        this.tweens.add({
          targets: container, x: exit.x, y: exit.y, alpha: 0, duration: 850, ease: 'Sine.inOut', onComplete: () => {
            if (result.visitUid) this.customerTextureAssignments.delete(result.visitUid);
            this.destroyAnimatedContainer(container);
            this.refreshCustomer();
          }
        });
      } else this.refreshCustomer();
      return;
    }

    if (this.departing) { if (result.success) this.burst(426, 372, result.viral); return; }
    if (!this.avatar) { this.refreshCustomer(); return; }

    this.customerActionTimer?.remove(false);
    this.customerActionTimer = undefined;
    this.departing = true;
    const avatar = this.avatar;
    this.tweens.killTweensOf(avatar);
    const sprite = avatar.list[0] as Phaser.GameObjects.Image;
    sprite.setTexture(this.getCustomerTextureKey(result.customer, result.success, result.visitUid));

    this.tweens.add({ targets: sprite, scaleX: 0, duration: 150, yoyo: true, onYoyo: () => sprite.setTint(result.success ? 0xffe8f8 : 0xffffff), onComplete: () => sprite.clearTint() });
    const reaction = result.success
      ? result.viral ? 'Mê quá! Chốt đơn nhé ✦' : 'Xinh quá, mình lấy nhé!'
      : 'Chưa hợp lắm, hẹn lần sau nhé.';
    this.showSpeechBubble(reaction, result.success ? 'buy' : 'leave');

    // Chủ shop tương tác vui vẻ / động viên khách
    if (result.success) {
      const happyMsg = OWNER_SALE_SUCCESS_CHATS[Math.floor(Math.random() * OWNER_SALE_SUCCESS_CHATS.length)];
      this.showOwnerSpeech(happyMsg, 3500);
    } else {
      const leaveMsg = OWNER_SALE_LEAVE_CHATS[Math.floor(Math.random() * OWNER_SALE_LEAVE_CHATS.length)];
      this.showOwnerSpeech(leaveMsg, 3500);
    }

    if (result.success) this.burst(avatar.x, avatar.y - 60, result.viral);
    this.departureTimer = this.time.delayedCall(1900, () => {
      this.customerLeaveShop(avatar);
    });
  }
  burst(x: number, y: number, big = false) {
    const colors = [0xf8b0d0, 0xf8e080, 0xa8f0d8, 0xd0b0f8];
    for (let i = 0; i < (big ? 24 : 12); i++) {
      const dot = this.add.circle(x, y, 3, colors[i % colors.length]).setDepth(1800);
      const angle = i / 12 * Math.PI * 2;
      this.tweens.add({ targets: dot, x: x + Math.cos(angle) * (60 + Math.random() * 80), y: y + Math.sin(angle) * 80 - 40, alpha: 0, duration: 1000 + Math.random() * 600, onComplete: () => dot.destroy() });
    }
  }
  zoom() {
    if (Math.abs(this.cameras.main.zoom - 1) > 0.05 || Math.abs(this.cameras.main.scrollX) > 10 || Math.abs(this.cameras.main.scrollY) > 10) {
      this.cameras.main.pan(0, 0, 300, 'Sine.easeInOut');
      this.cameras.main.zoomTo(1, 300);
      this.zoomed = false;
    } else {
      this.zoomed = true;
      this.cameras.main.zoomTo(1.28, 300);
    }
  }

  private getCounterOwnerSpot(): { x: number; y: number; depth: number; flipX: boolean } {
    const counter = this.store.state.layout.find(p => p.id === 'counter');
    if (!counter) {
      // Vị trí mặc định ở giữa shop khi chưa có quầy thu ngân
      return { x: 500, y: 460, depth: 450, flipX: false };
    }

    // Quầy thu ngân được vẽ tại toWorld(counter.x + 0.5, counter.y + 0.5) với depth = counterPos.y
    const counterPos = furnitureAnchor(counter);
    const counterDepth = counterPos.y;

    const isRotated = counter.rotation === 1;
    // BẮT BUỘC: Chủ shop luôn luôn đứng sau bàn thanh toán (như thực tế boutique ngoài đời):
    // Chiếc máy tính tiền nằm trên quầy, màn hình quay vào phía chủ shop và lưng quay ra phía khách.
    // Sprite chủ shop hiện là hình toàn thân. Nâng điểm neo lên để vai và tay nằm phía trên mặt quầy.
    // Khi rotation = 0: máy tính tiền ở vị trí sâu trong bàn -> chủ shop đứng sau máy tính.
    // Khi rotation = 1 (quầy lật): máy tính tiền ở góc trái -> flipX: true.
    // depth của chủ shop PHẢI nhỏ hơn depth của quầy (counterDepth - 10) để mặt bàn quầy che phía trước thân dưới,
    // đầu, vai, ngực và hai bàn tay gõ máy tính tiền nhô lên sau quầy cực kỳ tự nhiên.
    const offsetX = (isRotated ? -12 : 12) + 12;
    const offsetY = -19;

    const ownerX = counterPos.x + offsetX;
    const ownerY = counterPos.y + offsetY;
    const ownerDepth = counterDepth - 10;

    return { x: ownerX, y: ownerY, depth: ownerDepth, flipX: isRotated };
  }

  private updateOwnerPosition(animate = true) {
    const target = this.getCounterOwnerSpot();
    if (!this.owner) {
      this.owner = this.add.image(target.x, target.y, 'owner-pc').setScale(.69).setOrigin(.5, 1).setDepth(target.depth).setFlipX(target.flipX);
      this.owner.setInteractive({ cursor: 'pointer' });
      this.owner.on('pointerdown', () => {
        if (this.edit || this.isDraggingPiece || this.currentTab !== 'shop') return;
        this.burst(this.owner!.x, this.owner!.y - 70);
        this.tweens.add({ targets: this.owner, scaleY: 0.62, duration: 100, yoyo: true });
        const customer = activeCustomer(this.store.state);
        const pool = customer
          ? this.store.state.customerMode === 'advice' ? OWNER_ADVICE_CHATS : OWNER_BROWSE_CHATS
          : this.store.state.phase === 'preparation' ? OWNER_IDLE_CHATS_PREP : OWNER_IDLE_CHATS_WAITING;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        this.showOwnerSpeech(msg, 3800);
      });
      this.ownerIdleTween = this.tweens.add({ targets: this.owner, y: target.y - 3, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, target.x, target.y);
    if (dist < 4) {
      this.owner.setTexture('owner-pc').setDepth(target.depth).setFlipX(target.flipX);
      return;
    }

    if (!animate) {
      this.ownerIdleTween?.stop();
      this.ownerMoveTween?.stop();
      this.ownerWalkTween?.stop();
      this.owner.setTexture('owner-pc').setPosition(target.x, target.y).setScale(.69).setDepth(target.depth).setFlipX(target.flipX);
      this.ownerIdleTween = this.tweens.add({ targets: this.owner, y: target.y - 3, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return;
    }

    // Đi bộ thông minh tới sau bàn thanh toán!
    this.ownerIdleTween?.stop();
    this.ownerMoveTween?.stop();
    this.ownerWalkTween?.stop();

    // Trong khi di chuyển dùng sprite dáng đi
    this.owner.setTexture('owner').setFlipX(target.x < this.owner.x);

    // Bước chân nhún nhấp nhô sống động
    this.ownerWalkTween = this.tweens.add({
      targets: this.owner,
      scaleY: 0.63,
      duration: 130,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const duration = Math.min(2200, Math.max(700, dist * 6.5));
    this.ownerMoveTween = this.tweens.add({
      targets: this.owner,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Sine.inOut',
      onUpdate: () => {
        if (!this.owner) return;
        this.owner.setDepth(target.depth);
        if (this.ownerSpeechBubble && this.ownerSpeechBubble.visible) {
          const headY = this.owner.y - (this.owner.displayHeight || 104) - 8;
          this.ownerSpeechBubble.setPosition(this.owner.x, headY);
        }
      },
      onComplete: () => {
        if (!this.owner) return;
        this.ownerWalkTween?.stop();
        // Khi tới nơi sau bàn thanh toán: chuyển sang tư thế làm việc trên máy tính tiền
        this.owner.setTexture('owner-pc').setScale(.69).setDepth(target.depth).setFlipX(target.flipX);
        this.ownerIdleTween = this.tweens.add({
          targets: this.owner,
          y: target.y - 3,
          duration: 1900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });
  }

  private startOwnerMusicNotes() {
    this.ownerMusicNoteTimer?.remove(false);
    this.ownerMusicNoteTimer = this.time.delayedCall(Phaser.Math.Between(2800, 4400), () => {
      if (this.store.state.music && this.currentTab === 'shop' && !this.edit && !this.isDraggingPiece && this.owner?.visible && !this.ownerSpeechBubble?.visible) {
        this.releaseOwnerMusicNotes();
      }
      this.startOwnerMusicNotes();
    });
  }

  private releaseOwnerMusicNotes() {
    const owner = this.owner;
    if (!owner || this.ownerSpeechBubble?.visible) return;
    this.ownerMusicNotesUntil = this.time.now + 2500;
    const headY = owner.y - owner.displayHeight * owner.originY + 13;
    const notes = [
      { glyph: '♪', color: '#d4429a', delay: 0, side: -1, rise: 54 },
      { glyph: '♫', color: '#9a67d1', delay: 230, side: 1, rise: 67 },
      { glyph: '♩', color: '#f07898', delay: 500, side: -1, rise: 46 },
    ];
    notes.forEach((noteSpec, index) => {
      this.time.delayedCall(noteSpec.delay, () => {
        if (!this.store.state.music || this.currentTab !== 'shop' || this.edit || this.isDraggingPiece || !this.owner?.visible) return;
        const startX = this.owner.x + noteSpec.side * (10 + index * 3);
        const startY = this.owner.y - this.owner.displayHeight * this.owner.originY + 15;
        const note = this.add.text(startX, startY, noteSpec.glyph, {
          fontFamily: "'Nunito', Arial, sans-serif",
          fontSize: index === 1 ? '20px' : '17px',
          fontStyle: 'bold',
          color: noteSpec.color,
          stroke: '#fff8fc',
          strokeThickness: 3,
        }).setOrigin(.5).setDepth(this.owner.depth + 30).setAlpha(0).setScale(.72);
        this.tweens.add({
          targets: note,
          y: headY - noteSpec.rise,
          angle: noteSpec.side * (12 + index * 4),
          scale: 1,
          duration: 1650 + index * 120,
          ease: 'Sine.easeOut',
          onUpdate: tween => {
            const progress = tween.progress;
            note.x = startX + noteSpec.side * progress * 17 + Math.sin(progress * Math.PI * 3) * 4;
            note.setAlpha(Math.sin(progress * Math.PI) * .95);
          },
          onComplete: () => note.destroy(),
        });
      });
    });
  }

  /* ==============================================================================
     Ô CHAT & CẢM THÁN CỦA CHỦ SHOP (Nhân vật chính)
     ============================================================================== */

  setupOwnerSpeechBubble() {
    this.ownerSpeechGfx = this.add.graphics();
    this.ownerSpeechText = this.add.text(0, 0, '', {
      fontFamily: 'Nunito Variable, Arial, sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#3e2740',
      stroke: '#fffdfb',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 126 }
    }).setOrigin(.5, .5).setResolution(2);

    this.ownerSpeechBubble = this.add.container(0, 0, [this.ownerSpeechGfx, this.ownerSpeechText]);
    this.ownerSpeechBubble.setDepth(1500).setVisible(false);
  }

  showOwnerSpeech(message: string, duration = 4200) {
    if (!this.owner || !this.ownerSpeechBubble || !this.ownerSpeechGfx || !this.ownerSpeechText) return;

    // Musical notes and dialogue never overlap. Keep the latest requested line
    // and reveal it as soon as the final note has faded away.
    if (this.time.now < this.ownerMusicNotesUntil) {
      this.ownerQueuedSpeechTimer?.remove(false);
      this.ownerQueuedSpeechTimer = this.time.delayedCall(this.ownerMusicNotesUntil - this.time.now + 60, () => {
        this.ownerQueuedSpeechTimer = undefined;
        this.showOwnerSpeech(message, duration);
      });
      return;
    }

    this.ownerHideTimer?.remove(false);
    this.ownerSpeechText.setText(message);

    const targetPos = this.getCounterOwnerSpot();
    const ownerX = this.owner.x || targetPos.x;
    const ownerY = this.owner.y || targetPos.y;
    const headY = ownerY - (this.owner.displayHeight || 104) - 8;

    this.ownerSpeechBubble.setPosition(ownerX, headY);
    this.ownerSpeechBubble.setDepth(1500);

    const padX = 8;
    const padY = 4;
    const textW = this.ownerSpeechText.width;
    const textH = this.ownerSpeechText.height;
    const boxW = Math.max(68, textW + padX * 2);
    const boxH = Math.max(22, textH + padY * 2);
    const boxX = -boxW / 2;
    const boxY = -boxH - 8;

    this.ownerSpeechGfx.clear();
    this.ownerSpeechGfx.fillStyle(0xfffbfc, .56);
    this.ownerSpeechGfx.fillRoundedRect(boxX, boxY, boxW, boxH, 8);
    this.strokeDashedBubble(this.ownerSpeechGfx, boxX, boxY, boxW, boxH, 8, 0x493746, 6);
    this.ownerSpeechGfx.fillStyle(0xfffbfc, .56);
    this.ownerSpeechGfx.fillTriangle(-6, boxY + boxH - 1, 6, boxY + boxH - 1, 0, boxY + boxH + 9);
    this.ownerSpeechGfx.lineStyle(1.6, 0x493746, .9);
    this.drawDashedLine(this.ownerSpeechGfx, -6, boxY + boxH - 1, 0, boxY + boxH + 9, 3, 2);
    this.drawDashedLine(this.ownerSpeechGfx, 0, boxY + boxH + 9, 6, boxY + boxH - 1, 3, 2);

    this.ownerSpeechText.setPosition(0, boxY + boxH / 2);
    this.ownerSpeechText.setColor('#3e2740').setStroke('#fffdfb', 2);

    this.ownerSpeechBubble.setVisible(true);
    this.tweens.killTweensOf(this.ownerSpeechBubble);
    this.ownerSpeechBubble.setScale(0.8);
    this.ownerSpeechBubble.setAlpha(1);

    this.tweens.add({
      targets: this.ownerSpeechBubble,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut'
    });

    this.ownerHideTimer = this.time.delayedCall(duration, () => {
      if (!this.ownerSpeechBubble) return;
      this.tweens.add({
        targets: this.ownerSpeechBubble,
        alpha: 0,
        scale: 0.85,
        duration: 260,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this.ownerSpeechBubble?.setVisible(false);
        }
      });
    });
  }

  startOwnerChatter() {
    this.ownerThoughtTimer?.remove(false);
    this.ownerThoughtTimer = this.time.addEvent({
      delay: 7500,
      loop: true,
      callback: () => {
        // Chỉ cảm thán khi ở màn hình boutique chính, không ở chế độ di chuyển đồ
        if (this.edit || this.isDraggingPiece || this.currentTab !== 'shop') return;

        const hasCustomer = this.avatar && !this.departing;
        if (!hasCustomer) {
          // Chưa có khách hoặc khách chưa vào shop: cảm thán dễ thương
          const isPrep = this.store.state.phase === 'preparation';
          const pool = isPrep ? OWNER_IDLE_CHATS_PREP : OWNER_IDLE_CHATS_WAITING;
          const msg = pool[Math.floor(Math.random() * pool.length)];
          this.showOwnerSpeech(msg, 4500);
        }
      }
    });
  }
}
