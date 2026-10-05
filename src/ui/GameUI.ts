import { customers, furniture, levels, products } from '../data/catalog';
import { looks } from '../data/fashion';
import type { GameStore } from '../systems/store';
import { BACKGROUND_MUSIC, MUSIC_TRACKS, SALE_BACKGROUND_MUSIC, type AudioSystem } from '../systems/audio';
import { activeCustomer, activeVisit, buyPrice, currentEvent, currentTrend, DAY_DURATION, dailyRent, dayDuration, customerNeedsAdvice, decorAppealScore, displayCapacity, displayLevel, displayUpgradeCost, isTrending, landExpansion, landSize, landTier, MAX_OUTFIT_ITEMS, nextLandExpansion, validOutfit, smartOutfitSelection } from '../systems/rules';
import { defaultFilters } from '../systems/catalog';
import { icon } from './icons';
import { ownerPortrait, productSvg } from '../art/svg';
import { courierImage } from '../art/courierAssets';
import { isWallFurnitureId } from '../systems/rules';
import { avatarImage, compact, compactMoney, escapeHtml, furnitureImage, money, productImage } from './format';
import { boutiqueProfileModal, campaignModal, cashTransferModal, checkoutModal, type CheckoutStage, debugPanel, debtWarningModal, decorCatalog, displayFixtureModal, financeModal, financialGameOverModal, importPanel, inventoryPanel, livestreamModal, livestreamRequest, nameShopModal, onlineChannelModal, onlineOrderModal, onlineStockModal, questPanel, regularOrderDetailModal, regularPickupModal, serveModal, shortChangeFineModal, socialPanel, staffManagementModal, summaryModal, supplierSelectionPanel, trendPanel, upgradeModal } from './panels';
import type { ShopScene } from '../scenes/ShopScene';
import { DISPLAY_GUIDE_SEEN, displayGuideModal, needsDisplayGuide } from './displayGuide';
import { CAMPAIGN_GUIDE_SEEN } from '../systems/campaigns';
import { customerCareModal } from './operationsPanel';
import type { ArrivedOrderSummary, CashDrawer, LivestreamComment, LivestreamRequest, LivestreamRoundResult, LivestreamSessionStats, ProductDesignBrushTip, ProductDesignMotif, ProductDesignPoint, ProductDesignSticker, ProductDesignStroke, SocialDrama, StaffAssignment, Style, SupplierId } from '../types';
import { supplierFor, suppliers } from '../systems/operations';
import { gameCalendarDate } from '../systems/calendar';
import { lookupCustomer } from '../systems/customerGen';
import { ATELIER_CUSTOMIZER_ENABLED, atelierCustomizeModal, atelierPanel, atelierRecipeBookModal, atelierSampleModal, type AtelierSection } from './atelierPanel';
import { ATELIER_UNLOCK_LEVEL, atelierMaterials, atelierRecipes } from '../data/atelier';
import { atelierMaterialIllustration, atelierProductPoints } from '../art/atelierArt';
import type { PanzoomEventDetail, PanzoomObject } from '@panzoom/panzoom';
import type Moveable from 'moveable';
import { requestDramaReplyEvaluation, requestSocialDrama } from '../systems/drama';

type Tab = 'shop' | 'stock' | 'import' | 'looks' | 'trend' | 'decor' | 'social' | 'atelier';
type Modal = 'none' | 'profile' | 'serve' | 'checkout' | 'display' | 'fixture-info' | 'store-furniture-confirm' | 'music-player' | 'summary' | 'finance' | 'cash-transfer' | 'debt-warning' | 'short-change-fine' | 'gameover' | 'upgrade' | 'help' | 'settings' | 'reset' | 'quests' | 'campaign' | 'customer-care' | 'crisis-detail' | 'orders-arrived' | 'name-shop' | 'staff' | 'online' | 'online-stock' | 'online-order' | 'regular-order-detail' | 'regular-pickup' | 'livestream' | 'debug' | 'close-shop-confirm' | 'land-expand-confirm' | 'display-upgrade-confirm' | 'tutorial-recap' | 'display-guide' | 'atelier-result' | 'atelier-recipes' | 'atelier-customize' | 'atelier-delete-confirm' | 'import-quantity';
const MONEY_PURCHASE_ACTIONS = new Set(['buy', 'order-import', 'buy-look', 'order-material', 'import-quantity-confirm', 'atelier-buy', 'atelier-recipe-buy', 'buy-furniture', 'expand-land-confirmed', 'display-upgrade-confirmed']);
const IMPORT_BALANCE_ACTIONS = new Set(['buy', 'order-import', 'buy-look', 'order-material', 'import-quantity-confirm']);
const FINANCE_BALANCE_ACTIONS = new Set(['pay-loan', 'pay-rent', 'pay-staff-wages', 'pay-all-staff-wages']);
const CLOTHING_ACTIONS = new Set(['select-product']);
const EQUIP_ACTIONS = new Set(['display-add', 'livestream-pool-select', 'livestream-round-select', 'move-done']);
const REWARD_ACTIONS = new Set(['claim', 'campaign-claim']);
const SHOW_DEBUG_BUTTON = false;
const saleClockLabel = (remainingSeconds: number, totalSeconds: number) => {
  const duration = Math.max(1, totalSeconds);
  const remaining = Math.max(0, Math.min(duration, remainingSeconds));
  const openingMinutes = 8 * 60;
  const tradingMinutes = 14 * 60;
  const currentMinutes = openingMinutes + Math.round((1 - remaining / duration) * tradingMinutes);
  const hours = Math.floor(currentMinutes / 60);
  const minutes = currentMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
const navItems: { id: Tab; label: string; icon: string; subtitle: string }[] = [
  { id: 'stock', label: 'Kho hàng', icon: 'hudStock', subtitle: 'Hàng đang có' },
  { id: 'import', label: 'Nhập hàng', icon: 'hudImport', subtitle: 'Bổ sung kho & Lookbook' },
  { id: 'trend', label: 'Xu hướng', icon: 'hudTrend', subtitle: 'Một chút cảm hứng' },
  { id: 'decor', label: 'Bày trí', icon: 'hudDecor', subtitle: 'Nội thất & trưng hàng' },
  { id: 'atelier', label: 'Xưởng may', icon: 'hudAtelier', subtitle: 'Thiết kế cá nhân' },
  { id: 'social', label: 'Bảng tin', icon: 'hudSocial', subtitle: 'Chuyện của boutique' },
];
const SOCIAL_DRAMA_SEEN_KEY = 'little-boutique.social-drama-seen';

export class GameUI {
  tab: Tab = 'shop';
  modal: Modal = 'none';
  private scene?: ShopScene;
  private saleSpeed: 1 | 2 | 4 = 1;
  private saleTickProgress = 0;
  private selected: string[] = [];
  private outfitCategory = 'all';
  private selectedFurniture?: string;
  private pendingStoreFurnitureUid = '';
  private filter = 'all';
  private inventoryMode: 'stock' | 'pending' | 'custom' = 'stock';
  private importFilters = defaultFilters();
  private lookFilters = defaultFilters();
  private importMode: 'products' | 'looks' | 'materials' = 'products';
  private importSourceSelected = false;
  private sort = 'level';
  private quantity = 1;
  private importQty = 1;
  private productImportQtys: Record<string, number> = {};
  private lookQtys: Record<string, number> = {};
  private materialQtys: Record<string, number> = {};
  private expandedImportPurchase = '';
  private atelierSection: AtelierSection = 'design';
  private atelierSelection: Record<string, number> = {};
  private atelierStyle: Style = atelierRecipes[0].style;
  private atelierBatchQtys: Record<string, number> = {};
  private atelierHistoryOpen = false;
  private atelierCustomizeProductId = '';
  private atelierCustomizeName = '';
  private atelierDesignColor = '#f177ad';
  private atelierDesignStrokes: ProductDesignStroke[] = [];
  private atelierDesignMotif: ProductDesignMotif = 'none';
  private atelierDesignAccentColor = '#d4429a';
  private atelierDesignMotifScale = 1;
  private atelierDesignMotifX = 60;
  private atelierDesignMotifY = 69;
  private atelierDesignFormWidth = 1;
  private atelierDesignFormLength = 1;
  private atelierDesignMotifRotation = 0;
  private atelierDesignMotifOpacity = 1;
  private atelierDesignMotifRepeat: 1 | 3 | 5 = 1;
  private atelierShapePoints: ProductDesignPoint[] = [];
  private atelierShapeSelected = true;
  private atelierSelectedNode = -1;
  private atelierShapeSmooth = true;
  private atelierShapeStrokeColor = '#795267';
  private atelierShapeStrokeWidth = 2;
  private atelierShapeDragPointer = -1;
  private atelierCanvasZoom = 1;
  private atelierCanvasPanX = 0;
  private atelierCanvasPanY = 0;
  private atelierPanzoom?: PanzoomObject;
  private atelierPanzoomCanvas?: HTMLElement;
  private atelierPanzoomWheel?: (event: WheelEvent) => void;
  private atelierPanzoomInitId = 0;
  private atelierStickerMoveable?: Moveable;
  private atelierDesignStickers: ProductDesignSticker[] = [];
  private atelierSelectedStickerId = '';
  private atelierBrushColor = '#d4429a';
  private atelierBrushWidth = 4;
  private atelierBrushTip: ProductDesignBrushTip = 'round';
  private atelierDrawingEnabled = false;
  private atelierDrawingStroke?: ProductDesignStroke;
  private atelierDrawingPointer = -1;
  private pendingBlueprintDeleteId = '';
  private decorCategory = 'all';
  private trendSection: 'hot' | 'out' = 'hot';
  private socialSection: 'feed' | 'recruitment' = 'feed';
  private dialog!: HTMLDialogElement;
  private beforeDialogFocus?: HTMLElement;
  private modalScrollResetVersion = 0;
  private lastAnnouncement = '';
  private moveMode = false;
  private tutorialStep = 0;
  private welcomeCollapsed = false;
  private tutorialRetry = 0;
  private displayGuideTimer = 0;
  private onlineOrderId = '';
  private regularOrderId = '';
  private onlineDashboardScroll = { dashboardTop: 0, regularOrdersTop: 0 };
  private pendingDisplayUpgradeUid = '';
  private campaignGuideForced = false;
  private campaignGuideTimer = 0;
  private campaignUnlockPrompted = false;
  private suppressSuccessToastAudio = false;
  private suppressTransactionSuccessToast = false;
  private catalogSearchTimer = 0;
  private composingCatalogSearch = false;
  private onlineHandoverProductIds: string[] = [];
  private livestreamPoolIds: string[] = [];
  private livestreamRound = 0;
  private livestreamSelectedIds: string[] = [];
  private livestreamDiscount = 0;
  private livestreamResult?: LivestreamRoundResult;
  private livestreamStats: LivestreamSessionStats = { viewers: 0, peakViewers: 0, likes: 0, orders: 0, intents: 0, revenue: 0, followers: 0 };
  private livestreamDuration = 0;
  private livestreamRemaining = 0;
  private livestreamEndsAt = 0;
  private livestreamComments: LivestreamComment[] = [];
  private livestreamActiveRequest?: LivestreamRequest;
  private livestreamIntentResolved = false;
  private livestreamIntentStartedAt = 0;
  private livestreamNextCommentAt = 0;
  private livestreamNextIntentAt = 0;
  private livestreamCommentSequence = 0;
  private serveVisitId = '';
  private pendingDayDramaDay = 0;
  private pendingDayDrama?: Promise<SocialDrama>;
  private preparedDayDrama?: SocialDrama;
  private staffDetailUid = '';
  private financeSection: 'loan' | 'payroll' | 'land' | 'cash' = 'loan';
  private cashTransferMode: 'deposit' | 'withdraw' = 'deposit';
  private cashTransferSelection: CashDrawer = {};
  private checkoutVisitId = '';
  private checkoutStage: CheckoutStage = 'cash';
  private checkoutChange: CashDrawer = {};
  private checkoutTransferEndsAt = 0;
  private checkoutCardProcessingEndsAt = 0;
  private checkoutCompleting = false;
  private displayHoldDelay = 0;
  private displayHoldRepeat = 0;
  private displayHoldStart?: { x: number; y: number };
  private suppressDisplayAddClick = false;
  private activeUiPointers = new Set<number>();
  private pendingStoreRender = false;
  private pendingStoreRenderTimer = 0;
  private lastSeenDramaId = '';
  constructor(private store: GameStore, private audio: AudioSystem) {
    try { this.lastSeenDramaId = localStorage.getItem(SOCIAL_DRAMA_SEEN_KEY) ?? ''; } catch { /* Storage may be unavailable. */ }
    this.shell(); this.render(); this.bind();
    this.queueDisplayGuide();
    this.queueCampaignUnlock();
    if (this.store.state.gameOverReason) {
      setTimeout(() => this.openModal('gameover', financialGameOverModal(this.store.state)), 100);
    } else if (this.store.state.loanOverdueDays >= 5 || this.store.state.rentOverdueDays >= 5) {
      setTimeout(() => this.openModal('debt-warning', debtWarningModal(this.store.state)), 250);
    }
    if (!this.store.state.hasNamedShop) {
      setTimeout(() => {
        if (!this.store.state.hasNamedShop && this.modal === 'none') {
          this.openNameShop(true);
        }
      }, 400);
    }
    store.subscribe(event => {
      if (event.type === 'change') {
        if (this.activeUiPointers.size) this.pendingStoreRender = true;
        else this.renderStoreChange();
      }
      if (event.type === 'toast') {
        if (this.suppressTransactionSuccessToast && event.tone !== 'error') return;
        this.toast(event.message, event.tone);
        if (event.tone === 'error') audio.play('error');
        else if (!this.suppressSuccessToastAudio) audio.play('click');
      }
      if (event.type === 'sale') {
        if (this.modal === 'serve' && event.result.visitUid === this.serveVisitId) this.closeModal();
        if (this.modal === 'checkout' && event.result.visitUid === this.checkoutVisitId) this.closeModal();
        this.toast(
          event.result.checkoutTimedOut
            ? `${event.result.customer.name} đã hết thời gian chờ thanh toán và rời quầy.`
            : event.result.checkoutPaymentRefused
              ? `${event.result.customer.name} không đồng ý đổi phương thức thanh toán và đã rời shop.`
            : event.result.success
            ? event.result.isStaffAssisted
              ? `${event.result.staffName ?? 'Nhân viên'} đã chốt đơn cho ${event.result.customer.name} · +${money(event.result.total)}`
              : `${event.result.customer.name} mua thành công · +${money(event.result.total)}`
            : `${event.result.customer.name} rời shop · chưa tìm được món phù hợp`,
          event.result.success ? 'success' : 'error'
        );
        audio.play(event.result.success ? 'payment' : 'disappointment');
        if (event.result.success) window.setTimeout(() => audio.play('exit'), 2100);
        if (event.result.shortChangeFine) {
          const penalty = event.result.shortChangeFine;
          this.openModal('short-change-fine', shortChangeFineModal(penalty.amount, penalty.reputationLoss, penalty.violations));
          audio.play('error');
        }
      }
      if (event.type === 'customer' && event.reason === 'checkout-advice') {
        const checkout = activeVisit(this.store.state);
        if (checkout?.stage === 'checkout' && (this.modal === 'none' || this.modal === 'serve' && this.serveVisitId === checkout.uid)) {
          if (this.modal === 'serve') this.closeModal();
          this.openCheckout(checkout.uid);
        }
      }
      if (event.type === 'summary') { audio.play('closing'); this.publishPreparedDayDrama(); this.openModal('summary', summaryModal(store.state)); }
      if (event.type === 'debt-warning') { this.publishPreparedDayDrama(); this.openModal('debt-warning', debtWarningModal(store.state, event.staff)); }
      if (event.type === 'game-over') { this.publishPreparedDayDrama(); this.openModal('gameover', financialGameOverModal(store.state)); }
      if (event.type === 'customer' && event.reason === 'arrival') audio.play('entry');
      if (event.type === 'customer' && event.reason === 'exit') audio.play('exit');
      if (event.type === 'orders-arrived') {
        const items = event.items;
        window.setTimeout(() => {
          if (this.store.state.phase !== 'preparation') return;
          if (this.tab !== 'shop') this.navigate('shop');
          if (this.modal !== 'none') this.closeModal();
          this.openModal('orders-arrived', this.ordersArrivedHtml(items));
          this.audio.play('reward');
        }, 60);
      }
    });
    setInterval(() => {
      const modalPausesSale = !['none', 'serve', 'checkout', 'online-order', 'regular-pickup', 'campaign'].includes(this.modal);
      const paused = document.hidden || this.moveMode || this.tab !== 'shop' || modalPausesSale;
      if (this.isSaleSpeedLocked()) this.resetSaleSpeed();
      if (!paused && this.store.state.phase === 'open') {
        this.repairSaleInteraction();
        this.saleTickProgress += this.saleSpeed / 4;
        if (this.saleTickProgress >= 1) {
          this.saleTickProgress -= 1;
          this.store.tick(
            this.modal === 'serve' ? this.serveVisitId : '',
            this.modal === 'checkout' || this.hasPendingTransferCheckout() ? this.checkoutVisitId : '',
          );
          if (this.isSaleSpeedLocked()) this.resetSaleSpeed();
        }
      }
      this.updatePatience();
      this.updateCheckoutPayment();
      this.updateLivestreamClock();
      this.audio.syncBackgroundForGame(
        this.store.state.phase === 'open',
        Math.max(0, this.store.state.dayTimer - this.saleTickProgress),
      );
    }, 250);
    window.addEventListener('pagehide', () => store.save.write(store.state));
    document.addEventListener('visibilitychange', () => { if (document.hidden) store.save.write(store.state); });
  }
  attachScene(scene: ShopScene) {
    this.scene = scene;
    this.scene.setMoveModeCallback((active, uid) => this.handleMoveMode(active, uid));
    this.syncSceneInteraction();
  }

  private syncSceneInteraction() {
    const enabled = this.modal === 'none' && (this.tab === 'shop' || this.tab === 'decor');
    // A character can open the advice dialog from Phaser's object-level
    // pointerup before the scene-level pointerup clears camera panning. Reset
    // that gesture explicitly so the camera does not remain attached to the
    // cursor after the dialog closes.
    this.scene?.releasePointerGesture();
    const canvasEl = document.querySelector<HTMLElement>('#game-canvas');
    if (canvasEl) {
      canvasEl.style.pointerEvents = enabled ? 'auto' : 'none';
      const innerCanvas = canvasEl.querySelector<HTMLElement>('canvas');
      if (innerCanvas) innerCanvas.style.pointerEvents = enabled ? 'auto' : 'none';
    }
    if (this.scene?.input) this.scene.input.enabled = enabled;
  }
  private repairSaleInteraction() {
    if (this.store.state.phase !== 'open' || this.tab !== 'shop' || this.modal !== 'none' || this.moveMode) return;
    const panel = document.querySelector<HTMLElement>('#content-panel');
    if (panel && !panel.hidden) panel.hidden = true;
    const canvasEl = document.querySelector<HTMLElement>('#game-canvas');
    if (canvasEl?.style.pointerEvents !== 'auto') canvasEl?.style.setProperty('pointer-events', 'auto');
    const innerCanvas = canvasEl?.querySelector<HTMLElement>('canvas');
    if (innerCanvas?.style.pointerEvents !== 'auto') innerCanvas?.style.setProperty('pointer-events', 'auto');
    this.scene?.ensurePointerInputReady();
  }
  private shell() {
    document.querySelector('#app')!.innerHTML = `
      <div class="game-viewport">
        <!-- Ask players to rotate the device before playing. -->
        <div class="landscape-banner" id="landscape-hint">
          <div class="rotate-brand"><span>ML</span><p><b>MY LITTLE</b><strong>BOUTIQUE</strong></p></div>
          <div class="rotate-visual" aria-hidden="true">
            <span class="rotate-orbit"></span>
            <span class="rotate-phone"><i></i><b>${icon('shop')}</b></span>
            <span class="rotate-arrow">${icon('rotate')}</span>
            <i class="rotate-star star-a">✦</i><i class="rotate-star star-b">✦</i>
          </div>
          <div class="rotate-copy">
            <span class="rotate-eyebrow">TRẢI NGHIỆM TỐT NHẤT</span>
            <strong class="banner-title">Xoay ngang để mở cửa tiệm</strong>
            <span class="banner-text">Boutique của bạn đẹp nhất ở chế độ ngang. Game sẽ tiếp tục ngay khi bạn xoay thiết bị.</span>
          </div>
          <div class="rotate-status"><i></i><span>Đang chờ xoay màn hình</span><i></i></div>
        </div>

        <div class="game-stage">
          <!-- Top HUD Bar: Level, Day, Currencies, Quick Controls (Fixed trên đỉnh toàn bộ game) -->
          <header class="game-top-bar">
            <div class="shop-profile-hud coc-profile-hud">
              <button class="level-capsule coc-level-box" data-action="upgrade-open" title="Nâng cấp boutique" aria-label="Cấp boutique 1">
                <span class="coc-profile-avatar">${ownerPortrait(46)}</span>
              </button>
              <div class="coc-bar-column">
                <button class="shop-profile-main coc-name-btn" data-action="home" aria-label="Mở trang cá nhân boutique" title="Trang cá nhân boutique">
                  <strong id="shop-hud-name">My Little Boutique</strong><small id="shop-hud-level">· Cấp 1</small>
                </button>
                <div class="coc-exp-bar-track" data-action="upgrade-open" title="Kinh nghiệm boutique">
                  <div class="coc-exp-bar-fill" id="shop-hud-exp-bar">
                    <span class="coc-exp-gloss"></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="top-left-cluster">
              <div id="day-card"></div>
              <div id="shop-status"></div>
            </div>
            <button id="crisis-alert-button" class="crisis-alert-button" data-action="crisis-detail-open" aria-label="Xem chi tiết khủng hoảng uy tín" hidden></button>

            <div class="top-right-cluster"><section class="hud" id="hud" aria-label="Chỉ số cửa hàng"></section></div>

            <div class="quick-tools-bar">
              <button class="hud-circle-btn campaign-hud-button" data-action="campaign-open" title="Studio hợp tác" aria-label="Studio hợp tác">${icon('hudStudio')}<span class="hud-side-label">Studio</span><span class="campaign-new-label" hidden>MỚI</span><b id="campaign-hud-badge" class="quest-ready-badge" hidden></b></button>
              <button class="hud-circle-btn settings-hud-button" data-action="settings" id="settings-button" aria-label="Cài đặt boutique" title="Cài đặt">${icon('hudSettings')}<span class="hud-side-label">Cài đặt</span></button>
            </div>
          </header>

          <output id="sale-shift-timer" class="sale-shift-timer" aria-live="polite" hidden></output>

          <!-- Shop Screen View (Canvas + Shop Floating HUD) -->
          <div id="shop-view" class="shop-main-view">
            <div id="game-canvas" role="img" aria-label="Cửa hàng thời trang 2D.">
              <div class="game-loading"><span>${icon('hanger')}</span>Đang mở một giấc mơ nhỏ…</div>
            </div>

            <!-- In-Game Floating HUD Layer (Shop controls only) -->
            <div class="game-hud-layer">
              <button id="staff-manager-button" class="staff-manager-fab" data-action="staff-open" aria-label="Quản lý nhân viên" title="Quản lý nhân viên">
                ${icon('hudStaff')}<span class="staff-fab-copy"><strong id="staff-fab-status">Nhân viên: 0</strong></span>
                <b id="staff-leave-badge" class="coc-badge-pill" hidden></b>
              </button>
              <div id="online-care-cluster" class="online-care-cluster coc-buttons-stack">
                <button id="online-channel-button" class="online-channel-fab coc-square-btn coc-btn-online" data-action="online-open" aria-label="Kênh bán hàng online" title="Quản lý kênh bán hàng online">
                  ${icon('hudOnline')}
                  <small id="online-fab-status" hidden></small>
                  <b id="online-fab-badge" hidden></b>
                </button>
                <button class="hud-circle-btn customer-care-hud-button coc-square-btn coc-btn-care" data-action="customer-care-open" title="Chăm sóc khách hàng" aria-label="Đổi trả và đơn VIP đặt trước">
                  ${icon('hudCare')}
                  <b id="customer-care-hud-badge" class="coc-badge-pill" hidden>1</b>
                </button>
              </div>
              <button id="land-expand-button" class="land-expand-fab" data-action="expand-land-confirm" aria-label="Mở rộng mặt bằng" title="Xem thông tin mở rộng mặt bằng">
                <span class="staff-fab-icon land-fab-icon">${icon('hudExpand')}</span><span class="staff-fab-copy"><strong>Mở rộng</strong><small id="land-expand-status">Xem nâng cấp</small></span>
              </button>
              <button id="finance-hud-button" class="finance-hud-button hud-edge-button" data-action="finance-open" aria-label="Tài chính" title="Quản lý tài chính"><span>${icon('hudFinance')}</span><strong>Tài chính</strong><b id="finance-hud-badge" class="coc-badge-pill" hidden></b></button>
              <button id="debug-button" class="debug-fab" data-action="debug-open" aria-label="Mở công cụ test bug" title="Test bug" hidden>${icon('settings')} Test bug</button>
              <!-- Center Zone: Sub-HUD Tools -->
              <div class="game-center-hud"></div>

              <!-- Bottom Zone: Customer Card, Move Toolbar & Dock Nav -->
              <footer class="game-bottom-hud">
                <div id="sale-controls" class="sale-controls" hidden></div>
                <nav id="sale-interaction-bar" class="sale-interaction-bar" aria-label="Nhân vật đang chờ tương tác" hidden></nav>
                <!-- Customer Interaction Card / Welcome / Closing -->
                <div id="customer-card"></div>

                <!-- Floating Bottom Move Toolbar (Chế độ di chuyển đồ vật gọn gàng ở dưới) -->
                <div id="move-toolbar" class="move-bottom-toolbar" hidden></div>

                <!-- Navigation Dock Bar Dọc Bên Phải (Chỉ hiển thị các nút liên quan tùy theo trạng thái mở cửa) -->
                <div id="game-dock-bar" class="game-dock-container right-dock-container">
                  <nav class="vertical-dock" aria-label="Menu tính năng boutique"></nav>
                </div>
              </footer>
            </div>

            <!-- Compat elements kept in DOM for Playwright selector compatibility -->
            <div class="sr-compat" style="display:none !important;" aria-hidden="true">
              <span id="stage-hint">Một góc nhỏ. Một thế giới của riêng bạn.</span>
              <div id="sidebar-upgrade"></div>
              <div id="save-status">Tiến trình được tự động lưu</div>
              <div id="stock-strip"></div>
              <aside class="right-rail" id="right-rail"></aside>
            </div>
          </div>

          <!-- In-Game Full View Window for Sub-Panels (Stock, Trend, Social) -->
          <div id="content-panel" class="game-content-panel" hidden></div>
          <div id="music-edge-aura" class="music-edge-aura" aria-hidden="true"></div>
        </div>
      </div>

      <dialog id="game-dialog" aria-label="Bảng tương tác game">
        <div class="dialog-sheet-handle" aria-hidden="true"></div>
        <div class="dialog-inner"></div>
      </dialog>
      <div id="toasts" aria-live="polite" aria-atomic="false"></div>
      <div id="announcer" class="sr-only" aria-live="polite"></div>`;
    this.dialog = document.querySelector('#game-dialog')!;
    this.updateDockVisibility();
  }
  private renderStoreChange() {
    this.pendingStoreRender = false;
    this.render();
    if (this.modal === 'serve' && !this.store.state.activeVisits.some(visit => visit.uid === this.serveVisitId)) this.closeModal();
    if (this.modal === 'checkout' && !this.store.state.activeVisits.some(visit => visit.uid === this.checkoutVisitId && visit.stage === 'checkout')) this.closeModal();
    if (this.modal === 'quests') this.dialog.querySelector('.dialog-inner')!.innerHTML = questPanel(this.store.state);
    if (this.modal === 'campaign') this.dialog.querySelector('.dialog-inner')!.innerHTML = campaignModal(this.store.state, this.campaignGuideForced);
    if (this.modal === 'customer-care') this.dialog.querySelector('.dialog-inner')!.innerHTML = customerCareModal(this.store.state);
    if (this.modal === 'crisis-detail') {
      if (this.store.state.reputationCrisis) this.dialog.querySelector('.dialog-inner')!.innerHTML = this.crisisDetailMarkup();
      else this.closeModal();
    }
    if (this.modal === 'staff') this.dialog.querySelector('.dialog-inner')!.innerHTML = staffManagementModal(this.store.state, this.staffDetailUid);
    if (this.modal === 'online') this.refreshOnlineChannel();
    if (this.modal === 'online-stock') this.refreshOnlineStock();
    if (this.modal === 'online-order') this.refreshOnlineOrder();
    if (this.modal === 'regular-order-detail') this.refreshRegularOrderDetail();
    if (this.modal === 'regular-pickup') this.refreshRegularPickup();
    if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
    if (this.modal === 'debug') this.dialog.querySelector('.dialog-inner')!.innerHTML = debugPanel(this.store.state);
    this.queueTutorialCue();
    this.queueDisplayGuide();
    this.queueCampaignUnlock();
  }
  private finishUiPointer(pointerId: number) {
    this.activeUiPointers.delete(pointerId);
    if (this.activeUiPointers.size || !this.pendingStoreRender) return;
    window.clearTimeout(this.pendingStoreRenderTimer);
    // Native click is dispatched after pointerup. Waiting one task keeps its
    // original button connected until the browser has delivered that click.
    this.pendingStoreRenderTimer = window.setTimeout(() => {
      this.pendingStoreRenderTimer = 0;
      if (!this.activeUiPointers.size && this.pendingStoreRender) this.renderStoreChange();
    }, 0);
  }
  private bind() {
    document.addEventListener('pointerdown', event => {
      const target = event.target as Element;
      if (event.button !== 0 || !target.closest('[data-action], [data-checkout-bank-card], input, select, textarea, a')) return;
      window.clearTimeout(this.pendingStoreRenderTimer);
      this.pendingStoreRenderTimer = 0;
      this.activeUiPointers.add(event.pointerId);
    }, { capture: true, passive: true });
    document.addEventListener('pointerup', event => this.finishUiPointer(event.pointerId), { capture: true, passive: true });
    document.addEventListener('pointercancel', event => this.finishUiPointer(event.pointerId), { capture: true, passive: true });
    window.addEventListener('blur', () => {
      this.activeUiPointers.clear();
      if (this.pendingStoreRender) this.finishUiPointer(-1);
    });
    const protectCanvasFromUiPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('#game-canvas')) return;
      if (target.closest('button, [data-action], input, select, textarea, a, dialog, #content-panel, #move-toolbar')) {
        this.scene?.preserveSelectionForUiAction();
      }
    };
    document.addEventListener('pointerdown', protectCanvasFromUiPointer, true);
    document.addEventListener('pointerup', protectCanvasFromUiPointer, true);
    // Run before Phaser's canvas listener. If a previous touch was interrupted,
    // the very next intentional tap can repair input and continue immediately.
    document.addEventListener('pointerdown', event => {
      if (!(event.target as Element).closest('#game-canvas')) return;
      this.repairSaleInteraction();
    }, { capture: true, passive: true });
    const swipeSurfaceSelector = '.outfit-grid, .livestream-product-grid, .livestream-pin-list, .online-stock-grid, .storefront-product-grid, .regular-orders-list';
    let swipePointerId = -1;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeSurface: HTMLElement | undefined;
    let swipeMoved = false;
    let suppressedSwipeSurface: HTMLElement | undefined;
    let suppressSwipeClickUntil = 0;
    document.addEventListener('pointerdown', event => {
      const surface = (event.target as Element).closest<HTMLElement>(swipeSurfaceSelector);
      if (!surface || event.button !== 0) return;
      // A new contact is an intentional new gesture, so it must not inherit
      // suppression from the synthetic click of the previous swipe.
      suppressedSwipeSurface = undefined;
      suppressSwipeClickUntil = 0;
      swipePointerId = event.pointerId;
      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
      swipeSurface = surface;
      swipeMoved = false;
    }, { capture: true, passive: true });
    document.addEventListener('pointermove', event => {
      if (event.pointerId !== swipePointerId || !swipeSurface || swipeMoved) return;
      if (Math.hypot(event.clientX - swipeStartX, event.clientY - swipeStartY) > 9) swipeMoved = true;
    }, { capture: true, passive: true });
    const finishSwipePointer = (event: PointerEvent) => {
      if (event.pointerId !== swipePointerId) return;
      if (swipeMoved && swipeSurface) {
        suppressedSwipeSurface = swipeSurface;
        suppressSwipeClickUntil = performance.now() + 250;
      }
      swipePointerId = -1;
      swipeSurface = undefined;
      swipeMoved = false;
    };
    document.addEventListener('pointerup', finishSwipePointer, { capture: true, passive: true });
    document.addEventListener('pointercancel', finishSwipePointer, { capture: true, passive: true });
    document.addEventListener('click', event => {
      if (performance.now() > suppressSwipeClickUntil || !suppressedSwipeSurface) return;
      const surface = (event.target as Element).closest<HTMLElement>(swipeSurfaceSelector);
      if (surface !== suppressedSwipeSurface) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressedSwipeSurface = undefined;
      suppressSwipeClickUntil = 0;
    }, true);
    let checkoutCardPointer = -1;
    let draggedCheckoutCard: HTMLElement | undefined;
    let checkoutCardStartX = 0;
    let checkoutCardStartY = 0;
    let checkoutCardX = 0;
    let checkoutCardY = 0;
    const resetCheckoutCardDrag = () => {
      if (draggedCheckoutCard && !draggedCheckoutCard.classList.contains('is-inserted')) {
        draggedCheckoutCard.classList.remove('is-dragging');
        draggedCheckoutCard.style.transform = '';
      }
      this.dialog.querySelector<HTMLElement>('[data-card-drop-zone]')?.classList.remove('is-drop-ready');
      checkoutCardPointer = -1;
      draggedCheckoutCard = undefined;
    };
    document.addEventListener('pointerdown', event => {
      const card = (event.target as Element).closest<HTMLElement>('[data-checkout-bank-card]');
      if (!card || event.button !== 0 || this.modal !== 'checkout' || this.checkoutStage !== 'card' || this.checkoutCardProcessingEndsAt) return;
      event.preventDefault();
      event.stopPropagation();
      checkoutCardPointer = event.pointerId;
      draggedCheckoutCard = card;
      checkoutCardStartX = event.clientX;
      checkoutCardStartY = event.clientY;
      checkoutCardX = 0;
      checkoutCardY = 0;
      card.classList.add('is-dragging');
      card.setPointerCapture?.(event.pointerId);
    }, { capture: true, passive: false });
    document.addEventListener('pointermove', event => {
      if (event.pointerId !== checkoutCardPointer || !draggedCheckoutCard) return;
      event.preventDefault();
      checkoutCardX = event.clientX - checkoutCardStartX;
      checkoutCardY = event.clientY - checkoutCardStartY;
      draggedCheckoutCard.style.transform = `translate3d(${checkoutCardX}px,${checkoutCardY}px,0) rotate(-3deg) scale(1.03)`;
      const zone = this.dialog.querySelector<HTMLElement>('[data-card-drop-zone]');
      if (!zone) return;
      const bounds = zone.getBoundingClientRect();
      zone.classList.toggle('is-drop-ready', event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom);
    }, { capture: true, passive: false });
    const finishCheckoutCardDrag = (event: PointerEvent, cancelled = false) => {
      if (event.pointerId !== checkoutCardPointer || !draggedCheckoutCard) return;
      event.preventDefault();
      const card = draggedCheckoutCard;
      const zone = this.dialog.querySelector<HTMLElement>('[data-card-drop-zone]');
      const bounds = zone?.getBoundingClientRect();
      const dropped = !cancelled && !!bounds && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!dropped || !zone) { resetCheckoutCardDrag(); return; }
      const cardBounds = card.getBoundingClientRect();
      checkoutCardX += bounds.left + bounds.width / 2 - (cardBounds.left + cardBounds.width / 2);
      checkoutCardY += bounds.top + bounds.height * .7 - (cardBounds.top + cardBounds.height / 2);
      card.classList.remove('is-dragging');
      card.classList.add('is-inserted');
      card.style.transform = `translate3d(${checkoutCardX}px,${checkoutCardY}px,0) rotate(-8deg) scale(.58)`;
      zone.classList.remove('is-drop-ready');
      zone.classList.add('is-processing');
      const status = zone.querySelector<HTMLElement>('#checkout-card-status');
      if (status) status.textContent = 'Đang xử lý · 2s';
      this.checkoutCardProcessingEndsAt = Date.now() + 2000;
      this.audio.play('equip');
      checkoutCardPointer = -1;
      draggedCheckoutCard = undefined;
    };
    document.addEventListener('pointerup', event => finishCheckoutCardDrag(event), { capture: true, passive: false });
    document.addEventListener('pointercancel', event => finishCheckoutCardDrag(event, true), { capture: true, passive: false });
    let audioVolumePointer = -1;
    let audioVolumeInput: HTMLInputElement | undefined;
    const updateAudioVolumeFromPointer = (input: HTMLInputElement, clientX: number, persist: boolean) => {
      const bounds = input.getBoundingClientRect();
      if (bounds.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
      const volumePercent = Math.round(ratio * 20) * 5;
      input.value = String(volumePercent);
      const volume = volumePercent / 100;
      const effects = input.matches('[data-effects-volume]');
      if (effects) this.audio.setEffectsVolume(volume);
      else this.audio.setMusicVolume(volume);
      const output = input.closest('label')?.querySelector<HTMLOutputElement>(effects ? '[data-effects-volume-value]' : '[data-music-volume-value]');
      if (output) output.value = `${volumePercent}%`;
      if (persist) {
        if (effects) this.store.setEffectsVolume(volume);
        else this.store.setMusicVolume(volume);
      }
    };
    document.addEventListener('pointerdown', event => {
      const input = (event.target as Element).closest<HTMLInputElement>('input[data-music-volume], input[data-effects-volume]');
      if (!input || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      audioVolumePointer = event.pointerId;
      audioVolumeInput = input;
      input.setPointerCapture?.(event.pointerId);
      updateAudioVolumeFromPointer(input, event.clientX, false);
    }, { capture: true, passive: false });
    document.addEventListener('pointermove', event => {
      if (event.pointerId !== audioVolumePointer || !audioVolumeInput) return;
      event.preventDefault();
      updateAudioVolumeFromPointer(audioVolumeInput, event.clientX, false);
    }, { capture: true, passive: false });
    const finishAudioVolumeDrag = (event: PointerEvent) => {
      if (event.pointerId !== audioVolumePointer || !audioVolumeInput) return;
      event.preventDefault();
      const input = audioVolumeInput;
      updateAudioVolumeFromPointer(input, event.clientX, true);
      if (input.hasPointerCapture?.(event.pointerId)) input.releasePointerCapture(event.pointerId);
      audioVolumePointer = -1;
      audioVolumeInput = undefined;
    };
    document.addEventListener('pointerup', finishAudioVolumeDrag, { capture: true, passive: false });
    document.addEventListener('pointercancel', finishAudioVolumeDrag, { capture: true, passive: false });
    document.querySelector<HTMLElement>('#game-canvas')?.addEventListener('pointerup', event => {
      if (this.tutorialStep !== 3 || !this.tutorialActive()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.openTutorialRack();
    }, true);
    document.addEventListener('pointerdown', event => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action="display-add"]');
      if (!target || target.disabled || event.button !== 0) return;
      this.stopDisplayAddHold();
      this.displayHoldStart = { x: event.clientX, y: event.clientY };
      const productId = target.dataset.id ?? '';
      const fixtureUid = target.dataset.fixture ?? '';
      this.displayHoldDelay = window.setTimeout(() => {
        this.displayHoldDelay = 0;
        this.suppressDisplayAddClick = true;
        const addNext = () => {
          if (this.modal !== 'display' || !this.store.displayProduct(fixtureUid, productId)) {
            this.stopDisplayAddHold();
            return false;
          }
          this.audio.play('click');
          this.refreshDisplayFixture(fixtureUid);
          if (this.tutorialStep === 4) this.advanceTutorial(5);
          return true;
        };
        if (addNext()) this.displayHoldRepeat = window.setInterval(addNext, 120);
      }, 340);
    }, { passive: true });
    document.addEventListener('pointermove', event => {
      if (!this.displayHoldStart || (!this.displayHoldDelay && !this.displayHoldRepeat)) return;
      if (Math.hypot(event.clientX - this.displayHoldStart.x, event.clientY - this.displayHoldStart.y) > 9) this.stopDisplayAddHold();
    }, { passive: true });
    document.addEventListener('pointerup', () => this.stopDisplayAddHold(), { passive: true });
    document.addEventListener('pointercancel', () => this.stopDisplayAddHold(), { passive: true });
    window.addEventListener('blur', () => this.stopDisplayAddHold());
    this.dialog.addEventListener('contextmenu', event => {
      if (this.modal === 'display' && (event.target as Element).closest('.fixture-studio')) event.preventDefault();
    });
    this.dialog.addEventListener('dragstart', event => {
      if (this.modal === 'display' && (event.target as Element).closest('.fixture-studio')) event.preventDefault();
    });
    this.dialog.addEventListener('selectstart', event => {
      if (this.modal === 'display' && (event.target as Element).closest('.fixture-studio')) event.preventDefault();
    });
    document.addEventListener('pointerdown', event => {
      const canvas = (event.target as HTMLElement).closest<HTMLElement>('[data-design-canvas]');
      if (!canvas || this.modal !== 'atelier-customize' || !this.atelierDrawingEnabled || event.button !== 0 || (event.target as Element).closest('[data-design-sticker], [data-shape-node]')) return;
      event.preventDefault();
      event.stopPropagation();
      const point = this.atelierCanvasPoint(canvas, event);
      this.atelierDrawingPointer = event.pointerId;
      this.atelierDrawingStroke = { color: this.atelierBrushColor, width: this.atelierBrushWidth, tip: this.atelierBrushTip, points: [point] };
      canvas.setPointerCapture?.(event.pointerId);
      const svg = canvas.querySelector('svg');
      if (svg) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('customizer-live-stroke');
        path.setAttribute('d', `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.atelierBrushColor);
        path.setAttribute('stroke-width', String(this.atelierBrushWidth));
        path.setAttribute('stroke-linecap', this.atelierBrushTip === 'marker' || this.atelierBrushTip === 'calligraphy' ? 'square' : 'round');
        path.setAttribute('stroke-linejoin', 'round');
        if (this.atelierBrushTip === 'marker') path.setAttribute('opacity', '.55');
        if (this.atelierBrushTip === 'calligraphy') path.setAttribute('stroke-width', String(this.atelierBrushWidth * 1.35));
        if (this.atelierBrushTip === 'neon') {
          path.setAttribute('stroke', '#fff');
          path.setAttribute('style', `filter:drop-shadow(0 0 2px ${this.atelierBrushColor}) drop-shadow(0 0 4px ${this.atelierBrushColor})`);
        }
        if (this.atelierBrushTip === 'eraser') {
          path.setAttribute('stroke', '#fff');
          path.setAttribute('stroke-width', String(this.atelierBrushWidth * 2));
          path.setAttribute('stroke-dasharray', '2 2');
          path.setAttribute('opacity', '.85');
        }
        svg.append(path);
      }
    }, { capture: true });
    document.addEventListener('pointermove', event => {
      if (!this.atelierDrawingStroke || event.pointerId !== this.atelierDrawingPointer || this.modal !== 'atelier-customize') return;
      const canvas = document.querySelector<HTMLElement>('[data-design-canvas]');
      if (!canvas) return;
      event.preventDefault();
      const point = this.atelierCanvasPoint(canvas, event);
      const previous = this.atelierDrawingStroke.points.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < .7) return;
      this.atelierDrawingStroke.points.push(point);
      const path = canvas.querySelector<SVGPathElement>('.customizer-live-stroke');
      path?.setAttribute('d', this.atelierDrawingStroke.points.map((item, index) => `${index ? 'L' : 'M'}${item.x.toFixed(1)} ${item.y.toFixed(1)}`).join(' '));
    }, { passive: false });
    const finishAtelierStroke = (event: PointerEvent) => {
      if (!this.atelierDrawingStroke || event.pointerId !== this.atelierDrawingPointer) return;
      if (this.atelierDrawingStroke.points.length === 1) {
        const point = this.atelierDrawingStroke.points[0];
        this.atelierDrawingStroke.points.push({ x: Math.min(120, point.x + .1), y: point.y });
      }
      this.atelierDesignStrokes.push(this.atelierDrawingStroke);
      this.atelierDrawingStroke = undefined;
      this.atelierDrawingPointer = -1;
      const canvas = this.dialog.querySelector<HTMLElement>('[data-design-canvas]');
      if (canvas) this.syncAtelierDrawingLayer(canvas);
      const undoButton = this.dialog.querySelector<HTMLButtonElement>('[data-action="atelier-customize-undo"]');
      if (undoButton) undoButton.disabled = false;
    };
    document.addEventListener('pointerup', finishAtelierStroke);
    document.addEventListener('pointercancel', finishAtelierStroke);
    document.addEventListener('pointerdown', event => {
      if (this.modal !== 'atelier-customize' || event.button !== 0) return;
      const node = (event.target as Element).closest<SVGCircleElement>('[data-shape-node]');
      const canvas = (event.target as Element).closest<HTMLElement>('[data-shape-canvas]');
      if (!node || !canvas) return;
      event.preventDefault();
      event.stopPropagation();
      const index = Number(node.dataset.shapeNode);
      if (!Number.isInteger(index) || !this.atelierShapePoints[index]) return;
      this.atelierShapeSelected = true;
      this.atelierSelectedNode = index;
      this.atelierShapeDragPointer = event.pointerId;
      canvas.setPointerCapture?.(event.pointerId);
      const contact = this.atelierCanvasPoint(canvas, event);
      const point = this.atelierShapePoints[index];
      point.x = Math.max(4, Math.min(116, contact.x));
      point.y = Math.max(5, Math.min(138, contact.y));
      canvas.querySelectorAll<SVGCircleElement>(`[data-shape-node="${index}"]`).forEach(item => {
        item.setAttribute('cx', point.x.toFixed(1));
        item.setAttribute('cy', point.y.toFixed(1));
      });
      canvas.querySelectorAll<SVGCircleElement>('.shape-node-visual').forEach(item => item.classList.toggle('active', item.dataset.shapeNode === String(index)));
      const polygon = canvas.querySelector<SVGPolygonElement>('.customizer-node-overlay>polygon');
      polygon?.setAttribute('points', this.atelierShapePoints.map(item => `${item.x},${item.y}`).join(' '));
      const shapePath = this.atelierShapePathData();
      canvas.querySelectorAll<SVGPathElement>('.atelier-live-shape-path').forEach(item => item.setAttribute('d', shapePath));
      const status = this.dialog.querySelector<HTMLElement>('.customizer-vector-tools header em');
      if (status) status.textContent = `Điểm ${index + 1}`;
    }, { capture: true });
    document.addEventListener('pointermove', event => {
      if (this.modal !== 'atelier-customize' || event.pointerId !== this.atelierShapeDragPointer || this.atelierSelectedNode < 0) return;
      const canvas = document.querySelector<HTMLElement>('[data-shape-canvas]');
      const point = this.atelierShapePoints[this.atelierSelectedNode];
      if (!canvas || !point) return;
      event.preventDefault();
      const next = this.atelierCanvasPoint(canvas, event);
      point.x = Math.max(4, Math.min(116, next.x));
      point.y = Math.max(5, Math.min(138, next.y));
      canvas.querySelectorAll<SVGCircleElement>(`[data-shape-node="${this.atelierSelectedNode}"]`).forEach(node => {
        node.setAttribute('cx', point.x.toFixed(1));
        node.setAttribute('cy', point.y.toFixed(1));
      });
      const polygon = canvas.querySelector<SVGPolygonElement>('.customizer-node-overlay>polygon');
      polygon?.setAttribute('points', this.atelierShapePoints.map(item => `${item.x},${item.y}`).join(' '));
      const shapePath = this.atelierShapePathData();
      canvas.querySelectorAll<SVGPathElement>('.atelier-live-shape-path').forEach(item => item.setAttribute('d', shapePath));
    }, { passive: false });
    const finishShapeDrag = (event: PointerEvent) => {
      if (event.pointerId !== this.atelierShapeDragPointer) return;
      const canvas = this.dialog.querySelector<HTMLElement>('[data-shape-canvas]');
      if (canvas?.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      this.atelierShapeDragPointer = -1;
    };
    document.addEventListener('pointerup', finishShapeDrag);
    document.addEventListener('pointercancel', finishShapeDrag);
    window.addEventListener('resize', () => {
      if (this.tutorialActive()) this.queueTutorialCue();
    });
    document.addEventListener('click', event => {
      const clicked = event.target as HTMLElement;
      const clickedSticker = clicked.closest<SVGGElement>('[data-design-sticker]');
      if (this.modal === 'atelier-customize' && clickedSticker) {
        const stickerId = clickedSticker.dataset.designSticker ?? '';
        if (stickerId && stickerId !== this.atelierSelectedStickerId) {
          this.atelierSelectedStickerId = stickerId;
          this.atelierShapeSelected = false;
          this.atelierSelectedNode = -1;
          this.refreshAtelierCustomizer();
        }
        return;
      }
      const shapeCanvas = this.modal === 'atelier-customize' ? clicked.closest<HTMLElement>('[data-shape-canvas]') : null;
      if (shapeCanvas && this.atelierDrawingEnabled) return;
      if (shapeCanvas && !clicked.closest('[data-shape-node], [data-design-sticker], [data-sticker-move], [data-sticker-resize]')) {
        const clickedShape = clicked.closest('.atelier-editable-shape');
        if (clickedShape) {
          if (!this.atelierShapeSelected || this.atelierSelectedStickerId) {
            this.atelierShapeSelected = true;
            this.atelierSelectedStickerId = '';
            this.atelierSelectedNode = -1;
            this.refreshAtelierCustomizer();
          }
        } else if (this.atelierShapeSelected || this.atelierSelectedNode >= 0 || this.atelierSelectedStickerId) {
          this.atelierShapeSelected = false;
          this.atelierSelectedNode = -1;
          this.atelierSelectedStickerId = '';
          this.refreshAtelierCustomizer();
        }
        return;
      }
      if (this.tutorialStep === 3 && this.tutorialActive() && clicked.closest('[data-tutorial-open-rack]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.openTutorialRack();
        return;
      }
      if (this.tutorialStep === 3 && this.tutorialActive() && clicked.closest('#game-canvas')) {
        event.preventDefault();
        this.openTutorialRack();
        return;
      }
      const target = clicked.closest<HTMLElement>('[data-action]');
      if (!target || target instanceof HTMLButtonElement && target.disabled) return;
      event.preventDefault();
      void this.audio.unlock();
      const action = target.dataset.action!;
      if (action === 'display-add' && this.suppressDisplayAddClick) {
        this.suppressDisplayAddClick = false;
        return;
      }
      const isImportPayment = this.tab === 'import' && IMPORT_BALANCE_ACTIONS.has(action);
      const isFinancePayment = this.modal === 'finance' && FINANCE_BALANCE_ACTIONS.has(action);
      const isMoneyPurchase = MONEY_PURCHASE_ACTIONS.has(action) || isFinancePayment;
      const isClothingAction = CLOTHING_ACTIONS.has(action);
      const isEquipAction = EQUIP_ACTIONS.has(action);
      const isRewardAction = REWARD_ACTIONS.has(action);
      const levelBefore = this.store.state.level;
      const moneyBefore = this.store.state.money;
      if (!isMoneyPurchase && !isClothingAction && !isEquipAction && !isRewardAction && action !== 'upgrade' && action !== 'close-shop-confirm') this.audio.play('click');
      this.suppressSuccessToastAudio = isMoneyPurchase || isClothingAction || isEquipAction || isRewardAction || action === 'serve' || action === 'upgrade' || action === 'close-shop-confirm' || action === 'online-list' || action === 'place-stored';
      this.suppressTransactionSuccessToast = isImportPayment || isFinancePayment;
      try {
        this.action(action, target.dataset.id ?? '', target);
      } catch (error) {
        this.recoverFromActionError(action, error);
      } finally {
        this.suppressSuccessToastAudio = false;
        this.suppressTransactionSuccessToast = false;
      }
      const deducted = moneyBefore - this.store.state.money;
      if (this.store.state.level > levelBefore) {
        this.audio.play('levelUp');
      } else if (deducted > 0) {
        this.audio.play('coin');
        if (isImportPayment) this.animateMoneyDeduction('import', deducted);
        if (isFinancePayment) this.animateMoneyDeduction('finance', deducted);
      } else if (isClothingAction) {
        this.audio.play('clothing');
      } else if (isEquipAction) {
        this.audio.play('equip');
      } else if (isRewardAction) {
        this.audio.play('reward');
      }
    });
    document.addEventListener('change', event => {
      const target = event.target as HTMLInputElement | HTMLSelectElement;
      if (target.id === 'loan-amount-input' && !target.value.replace(/\D/g, '')) target.value = '0';
      if (target.id === 'music-volume') {
        const volume = Number(target.value) / 100;
        this.store.setMusicVolume(volume);
        this.audio.setMusicVolume(volume);
      }
      if (target.id === 'effects-volume') {
        const volume = Number(target.value) / 100;
        this.store.setEffectsVolume(volume);
        this.audio.setEffectsVolume(volume);
      }
      if (target.id === 'stock-sort') { this.sort = target.value; this.renderPanel(); }
      if (target instanceof HTMLInputElement && target.matches('.inv-price-input[data-price]')) this.commitInventoryPrice(target);
      if (target.id === 'decor-select') this.selectFurniture(target.value || undefined);
      if (target.matches('.product-import-qty-input')) {
        const input = target;
        const productId = input.dataset.product ?? '';
        const supplier = supplierFor(this.store.state);
        if (productId) this.productImportQtys[productId] = Math.max(supplier.minOrder, Math.min(30, Math.floor(Number(input.value) || supplier.minOrder)));
        this.renderPanel();
      }
      if (target.matches('.look-qty-input')) {
        const input = target;
        const lookId = input.dataset.look ?? '';
        const supplier = supplierFor(this.store.state);
        if (lookId) this.lookQtys[lookId] = Math.max(supplier.minOrder, Math.min(30, Math.floor(Number(input.value) || supplier.minOrder)));
        this.renderPanel();
      }
      if (target.matches('.material-import-qty-input')) {
        const materialId = target.dataset.material ?? '';
        const supplier = supplierFor(this.store.state);
        if (materialId) this.materialQtys[materialId] = Math.max(supplier.minOrder, Math.min(30, Math.floor(Number(target.value) || supplier.minOrder)));
        this.renderPanel();
      }
      if (target.matches('.import-modal-qty-input')) {
        const supplier = supplierFor(this.store.state);
        const quantity = Math.max(supplier.minOrder, Math.min(30, Math.floor(Number(target.value) || supplier.minOrder)));
        this.setImportModalQuantity(quantity);
        this.refreshImportQuantityModal();
      }
      if (target.matches('.production-name-input')) {
        const productId = target.dataset.customProduct ?? '';
        if (productId) this.store.renameCustomProduct(productId, target.value);
        this.renderPanel();
      }
      if (target.id === 'customizer-base-color' && /^#[0-9a-f]{6}$/i.test(target.value)) {
        this.atelierDesignColor = target.value;
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-accent-color' && /^#[0-9a-f]{6}$/i.test(target.value)) {
        this.atelierDesignAccentColor = target.value;
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-stroke-color' && /^#[0-9a-f]{6}$/i.test(target.value)) {
        this.atelierShapeStrokeColor = target.value;
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-sticker-color' && /^#[0-9a-f]{6}$/i.test(target.value)) {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker) sticker.color = target.value;
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-text-font') {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker?.kind === 'text' && (['rounded', 'handwritten', 'serif'] as string[]).includes(target.value)) sticker.font = target.value as ProductDesignSticker['font'];
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-text-effect') {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker?.kind === 'text' && (['none', 'outline', 'shadow', 'glow'] as string[]).includes(target.value)) sticker.effect = target.value as ProductDesignSticker['effect'];
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-text-curve') {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker?.kind === 'text') sticker.curve = Math.max(-60, Math.min(60, Math.round(Number(target.value) || 0)));
        this.refreshAtelierCustomizer();
      }
      if (target.id === 'customizer-brush-color' && /^#[0-9a-f]{6}$/i.test(target.value)) {
        this.atelierBrushColor = target.value;
        this.refreshAtelierCustomizer();
      }
      const field = { 'catalog-style': 'style', 'catalog-occasion': 'occasion', 'catalog-availability': 'availability' }[target.id] as 'style' | 'occasion' | 'availability' | undefined;
      if (field) { this.lookFilters[field] = target.value; this.renderPanel(); }
      const importField = { 'import-style': 'style', 'import-occasion': 'occasion' }[target.id] as 'style' | 'occasion' | undefined;
      if (importField) { this.importFilters[importField] = target.value; this.renderPanel(); }
    });
    document.addEventListener('compositionstart', event => {
      const target = event.target as HTMLInputElement;
      if (target.id === 'catalog-search' || target.id === 'import-search') {
        this.composingCatalogSearch = true;
        window.clearTimeout(this.catalogSearchTimer);
      }
    });
    document.addEventListener('compositionend', event => {
      const target = event.target as HTMLInputElement;
      if (target.id !== 'catalog-search' && target.id !== 'import-search') return;
      this.composingCatalogSearch = false;
      const filters = target.id === 'import-search' ? this.importFilters : this.lookFilters;
      filters.query = target.value;
      this.scheduleCatalogSearch(target.id, target.selectionStart);
    });
    document.addEventListener('input', event => {
      const target = event.target as HTMLInputElement;
      if (target.id === 'loan-amount-input') {
        const caret = target.selectionStart ?? target.value.length;
        const digitsBeforeCaret = target.value.slice(0, caret).replace(/\D/g, '').length;
        const digits = target.value.replace(/\D/g, '').slice(0, 9);
        const formatted = digits ? Number(digits).toLocaleString('vi-VN') : '';
        target.value = formatted;

        let nextCaret = 0;
        let seenDigits = 0;
        while (nextCaret < formatted.length && seenDigits < digitsBeforeCaret) {
          if (/\d/.test(formatted[nextCaret])) seenDigits++;
          nextCaret++;
        }
        target.setSelectionRange(nextCaret, nextCaret);
      }
      if (target.matches('.inv-price-input[data-price]')) {
        const caret = target.selectionStart ?? target.value.length;
        const digitsBeforeCaret = target.value.slice(0, caret).replace(/\D/g, '').length;
        const digits = target.value.replace(/\D/g, '').slice(0, 9);
        const formatted = digits ? Number(digits).toLocaleString('vi-VN') : '';
        target.value = formatted;

        let nextCaret = 0;
        let seenDigits = 0;
        while (nextCaret < formatted.length && seenDigits < digitsBeforeCaret) {
          if (/\d/.test(formatted[nextCaret])) seenDigits++;
          nextCaret++;
        }
        target.setSelectionRange(nextCaret, nextCaret);
      }
      if (target.id === 'music-volume') {
        const volume = Number(target.value) / 100;
        this.audio.setMusicVolume(volume);
        const output = target.closest('label')?.querySelector<HTMLOutputElement>('[data-music-volume-value]');
        if (output) output.value = `${Math.round(volume * 100)}%`;
      }
      if (target.id === 'effects-volume') {
        const volume = Number(target.value) / 100;
        this.audio.setEffectsVolume(volume);
        const output = target.closest('label')?.querySelector<HTMLOutputElement>('[data-effects-volume-value]');
        if (output) output.value = `${Math.round(volume * 100)}%`;
      }
      if (target.id === 'customizer-product-name') this.atelierCustomizeName = target.value.slice(0, 32);
      if (target.id === 'customizer-text-content') {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker?.kind === 'text') {
          sticker.text = target.value.slice(0, 18);
          this.dialog.querySelectorAll<SVGTextElement>(`[data-design-sticker="${CSS.escape(sticker.id)}"] .custom-product-text-value`).forEach(text => {
            const textPath = text.querySelector<SVGTextPathElement>('textPath');
            if (textPath) textPath.textContent = sticker.text || ' ';
            else text.textContent = sticker.text || ' ';
          });
          this.atelierStickerMoveable?.updateRect();
        }
      }
      if (target.id === 'customizer-text-size') {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker?.kind === 'text') {
          sticker.fontSize = Math.max(8, Math.min(32, Math.round(Number(target.value) || 14)));
          this.dialog.querySelectorAll<SVGTextElement>(`[data-design-sticker="${CSS.escape(sticker.id)}"] .custom-product-text-value`).forEach(text => text.setAttribute('font-size', String(sticker.fontSize)));
          this.atelierStickerMoveable?.updateRect();
        }
      }
      if (target.matches('.fixture-title-edit') && (target.textContent?.length ?? 0) > 28) {
        target.textContent = target.textContent!.slice(0, 28);
        const range = document.createRange(); range.selectNodeContents(target); range.collapse(false);
        const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      }
      if (target.id === 'decor-select') this.selectFurniture(target.value || undefined);
      if (target.id === 'catalog-search' || target.id === 'import-search') {
        const filters = target.id === 'import-search' ? this.importFilters : this.lookFilters;
        filters.query = target.value;
        if (!this.composingCatalogSearch) this.scheduleCatalogSearch(target.id, target.selectionStart);
      }
    });
    document.addEventListener('focusout', event => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.matches('.inv-price-input[data-price]')) {
        this.commitInventoryPrice(target);
        return;
      }
      if (!target.matches('.fixture-title-edit')) return;
      const uid = target.dataset.fixture ?? '';
      const defaultName = target.dataset.defaultName ?? '';
      const value = target.textContent?.trim() ?? '';
      this.store.renameDisplayFixture(uid, value === defaultName ? '' : value);
      const placed = this.store.state.layout.find(item => item.uid === uid);
      target.textContent = placed?.customName || defaultName;
    });
    document.addEventListener('keydown', event => {
      const target = event.target as HTMLElement;
      if (target.matches('.employee-roster-card') && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        this.action('staff-detail', target.dataset.id ?? '', target);
        return;
      }
      if (target.matches('.inv-price-input') && event.key === 'Enter') { event.preventDefault(); target.blur(); return; }
      if (target.matches('.production-name-input') && event.key === 'Enter') { event.preventDefault(); target.blur(); return; }
      if (target.matches('.fixture-title-edit') && event.key === 'Enter') { event.preventDefault(); target.blur(); return; }
      if (this.tab !== 'decor' || !this.selectedFurniture || this.modal !== 'none' || (event.target as HTMLElement).matches('input,select,textarea')) return;
      const moves: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (moves[event.key]) { event.preventDefault(); this.moveSelected(...moves[event.key]); }
    });
    this.dialog.addEventListener('cancel', event => {
      event.preventDefault();
      if (this.modal === 'gameover' || this.modal === 'checkout' && this.checkoutStage === 'transfer') return;
      this.closeModal();
    });
    this.dialog.addEventListener('click', event => {
      if (event.target !== this.dialog || this.modal === 'none' || this.modal === 'gameover') return;
      const bounds = this.dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (!outside) return;
      event.preventDefault();
      this.closeModal(this.modal === 'checkout' && this.checkoutStage === 'transfer');
    });
    window.addEventListener('boutique-display', event => {
      const uid = (event as CustomEvent<string>).detail;
      if (uid && this.tab === 'shop' && this.modal === 'none' && !this.moveMode) {
        this.openDisplayFixture(uid);
        if (this.tutorialStep === 3) this.advanceTutorial(4);
      }
    });
  }
  private stopDisplayAddHold() {
    window.clearTimeout(this.displayHoldDelay);
    window.clearInterval(this.displayHoldRepeat);
    this.displayHoldDelay = 0;
    this.displayHoldRepeat = 0;
    this.displayHoldStart = undefined;
    if (this.suppressDisplayAddClick) {
      window.setTimeout(() => { this.suppressDisplayAddClick = false; }, 450);
    }
  }
  private recoverFromActionError(action: string, error: unknown) {
    console.error(`Could not complete UI action: ${action}`, error);
    try {
      if (this.dialog.open) this.dialog.close();
      this.modal = 'none';
      this.tab = 'shop';
      const panel = document.querySelector<HTMLElement>('#content-panel');
      if (panel) panel.hidden = true;
      this.scene?.setTab('shop');
      this.scene?.setEdit(false);
      this.syncSceneInteraction();
      this.updateDockVisibility();
    } catch (recoveryError) {
      console.error('Could not restore the shop screen', recoveryError);
    }
    this.toast('Kh\u00f4ng th\u1ec3 m\u1edf m\u1ee5c n\u00e0y. Game \u0111\u00e3 quay l\u1ea1i c\u1eeda h\u00e0ng an to\u00e0n.', 'error');
  }
  private action(action: string, id: string, target?: HTMLElement) {
    switch (action) {
      case 'nav': {
        if (id === 'atelier' && this.store.state.level < ATELIER_UNLOCK_LEVEL) {
          this.toast(`Xưởng may cá nhân mở khóa ở cấp boutique ${ATELIER_UNLOCK_LEVEL}.`, 'info');
          return;
        }
        if (this.store.state.phase === 'open' && (id === 'import' || id === 'decor' || id === 'looks' || id === 'social' || id === 'atelier')) {
          this.toast('Cửa hàng đang mở cửa đón khách! Hãy tập trung tư vấn và bán hàng nhé', 'info');
          return;
        }
        this.navigate(id as Tab);
        if (this.tutorialStep === 0 && id === 'import') this.advanceTutorial(1);
        else if (this.tutorialStep === 2 && id === 'shop') this.advanceTutorial(3);
        break;
      }
      case 'open': {
        this.navigate('shop');
        this.store.openShop();
        if (this.store.state.phase === 'open') this.prepareDayDrama();
        // Recover from an interrupted pointer/modal interaction before the sale
        // starts. Without this, the DOM speed button still works while Phaser is
        // left unable to receive taps or drags.
        this.syncSceneInteraction();
        break;
      }
      case 'welcome-toggle': {
        this.welcomeCollapsed = !this.welcomeCollapsed;
        this.renderCustomer();
        document.querySelector<HTMLButtonElement>('[data-action="welcome-toggle"]')?.focus({ preventScroll: true });
        break;
      }
      case 'serve-open': this.openServe(); break;
      case 'sale-visit-open':
        if (this.store.focusCustomer(id)) this.openServe();
        break;
      case 'checkout-change-note': {
        const value = Number(id);
        if (value > 0) this.checkoutChange[String(value)] = (this.checkoutChange[String(value)] ?? 0) + 1;
        this.refreshCheckout();
        break;
      }
      case 'checkout-change-note-remove': {
        const value = Number(id);
        const count = this.checkoutChange[String(value)] ?? 0;
        if (value > 0 && count > 0) {
          if (count === 1) delete this.checkoutChange[String(value)];
          else this.checkoutChange[String(value)] = count - 1;
        }
        this.refreshCheckout();
        break;
      }
      case 'checkout-cash-complete': this.finishCheckout('cash'); break;
      case 'checkout-fallback':
        {
          const response = this.store.requestCheckoutPaymentChange(this.checkoutVisitId);
          if (!response.accepted || !response.method) break;
          this.checkoutStage = response.method;
          this.checkoutChange = {};
          this.checkoutCardProcessingEndsAt = 0;
          this.checkoutTransferEndsAt = response.method === 'transfer'
            ? Date.now() + (3 + ((this.store.state.activeVisits.find(item => item.uid === this.checkoutVisitId)?.customerId.length ?? 0) % 5)) * 1000
            : 0;
          this.refreshCheckout();
          this.toast(`Khách đồng ý đổi sang ${response.method === 'transfer' ? 'chuyển khoản' : 'thẻ'}.`);
        }
        break;
      case 'skip': this.closeModal(); this.store.skipCustomer(); break;
      case 'buy': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
          return;
        }
        const purchased = this.store.buy(id, this.quantity);
        if (purchased && this.tutorialStep === 1) this.advanceTutorial(2);
        break;
      }
      case 'filter': this.filter = id; this.renderPanel(); break;
      case 'inventory-filter': this.filter = id; this.renderPanel(); break;
      case 'inventory-mode':
        this.inventoryMode = id === 'pending' ? 'pending' : id === 'custom' ? 'custom' : 'stock';
        this.renderPanel();
        break;
      case 'atelier-section':
        this.atelierSection = id === 'production' ? 'production' : 'design';
        this.atelierHistoryOpen = false;
        this.renderPanel();
        break;
      case 'atelier-history-open':
        this.atelierHistoryOpen = true;
        document.querySelector('.craft-history-drawer')?.classList.add('is-open');
        document.querySelector('.craft-history-backdrop')?.classList.add('is-open');
        document.querySelector('.craft-history-drawer')?.setAttribute('aria-hidden', 'false');
        break;
      case 'atelier-history-close':
        this.atelierHistoryOpen = false;
        document.querySelector('.craft-history-drawer')?.classList.remove('is-open');
        document.querySelector('.craft-history-backdrop')?.classList.remove('is-open');
        document.querySelector('.craft-history-drawer')?.setAttribute('aria-hidden', 'true');
        break;
      case 'atelier-buy':
        if (this.store.buyAtelier()) this.renderPanel();
        break;
      case 'atelier-recipes-open':
        this.openModal('atelier-recipes', atelierRecipeBookModal(this.store.state));
        break;
      case 'atelier-recipe-buy': {
        const result = this.store.buyRandomAtelierRecipe();
        if (result.success) {
          const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
          if (inner) inner.innerHTML = atelierRecipeBookModal(this.store.state, result.recipe.id);
        }
        break;
      }
      case 'atelier-style':
        this.atelierStyle = id as Style;
        this.renderPanel();
        break;
      case 'atelier-material-step': {
        const current = this.atelierSelection[id] ?? 0;
        const available = this.store.state.materialInventory[id] ?? 0;
        const change = Number(target?.dataset.value) || 0;
        const selectedTypeCount = Object.values(this.atelierSelection).filter(quantity => quantity > 0).length;
        if (change > 0 && current === 0 && selectedTypeCount >= 3) {
          this.toast('Mỗi công thức chỉ được chọn tối đa 3 loại nguyên liệu.', 'info');
          return;
        }
        this.atelierSelection[id] = Math.max(0, Math.min(available, current + change));
        if (!this.atelierSelection[id]) delete this.atelierSelection[id];
        this.renderPanel();
        break;
      }
      case 'atelier-material-remove': {
        const current = this.atelierSelection[id] ?? 0;
        if (current <= 1) delete this.atelierSelection[id];
        else this.atelierSelection[id] = current - 1;
        this.renderPanel();
        break;
      }
      case 'atelier-create-sample': {
        const result = this.store.createAtelierSample(this.atelierStyle, this.atelierSelection);
        this.atelierSelection = {};
        this.renderPanel();
        if (result.success) {
          this.openModal('atelier-result', atelierSampleModal(this.store.state));
        } else if (result.reason === 'wrong-recipe') {
          this.openModal('atelier-result', atelierSampleModal(this.store.state, true));
        }
        break;
      }
      case 'atelier-review-draft':
        if (this.store.state.atelierDraft) this.openModal('atelier-result', atelierSampleModal(this.store.state));
        break;
      case 'atelier-accept-sample':
        if (this.store.acceptAtelierSample()) { this.closeModal(); this.atelierSection = 'production'; this.renderPanel(); }
        break;
      case 'atelier-discard-sample':
        if (this.store.discardAtelierSample()) { this.closeModal(); this.renderPanel(); }
        break;
      case 'atelier-batch-step':
        this.atelierBatchQtys[id] = Math.max(5, Math.min(50, (this.atelierBatchQtys[id] ?? 5) + (Number(target?.dataset.value) || 0)));
        this.renderPanel();
        break;
      case 'atelier-start-batch':
        if (this.store.startTailoringBatch(id, this.atelierBatchQtys[id] ?? 5)) this.renderPanel();
        break;
      case 'atelier-customize-open': {
        if (!ATELIER_CUSTOMIZER_ENABLED) return;
        const product = this.store.state.customProducts.find(item => item.id === id);
        if (!product) return;
        this.atelierCustomizeProductId = product.id;
        this.atelierCustomizeName = product.name;
        this.atelierDesignColor = product.designColor ?? product.color;
        this.atelierDesignStrokes = (product.designStrokes ?? []).map(stroke => ({ ...stroke, points: stroke.points.map(point => ({ ...point })) }));
        this.atelierDesignMotif = product.designMotif ?? 'none';
        this.atelierDesignAccentColor = product.designAccentColor ?? '#d4429a';
        this.atelierDesignMotifScale = product.designMotifScale ?? 1;
        this.atelierDesignMotifX = product.designMotifX ?? 60;
        this.atelierDesignMotifY = product.designMotifY ?? 69;
        this.atelierDesignFormWidth = product.designFormWidth ?? 1;
        this.atelierDesignFormLength = product.designFormLength ?? 1;
        this.atelierDesignMotifRotation = product.designMotifRotation ?? 0;
        this.atelierDesignMotifOpacity = product.designMotifOpacity ?? 1;
        this.atelierDesignMotifRepeat = product.designMotifRepeat ?? 1;
        this.atelierShapePoints = (product.designShapePoints ?? atelierProductPoints(product.art) ?? []).map(point => ({ ...point }));
        this.atelierShapeSelected = true;
        this.atelierSelectedNode = -1;
        this.atelierShapeSmooth = product.designShapeSmooth !== false;
        this.atelierShapeStrokeColor = product.designStrokeColor ?? '#795267';
        this.atelierShapeStrokeWidth = product.designStrokeWidth ?? 2;
        this.atelierCanvasZoom = 1;
        this.atelierCanvasPanX = 0;
        this.atelierCanvasPanY = 0;
        this.atelierDesignStickers = (product.designStickers ?? []).map(sticker => ({ ...sticker }));
        this.atelierSelectedStickerId = '';
        this.atelierBrushColor = '#d4429a';
        this.atelierBrushWidth = 4;
        this.atelierBrushTip = 'round';
        this.atelierDrawingEnabled = false;
        this.openModal('atelier-customize', atelierCustomizeModal(product, this.atelierCustomizerState()));
        requestAnimationFrame(() => this.initAtelierPanzoom(true));
        break;
      }
      case 'atelier-customize-base':
        if (/^#[0-9a-f]{6}$/i.test(id)) this.atelierDesignColor = id;
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-brush':
        if (/^#[0-9a-f]{6}$/i.test(id)) this.atelierBrushColor = id;
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-width':
        this.atelierBrushWidth = Math.max(.6, Math.min(8, Number(id) || 3));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-motif':
        if ((['none', 'heart', 'star', 'bow', 'flower', 'stripes'] as string[]).includes(id)) {
          this.atelierDesignMotif = id as ProductDesignMotif;
          this.atelierDesignStrokes = [];
        }
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-accent':
        if (/^#[0-9a-f]{6}$/i.test(id)) this.atelierDesignAccentColor = id;
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-scale':
        this.atelierDesignMotifScale = Math.max(.7, Math.min(1.35, Number(id) || 1));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-position': {
        const [x, y] = id.split(',').map(Number);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          this.atelierDesignMotifX = Math.max(38, Math.min(82, x));
          this.atelierDesignMotifY = Math.max(42, Math.min(100, y));
        }
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-customize-form-width':
        this.atelierDesignFormWidth = Math.max(.84, Math.min(1.16, Number(id) || 1));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-form-length':
        this.atelierDesignFormLength = Math.max(.84, Math.min(1.18, Number(id) || 1));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-rotation':
        this.atelierDesignMotifRotation = Math.max(-40, Math.min(40, Number(id) || 0));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-opacity':
        this.atelierDesignMotifOpacity = Math.max(.4, Math.min(1, Number(id) || 1));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-repeat': {
        const repeat = Number(id);
        if (repeat === 1 || repeat === 3 || repeat === 5) this.atelierDesignMotifRepeat = repeat;
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-customize-reset': {
        const product = this.store.state.customProducts.find(item => item.id === this.atelierCustomizeProductId);
        if (product) this.atelierDesignColor = product.color;
        this.atelierDesignStrokes = [];
        this.atelierDesignMotif = 'none';
        this.atelierDesignAccentColor = '#d4429a';
        this.atelierDesignMotifScale = 1;
        this.atelierDesignMotifX = 60;
        this.atelierDesignMotifY = 69;
        this.atelierDesignFormWidth = 1;
        this.atelierDesignFormLength = 1;
        this.atelierDesignMotifRotation = 0;
        this.atelierDesignMotifOpacity = 1;
        this.atelierDesignMotifRepeat = 1;
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-customizer-jump':
        this.dialog.querySelector<HTMLElement>(`[data-customizer-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'atelier-brush-toggle':
        this.atelierDrawingEnabled = !this.atelierDrawingEnabled;
        this.atelierSelectedStickerId = '';
        this.atelierShapeSelected = false;
        this.atelierSelectedNode = -1;
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-brush-tip':
        if ((['round', 'marker', 'calligraphy', 'neon', 'eraser'] as string[]).includes(id)) this.atelierBrushTip = id as ProductDesignBrushTip;
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-brush-width':
        this.atelierBrushWidth = Math.max(2, Math.min(7, Number(id) || 4));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-canvas-zoom':
        {
          const amount = Number(id) || 0;
          this.atelierPanzoom?.zoom(Math.max(.25, Math.min(4, this.atelierCanvasZoom + amount)), { animate: false });
        }
        break;
      case 'atelier-canvas-view-reset':
        this.fitAtelierCanvas();
        break;
      case 'atelier-shape-add': {
        if (this.atelierShapePoints.length >= 48) break;
        let longestIndex = 0;
        let longestDistance = -1;
        for (let index = 0; index < this.atelierShapePoints.length; index++) {
          const current = this.atelierShapePoints[index];
          const next = this.atelierShapePoints[(index + 1) % this.atelierShapePoints.length];
          const distance = Math.hypot(next.x - current.x, next.y - current.y);
          if (distance > longestDistance) { longestDistance = distance; longestIndex = index; }
        }
        const current = this.atelierShapePoints[longestIndex];
        const next = this.atelierShapePoints[(longestIndex + 1) % this.atelierShapePoints.length];
        this.atelierShapePoints.splice(longestIndex + 1, 0, { x: (current.x + next.x) / 2, y: (current.y + next.y) / 2 });
        this.atelierSelectedNode = longestIndex + 1;
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-shape-delete':
        if (this.atelierSelectedNode >= 0 && this.atelierShapePoints.length > 6) {
          this.atelierShapePoints.splice(this.atelierSelectedNode, 1);
          this.atelierSelectedNode = Math.min(this.atelierSelectedNode, this.atelierShapePoints.length - 1);
          this.refreshAtelierCustomizer();
        }
        break;
      case 'atelier-shape-mirror':
        this.atelierShapePoints = this.atelierShapePoints.map(point => ({ x: 120 - point.x, y: point.y })).reverse();
        this.atelierSelectedNode = -1;
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-shape-reset': {
        const product = this.store.state.customProducts.find(item => item.id === this.atelierCustomizeProductId);
        this.atelierShapePoints = product ? (atelierProductPoints(product.art) ?? []).map(point => ({ ...point })) : [];
        this.atelierSelectedNode = -1;
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-shape-nudge': {
        const point = this.atelierShapePoints[this.atelierSelectedNode];
        const [dx, dy] = id.split(',').map(Number);
        if (point && Number.isFinite(dx) && Number.isFinite(dy)) {
          point.x = Math.max(4, Math.min(116, point.x + dx));
          point.y = Math.max(5, Math.min(138, point.y + dy));
          this.refreshAtelierCustomizer();
        }
        break;
      }
      case 'atelier-shape-stroke':
        this.atelierShapeStrokeWidth = Math.max(.6, Math.min(4, Number(id) || 2));
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-shape-smooth':
        this.atelierShapeSmooth = id !== 'sharp';
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-sticker-add': {
        const stickerKinds: ProductDesignSticker['kind'][] = ['heart', 'star', 'bow', 'flower', 'round-collar', 'vest-collar', 'polo-collar', 'pleats', 'buttons', 'pocket', 'zipper', 'belt', 'seam', 'cuffs', 'text'];
        if (this.atelierDesignStickers.length >= 24 || !stickerKinds.includes(id as ProductDesignSticker['kind'])) break;
        const placement: Partial<Record<ProductDesignSticker['kind'], { x: number; y: number; scale: number }>> = {
          'round-collar': { x: 60, y: 40, scale: .8 },
          'vest-collar': { x: 60, y: 47, scale: .9 },
          'polo-collar': { x: 60, y: 42, scale: .8 },
          pleats: { x: 60, y: 94, scale: 1.15 },
          buttons: { x: 60, y: 72, scale: .85 },
          pocket: { x: 72, y: 76, scale: .72 },
          zipper: { x: 60, y: 72, scale: 1 },
          belt: { x: 60, y: 79, scale: 1 },
          seam: { x: 60, y: 91, scale: 1 },
          cuffs: { x: 60, y: 68, scale: 1.1 },
        };
        const initial = placement[id as ProductDesignSticker['kind']] ?? { x: 60, y: 69, scale: 1 };
        const sticker: ProductDesignSticker = {
          id: `sticker-${Date.now().toString(36)}-${this.atelierDesignStickers.length}`,
          kind: id as ProductDesignSticker['kind'],
          x: initial.x,
          y: initial.y,
          scale: initial.scale,
          rotation: 0,
          color: '#d4429a',
          ...(id === 'text' ? { text: 'Boutique', font: 'rounded' as const, fontSize: 14, curve: 0, effect: 'none' as const } : {}),
        };
        this.atelierDesignStickers.push(sticker);
        this.atelierSelectedStickerId = sticker.id;
        this.atelierShapeSelected = false;
        this.atelierSelectedNode = -1;
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-sticker-rotate': {
        const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (sticker) sticker.rotation = Math.max(-180, Math.min(180, sticker.rotation + (Number(id) || 0)));
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-sticker-duplicate': {
        const source = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
        if (source && this.atelierDesignStickers.length < 24) {
          const sticker = { ...source, id: `sticker-${Date.now().toString(36)}-${this.atelierDesignStickers.length}`, x: Math.min(114, source.x + 8), y: Math.min(133, source.y + 8) };
          this.atelierDesignStickers.push(sticker);
          this.atelierSelectedStickerId = sticker.id;
        }
        this.refreshAtelierCustomizer();
        break;
      }
      case 'atelier-sticker-delete':
        this.atelierDesignStickers = this.atelierDesignStickers.filter(item => item.id !== this.atelierSelectedStickerId);
        this.atelierSelectedStickerId = '';
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-undo':
        this.atelierDesignStrokes.pop();
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-clear':
        this.atelierDesignStrokes = [];
        this.atelierDesignMotif = 'none';
        this.refreshAtelierCustomizer();
        break;
      case 'atelier-customize-save': {
        const nameInput = this.dialog.querySelector<HTMLInputElement>('#customizer-product-name');
        this.atelierCustomizeName = nameInput?.value ?? this.atelierCustomizeName;
        if (!this.atelierCustomizeName.trim()) { this.toast('Tên thiết kế không được để trống.', 'error'); return; }
        if (this.store.customizeCustomProduct(this.atelierCustomizeProductId, this.atelierCustomizeName, this.atelierDesignColor, this.atelierDesignStrokes, 'none', this.atelierDesignAccentColor, 1, 60, 69, 1, 1, 0, 1, 1, this.atelierShapePoints, this.atelierShapeSmooth, this.atelierShapeStrokeColor, this.atelierShapeStrokeWidth, this.atelierDesignStickers)) {
          this.closeModal();
          this.renderPanel();
        }
        break;
      }
      case 'atelier-delete-blueprint': {
        const product = this.store.state.customProducts.find(item => item.id === id);
        if (!product) return;
        this.pendingBlueprintDeleteId = id;
        const stock = this.store.state.inventory[id] ?? 0;
        this.openModal('atelier-delete-confirm', `<section class="blueprint-delete-confirm"><span>${icon('close')}</span><small>XÓA BẢN THIẾT KẾ</small><h2>${escapeHtml(product.name)}</h2><p>Bản thiết kế và ${stock} sản phẩm đang có trong kho sẽ bị xóa. Thao tác này không thể hoàn tác.</p><div><button data-action="close-modal">Giữ lại</button><button data-action="atelier-delete-confirmed">Xóa bản thiết kế</button></div></section>`);
        break;
      }
      case 'atelier-delete-confirmed':
        if (this.store.deleteCustomProduct(this.pendingBlueprintDeleteId)) {
          delete this.atelierBatchQtys[this.pendingBlueprintDeleteId];
          this.pendingBlueprintDeleteId = '';
          this.closeModal();
          this.renderPanel();
        }
        break;
      case 'quantity': this.quantity = Number(id); this.renderPanel(); break;
      case 'import-mode': {
        if (id === 'materials' && this.store.state.level < 8) return;
        this.importMode = id === 'looks' ? 'looks' : id === 'materials' ? 'materials' : 'products';
        this.expandedImportPurchase = '';
        this.renderPanel();
        break;
      }
      case 'import-purchase-open':
        this.expandedImportPurchase = id;
        this.openModal('import-quantity', this.importQuantityModal());
        break;
      case 'import-modal-qty-step': {
        const supplier = supplierFor(this.store.state);
        const next = Math.max(supplier.minOrder, Math.min(30, this.getImportModalQuantity() + Number(id)));
        this.setImportModalQuantity(next);
        this.refreshImportQuantityModal();
        break;
      }
      case 'import-quantity-confirm': {
        const [kind, itemId] = this.expandedImportPurchase.split(':');
        const quantity = this.getImportModalQuantity();
        let imported = false;
        if (kind === 'product') imported = this.store.orderImport(itemId, quantity);
        else if (kind === 'material') imported = this.store.buyAtelierMaterial(itemId, quantity);
        else if (kind === 'look') {
          const look = looks.find(item => item.id === itemId);
          if (look) imported = this.store.buyOutfit(look.items, quantity);
        }
        if (imported) {
          this.expandedImportPurchase = '';
          if (this.tutorialStep === 1) this.advanceTutorial(2);
          this.closeModal();
        }
        break;
      }
      case 'catalog-mode': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách!', 'info');
          return;
        }
        if (id === 'materials' && this.store.state.level < 8) {
          this.toast('Nguyên vật liệu mở khóa ở cấp boutique 8.', 'info');
          return;
        }
        this.importMode = id === 'looks' ? 'looks' : id === 'materials' ? 'materials' : 'products';
        this.navigate('import');
        break;
      }
      case 'clear-filters':
      case 'import-clear': {
        this.importFilters = defaultFilters();
        this.lookFilters = defaultFilters();
        this.renderPanel();
        break;
      }
      case 'import-filter': this.importFilters.category = id; this.renderPanel(); break;
      case 'import-look-style': this.lookFilters.style = id; this.renderPanel(); break;
      case 'import-qty':
      case 'product-import-qty': {
        const productId = target?.getAttribute('data-product') ?? target?.dataset.product;
        if (productId) {
          this.productImportQtys[productId] = Number(id) || 1;
        } else {
          this.importQty = Number(id) || 1;
        }
        this.renderPanel();
        break;
      }
      case 'product-qty-step': {
        const productId = target?.dataset.product ?? '';
        const supplier = supplierFor(this.store.state);
        const current = Math.max(supplier.minOrder, this.productImportQtys[productId] ?? supplier.minOrder);
        if (productId) this.productImportQtys[productId] = Math.max(supplier.minOrder, Math.min(30, current + Number(id)));
        this.renderPanel();
        break;
      }
      case 'material-qty-step': {
        const materialId = target?.dataset.material ?? '';
        const supplier = supplierFor(this.store.state);
        const current = Math.max(supplier.minOrder, this.materialQtys[materialId] ?? supplier.minOrder);
        if (materialId) this.materialQtys[materialId] = Math.max(supplier.minOrder, Math.min(30, current + Number(id)));
        this.renderPanel();
        break;
      }
      case 'order-material': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập nguyên liệu trong giờ bán.', 'error');
          return;
        }
        const qty = Math.max(supplierFor(this.store.state).minOrder, this.materialQtys[id] ?? 1);
        if (this.store.buyAtelierMaterial(id, qty)) {
          this.expandedImportPurchase = '';
          this.renderPanel();
        }
        break;
      }
      case 'order-import': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
          return;
        }
        const qty = Math.max(supplierFor(this.store.state).minOrder, this.productImportQtys[id] ?? this.importQty ?? 1);
        const ordered = this.store.orderImport(id, qty);
        if (ordered) {
          this.expandedImportPurchase = '';
          this.renderPanel();
        }
        if (ordered && this.tutorialStep === 1) this.advanceTutorial(2);
        break;
      }
      case 'look-qty': {
        const lookId = target?.getAttribute('data-look') ?? target?.dataset.look;
        if (lookId) {
          this.lookQtys[lookId] = Number(id) || 1;
          this.renderPanel();
        }
        break;
      }
      case 'look-qty-step': {
        const lookId = target?.dataset.look ?? '';
        const supplier = supplierFor(this.store.state);
        const current = Math.max(supplier.minOrder, this.lookQtys[lookId] ?? supplier.minOrder);
        if (lookId) this.lookQtys[lookId] = Math.max(supplier.minOrder, Math.min(30, current + Number(id)));
        this.renderPanel();
        break;
      }
      case 'buy-look': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
          return;
        }
        const look = looks.find(l => l.id === id);
        const qty = Math.max(supplierFor(this.store.state).minOrder, this.lookQtys[id] ?? 1);
        if (look && this.store.buyOutfit(look.items, qty)) {
          this.expandedImportPurchase = '';
          this.renderPanel();
        }
        break;
      }
      case 'quests': {
        if (this.store.state.phase === 'open') {
          this.toast('Hãy tập trung phục vụ khách trước nhé!', 'info');
          return;
        }
        this.openModal('quests', questPanel(this.store.state));
        break;
      }
      case 'staff-open': this.staffDetailUid = ''; this.openModal('staff', staffManagementModal(this.store.state)); break;
      case 'staff-detail':
        this.staffDetailUid = id;
        this.dialog.querySelector('.dialog-inner')!.innerHTML = staffManagementModal(this.store.state, id);
        this.scrollModalToTop();
        break;
      case 'staff-detail-close':
        this.staffDetailUid = '';
        this.dialog.querySelector('.dialog-inner')!.innerHTML = staffManagementModal(this.store.state);
        this.scrollModalToTop();
        break;
      case 'campaign-open': this.campaignGuideForced = false; this.openModal('campaign', campaignModal(this.store.state)); break;
      case 'campaign-guide': this.campaignGuideForced = true; this.openModal('campaign', campaignModal(this.store.state, true)); break;
      case 'campaign-guide-done': this.campaignGuideForced = false; this.store.acknowledgeCampaignGuide(); if (this.modal === 'campaign') this.dialog.querySelector('.dialog-inner')!.innerHTML = campaignModal(this.store.state); break;
      case 'campaign-start': this.store.startCampaign(id); break;
      case 'campaign-claim': this.store.claimCampaign(); break;
      case 'campaign-abandon': this.store.abandonCampaign(); break;
      case 'customer-care-open': this.openModal('customer-care', customerCareModal(this.store.state)); break;
      case 'crisis-detail-open':
        if (this.store.state.reputationCrisis) this.openModal('crisis-detail', this.crisisDetailMarkup());
        break;
      case 'supplier-select':
        if (this.store.selectSupplier(id as SupplierId)) {
          this.importSourceSelected = true;
          this.renderPanel();
          this.queueTutorialCue();
        }
        break;
      case 'staff-assignment': this.store.setStaffAssignment(id, target?.dataset.value as StaffAssignment); break;
      case 'return-resolve': this.store.resolveReturn(id, target?.dataset.value as 'refund' | 'exchange' | 'deny'); break;
      case 'vip-accept': this.store.acceptVip(id); break;
      case 'vip-decline': this.store.declineVip(id); break;
      case 'couture-start': this.store.startCoutureOrder(); break;
      case 'couture-advance': this.store.advanceCouture(target?.dataset.value as 'safe' | 'premium'); break;
      case 'couture-deliver': this.store.deliverCouture(); break;
      case 'online-open':
        this.onlineDashboardScroll = { dashboardTop: 0, regularOrdersTop: 0 };
        this.openModal('online', onlineChannelModal(this.store.state));
        break;
      case 'online-stock-open': this.openModal('online-stock', onlineStockModal(this.store.state)); break;
      case 'online-stock-back': this.openModal('online', onlineChannelModal(this.store.state)); break;
      case 'online-list': this.store.listOnlineProduct(id); break;
      case 'online-unlist': this.store.removeOnlineProduct(id); break;
      case 'online-toggle': this.store.toggleOnlineChannel(); break;
      case 'online-order-open': this.openOnlineOrder(id); break;
      case 'online-hand-over-select': {
        this.onlineHandoverProductIds = this.onlineHandoverProductIds.includes(id)
          ? this.onlineHandoverProductIds.filter(productId => productId !== id)
          : [...this.onlineHandoverProductIds, id];
        this.refreshOnlineOrder();
        this.dialog.querySelector<HTMLButtonElement>(`[data-action="online-hand-over-select"][data-id="${id}"]`)?.focus({ preventScroll: true });
        break;
      }
      case 'online-hand-over': {
        const orderId = target?.dataset.order ?? this.onlineOrderId;
        if (!this.onlineHandoverProductIds.length) { this.toast('Hãy chọn sản phẩm trong kho trước khi giao.', 'error'); break; }
        this.store.fulfillOnlineOrder(orderId, this.onlineHandoverProductIds);
        if (!this.store.state.onlineOrders.some(order => order.id === orderId)) this.closeModal();
        break;
      }
      case 'online-cancel-order': {
        if (this.store.cancelOnlineOrder(id)) this.closeModal();
        break;
      }
      case 'regular-order-open':
        this.rememberOnlineDashboardScroll();
        this.regularOrderId = id;
        this.openModal('regular-order-detail', regularOrderDetailModal(this.store.state, id));
        break;
      case 'regular-order-back': this.returnToOnlineDashboard(); break;
      case 'regular-pack': this.store.packRegularOnlineOrder(id); break;
      case 'regular-cancel':
        if (this.store.cancelRegularOnlineOrder(id) && this.modal === 'regular-order-detail') this.returnToOnlineDashboard();
        break;
      case 'regular-pack-all': this.store.packAllRegularOrdersWithStaff(); break;
      case 'packing-upgrade': this.store.upgradeOnlinePacking(); break;
      case 'regular-pickup-open': this.openModal('regular-pickup', regularPickupModal(this.store.state)); break;
      case 'regular-pickup-confirm':
        if (this.store.fulfillPackedRegularOrders()) this.closeModal();
        break;
      case 'livestream-open': {
        this.livestreamPoolIds = [];
        this.livestreamRound = 0;
        this.livestreamSelectedIds = [];
        this.livestreamDiscount = 0;
        this.livestreamResult = undefined;
        const startingViewers = this.initialLivestreamViewers();
        this.livestreamStats = { viewers: startingViewers, peakViewers: startingViewers, likes: 0, orders: 0, intents: 0, revenue: 0, followers: 0 };
        this.livestreamDuration = Math.max(1, Math.ceil(dayDuration(this.store.state) / 3));
        this.livestreamRemaining = this.livestreamDuration;
        this.livestreamEndsAt = 0;
        this.livestreamComments = [];
        this.livestreamActiveRequest = undefined;
        this.openModal('livestream', livestreamModal(this.store.state, this.livestreamPoolIds));
        break;
      }
      case 'livestream-pool-select': {
        this.livestreamPoolIds = this.livestreamPoolIds.includes(id)
          ? this.livestreamPoolIds.filter(productId => productId !== id)
          : [...this.livestreamPoolIds, id];
        this.refreshLivestream();
        break;
      }
      case 'livestream-start':
        if (this.livestreamPoolIds.length >= 1 && this.store.beginLivestream()) {
          this.livestreamRound = 1;
          this.livestreamSelectedIds = [];
          this.livestreamDiscount = 0;
          this.livestreamResult = undefined;
          this.livestreamDuration = Math.max(1, Math.ceil(dayDuration(this.store.state) / 3));
          this.livestreamRemaining = this.livestreamDuration;
          this.livestreamEndsAt = Date.now() + this.livestreamDuration * 1000;
          this.livestreamComments = [];
          this.livestreamActiveRequest = livestreamRequest(this.store.state, this.livestreamPoolIds, this.livestreamRound);
          this.livestreamIntentResolved = false;
          this.livestreamIntentStartedAt = Date.now();
          this.livestreamNextCommentAt = Date.now() + 500;
          this.livestreamNextIntentAt = 0;
          this.pushLivestreamComment(this.livestreamActiveRequest.handle, this.livestreamActiveRequest.question, 'intent');
          this.refreshLivestream();
        }
        break;
      case 'livestream-round-select': {
        this.livestreamSelectedIds = this.livestreamSelectedIds[0] === id ? [] : [id];
        this.refreshLivestream();
        break;
      }
      case 'livestream-discount':
        this.livestreamDiscount = Math.max(0, Math.min(.15, Number(target?.dataset.value) || 0));
        this.refreshLivestream();
        break;
      case 'livestream-submit': {
        this.resolveLivestreamIntent();
        break;
      }
      case 'livestream-next':
        if (this.livestreamRemaining <= 0) { this.refreshLivestream(); break; }
        this.livestreamRound++;
        this.livestreamSelectedIds = [];
        this.livestreamDiscount = 0;
        this.livestreamResult = undefined;
        this.refreshLivestream();
        break;
      case 'livestream-end':
        this.livestreamEndsAt = 0;
        this.livestreamRemaining = 0;
        this.livestreamResult = undefined;
        this.refreshLivestream();
        break;
      case 'livestream-finish':
        this.livestreamEndsAt = 0;
        this.openModal('online', onlineChannelModal(this.store.state));
        break;
      case 'debug-open': this.openModal('debug', debugPanel(this.store.state)); break;
      case 'debug-action':
        if (id === 'customer' || id === 'online-order') this.closeModal();
        if (this.store.debug(id)) {
          if (id === 'online-stock') this.openModal('online-stock', onlineStockModal(this.store.state));
          if (id === 'regular-order') this.openModal('online', onlineChannelModal(this.store.state));
          if (id === 'livestream-reset') {
            this.livestreamPoolIds = [];
            this.livestreamRound = 0;
            this.livestreamSelectedIds = [];
            this.livestreamDiscount = 0;
            this.livestreamResult = undefined;
            const startingViewers = this.initialLivestreamViewers();
            this.livestreamStats = { viewers: startingViewers, peakViewers: startingViewers, likes: 0, orders: 0, intents: 0, revenue: 0, followers: 0 };
            this.livestreamDuration = Math.max(1, Math.ceil(dayDuration(this.store.state) / 3));
            this.livestreamRemaining = this.livestreamDuration;
            this.livestreamEndsAt = 0;
            this.openModal('livestream', livestreamModal(this.store.state, this.livestreamPoolIds));
          }
        }
        break;
      case 'social-section':
        if (id === 'feed' || id === 'recruitment') {
          this.socialSection = id;
          this.renderPanel();
        }
        break;
      case 'review-like': {
        const scrollTop = document.querySelector<HTMLElement>('.social-drawer-content')?.scrollTop ?? 0;
        if (this.store.toggleShopReviewLike(id)) {
          const scroller = document.querySelector<HTMLElement>('.social-drawer-content');
          if (scroller) scroller.scrollTop = scrollTop;
        }
        break;
      }
      case 'drama-response': {
        const dramaId = target?.dataset.drama ?? '';
        const scrollTop = document.querySelector<HTMLElement>('.social-drawer-content')?.scrollTop ?? 0;
        if (this.store.resolveSocialDrama(dramaId, id)) {
          this.renderPanel();
          const scroller = document.querySelector<HTMLElement>('.social-drawer-content');
          if (scroller) scroller.scrollTop = scrollTop;
        }
        break;
      }
      case 'drama-free-response':
        this.submitFreeDramaResponse(target as HTMLButtonElement | null);
        break;
      case 'recruit-post': {
        const input = document.querySelector<HTMLInputElement>('#staff-salary-input');
        this.store.postRecruitment(Number(input?.value ?? 0));
        break;
      }
      case 'recruit-cancel': this.store.cancelRecruitment(); break;
      case 'recruit-new': {
        if (this.store.cancelRecruitment()) this.renderPanel();
        break;
      }
      case 'staff-hire': this.store.hireStaff(id); break;
      case 'staff-fire': this.store.fireStaff(id); break;
      case 'staff-leave-approve': this.store.decideStaffLeave(id, true); break;
      case 'staff-leave-deny': this.store.decideStaffLeave(id, false); break;
        case 'staff-recruit-go':
          this.closeModal();
          if (this.store.state.phase === 'open') this.store.toast('Hãy đóng cửa shop trước khi đăng tin tuyển dụng.', 'error');
          else { this.socialSection = 'recruitment'; this.navigate('social'); }
          break;
      case 'outfit-category':
        if (!this.ensureServeVisitFocused()) break;
        this.outfitCategory = id;
        this.dialog.querySelector('.dialog-inner')!.innerHTML = this.serveModalMarkup();
        this.dialog.querySelector<HTMLButtonElement>(`[data-action="outfit-category"][data-id="${id}"]`)?.focus({ preventScroll: true });
        break;
      case 'outfit-clear':
        if (!this.ensureServeVisitFocused()) break;
        this.selected = [];
        this.dialog.querySelector('.dialog-inner')!.innerHTML = this.serveModalMarkup();
        this.dialog.querySelector<HTMLButtonElement>('[data-action="outfit-category"]')?.focus({ preventScroll: true });
        break;
      case 'display-add':
      case 'display-remove': {
        const uid = target?.dataset.fixture ?? '';
        const changed = action === 'display-add' ? this.store.displayProduct(uid, id) : this.store.removeDisplayedProduct(uid, id);
        this.refreshDisplayFixture(uid);
        if (changed && action === 'display-add' && this.tutorialStep === 4) this.advanceTutorial(5);
        break;
      }
      case 'display-upgrade': {
        const uid = target?.dataset.fixture ?? '';
        this.openDisplayUpgradeConfirmation(uid);
        break;
      }
      case 'display-upgrade-confirmed': {
        const uid = this.pendingDisplayUpgradeUid;
        if (uid) this.store.upgradeDisplay(uid);
        this.pendingDisplayUpgradeUid = '';
        if (uid) this.openDisplayFixture(uid);
        else this.closeModal();
        break;
      }
      case 'display-upgrade-cancel': {
        this.pendingDisplayUpgradeUid = '';
        this.closeModal();
        this.selectedFurniture = undefined;
        this.scene?.setMoveMode(false);
        this.renderMoveToolbar();
        this.navigate('shop');
        break;
      }
      case 'select-product': {
        if (!this.ensureServeVisitFocused()) break;
        const { next, replaced } = smartOutfitSelection(this.selected, id);
        if (!this.selected.includes(id) && !validOutfit(next)) {
          this.toast(`Chọn tối đa ${MAX_OUTFIT_ITEMS} món khác loại.`, 'error');
          return;
        }
        this.selected = next;

        if (replaced.length > 0) {
          const newProd = products.find(p => p.id === id);
          const oldNames = replaced.map(rid => products.find(p => p.id === rid)?.name).filter(Boolean);
          if (newProd && oldNames.length > 0) {
            this.toast(`Đã đổi sang ${newProd.name} (thay cho ${oldNames.join(', ')})`, 'info');
          }
        }

        this.refreshServeSelection();
        break;
      }
      case 'serve': {
        if (!this.ensureServeVisitFocused()) break;
        const visitUid = this.serveVisitId;
        const result = this.store.serve(this.selected);
        const checkout = this.store.state.activeVisits.find(visit => visit.uid === visitUid && visit.stage === 'checkout');
        if (result?.success && checkout && (this.modal !== 'checkout' || this.checkoutVisitId !== visitUid)) this.openCheckout(visitUid);
        break;
      }
      case 'close-shop':
        this.openModal('close-shop-confirm', `
          <div class="early-close-confirmation">
            <span class="early-close-icon">${icon('clock')}</span>
            <span class="eyebrow">KẾT THÚC NGÀY BÁN</span>
            <h2>Đóng cửa sớm ngay bây giờ?</h2>
            <p>Khách đang ở trong shop sẽ rời đi và hôm nay sẽ được tổng kết ngay.</p>
            <div class="early-close-actions">
              <button class="btn btn-secondary" data-action="close-modal">Tiếp tục bán</button>
              <button class="btn btn-primary" data-action="close-shop-confirm">Đóng cửa và tổng kết</button>
            </div>
          </div>`);
        break;
      case 'close-shop-confirm':
        this.closeModal();
        this.store.closeDay();
        break;
      case 'sale-speed': {
        if (this.store.state.phase !== 'open') return;
        if (this.isSaleSpeedLocked()) {
          this.resetSaleSpeed();
          return;
        }
        this.saleSpeed = this.saleSpeed === 1 ? 2 : this.saleSpeed === 2 ? 4 : 1;
        this.scene?.setSaleSpeed(this.saleSpeed);
        this.render();
        document.querySelector<HTMLButtonElement>('[data-action="sale-speed"]')?.focus({ preventScroll: true });
        break;
      }
      case 'summary': this.openModal('summary', summaryModal(this.store.state)); break;
      case 'finance-open': {
        this.financeSection = this.store.state.employees.some(employee => (employee.unpaidWages ?? 0) > 0)
          ? 'payroll'
          : this.store.state.rentDue > 0 ? 'land' : 'loan';
        this.openModal('finance', financeModal(this.store.state, this.financeSection));
        break;
      }
      case 'finance-section':
        if (id === 'loan' || id === 'payroll' || id === 'land' || id === 'cash') {
          this.financeSection = id;
          this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
        }
        break;
      case 'take-loan': {
        const input = this.dialog.querySelector<HTMLInputElement>('#loan-amount-input');
        const amount = Number(input?.value.replace(/\D/g, '') || 0);
        this.store.takeLoan(amount);
        if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
        break;
      }
      case 'cash-deposit':
      case 'cash-withdraw': {
        this.cashTransferMode = action === 'cash-deposit' ? 'deposit' : 'withdraw';
        this.cashTransferSelection = {};
        this.openModal('cash-transfer', cashTransferModal(this.store.state, this.cashTransferMode, this.cashTransferSelection));
        break;
      }
      case 'cash-transfer-note-plus':
      case 'cash-transfer-note-minus': {
        const noteGrid = this.dialog.querySelector<HTMLElement>('.cash-transfer-note-grid');
        const noteGridScrollTop = noteGrid?.scrollTop ?? 0;
        const noteGridScrollLeft = noteGrid?.scrollLeft ?? 0;
        const value = Number(id);
        if (!Number.isFinite(value) || value <= 0) break;
        const key = String(value);
        const count = this.cashTransferSelection[key] ?? 0;
        if (action === 'cash-transfer-note-minus') this.cashTransferSelection[key] = Math.max(0, count - 1);
        else {
          const maximum = this.cashTransferMode === 'deposit' ? (this.store.state.cashDrawer[key] ?? 0) : 99;
          this.cashTransferSelection[key] = Math.min(maximum, count + 1);
        }
        this.dialog.querySelector('.dialog-inner')!.innerHTML = cashTransferModal(this.store.state, this.cashTransferMode, this.cashTransferSelection);
        const nextNoteGrid = this.dialog.querySelector<HTMLElement>('.cash-transfer-note-grid');
        if (nextNoteGrid) {
          nextNoteGrid.scrollTop = noteGridScrollTop;
          nextNoteGrid.scrollLeft = noteGridScrollLeft;
        }
        break;
      }
      case 'cash-transfer-confirm': {
        const ok = this.store.transferCashNotes(this.cashTransferMode, this.cashTransferSelection);
        if (!ok) { this.toast('Không thể thực hiện giao dịch. Hãy kiểm tra tiền đã chọn, số dư và phí 30.000₫.', 'error'); break; }
        this.cashTransferSelection = {};
        this.financeSection = 'cash';
        this.openModal('finance', financeModal(this.store.state, 'cash'));
        break;
      }
      case 'cash-transfer-back':
        this.cashTransferSelection = {};
        this.financeSection = 'cash';
        this.openModal('finance', financeModal(this.store.state, 'cash'));
        break;
      case 'pay-loan': {
        this.store.payLoanDue();
        if (this.modal === 'summary') {
          this.dialog.querySelector('.dialog-inner')!.innerHTML = summaryModal(this.store.state);
          this.scrollModalToTop();
        }
        else if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
        break;
      }
      case 'pay-rent': {
        this.store.payRentDue();
        if (this.modal === 'summary') {
          this.dialog.querySelector('.dialog-inner')!.innerHTML = summaryModal(this.store.state);
          this.scrollModalToTop();
        }
        else if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
        break;
      }
      case 'pay-staff-wages':
        this.store.payStaffWages(id);
        if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
        break;
      case 'pay-all-staff-wages':
        this.store.payStaffWages();
        if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state, this.financeSection);
        break;
      case 'next-day': this.closeModal(); this.navigate('shop'); break;
      case 'display-guide-start': {
        this.closeModal();
        this.navigate('shop');
        const fixture = this.store.state.layout.find(item => furniture.find(def => def.id === item.id)?.display?.kind === 'clothing')
          ?? this.store.state.layout.find(item => furniture.find(def => def.id === item.id)?.display);
        if (fixture) this.openDisplayFixture(fixture.uid);
        else this.navigate('decor');
        break;
      }
      case 'close-modal': {
        const closedDisplay = this.modal === 'display';
        this.closeModal();
        if (closedDisplay) this.scene?.setMoveMode(false);
        break;
      }
      case 'restock': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
          return;
        }
        this.closeModal();
        this.navigate('import');
        break;
      }
      case 'claim': this.store.claimQuest(id); break;
      case 'edit-toggle': this.navigate(this.tab === 'decor' ? 'shop' : 'decor'); break;
      case 'decor-category': {
        this.decorCategory = id;
        this.renderPanel();
        break;
      }
      case 'trend-section': {
        if (id === 'hot' || id === 'out') {
          this.trendSection = id;
          this.renderPanel();
        }
        break;
      }
      case 'buy-furniture': {
        const uid = this.store.buyFurniture(id);
        if (uid) this.beginFurniturePlacement(uid);
        else this.renderPanel();
        break;
      }
      case 'expand-land-confirm': {
        this.openLandExpansionConfirmation();
        break;
      }
      case 'expand-land-confirmed': {
        this.store.expandLand();
        this.closeModal();
        break;
      }
      case 'move-rotate': {
        if (this.selectedFurniture) {
          const f = this.store.state.layout.find(f => f.uid === this.selectedFurniture);
          if (f) this.store.moveFurniture(f.uid, f.x, f.y, true);
        }
        break;
      }
      case 'move-store': {
        const placed = this.store.state.layout.find(item => item.uid === this.selectedFurniture);
        const definition = placed && furniture.find(item => item.id === placed.id);
        if (!placed || !definition) break;
        this.pendingStoreFurnitureUid = placed.uid;
        const displayedItems = placed.displayItems?.length ?? 0;
        this.openModal('store-furniture-confirm', `<section class="store-furniture-confirmation">
          <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
          <div class="store-furniture-art"><span>${furnitureImage(definition)}</span><i>${icon('hudFixtureStore')}</i></div>
          <div class="store-furniture-copy"><small>CẤT ĐỒ VÀO KHO</small><h2>Cất ${escapeHtml(placed.customName || definition.name)}?</h2><p>Món đồ sẽ được đưa vào kho nội thất và bạn có thể đặt lại bất cứ lúc nào.${displayedItems ? ` ${displayedItems} sản phẩm đang trưng bày cũng sẽ được trả về kho hàng.` : ''}</p></div>
          <footer><button class="btn btn-secondary" data-action="close-modal">Giữ lại</button><button class="btn btn-primary" data-action="move-store-confirmed">${icon('hudFixtureStore')} Cất vào kho</button></footer>
        </section>`);
        break;
      }
      case 'move-store-confirmed': {
        const uid = this.pendingStoreFurnitureUid;
        if (uid && this.store.state.layout.some(item => item.uid === uid)) this.store.storeFurniture(uid);
        this.pendingStoreFurnitureUid = '';
        if (this.selectedFurniture === uid) this.selectedFurniture = undefined;
        this.scene?.setMoveMode(false);
        this.closeModal();
        this.renderMoveToolbar();
        break;
      }
      case 'move-start': if (this.selectedFurniture) this.scene?.setMoveMode(true, this.selectedFurniture); break;
      case 'display-open': {
        const uid = this.selectedFurniture;
        if (uid) { this.scene?.setMoveMode(false); this.openDisplayFixture(uid); }
        break;
      }
      case 'fixture-info': {
        const placed = this.store.state.layout.find(item => item.uid === id);
        const definition = placed && furniture.find(item => item.id === placed.id);
        if (!placed || !definition) break;
        const display = definition.display;
        const currentCapacity = display ? displayCapacity(definition, placed) : 0;
        const currentLevel = display ? displayLevel(definition, placed) : 0;
        this.openModal('fixture-info', `<div class="app-info-modal fixture-details-modal">
          <header class="app-modal-header"><span class="app-header-chip">${icon('decor')} Đang đặt</span><div><small>THÔNG TIN ĐỒ ĐẠC</small><h2>${escapeHtml(placed.customName || definition.name)}</h2></div><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></header>
          <section class="fixture-details-hero"><div class="fixture-details-art">${furnitureImage(definition)}</div><div><span class="eyebrow">${escapeHtml(definition.style ?? 'Boutique')}</span><h3>${escapeHtml(placed.customName || definition.name)}</h3><p>${escapeHtml(definition.description ?? 'Một món đồ giúp bạn hoàn thiện không gian boutique.')}</p></div></section>
          <div class="app-stat-grid fixture-details-stats"><span>${icon('expand')}<small>Kích thước</small><b>${definition.width} × ${definition.height}</b></span><span>${icon('hudAppeal')}<small>Thẩm mỹ</small><b>+${definition.appeal}</b></span>${display ? `<span>${icon('hanger')}<small>Sức chứa</small><b>${currentCapacity}</b></span><span>${icon('trophy')}<small>Cấp kệ</small><b>${currentLevel}</b></span>` : `<span>${icon('shop')}<small>Phân loại</small><b>Trang trí</b></span>`}</div>
          <footer class="app-modal-actions"><button class="btn btn-primary" data-action="close-modal">${icon('check')} Đã hiểu</button></footer>
        </div>`);
        break;
      }
      case 'move-sell': {
        if (this.selectedFurniture) {
          this.store.sellFurniture(this.selectedFurniture);
          this.selectedFurniture = undefined;
          this.scene?.setMoveMode(false);
          this.renderMoveToolbar();
        }
        break;
      }
      case 'place-stored': {
        const uid = this.store.placeStoredFurniture(id);
        if (uid) this.beginFurniturePlacement(uid);
        else this.renderPanel();
        break;
      }
      case 'move-done': {
        this.scene?.setMoveMode(false);
        break;
      }
      case 'rotate': { const f = this.store.state.layout.find(f => f.uid === this.selectedFurniture); if (f) this.store.moveFurniture(f.uid, f.x, f.y, true); break; }
      case 'sell-furniture': if (this.selectedFurniture) { this.store.sellFurniture(this.selectedFurniture); this.selectFurniture(); } break;
      case 'move-up': this.moveSelected(0, -1); break;
      case 'move-down': this.moveSelected(0, 1); break;
      case 'move-left': this.moveSelected(-1, 0); break;
      case 'move-right': this.moveSelected(1, 0); break;
      case 'zoom': this.scene?.zoom(); break;
      case 'upgrade-open': {
        if (this.store.state.phase === 'open') {
          this.toast('Đang trong giờ bán hàng! Bạn có thể nâng cấp tiệm sau khi đóng cửa nhé.', 'info');
          return;
        }
        this.openModal('upgrade', upgradeModal(this.store.state));
        break;
      }
      case 'upgrade': this.store.upgrade(); this.closeModal(); this.scene?.burst(500, 300, true); break;
      case 'sound': this.store.settings('sound', !this.store.state.sound); this.audio.enabled = this.store.state.sound; if (this.modal === 'settings') this.showSettings(); break;
      case 'music': {
        const fromPlayer = this.modal === 'music-player';
        this.store.settings('music', !this.store.state.music);
        this.audio.setMusicVolume(this.store.state.musicVolume);
        this.audio.music(this.store.state.music);
        if (fromPlayer) this.refreshMusicPlayer(); else this.showSettings();
        break;
      }
      case 'music-player-open':
        this.scene?.setMoveMode(false);
        this.openMusicPlayer(false);
        break;
      case 'music-player-track':
        this.store.setMusicTrack(id);
        this.audio.playMusicTrack(id);
        this.refreshMusicPlayer();
        break;
      case 'music-player-stop':
        this.audio.stopMusicTrack();
        this.refreshMusicPlayer();
        break;
      case 'settings': {
        if (this.store.state.phase === 'open') {
          this.toast('Đang trong giờ bán hàng! Hãy chăm chút phục vụ khách nhé.', 'info');
          return;
        }
        this.showSettings();
        break;
      }
      case 'home': {
        if (this.modal !== 'none') this.closeModal();
        this.navigate('shop');
        this.openModal('profile', boutiqueProfileModal(this.store.state));
        break;
      }
      case 'help': this.showHelp(); break;
      case 'name-shop': this.openNameShop(false); break;
      case 'pick-name': {
        const input = this.dialog.querySelector<HTMLInputElement>('#shop-name-input');
        if (input && id) {
          input.value = id;
          input.focus();
        }
        break;
      }
      case 'confirm-shop-name': {
        const input = this.dialog.querySelector<HTMLInputElement>('#shop-name-input');
        const rawName = input?.value?.trim() || '';
        if (!rawName) {
          this.toast('Vui lòng nhập tên cho tiệm của bạn nhé!', 'error');
          return;
        }
        this.store.setShopName(rawName);
        this.closeModal();
        this.tutorialStep = 0;
        this.queueTutorialCue();
        break;
      }
      case 'tutorial-done': this.store.settings('tutorialDone', true); this.closeModal(); break;
      case 'rescue': this.store.rescue(); break;
      case 'reset-confirm': this.openModal('reset', `<div class="modal-heading"><h2>Bắt đầu một boutique mới?</h2><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></div><p>Tiền, hàng hóa, ngày chơi và toàn bộ tiến trình hiện tại sẽ bị xóa khỏi trình duyệt này. Thao tác này không thể hoàn tác.</p><div class="reset-actions"><button class="btn btn-secondary" data-action="settings">Giữ boutique của mình</button><button class="btn btn-danger" data-action="reset">Xóa và chơi lại</button></div>`); break;
      case 'reset': this.closeModal(); this.store.reset(); this.audio.enabled = true; this.audio.setMusicVolume(this.store.state.musicVolume); this.audio.setEffectsVolume(this.store.state.effectsVolume); this.audio.setMusicTrack(this.store.state.musicTrack); this.audio.music(this.store.state.music); this.productImportQtys = {}; this.lookQtys = {}; this.materialQtys = {}; this.expandedImportPurchase = ''; this.decorCategory = 'all'; this.navigate('shop'); setTimeout(() => this.openNameShop(true), 100); break;
    }
  }
  private scheduleCatalogSearch(inputId: 'catalog-search' | 'import-search', caret: number | null) {
    window.clearTimeout(this.catalogSearchTimer);
    this.catalogSearchTimer = window.setTimeout(() => {
      const shouldRestoreFocus = document.activeElement?.id === inputId;
      this.renderPanel();
      if (!shouldRestoreFocus) return;
      const nextInput = document.getElementById(inputId) as HTMLInputElement | null;
      if (!nextInput) return;
      nextInput.focus({ preventScroll: true });
      const position = Math.min(caret ?? nextInput.value.length, nextInput.value.length);
      nextInput.setSelectionRange(position, position);
    }, 180);
  }
  navigate(tab: Tab) {
    if (tab !== 'atelier') this.atelierHistoryOpen = false;
    if (tab === 'atelier' && this.store.state.level < ATELIER_UNLOCK_LEVEL) {
      this.toast(`Xưởng may cá nhân mở khóa ở cấp boutique ${ATELIER_UNLOCK_LEVEL}.`, 'info');
      return;
    }
    const enteringImport = (tab === 'import' || tab === 'looks') && this.tab !== 'import';
    if (tab === 'looks') {
      this.importMode = 'looks';
      tab = 'import';
    }
    if (tab !== 'shop' && !navItems.some(n => n.id === tab)) return;
    if (enteringImport) {
      this.importSourceSelected = false;
      this.expandedImportPurchase = '';
    }
    if (this.store.state.phase === 'open' && (tab === 'import' || tab === 'decor' || tab === 'social' || tab === 'atelier')) {
      tab = 'shop';
    }
    if (tab === 'social') {
      this.lastSeenDramaId = this.store.state.dramas[0]?.id ?? '';
      try { localStorage.setItem(SOCIAL_DRAMA_SEEN_KEY, this.lastSeenDramaId); } catch { /* Storage may be unavailable. */ }
    }
    if (this.modal !== 'none') this.closeModal();
    if (this.moveMode) this.scene?.setMoveMode(false);
    if (this.tab === tab && tab !== 'shop') tab = 'shop';
    this.tab = tab;
    document.querySelectorAll<HTMLElement>('[data-action="nav"]').forEach(el => {
      el.classList.remove('active');
      if (el.tagName === 'BUTTON') el.setAttribute('aria-current', 'false');
    });
    const showShop = tab === 'shop';
    const panel = document.querySelector<HTMLElement>('#content-panel')!;
    // Keep the current screen visible until the destination has rendered.
    // This prevents a renderer error from leaving a blank full-screen panel.
    if (showShop) panel.hidden = true;
    this.scene?.setTab(tab);
    this.syncSceneInteraction();
    this.scene?.setEdit(false);
    this.updateDockVisibility();
    this.render();
    panel.hidden = showShop;
    panel.scrollTop = 0;
    requestAnimationFrame(() => { panel.scrollTop = 0; });
    requestAnimationFrame(() => this.scene?.scale?.refresh());
    this.queueDisplayGuide();
  }
  private beginFurniturePlacement(uid: string) {
    this.navigate('shop');
    this.scene?.startFurniturePlacement(uid);
  }
  private updateFloatingActionVisibility() {
    const hiddenFromShop = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || this.store.state.phase === 'open';
    const staffButton = document.querySelector<HTMLElement>('#staff-manager-button');
    if (staffButton) staffButton.hidden = hiddenFromShop;
    const onlineButton = document.querySelector<HTMLElement>('#online-channel-button');
    if (onlineButton) onlineButton.hidden = hiddenFromShop;
    const onlineCareCluster = document.querySelector<HTMLElement>('#online-care-cluster');
    if (onlineCareCluster) onlineCareCluster.hidden = hiddenFromShop;
    const landButton = document.querySelector<HTMLElement>('#land-expand-button');
    if (landButton) landButton.hidden = hiddenFromShop || this.store.state.phase === 'open';
    const financeButton = document.querySelector<HTMLElement>('#finance-hud-button');
    if (financeButton) financeButton.hidden = hiddenFromShop;
    const debugButton = document.querySelector<HTMLElement>('#debug-button');
    if (debugButton) debugButton.hidden = !SHOW_DEBUG_BUTTON || hiddenFromShop;
  }
  private updateDockVisibility() {
    const isMainShop = this.tab === 'shop' && this.modal === 'none' && !this.moveMode;
    const isWorking = this.store.state.phase === 'open';
    const saleControls = document.querySelector<HTMLElement>('#sale-controls');
    if (saleControls) saleControls.hidden = !isMainShop || this.store.state.phase !== 'open';
    const dockContainer = document.querySelector<HTMLElement>('#game-dock-bar');
    if (dockContainer) {
      dockContainer.hidden = !isMainShop || isWorking;
      dockContainer.classList.toggle('is-hidden', !isMainShop || isWorking);
    }
    this.updateFloatingActionVisibility();
  }
  private renderDock() {
    const dockNav = document.querySelector<HTMLElement>('.vertical-dock');
    if (!dockNav) return;
    const isOpen = this.store.state.phase === 'open';
    const staffNotices = this.store.state.staffLeaveRequests.length + this.store.state.staffApplicants.length;
    const latestDramaId = this.store.state.dramas[0]?.id ?? '';
    const hasUnreadDrama = !!latestDramaId && latestDramaId !== this.lastSeenDramaId;
    const availableItems = isOpen
      ? navItems.filter(n => n.id === 'stock' || n.id === 'trend')
      : navItems;
    dockNav.innerHTML = availableItems.map(n => `
      <button data-action="nav" data-id="${n.id}" class="dock-item standalone-dock-btn dock-btn-${n.id}" aria-label="${n.label}">
        <div class="dock-icon-bubble dock-bubble-${n.id}">
          ${icon(n.icon)}
        </div>
         ${n.id === 'social' && (hasUnreadDrama || staffNotices > 0) ? `<b class="dock-social-badge ${hasUnreadDrama ? 'is-drama-alert' : ''}" title="${hasUnreadDrama ? 'Có drama mới' : `${staffNotices} thông báo nhân viên`}">${hasUnreadDrama ? '!' : staffNotices}</b>` : ''}
        <span class="dock-btn-label">${n.label}</span>
      </button>
    `).join('');
  }
  private reconcileSaleInteractionBar(
    bar: HTMLElement,
    cards: Array<{ key: string; html: string }>,
  ) {
    const existing = new Map<string, HTMLElement>();
    Array.from(bar.children).forEach(child => {
      const element = child as HTMLElement;
      const key = element.dataset.saleCardKey;
      if (key) existing.set(key, element);
    });
    const ordered = cards.map(card => {
      const current = existing.get(card.key);
      if (current) {
        existing.delete(card.key);
        return current;
      }
      const template = document.createElement('template');
      template.innerHTML = card.html.trim();
      const created = template.content.firstElementChild as HTMLElement | null;
      if (!created) return undefined;
      created.dataset.saleCardKey = card.key;
      return created;
    }).filter((card): card is HTMLElement => !!card);
    existing.forEach(element => element.remove());
    ordered.forEach((element, index) => {
      if (bar.children[index] !== element) bar.insertBefore(element, bar.children[index] ?? null);
    });
  }
  private render() {
    const s = this.store.state;
    const crisisWarning = !!s.reputationCrisis || s.loanOverdueDays >= 5 || s.rentOverdueDays >= 5;
    document.querySelector<HTMLElement>('.game-stage')?.classList.toggle('is-crisis-warning', crisisWarning);
    document.querySelector<HTMLElement>('#music-edge-aura')?.classList.toggle('is-active', this.audio.isMusicTrackPlaying());
    const isOpen = s.phase === 'open';
    this.audio.syncBackgroundForGame(isOpen, isOpen ? Math.max(0, s.dayTimer - this.saleTickProgress) : 0);
    document.querySelector<HTMLElement>('.game-stage')?.classList.toggle('is-sale-open', isOpen);
    document.querySelector<HTMLElement>('#toasts')?.classList.toggle('is-sale-open', isOpen);
    if (!isOpen) {
      this.saleSpeed = 1;
      this.saleTickProgress = 0;
      this.scene?.setSaleSpeed(1);
    }
    const showShop = this.tab === 'shop';

    const calendarDate = gameCalendarDate(s.day);
    document.querySelector('#day-card')!.innerHTML = `${icon('daySun')}<span class="day-calendar"><small>NGÀY</small><strong class="day-num">${String(calendarDate.day).padStart(2, '0')}</strong></span><i></i><span class="day-calendar"><small>THÁNG</small><strong class="day-num">${String(calendarDate.month).padStart(2, '0')}</strong></span>`;
    const crisisButton = document.querySelector<HTMLButtonElement>('#crisis-alert-button');
    if (crisisButton) {
      const crisis = s.reputationCrisis;
      crisisButton.hidden = !crisis;
      if (crisis) {
        const daysLeft = Math.max(0, crisis.deadlineDay - s.day + 1);
        crisisButton.innerHTML = `${icon('hudCrisis')}<span class="sr-only">Khủng hoảng uy tín · còn ${daysLeft} ngày</span>`;
        crisisButton.setAttribute('aria-label', `Khủng hoảng uy tín, còn ${daysLeft} ngày. Nhấn để xem chi tiết.`);
      }
    }
    document.querySelector('#hud')!.innerHTML = `<span class="hud-item wallet"><strong data-testid="money">${compactMoney(s.money)}</strong>${icon('hudMoney')}</span><span class="hud-item" title="Độ uy tín"><strong>${s.reputation.toFixed(1)}</strong>${icon('hudReputation')}</span><span class="hud-item" title="Người theo dõi"><strong>${compact(s.followers)}</strong>${icon('hudFollowers')}</span><span class="hud-item hud-appeal" title="Điểm thẩm mỹ"><strong>${decorAppealScore(s)}</strong>${icon('hudAppeal')}</span>`;
    const currentProfileLevel = levels[Math.max(0, s.level - 1)];
    const profileNext = levels[s.level];
    const levelXp = Math.max(0, s.xp - currentProfileLevel.xp);
    const levelXpTarget = profileNext ? Math.max(1, profileNext.xp - currentProfileLevel.xp) : 1;
    const profileName = document.querySelector<HTMLElement>('#shop-hud-name');
    if (profileName) profileName.textContent = s.shopName;
    const profileExpBar = document.querySelector<HTMLElement>('#shop-hud-exp-bar');
    if (profileExpBar) profileExpBar.style.width = `${profileNext ? Math.min(100, levelXp / levelXpTarget * 100) : 100}%`;
    const soundBtn = document.querySelector('#sound-button');
    if (soundBtn) {
      soundBtn.innerHTML = icon(s.sound ? 'volume' : 'mute');
      soundBtn.setAttribute('aria-pressed', String(s.sound));
    }
    const profileLevel = document.querySelector<HTMLElement>('#shop-hud-level');
    if (profileLevel) profileLevel.textContent = `· Cấp ${s.level}`;
    document.querySelector('.level-capsule')?.setAttribute('aria-label', `Cấp boutique ${s.level}`);

    const timerVal = s.dayTimer ?? DAY_DURATION;
    const saleSpeedLocked = isOpen && timerVal <= 10;
    if (saleSpeedLocked) this.resetSaleSpeed();
    const shiftDuration = dayDuration(s);
    const saleControls = document.querySelector<HTMLElement>('#sale-controls')!;
    if (!isOpen) {
      saleControls.replaceChildren();
    } else if (!saleControls.querySelector('[data-action="close-shop"]') || !saleControls.querySelector('[data-action="sale-speed"]')) {
      saleControls.innerHTML = `          <button class="close-shop-button" data-action="close-shop" title="Kết thúc ngày bán và xem tổng kết">
            <span class="sale-btn-icon">${icon('shop')}</span>
            <span class="sale-btn-text">Đóng cửa</span>
          </button>
          <button class="sale-speed-button" data-action="sale-speed" aria-label="Tốc độ bán hàng ${this.saleSpeed}x" title="${saleSpeedLocked ? '10 giây cuối luôn chạy ở tốc độ 1x' : 'Đổi tốc độ: 1x → 2x → 4x → 1x'}" data-speed="${this.saleSpeed}" ${saleSpeedLocked ? 'disabled' : ''}>
            <span class="speed-icon-wrap">${icon('arrow')}</span>
            <strong class="speed-val">${this.saleSpeed}x</strong>
          </button>`;
    }
    const speedButton = saleControls.querySelector<HTMLButtonElement>('[data-action="sale-speed"]');
    if (speedButton) {
      speedButton.dataset.speed = String(this.saleSpeed);
      speedButton.disabled = saleSpeedLocked;
      speedButton.classList.toggle('is-locked', saleSpeedLocked);
      speedButton.title = saleSpeedLocked ? '10 giây cuối luôn chạy ở tốc độ 1x' : 'Đổi tốc độ: 1x → 2x → 4x → 1x';
      speedButton.setAttribute('aria-label', saleSpeedLocked ? 'Tốc độ khóa ở 1x trong 10 giây cuối' : `Tốc độ bán hàng ${this.saleSpeed}x`);
      const speedValue = speedButton.querySelector<HTMLElement>('.speed-val');
      if (speedValue) speedValue.textContent = `${this.saleSpeed}x`;
    }
    saleControls.hidden = !isOpen || this.tab !== 'shop' || this.modal !== 'none' || this.moveMode;
    const saleTimer = document.querySelector<HTMLOutputElement>('#sale-shift-timer')!;
    saleTimer.hidden = !isOpen || this.tab !== 'shop';
    saleTimer.classList.toggle('is-urgent', timerVal <= 15);
    if (!isOpen) saleTimer.replaceChildren();
    else {
      if (!saleTimer.querySelector('#day-timer-label')) saleTimer.innerHTML = '<span>GIỜ TRONG NGÀY</span><strong id="day-timer-label"></strong>';
      const timerLabel = saleTimer.querySelector<HTMLElement>('#day-timer-label');
      if (timerLabel) timerLabel.textContent = saleClockLabel(timerVal, shiftDuration);
    }

    const interactionBar = document.querySelector<HTMLElement>('#sale-interaction-bar')!;
    const actionableVisits = s.activeVisits.filter(visit => (visit.mode === 'advice' && !visit.assignedStaffUid) || visit.stage === 'checkout');
    const customerCards = actionableVisits.flatMap(visit => {
      const customer = customers.find(item => item.id === visit.customerId) ?? lookupCustomer(visit.customerId);
      if (!customer) return [];
      const visualCustomer = this.scene?.customerVisualForVisit(customer, visit.uid) ?? customer;
      const checkout = visit.stage === 'checkout';
      return [{ key: `${checkout ? 'checkout' : 'advice'}:${visit.uid}:${visualCustomer.id}`, html: `<span class="sale-card-aura ${checkout ? 'is-checkout-aura' : ''}">
        <button class="sale-character-card is-customer ${checkout ? 'is-checkout' : ''} ${visit.uid === s.currentVisitId ? 'is-current' : ''}" data-action="sale-visit-open" data-id="${visit.uid}" aria-label="${checkout ? 'Thanh toán cho' : 'Tư vấn cho'} ${escapeHtml(customer.name)}">
          <strong class="sale-card-name">${checkout ? 'THANH TOÁN' : escapeHtml(customer.name)}</strong>
          <span class="sale-character-art">${avatarImage(visualCustomer)}</span>
          <div class="sale-card-countdown ${checkout ? 'sale-card-checkout' : ''} ${visit.patience <= 10 ? 'is-urgent' : ''}" data-visit="${visit.uid}">${checkout ? icon('coin') : ''}<span>${visit.patience}</span></div>
        </button>
      </span>` }];
    });
    const courierCards = s.onlineOrders.map((order, index) => ({ key: `courier:${order.id}:${order.courierVariant}`, html: `<span class="sale-card-aura is-courier-aura"><button class="sale-character-card is-customer is-courier" data-action="online-order-open" data-id="${order.id}" aria-label="Giao đơn hỏa tốc ${index + 1}">
      <strong class="sale-card-name">Shipper ${String(index + 1).padStart(2, '0')}</strong>
      <span class="sale-character-art">${courierImage(order.courierVariant)}</span>
      <div class="sale-card-countdown sale-card-delivery">${icon('bag')}<span>Giao</span></div>
    </button></span>` }));
    const packedRegularCount = s.regularOnlineOrders.filter(order => order.packed).length;
    const regularCourierCards = packedRegularCount ? [{ key: 'regular-pickup', html: `<span class="sale-card-aura is-courier-aura is-regular-pickup"><button class="sale-character-card is-customer is-courier" data-action="regular-pickup-open" aria-label="Bàn giao ${packedRegularCount} đơn thường">
      <strong class="sale-card-name">Shipper tổng</strong>
      <span class="sale-character-art">${courierImage(2)}</span>
      <div class="sale-card-countdown sale-card-delivery">${icon('box')}<span>${packedRegularCount} kiện</span></div>
    </button></span>` }] : [];
    this.reconcileSaleInteractionBar(interactionBar, [...customerCards, ...courierCards, ...regularCourierCards]);
    interactionBar.querySelectorAll<HTMLButtonElement>('[data-action="sale-visit-open"]').forEach(button => {
      button.classList.toggle('is-current', button.dataset.id === s.currentVisitId);
    });
    interactionBar.querySelectorAll<HTMLButtonElement>('[data-action="online-order-open"]').forEach(button => {
      const index = s.onlineOrders.findIndex(order => order.id === button.dataset.id);
      if (index < 0) return;
      button.setAttribute('aria-label', `Giao đơn hỏa tốc ${index + 1}`);
      const name = button.querySelector<HTMLElement>('.sale-card-name');
      if (name) name.textContent = `Shipper ${String(index + 1).padStart(2, '0')}`;
    });
    const regularPickup = interactionBar.querySelector<HTMLButtonElement>('[data-action="regular-pickup-open"]');
    if (regularPickup) {
      regularPickup.setAttribute('aria-label', `Bàn giao ${packedRegularCount} đơn thường`);
      const count = regularPickup.querySelector<HTMLElement>('.sale-card-delivery span');
      if (count) count.textContent = `${packedRegularCount} kiện`;
    }
    interactionBar.hidden = !isOpen || this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || !interactionBar.childElementCount;
    document.querySelector('#shop-status')!.innerHTML = '';

    // Ẩn/hiện các nút công cụ nhanh trên đỉnh tùy theo giờ bán hàng:
    const questBtn = document.querySelector<HTMLElement>('[data-action="quests"]');
    if (questBtn) {
      questBtn.style.display = isOpen ? 'none' : '';
      const readyQuestCount = [
        s.stats.sold >= 3 && !s.claimed.includes(`${s.day}:sales`),
        s.stats.trendSales >= 2 && !s.claimed.includes(`${s.day}:trend`),
      ].filter(Boolean).length;
      const badge = questBtn.querySelector<HTMLElement>('#quest-ready-badge');
      if (badge) {
        badge.hidden = readyQuestCount === 0;
        badge.textContent = String(readyQuestCount);
      }
      questBtn.setAttribute('aria-label', readyQuestCount
        ? `Nhiệm vụ ngày, ${readyQuestCount} phần thưởng chưa nhận`
        : 'Nhiệm vụ ngày');
    }
    const settingsBtn = document.querySelector<HTMLElement>('[data-action="settings"]');
    if (settingsBtn) settingsBtn.style.display = isOpen ? 'none' : '';
    const campaignBtn = document.querySelector<HTMLElement>('[data-action="campaign-open"]');
    if (campaignBtn) {
      campaignBtn.hidden = false;
      const campaignUnseen = s.level >= 3 && !s.claimed.includes(CAMPAIGN_GUIDE_SEEN);
      campaignBtn.classList.toggle('is-new-unlock', campaignUnseen);
      campaignBtn.classList.toggle('has-active-campaign', !!s.activeCampaign);
      campaignBtn.classList.toggle('is-campaign-ready', s.activeCampaign?.status === 'ready');
      const badge = campaignBtn.querySelector<HTMLElement>('#campaign-hud-badge');
      if (badge) {
        const campaign = s.activeCampaign;
        badge.hidden = !campaign;
        badge.textContent = !campaign ? '' : campaign.status === 'ready' ? '!' : campaign.status === 'failed' ? '×' : String(Math.max(0, campaign.deadlineDay - s.day + 1));
      }
      campaignBtn.setAttribute('title', s.level < 3
        ? 'Studio hợp tác · Mở khóa ở cấp 3'
        : s.activeCampaign ? `${s.activeCampaign.name} · Studio hợp tác` : 'Chọn hợp đồng thương hiệu');
      const newLabel = campaignBtn.querySelector<HTMLElement>('.campaign-new-label');
      if (newLabel) newLabel.hidden = !campaignUnseen;
    }
    const operationsBtn = document.querySelector<HTMLElement>('[data-action="customer-care-open"]');
    if (operationsBtn) {
      const dueReturns = s.returnCases.filter(item => item.availableDay <= s.day).length;
      const dueVip = s.vipAppointments.filter(item => item.status === 'accepted' && item.scheduledDay <= s.day).length;
      const notices = dueReturns + dueVip + (s.reputationCrisis ? 1 : 0);
      const badge = operationsBtn.querySelector<HTMLElement>('#customer-care-hud-badge');
      if (badge) { badge.hidden = notices === 0; badge.textContent = String(notices); }
      operationsBtn.classList.toggle('has-operation-alert', notices > 0);
      operationsBtn.setAttribute('title', notices ? `Chăm sóc đặc biệt · ${notices} việc cần xử lý` : 'Chăm sóc đặc biệt');
    }
    const staffButton = document.querySelector<HTMLElement>('#staff-manager-button');
    if (staffButton) {
      staffButton.hidden = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || isOpen;
      const status = staffButton.querySelector<HTMLElement>('#staff-fab-status');
      if (status) status.textContent = `Nhân viên: ${s.employees.length}`;
      const leaveBadge = staffButton.querySelector<HTMLElement>('#staff-leave-badge');
      if (leaveBadge) {
        const leaveRequests = s.staffLeaveRequests.length;
        leaveBadge.hidden = leaveRequests === 0;
        leaveBadge.textContent = leaveRequests ? String(leaveRequests) : '';
        leaveBadge.title = leaveRequests ? `${leaveRequests} đơn xin nghỉ đang chờ duyệt` : '';
      }
    }
    const financeHudButton = document.querySelector<HTMLElement>('#finance-hud-button');
    if (financeHudButton) {
      const payrollDebts = s.employees.filter(employee => (employee.unpaidWages ?? 0) > 0).length;
      const debtNotices = Number((s.loan?.paymentDue ?? 0) > 0) + Number(s.rentDue > 0) + payrollDebts;
      const badge = financeHudButton.querySelector<HTMLElement>('#finance-hud-badge');
      if (badge) {
        badge.hidden = debtNotices === 0;
        badge.textContent = debtNotices ? String(debtNotices) : '';
        badge.title = debtNotices ? `${debtNotices} khoản cần thanh toán` : '';
      }
      financeHudButton.classList.toggle('has-finance-alert', debtNotices > 0);
    }
    const onlineButton = document.querySelector<HTMLElement>('#online-channel-button');
    if (onlineButton) {
      onlineButton.hidden = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || isOpen;
      const onlineCareCluster = document.querySelector<HTMLElement>('#online-care-cluster');
      if (onlineCareCluster) onlineCareCluster.hidden = onlineButton.hidden;
      const status = onlineButton.querySelector<HTMLElement>('#online-fab-status');
      if (status) status.textContent = !s.onlineChannelEnabled ? 'Đang tạm đóng' : s.onlineOrders.length ? `${s.onlineOrders.length} shipper đang chờ` : s.onlineListings.length ? `${s.onlineListings.length} mẫu đang bán` : 'Chưa đăng hàng';
      const badge = onlineButton.querySelector<HTMLElement>('#online-fab-badge');
      if (badge) {
        const onlineNoticeCount = s.onlineOrders.length + s.regularOnlineOrders.filter(order => !order.packed).length;
        badge.hidden = onlineNoticeCount === 0;
        badge.textContent = String(onlineNoticeCount);
      }
    }
    const debugButton = document.querySelector<HTMLElement>('#debug-button');
    if (debugButton) debugButton.hidden = !SHOW_DEBUG_BUTTON || this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || isOpen;
    const landButton = document.querySelector<HTMLButtonElement>('#land-expand-button');
    if (landButton) {
      const expansion = nextLandExpansion(s);
      landButton.hidden = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || isOpen;
      landButton.disabled = !expansion;
      landButton.classList.toggle('is-unaffordable', !!expansion && s.money < expansion.cost);
      const status = landButton.querySelector<HTMLElement>('#land-expand-status');
      if (status) status.textContent = expansion
        ? `Cấp ${(s.landLevel ?? 0) + 2} · ${money(expansion.cost)}`
        : 'Đã đạt cấp tối đa';
    }

    const upgradeBtn = document.querySelector<HTMLElement>('[data-action="upgrade-open"]');
    if (upgradeBtn) {
      (upgradeBtn as HTMLButtonElement).disabled = isOpen;
      upgradeBtn.classList.toggle('is-disabled-during-sale', isOpen);
      upgradeBtn.setAttribute('title', isOpen ? 'Đang đón khách - tập trung bán hàng' : 'Nâng cấp boutique');
    }

    const next = levels[s.level];
    const sideUpgrade = document.querySelector('#sidebar-upgrade');
    if (sideUpgrade) sideUpgrade.innerHTML = `<div class="upgrade-card"><span class="upgrade-spark">${icon('crown')}</span><span class="eyebrow">LITTLE STEPS, BIG DREAMS</span><h3>${levels[s.level - 1].label}</h3><div class="level-progress"><span>Cấp ${s.level}</span><span>${next ? `${s.xp} / ${next.xp} XP` : 'Cấp tối đa'}</span></div><div class="progress-track"><span style="width:${next ? Math.min(100, s.xp / next.xp * 100) : 100}%"></span></div><button data-action="upgrade-open">${next ? 'Nâng cấp boutique' : 'Hành trình của bạn'} ${icon('arrow')}</button></div>`;
    const saveStatus = document.querySelector('#save-status');
    if (saveStatus) saveStatus.textContent = this.store.save.available ? 'Tiến trình được tự động lưu' : 'Không thể lưu trên trình duyệt này';
    this.renderDock();
    this.renderCustomer();
    this.renderRail();
    this.renderPanel();
    this.queueTutorialCue();
    this.renderMoveToolbar();
  }
  private renderCustomer() {
    const card = document.querySelector<HTMLElement>('#customer-card');
    if (!card) return;
    if (this.moveMode || this.tab !== 'shop') {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const s = this.store.state, c = activeCustomer(s);
    const financeAlert = s.rentDue > 0 || (s.loan?.paymentDue ?? 0) > 0 || s.employees.some(employee => (employee.unpaidWages ?? 0) > 0);
    let html = '';
    if (s.phase === 'preparation') {
      html = `<div class="welcome-card preparation-welcome ${this.welcomeCollapsed ? 'is-collapsed' : ''}">
        <button class="welcome-toggle" data-action="welcome-toggle" aria-expanded="${!this.welcomeCollapsed}" aria-controls="welcome-details" aria-label="${this.welcomeCollapsed ? 'Mở phần chuẩn bị bán hàng' : 'Thu gọn phần chuẩn bị bán hàng'}">
          ${icon(this.welcomeCollapsed ? 'shop' : 'minus')}<span>${this.welcomeCollapsed ? 'Chuẩn bị bán hàng' : 'Thu gọn'}</span>${this.welcomeCollapsed ? icon('plus') : ''}
        </button>
        <div id="welcome-details" ${this.welcomeCollapsed ? 'hidden' : ''}>
          <div class="welcome-text"><span class="eyebrow">${s.day === 1 ? 'YOUR STORY STARTS HERE' : 'A FRESH LITTLE START'}</span><h3>${s.day === 1 ? 'Khởi đầu boutique của riêng bạn' : 'Mở cửa đón những điều dễ thương?'}</h3><p>${s.day === 1 ? 'Bạn bắt đầu với 500.000₫ và kho trống. Hãy nhập hàng, trưng sản phẩm rồi mở cửa; có thể vay thêm vốn nếu cần.' : currentEvent(s).description}</p></div><div class="welcome-actions"><button class="btn btn-secondary finance-entry-btn ${financeAlert ? 'has-finance-alert' : ''}" data-action="finance-open">Tài chính</button><button class="btn btn-primary open-shop-hud-button" data-action="open">${icon('hudOpen')}<span>Mở cửa</span></button></div>
        </div>
      </div>`;
    } else if (c) {
      card.hidden = true;
      const announcement = `Khách ${c.name}. ${c.goal}`;
      if (announcement !== this.lastAnnouncement) { document.querySelector('#announcer')!.textContent = announcement; this.lastAnnouncement = announcement; }
    } else if (s.phase === 'open') {
      card.hidden = true;
    } else {
      card.hidden = true;
    }
    card.innerHTML = html;
  }
  private renderRail() {
    const s = this.store.state, trend = currentTrend(s);
    const quest = (id: string, label: string, count: number, max: number, ico: string) => {
      const claimed = s.claimed.includes(`${s.day}:${id}`);
      return `<div class="quest"><span class="quest-icon">${icon(ico)}</span><div><strong>${label}</strong><span>${claimed ? 'Đã nhận thưởng' : '+35k₫ · +10 XP'}</span><div class="progress-track"><span style="width:${Math.min(100, count / max * 100)}%"></span></div></div>${count >= max && !claimed ? `<button class="claim-button" data-action="claim" data-id="${id}" aria-label="Nhận thưởng ${label}">${icon('gift')}</button>` : `<span class="quest-count">${claimed ? icon('check') : `${Math.min(max, count)}/${max}`}</span>`}</div>`;
    };
    document.querySelector('#right-rail')!.innerHTML = `<div class="rail-trend"><div class="rail-card-heading"><span>${icon('trend')} XU HƯỚNG HÔM NAY</span></div><div class="trend-preview">${productImage(products[(s.day - 1) % 4])}<span class="trend-preview-note">so dreamy!</span></div><h3>${trend.name}</h3><p>${trend.subtitle}</p><div class="tag-list">${trend.tags.slice(0, 2).map(t => `<span>${t}</span>`).join('')}</div><button data-action="nav" data-id="trend">Khám phá xu hướng ${icon('arrow')}</button></div>
    <div class="rail-card goals-card"><div class="rail-card-heading"><h3>Mục tiêu nhỏ xinh</h3>${icon('gift')}</div><p>Những bước nhỏ, niềm vui lớn.</p>${quest('sales', 'Bán 3 món đồ', s.stats.sold, 3, 'bag')}${quest('trend', 'Bán 2 món hợp trend', s.stats.trendSales, 2, 'trend')}</div>
    <div class="rail-card today-card"><div class="rail-card-heading"><h3>Nhật ký hôm nay</h3>${icon('sun')}</div><div class="daily-revenue"><span>Doanh thu</span><strong>${money(s.stats.revenue)}</strong></div><div class="today-stats"><div>${icon('users')}<span>Khách đã đón</span><strong>${s.stats.served}</strong></div><div>${icon('heart')}<span>Khách hài lòng</span><strong>${s.stats.happy}</strong></div><div>${icon('bag')}<span>Món đã bán</span><strong>${s.stats.sold}</strong></div></div><div class="daily-note">${s.phase === 'preparation' ? 'Psst… outfit hợp gu sẽ khiến khách nhớ bạn lâu hơn' : s.phase === 'closed' ? 'Bạn đã chăm chút cho shop thật tốt hôm nay' : 'Đừng quên dành một nụ cười cho mỗi vị khách'}</div></div>
    <button class="mobile-upgrade btn btn-secondary" data-action="upgrade-open">${icon('shop')} Nâng cấp · Cấp ${s.level} ${icon('arrow')}</button>`;
  }
  private renderPanel() {
    const panel = document.querySelector<HTMLElement>('#content-panel')!;
    const panelScrollTop = panel.scrollTop;
    const horizontalRail = panel.querySelector<HTMLElement>('.import-horizontal-rail, .lookbook-grid, .inventory-horizontal-rail');
    const horizontalRailScrollLeft = horizontalRail?.scrollLeft ?? 0;
    const craftMaterialGrid = panel.querySelector<HTMLElement>('.craft-material-grid');
    const craftMaterialScrollTop = craftMaterialGrid?.scrollTop ?? 0;
    panel.onscroll = null;
    let contentHtml = '';
    try {
    if (this.tab === 'stock') {
      contentHtml = inventoryPanel(this.store.state, this.filter, this.inventoryMode);
    } else if (this.tab === 'import') {
      contentHtml = this.importSourceSelected
        ? importPanel(
            this.store.state,
            this.importMode === 'looks' ? this.lookFilters : this.importFilters,
            this.productImportQtys,
            this.importMode,
            this.lookQtys,
            this.materialQtys
          )
        : supplierSelectionPanel(this.store.state);
    } else if (this.tab === 'looks') {
      contentHtml = importPanel(this.store.state, this.importFilters, this.productImportQtys, 'looks', this.lookQtys, this.materialQtys);
    } else if (this.tab === 'trend') {
      contentHtml = trendPanel(this.store.state, this.trendSection);
    } else if (this.tab === 'social') {
      try {
        contentHtml = socialPanel(this.store.state, this.socialSection);
      } catch (error) {
        console.error('Recovered an invalid Boutique Buzz feed', error);
        const safeState = {
          ...this.store.state,
          posts: (Array.isArray(this.store.state.posts) ? this.store.state.posts : []).filter(post =>
            !!post && typeof post === 'object' && typeof post.id === 'string'
            && typeof post.name === 'string' && typeof post.handle === 'string'
            && typeof post.text === 'string' && typeof post.color === 'string'
            && Number.isFinite(post.day) && Number.isFinite(post.reviewStars)
          ),
          dramas: (Array.isArray(this.store.state.dramas) ? this.store.state.dramas : []).filter(drama =>
            !!drama && typeof drama === 'object' && typeof drama.id === 'string'
            && typeof drama.title === 'string' && typeof drama.post === 'string'
            && typeof drama.authorName === 'string' && typeof drama.authorHandle === 'string'
            && Array.isArray(drama.comments) && Array.isArray(drama.choices)
          ),
          staffApplicants: Array.isArray(this.store.state.staffApplicants) ? this.store.state.staffApplicants : [],
        };
        try {
          contentHtml = socialPanel(safeState, this.socialSection);
        } catch (fallbackError) {
          console.error('Could not render Boutique Buzz fallback', fallbackError);
          this.toast('Bảng tin vừa bỏ qua một bài bị lỗi dữ liệu.', 'error');
          contentHtml = `<section class="social-drawer-panel"><header class="social-drawer-header"><strong>Bảng tin</strong></header><div class="social-drawer-content"><div class="social-drawer-state social-drawer-empty">${icon('social')}<strong>Đã chặn dữ liệu bài viết bị lỗi</strong><span>Tiến trình game vẫn được giữ nguyên. Hãy đóng rồi mở lại Bảng tin.</span></div></div><button class="social-drawer-handle" data-action="nav" data-id="shop" aria-label="Đóng bảng tin" title="Đóng">${icon('arrow')}</button></section>`;
        }
      }
    } else if (this.tab === 'decor') {
      contentHtml = decorCatalog(this.store.state, this.decorCategory);
    } else if (this.tab === 'atelier') {
      contentHtml = atelierPanel(this.store.state, this.atelierSection, this.atelierSelection, this.atelierStyle, this.atelierBatchQtys, this.atelierHistoryOpen);
    }
    } catch (error) {
      console.error(`Could not render panel: ${this.tab}`, error);
      contentHtml = `<section class="panel-render-error"><strong>Kh\u00f4ng th\u1ec3 m\u1edf m\u1ee5c n\u00e0y</strong><p>Game v\u1eabn an to\u00e0n. H\u00e3y quay l\u1ea1i c\u1eeda h\u00e0ng v\u00e0 th\u1eed l\u1ea1i.</p><button class="btn btn-primary" data-action="nav" data-id="shop">Quay l\u1ea1i c\u1eeda h\u00e0ng</button></section>`;
    }
    if (contentHtml) {
      const socialBackdrop = this.tab === 'social'
        ? '<button type="button" class="social-drawer-backdrop" data-action="nav" data-id="shop" aria-label="Đóng bảng tin"></button>'
        : '';
      panel.innerHTML = `${socialBackdrop}<div class="game-panel-body${this.tab === 'social' ? ' social-profile-page' : ''}">${contentHtml}</div>`;
      const restorePanelScroll = () => {
        panel.scrollTop = panelScrollTop;
        const rail = panel.querySelector<HTMLElement>('.import-horizontal-rail, .lookbook-grid, .inventory-horizontal-rail');
        if (rail) rail.scrollLeft = horizontalRailScrollLeft;
        const nextCraftMaterialGrid = panel.querySelector<HTMLElement>('.craft-material-grid');
        if (nextCraftMaterialGrid) nextCraftMaterialGrid.scrollTop = craftMaterialScrollTop;
      };
      restorePanelScroll();
      requestAnimationFrame(() => {
        restorePanelScroll();
        requestAnimationFrame(restorePanelScroll);
      });
      if (this.tab === 'social' && this.socialSection === 'feed') this.bindReviewSummarySticky(panel);
    } else {
      panel.innerHTML = '';
    }
  }
  private bindReviewSummarySticky(panel: HTMLElement) {
    const scroller = panel.querySelector<HTMLElement>('.social-drawer-content');
    const summary = panel.querySelector<HTMLElement>('.drawer-review-summary');
    if (!scroller || !summary) return;
    let frame = 0;
    let stuck = false;
    const update = () => {
      frame = 0;
      if (!stuck && scroller.scrollTop >= 12) stuck = true;
      else if (stuck && scroller.scrollTop <= 4) stuck = false;
      summary.classList.toggle('is-stuck', stuck);
    };
    scroller.addEventListener('scroll', () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }
  private updatePatience() {
    const s = this.store.state;
    const visit = this.modal === 'serve' && this.serveVisitId
      ? s.activeVisits.find(candidate => candidate.uid === this.serveVisitId)
      : activeVisit(s);
    const c = visit ? lookupCustomer(visit.customerId) : activeCustomer(s);
    const urgentConsultation = this.modal === 'serve' && visit?.uid === this.serveVisitId && visit.patience <= 10;
    this.dialog.classList.toggle('is-patience-urgent', urgentConsultation);
    const label = document.querySelector('#patience-label'); if (label) label.textContent = `${s.patience}s`;
    const bar = document.querySelector<HTMLElement>('#patience-bar'); if (bar && c) bar.style.width = `${visit ? visit.patience / visit.maxPatience * 100 : 0}%`;
    const modal = document.querySelector<HTMLElement>('#modal-patience');
    if (modal) {
      const remainingPatience = visit?.patience ?? s.patience;
      modal.innerHTML = `${icon('clock')} <strong>${remainingPatience}s</strong>`;
    }
    document.querySelectorAll<HTMLElement>('.sale-card-countdown[data-visit]').forEach(countdown => {
      const visit = s.activeVisits.find(item => item.uid === countdown.dataset.visit);
      if (!visit) return;
      const value = countdown.querySelector<HTMLElement>('span');
      if (value) value.textContent = String(visit.patience);
      countdown.classList.toggle('is-urgent', visit.patience <= 10);
    });

    if (s.phase === 'open') {
      const timerVal = s.dayTimer ?? DAY_DURATION;
      const timerEl = document.querySelector('#day-timer-label');
      if (timerEl) timerEl.textContent = saleClockLabel(timerVal, dayDuration(s));
      document.querySelector('#sale-shift-timer')?.classList.toggle('is-urgent', timerVal <= 15);
    }
  }
  selectFurniture(uid?: string) { this.selectedFurniture = uid; this.renderMoveToolbar(); }
  private handleMoveMode(active: boolean, uid?: string) {
    this.moveMode = active;
    this.selectedFurniture = uid;
    document.querySelector<HTMLElement>('.game-viewport')?.classList.toggle('is-move-mode', active);
    document.querySelector<HTMLElement>('#toasts')?.classList.toggle('is-move-mode', active);
    this.renderMoveToolbar();
    this.updateDockVisibility();
    this.renderCustomer();
  }
  private renderMoveToolbar() {
    const el = document.querySelector<HTMLElement>('#move-toolbar');
    if (!el) return;
    const selectionVisible = !!this.selectedFurniture && this.tab === 'shop' && this.modal === 'none';
    const toasts = document.querySelector<HTMLElement>('#toasts');
    toasts?.classList.toggle('is-selection-active', selectionVisible);
    if (selectionVisible) toasts?.replaceChildren();
    if (!selectionVisible) {
      el.hidden = true;
      el.innerHTML = '';
      el.classList.remove('is-selection-toolbar');
      return;
    }
    el.hidden = false;
    const s = this.store.state;
    const sel = s.layout.find(f => f.uid === this.selectedFurniture);
    const data = sel ? furniture.find(f => f.id === sel.id) : null;
    el.classList.add('is-selection-toolbar');
    el.innerHTML = `
      ${this.moveMode ? '' : `<button class="selection-move-fab" data-action="move-start" title="Di chuyển đồ vật" aria-label="Di chuyển"><span>${icon('hudMove')}</span><strong>Di chuyển</strong></button>`}
      <strong class="selection-item-meta move-item-name">
        ${sel?.customName || (data ? data.name : 'Đồ vật')}
        ${data?.display?.upgrade ? `<span class="move-item-badge">Cấp ${data && sel ? displayLevel(data, sel) + 1 : 1}</span>` : ''}
      </strong>
      <nav class="move-toolbar-actions selection-toolbar-actions" aria-label="Thao tác với đồ vật">
        ${this.moveMode ? '' : data?.id === 'shop-sign'
          ? `<button class="move-tool-btn open-btn" data-action="name-shop" title="Đổi tên trên biển hiệu" aria-label="Đổi tên shop"><span class="tool-btn-icon">${icon('hudFixtureRename')}</span><span class="tool-btn-text">Đổi tên</span></button>`
          : data?.id === 'vinyl-player'
            ? `<button class="move-tool-btn open-btn music-player-open-btn" data-action="music-player-open" title="Mở máy nghe nhạc" aria-label="Mở máy nghe nhạc"><span class="tool-btn-icon">${icon('volume')}</span><span class="tool-btn-text">Mở nhạc</span></button>`
          : data?.display
            ? `<button class="move-tool-btn open-btn" data-action="display-open" title="Mở khu trưng bày" aria-label="Mở"><span class="tool-btn-icon">${icon('hudFixtureOpen')}</span><span class="tool-btn-text">Mở</span></button>`
            : ''}
        <button class="move-tool-btn store-btn" data-action="move-store" title="Cất đồ vào kho" aria-label="Cất"><span class="tool-btn-icon">${icon('hudFixtureStore')}</span><span class="tool-btn-text">Cất</span></button>
        ${!this.moveMode && data?.display?.upgrade ? `<button class="move-tool-btn upgrade-btn" data-action="display-upgrade" data-fixture="${sel?.uid ?? ''}" title="Nâng cấp khu trưng bày" aria-label="Nâng cấp"><span class="tool-btn-icon">${icon('hudFixtureUpgrade')}</span><span class="tool-btn-text">Nâng cấp</span></button>` : ''}
        ${this.moveMode
          ? `<button class="move-tool-btn rotate-btn" data-action="move-rotate" title="Xoay đồ vật" aria-label="Xoay đồ vật"><span class="tool-btn-icon">${icon('hudFixtureRotate')}</span><span class="tool-btn-text">Xoay</span></button><button class="move-tool-btn sell-btn" data-action="move-sell" title="Bán đồ và nhận lại 50% giá mua" aria-label="Bán đồ"><span class="tool-btn-icon">${icon('trash')}</span><span class="tool-btn-text">Bán</span></button><button class="move-tool-btn done-btn" data-action="move-done" title="Hoàn tất sắp xếp" aria-label="Xong"><span class="tool-btn-icon">${icon('check')}</span><span class="tool-btn-text">Xong</span></button>`
          : `<button class="move-tool-btn info-btn" data-action="fixture-info" data-id="${sel?.uid ?? ''}" title="Xem thông tin đồ vật" aria-label="Thông tin"><span class="tool-btn-icon">${icon('hudFixtureInfo')}</span><span class="tool-btn-text">Thông tin</span></button>`}
      </nav>
    `;
  }
  private moveSelected(dx: number, dy: number) { const f = this.store.state.layout.find(f => f.uid === this.selectedFurniture); if (f) this.store.moveFurniture(f.uid, f.x + dx, f.y + dy); }
  private openDisplayFixture(uid: string) {
    const html = displayFixtureModal(this.store.state, uid);
    if (html) {
      this.openModal('display', html);
    }
  }
  private openDisplayUpgradeConfirmation(uid: string) {
    const placed = this.store.state.layout.find(item => item.uid === uid);
    const fixture = placed && furniture.find(item => item.id === placed.id);
    if (!placed || !fixture?.display?.upgrade) return;
    const cost = displayUpgradeCost(fixture, placed);
    if (cost === undefined) return;
    const currentLevel = displayLevel(fixture, placed);
    const currentCapacity = displayCapacity(fixture, placed);
    const nextCapacity = currentCapacity + fixture.display.upgrade.slotsPerLevel;
    this.pendingDisplayUpgradeUid = uid;
    this.openModal('display-upgrade-confirm', `<div class="app-info-modal display-upgrade-modal">
      <header class="app-modal-header"><span class="app-header-chip">${icon('coin')} ${money(this.store.state.money)}</span><div><small>NÂNG CẤP TRƯNG BÀY</small><h2>${escapeHtml(placed.customName || fixture.name)}</h2></div><button class="staff-modal-close" data-action="display-upgrade-cancel" aria-label="Quay lại shop">${icon('close')}</button></header>
      <section class="fixture-details-hero"><div class="fixture-details-art">${furnitureImage(fixture)}</div><div><span class="eyebrow">CẤP ${currentLevel} → ${currentLevel + 1}</span><h3>Mở rộng sức chứa trưng bày</h3><p>Thêm ${fixture.display.upgrade.slotsPerLevel} vị trí để bày nhiều sản phẩm hơn trên cùng thiết bị.</p></div></section>
      <div class="upgrade-capacity-comparison"><span><small>Hiện tại</small><b>${currentCapacity}</b><em>slot</em></span>${icon('arrow')}<span class="is-next"><small>Sau nâng cấp</small><b>${nextCapacity}</b><em>slot</em></span></div>
      <div class="app-cost-row"><span><small>Chi phí nâng cấp</small><strong>${money(cost)}</strong></span><em class="${this.store.state.money >= cost ? 'is-ready' : 'is-short'}">${this.store.state.money >= cost ? 'Đủ tiền' : `Thiếu ${money(cost - this.store.state.money)}`}</em></div>
      <footer class="app-modal-actions is-split"><button class="btn btn-secondary" data-action="display-upgrade-cancel">${icon('arrow')} Quay lại</button><button class="btn btn-primary" data-action="display-upgrade-confirmed" ${this.store.state.money < cost ? 'disabled' : ''}>${icon('check')} Xác nhận nâng cấp</button></footer>
    </div>`);
  }
  private openLandExpansionConfirmation() {
    const next = nextLandExpansion(this.store.state);
    if (!next) { this.store.expandLand(); return; }
    const currentSize = landSize(this.store.state);
    const currentLand = landExpansion[landTier(this.store.state)];
    const trafficIncrease = Math.max(0, next.traffic - currentLand.traffic);
    const currentDailyRent = dailyRent(this.store.state);
    const nextDailyRent = currentDailyRent - currentLand.rent + next.rent;
    this.openModal('land-expand-confirm', `<div class="app-info-modal land-upgrade-modal">
      <header class="app-modal-header"><span class="app-header-chip">${icon('coin')} ${money(this.store.state.money)}</span><div><small>NÂNG CẤP MẶT BẰNG</small><h2>Mở rộng boutique</h2></div><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></header>
      <section class="land-upgrade-hero"><span>${icon('expand')}</span><div><small>KHÔNG GIAN MỚI</small><h3>${next.size} × ${next.size} ô</h3><p>Có thêm diện tích bày đồ, trang trí và đón nhiều khách hơn.</p></div></section>
      <div class="upgrade-capacity-comparison land-size-comparison"><span><small>Hiện tại</small><b>${currentSize} × ${currentSize}</b><em>ô</em></span>${icon('arrow')}<span class="is-next"><small>Sau mở rộng</small><b>${next.size} × ${next.size}</b><em>ô</em></span></div>
      <div class="app-stat-grid land-upgrade-stats"><span>${icon('users')}<small>Lưu lượng tăng</small><b>+${trafficIncrease}</b></span><span>${icon('shop')}<small>Tổng thuê mới</small><b>${compactMoney(nextDailyRent)}/ngày</b></span><span>${icon('expand')}<small>Diện tích tăng</small><b>+${next.size * next.size - currentSize * currentSize} ô</b></span></div>
      <div class="app-cost-row"><span><small>Chi phí mở rộng</small><strong>${money(next.cost)}</strong></span><em class="${this.store.state.money >= next.cost ? 'is-ready' : 'is-short'}">${this.store.state.money >= next.cost ? 'Đủ tiền' : `Thiếu ${money(next.cost - this.store.state.money)}`}</em></div>
      <footer class="app-modal-actions is-split"><button class="btn btn-secondary" data-action="close-modal">Để sau</button><button class="btn btn-primary" data-action="expand-land-confirmed" ${this.store.state.money < next.cost ? 'disabled' : ''}>${icon('check')} Mở rộng mặt bằng</button></footer>
    </div>`);
  }
  private refreshDisplayFixture(uid: string) {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const stockScroll = inner.querySelector<HTMLElement>('.fixture-stock-grid')?.scrollTop ?? 0;
    const displayScroll = inner.querySelector<HTMLElement>('.fixture-display-groups')?.scrollTop ?? 0;
    const html = displayFixtureModal(this.store.state, uid);
    if (!html) { this.closeModal(); return; }
    inner.innerHTML = html;
    const restoreScroll = () => {
      const stock = inner.querySelector<HTMLElement>('.fixture-stock-grid');
      const display = inner.querySelector<HTMLElement>('.fixture-display-groups');
      if (stock) stock.scrollTop = stockScroll;
      if (display) display.scrollTop = displayScroll;
    };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
  private resetSaleSpeed() {
    if (this.saleSpeed === 1) return;
    this.saleSpeed = 1;
    this.saleTickProgress = 0;
    this.scene?.setSaleSpeed(1);
    const speedButton = document.querySelector<HTMLButtonElement>('[data-action="sale-speed"]');
    if (!speedButton) return;
    speedButton.dataset.speed = '1';
    speedButton.setAttribute('aria-label', 'Tốc độ bán hàng 1x');
    const speedValue = speedButton.querySelector<HTMLElement>('.speed-val');
    if (speedValue) speedValue.textContent = '1x';
  }
  private isSaleSpeedLocked() {
    return this.store.state.phase === 'open'
      && Math.max(0, this.store.state.dayTimer - this.saleTickProgress) <= 10;
  }
  openServe() {
    const customer = activeCustomer(this.store.state);
    const visit = activeVisit(this.store.state);
    if (!customer || !visit) return;
    if (visit.stage === 'checkout') { this.openCheckout(visit.uid); return; }
    if (!customerNeedsAdvice(this.store.state, customer)) return;
    this.resetSaleSpeed();
    this.serveVisitId = visit.uid;
    this.selected = [];
    this.outfitCategory = 'all';
    this.openModal('serve', this.serveModalMarkup());
    this.updatePatience();
  }
  private openCheckout(visitUid: string) {
    const visit = this.store.state.activeVisits.find(item => item.uid === visitUid && item.stage === 'checkout');
    if (!visit) return;
    this.resetSaleSpeed();
    const paymentMethod = this.store.checkoutPaymentMethod(visitUid);
    if (!paymentMethod) return;
    if (paymentMethod === 'cash') this.store.checkoutTender(visitUid);
    const pendingTransferEndsAt = paymentMethod === 'transfer'
      && this.checkoutVisitId === visit.uid
      && this.checkoutStage === 'transfer'
      ? this.checkoutTransferEndsAt
      : 0;
    this.checkoutVisitId = visit.uid;
    this.checkoutStage = paymentMethod;
    this.checkoutChange = {};
    this.checkoutTransferEndsAt = paymentMethod === 'transfer'
      ? pendingTransferEndsAt || Date.now() + (3 + (visit.customerId.length % 5)) * 1000
      : 0;
    this.checkoutCardProcessingEndsAt = 0;
    this.checkoutCompleting = false;
    this.openModal('checkout', checkoutModal(this.store.state, visit, this.checkoutStage, this.checkoutChange));
    this.dialog.classList.toggle('is-transfer-lock', this.checkoutStage === 'transfer');
    this.dialog.classList.toggle('is-card-workspace', this.checkoutStage === 'card');
    this.updatePatience();
  }
  private refreshCheckout() {
    if (this.modal !== 'checkout') return;
    const visit = this.store.state.activeVisits.find(item => item.uid === this.checkoutVisitId && item.stage === 'checkout');
    if (!visit) { this.closeModal(); return; }
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (inner) inner.innerHTML = checkoutModal(this.store.state, visit, this.checkoutStage, this.checkoutChange);
    this.dialog.classList.toggle('is-transfer-lock', this.checkoutStage === 'transfer');
    this.dialog.classList.toggle('is-card-workspace', this.checkoutStage === 'card');
  }
  private finishCheckout(method: 'cash' | 'transfer' | 'card') {
    const result = this.store.completeSelfCheckout(this.checkoutVisitId, method, method === 'cash' ? this.checkoutChange : undefined);
    if (!result.ok) {
      this.checkoutCompleting = false;
      this.toast(result.message ?? 'Không thể hoàn tất thanh toán.', 'error');
      if (method === 'transfer' && this.modal !== 'checkout') this.clearCheckoutSession();
      return;
    }
    if (method === 'transfer' && this.modal !== 'checkout') this.clearCheckoutSession();
  }
  private updateCheckoutPayment() {
    const transferRunsInBackground = this.modal !== 'checkout' && this.hasPendingTransferCheckout();
    if (this.modal !== 'checkout' && !transferRunsInBackground) return;
    const visit = this.store.state.activeVisits.find(item => item.uid === this.checkoutVisitId);
    if (!visit) {
      if (this.modal === 'checkout') this.closeModal();
      else this.clearCheckoutSession();
      return;
    }
    if (this.checkoutStage === 'card' && this.checkoutCardProcessingEndsAt && !this.checkoutCompleting) {
      const remaining = Math.max(0, Math.ceil((this.checkoutCardProcessingEndsAt - Date.now()) / 1000));
      const label = this.dialog.querySelector<HTMLElement>('#checkout-card-status');
      if (label) label.textContent = remaining ? `Đang xử lý · ${remaining}s` : 'Đã chấp nhận thẻ';
      if (!remaining) { this.checkoutCompleting = true; this.finishCheckout('card'); }
      return;
    }
    if (this.checkoutStage !== 'transfer' || !this.checkoutTransferEndsAt || this.checkoutCompleting) return;
    const remaining = Math.max(0, Math.ceil((this.checkoutTransferEndsAt - Date.now()) / 1000));
    const label = this.dialog.querySelector<HTMLElement>('#checkout-transfer-countdown');
    if (label) label.textContent = remaining ? String(remaining) : '✓';
    if (!remaining) { this.checkoutCompleting = true; this.finishCheckout('transfer'); }
  }
  private hasPendingTransferCheckout() {
    return this.checkoutStage === 'transfer' && !!this.checkoutVisitId && this.checkoutTransferEndsAt > 0;
  }
  private clearCheckoutSession() {
    this.checkoutVisitId = '';
    this.checkoutTransferEndsAt = 0;
    this.checkoutCardProcessingEndsAt = 0;
    this.checkoutCompleting = false;
  }
  private serveModalMarkup() {
    const visit = this.store.state.activeVisits.find(candidate => candidate.uid === this.serveVisitId)
      ?? activeVisit(this.store.state);
    const customer = activeCustomer(this.store.state);
    const visualCustomer = customer && visit
      ? this.scene?.customerVisualForVisit(customer, visit.uid)
      : undefined;
    return serveModal(this.store.state, this.selected, this.outfitCategory, visualCustomer);
  }
  private refreshServeSelection() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    const grid = inner?.querySelector<HTMLElement>('.outfit-grid');
    if (!inner || !grid) return;
    const scrollTop = grid.scrollTop;

    // Keep the wardrobe nodes mounted. Rebuilding the whole modal causes all
    // product images to disappear for a frame and makes the bottom of the
    // scroll list flash on mobile browsers.
    const template = document.createElement('template');
    template.innerHTML = this.serveModalMarkup();
    const nextRoot = template.content;
    for (const selector of ['.fitting-outfit-slots', '.studio-checkout-dock']) {
      const current = inner.querySelector<HTMLElement>(selector);
      const next = nextRoot.querySelector<HTMLElement>(selector);
      if (current && next) current.replaceWith(next.cloneNode(true));
    }

    grid.querySelectorAll<HTMLButtonElement>('.outfit-option[data-id]').forEach(option => {
      const id = option.dataset.id;
      const next = id
        ? [...nextRoot.querySelectorAll<HTMLButtonElement>('.outfit-option[data-id]')].find(candidate => candidate.dataset.id === id)
        : undefined;
      if (!next) return;
      option.className = next.className;
      option.setAttribute('aria-pressed', next.getAttribute('aria-pressed') ?? 'false');
      option.setAttribute('aria-label', next.getAttribute('aria-label') ?? '');
      const currentCheck = option.querySelector<HTMLElement>('.outfit-check');
      const nextCheck = next.querySelector<HTMLElement>('.outfit-check');
      if (currentCheck && nextCheck) {
        currentCheck.className = nextCheck.className;
        currentCheck.innerHTML = nextCheck.innerHTML;
      }
    });

    const restoreScroll = () => { grid.scrollTop = scrollTop; };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
  private ensureServeVisitFocused() {
    if (this.modal !== 'serve' || !this.serveVisitId) return false;
    const visit = this.store.state.activeVisits.find(candidate => candidate.uid === this.serveVisitId);
    if (!visit) {
      this.closeModal();
      return false;
    }
    if (this.store.state.currentVisitId !== visit.uid) this.store.focusCustomer(visit.uid);
    return true;
  }
  private rememberOnlineDashboardScroll() {
    this.onlineDashboardScroll = {
      dashboardTop: this.dialog.querySelector<HTMLElement>('.online-dashboard')?.scrollTop ?? 0,
      regularOrdersTop: this.dialog.querySelector<HTMLElement>('.regular-orders-list')?.scrollTop ?? 0,
    };
  }
  private restoreOnlineDashboardScroll() {
    const restore = () => {
      const dashboard = this.dialog.querySelector<HTMLElement>('.online-dashboard');
      const orders = this.dialog.querySelector<HTMLElement>('.regular-orders-list');
      if (dashboard) dashboard.scrollTop = this.onlineDashboardScroll.dashboardTop;
      if (orders) orders.scrollTop = this.onlineDashboardScroll.regularOrdersTop;
    };
    restore();
    requestAnimationFrame(restore);
  }
  private returnToOnlineDashboard() {
    this.openModal('online', onlineChannelModal(this.store.state), false);
    this.restoreOnlineDashboardScroll();
  }
  private refreshOnlineChannel() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const storefrontGrid = inner.querySelector<HTMLElement>('.storefront-product-grid');
    const dashboard = inner.querySelector<HTMLElement>('.online-dashboard');
    const storefrontScroll = { left: storefrontGrid?.scrollLeft ?? 0, top: storefrontGrid?.scrollTop ?? 0 };
    const dashboardScrollTop = dashboard?.scrollTop ?? 0;
    inner.innerHTML = onlineChannelModal(this.store.state);
    const restoreScroll = () => {
      const storefront = inner.querySelector<HTMLElement>('.storefront-product-grid');
      const nextDashboard = inner.querySelector<HTMLElement>('.online-dashboard');
      if (storefront) storefront.scrollTo(storefrontScroll.left, storefrontScroll.top);
      if (nextDashboard) nextDashboard.scrollTop = dashboardScrollTop;
    };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
  private refreshOnlineStock() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const list = inner.querySelector<HTMLElement>('.online-stock-grid');
    const scrollTop = list?.scrollTop ?? 0;
    const scrollLeft = list?.scrollLeft ?? 0;
    inner.innerHTML = onlineStockModal(this.store.state);
    const restoreScroll = () => {
      const nextList = inner.querySelector<HTMLElement>('.online-stock-grid');
      if (nextList) nextList.scrollTo(scrollLeft, scrollTop);
    };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
  private refreshLivestream() {
    if (this.modal !== 'livestream') return;
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const oldList = inner.querySelector<HTMLElement>('.livestream-pin-list');
    const productScroll = oldList?.scrollTop ?? 0;
    const oldRail = inner.querySelector<HTMLElement>('.livestream-product-grid');
    const railScrollLeft = oldRail?.scrollLeft ?? 0;
    const oldFeed = inner.querySelector<HTMLElement>('.livestream-feed');
    const feedScrollTop = oldFeed?.scrollTop ?? 0;
    const feedScrollHeight = oldFeed?.scrollHeight ?? 0;
    const followLatestComment = !oldFeed || feedScrollHeight - feedScrollTop - oldFeed.clientHeight < 24;
    const request = this.livestreamActiveRequest ?? (this.livestreamRound ? livestreamRequest(this.store.state, this.livestreamPoolIds, this.livestreamRound) : undefined);
    const pinnedChance = request && this.livestreamSelectedIds[0]
      ? this.store.previewLivestreamProduct(this.livestreamSelectedIds[0], request, this.livestreamDiscount, this.livestreamResponseAge()).conversionChance
      : 0;
    inner.innerHTML = livestreamModal(this.store.state, this.livestreamPoolIds, this.livestreamRound, this.livestreamSelectedIds, this.livestreamDiscount, this.livestreamResult, this.livestreamStats, this.livestreamRemaining, this.livestreamDuration, this.livestreamComments, request, pinnedChance);
    const nextList = inner.querySelector<HTMLElement>('.livestream-pin-list');
    if (nextList) nextList.scrollTop = productScroll;
    const restoreRailScroll = () => {
      const nextRail = inner.querySelector<HTMLElement>('.livestream-product-grid');
      if (nextRail) nextRail.scrollLeft = railScrollLeft;
    };
    const restoreFeedScroll = () => {
      const nextFeed = inner.querySelector<HTMLElement>('.livestream-feed');
      if (!nextFeed) return;
      nextFeed.scrollTop = followLatestComment
        ? nextFeed.scrollHeight
        : feedScrollTop;
    };
    restoreRailScroll();
    restoreFeedScroll();
    requestAnimationFrame(() => {
      restoreRailScroll();
      restoreFeedScroll();
    });
  }
  private updateLivestreamClock() {
    if (this.modal !== 'livestream' || this.livestreamRound < 1 || !this.livestreamEndsAt) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.livestreamEndsAt - now) / 1000));
    if (remaining !== this.livestreamRemaining) {
      this.livestreamRemaining = remaining;
      const clock = this.dialog.querySelector<HTMLElement>('.livestream-time strong');
      const progress = this.dialog.querySelector<HTMLElement>('.livestream-time-track b');
      if (clock) clock.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
      if (progress) progress.style.width = `${Math.max(0, Math.min(100, remaining / Math.max(1, this.livestreamDuration) * 100))}%`;
      this.syncLivestreamChance();
    }
    if (remaining) this.advanceLivestreamFeed(now);
    if (!remaining) {
      this.livestreamEndsAt = 0;
      this.livestreamResult = undefined;
      this.refreshLivestream();
      this.audio.play('reward');
    }
  }
  private initialLivestreamViewers() {
    const s = this.store.state;
    return Math.max(8, Math.round(s.followers * .04 + s.reputation * 7 + s.onlineRating * 5 + s.onlineReviews * 1.2));
  }
  private pushLivestreamComment(handle: string, text: string, kind: LivestreamComment['kind']) {
    this.livestreamCommentSequence++;
    this.livestreamComments.push({ id: `live-comment-${this.livestreamCommentSequence}`, handle, text, kind });
    if (this.livestreamComments.length > 40) this.livestreamComments.splice(0, this.livestreamComments.length - 40);
  }
  private syncLivestreamFeed() {
    const feed = this.dialog.querySelector<HTMLElement>('.livestream-feed');
    if (feed) {
      const oldHeight = feed.scrollHeight;
      const oldTop = feed.scrollTop;
      const stickToLatest = oldHeight - oldTop - feed.clientHeight < 24;
      feed.innerHTML = this.livestreamComments.map(comment => `<div class="livestream-feed-comment is-${comment.kind}"><span>${escapeHtml(comment.handle.replace('@', '').charAt(0).toUpperCase() || '?')}</span><p><strong>${escapeHtml(comment.handle)}</strong> ${escapeHtml(comment.text)}</p></div>`).join('');
      feed.scrollTop = stickToLatest ? feed.scrollHeight : oldTop;
    }
    const heading = this.dialog.querySelector<HTMLElement>('.livestream-studio-header h2');
    if (heading) heading.textContent = `${compact(this.livestreamStats.viewers)} đang xem`;
    const vitalSpans = this.dialog.querySelectorAll<HTMLElement>('.livestream-vitals > span');
    if (vitalSpans[0]) vitalSpans[0].innerHTML = `${icon('heart')} ${compact(this.livestreamStats.likes)}`;
    if (vitalSpans[1]) vitalSpans[1].innerHTML = `${icon('bag')} ${this.livestreamStats.orders} đơn`;
    if (vitalSpans[2]) vitalSpans[2].textContent = `${this.livestreamStats.intents ? Math.round(this.livestreamStats.orders / this.livestreamStats.intents * 100) : 0}% chốt`;
    const viewerBadge = this.dialog.querySelector<HTMLElement>('.livestream-video-top b');
    if (viewerBadge) viewerBadge.innerHTML = `${icon('users')} ${compact(this.livestreamStats.viewers)}`;
  }
  private advanceLivestreamFeed(now: number) {
    if (!this.livestreamActiveRequest) return;
    if (!this.livestreamIntentResolved && this.livestreamSelectedIds.length && now - this.livestreamIntentStartedAt >= 2600) {
      this.resolveLivestreamIntent();
    }
    if (this.livestreamIntentResolved && this.livestreamNextIntentAt && now >= this.livestreamNextIntentAt) {
      this.livestreamRound++;
      this.livestreamActiveRequest = livestreamRequest(this.store.state, this.livestreamPoolIds, this.livestreamRound);
      this.livestreamIntentResolved = false;
      this.livestreamIntentStartedAt = now;
      this.livestreamNextIntentAt = 0;
      this.pushLivestreamComment(this.livestreamActiveRequest.handle, this.livestreamActiveRequest.question, 'intent');
      this.refreshLivestream();
      return;
    }
    if (now < this.livestreamNextCommentAt) return;
    const chatter = [
      ['@mit.uot', 'Chị chủ nay xinh quá trời'], ['@camcam', 'Em vào ngắm thôi chứ ví đang khóc'],
      ['@be.tho', 'Shop live tới mấy giờ vậy ạ'], ['@ngoc.daily', 'Ai mới vào thả tim cho shop đi'],
      ['@meomeo', 'Đèn live màu xinh ghê'], ['@tui.la.ai', 'Có ai vừa đi học về giống tui không'],
      ['@banhbao', 'Nói chuyện cuốn quá quên luôn giờ ngủ'], ['@linh.wears', 'Shop quay gần chất vải xem với'],
      ['@gau.bong', 'Xin vía hôm nay săn được đồ đẹp'], ['@an.nhien', 'Mạng em lag mà vẫn cố xem nè'],
    ];
    const filler = chatter[Math.floor(Math.random() * chatter.length)];
    this.pushLivestreamComment(filler[0], filler[1], 'chat');
    const pinned = products.find(product => product.id === this.livestreamSelectedIds[0]);
    const hotMomentum = pinned ? (isTrending(this.store.state, pinned) ? 2 : -1) : -2;
    const saleMomentum = Math.min(4, this.livestreamStats.orders) - (this.livestreamStats.intents > 1 && !this.livestreamStats.orders ? 2 : 0);
    const luck = currentEvent(this.store.state).extra > 0 ? 1 : 0;
    const randomSwing = Math.floor(Math.random() * 7) - 3;
    const viewerCeiling = Math.max(80, Math.round(this.store.state.followers * .4 + this.store.state.reputation * 22 + this.livestreamStats.orders * 45));
    this.livestreamStats.viewers = Math.max(3, Math.min(viewerCeiling, this.livestreamStats.viewers + hotMomentum + saleMomentum + luck + randomSwing));
    this.livestreamStats.peakViewers = Math.max(this.livestreamStats.peakViewers, this.livestreamStats.viewers);
    this.livestreamStats.likes += Math.max(1, Math.round(this.livestreamStats.viewers / 18));
    const baseDelay = Math.max(2200, Math.min(7200, 7800 - Math.log10(this.livestreamStats.viewers + 1) * 1750));
    this.livestreamNextCommentAt = now + baseDelay * (.78 + Math.random() * .65);
    this.syncLivestreamFeed();
  }
  private resolveLivestreamIntent() {
    if (this.livestreamIntentResolved || !this.livestreamActiveRequest || !this.livestreamSelectedIds[0]) return;
    this.livestreamIntentResolved = true;
    this.livestreamResult = this.store.resolveLivestreamRound([this.livestreamSelectedIds[0]], this.livestreamActiveRequest, this.livestreamDiscount, this.livestreamResponseAge());
    this.livestreamStats.intents++;
    this.livestreamStats.viewers = Math.max(3, this.livestreamStats.viewers + this.livestreamResult.viewersDelta);
    this.livestreamStats.peakViewers = Math.max(this.livestreamStats.peakViewers, this.livestreamStats.viewers);
    this.livestreamStats.likes += this.livestreamResult.likesGain;
    this.livestreamStats.followers += this.livestreamResult.followerGain;
    if (this.livestreamResult.orderCreated) {
      this.livestreamStats.orders++;
      this.livestreamStats.revenue += this.livestreamResult.total;
      this.pushLivestreamComment(this.livestreamActiveRequest.handle, 'Em chốt mẫu đang ghim nha shop!', 'sale');
      this.pushLivestreamComment('@hethong', 'Đã có khách đặt hàng thành công', 'system');
    } else {
      this.pushLivestreamComment(this.livestreamActiveRequest.handle, 'Để em suy nghĩ thêm nha shop.', 'chat');
    }
    const intentGap = Math.max(3200, 7000 - Math.min(3500, this.livestreamStats.viewers * 22));
    this.livestreamNextIntentAt = Date.now() + intentGap + Math.random() * 1800;
    this.livestreamNextCommentAt = Math.min(this.livestreamNextCommentAt, Date.now() + 700);
    if (this.livestreamResult.orderCreated) {
      // The order reserves its products immediately. Rebuild the live product
      // list now so its available quantity changes in the same frame as the
      // successful-sale sound instead of waiting for the next comment/intent.
      this.refreshLivestream();
      requestAnimationFrame(() => {
        if (this.modal === 'livestream') this.audio.play('payment');
      });
    } else {
      this.syncLivestreamFeed();
      this.audio.play('click');
    }
  }
  private livestreamResponseAge() {
    return this.livestreamIntentStartedAt ? Math.max(0, (Date.now() - this.livestreamIntentStartedAt) / 1000) : 0;
  }
  private syncLivestreamChance() {
    if (!this.livestreamActiveRequest || !this.livestreamSelectedIds[0] || this.livestreamIntentResolved) return;
    const chance = this.store.previewLivestreamProduct(this.livestreamSelectedIds[0], this.livestreamActiveRequest, this.livestreamDiscount, this.livestreamResponseAge()).conversionChance;
    const percent = Math.round(chance * 100);
    const pinLabel = this.dialog.querySelector<HTMLElement>('.livestream-video-pin small > b');
    const footerValue = this.dialog.querySelector<HTMLElement>('.livestream-pin-footer strong');
    if (pinLabel) pinLabel.textContent = `${percent}% chốt`;
    if (footerValue) footerValue.textContent = `${percent}%`;
  }
  private commitInventoryPrice(input: HTMLInputElement) {
    const productId = input.dataset.price ?? '';
    const rawPrice = input.value.trim();
    const digits = rawPrice.replace(/[^0-9]/g, '').slice(0, 9);
    const product = products.find(item => item.id === productId);
    if (!product || !digits) {
      if (product) input.value = (this.store.state.prices[productId] ?? product.sellPrice).toLocaleString('vi-VN');
      return false;
    }
    const price = Number(digits);
    const currentPrice = this.store.state.prices[productId] ?? product.sellPrice;
    input.value = price.toLocaleString('vi-VN');
    if (price === currentPrice) return true;
    return this.store.setPrice(productId, price);
  }
  private atelierCanvasPoint(canvas: HTMLElement, event: PointerEvent) {
    return this.atelierCanvasClientPoint(canvas, event.clientX, event.clientY);
  }
  private atelierCanvasClientPoint(canvas: HTMLElement, clientX: number, clientY: number) {
    const svg = canvas?.querySelector<SVGSVGElement>('svg');
    const matrix = svg?.getScreenCTM();
    if (matrix) {
      const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
      return {
        x: Math.max(0, Math.min(120, point.x)),
        y: Math.max(0, Math.min(140, point.y)),
      };
    }
    const bounds = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(120, (clientX - bounds.left) / Math.max(1, bounds.width) * 120)),
      y: Math.max(0, Math.min(140, (clientY - bounds.top) / Math.max(1, bounds.height) * 140)),
    };
  }
  private async initAtelierPanzoom(fitOnOpen = false) {
    this.destroyAtelierPanzoom();
    const initId = this.atelierPanzoomInitId;
    if (this.modal !== 'atelier-customize') return;
    const canvas = this.dialog.querySelector<HTMLElement>('[data-shape-canvas]');
    const svg = canvas?.querySelector<SVGSVGElement>('svg');
    if (!canvas || !svg) return;
    // The editor is optional gameplay. Keep its gesture engine out of the
    // initial bundle and download it only when the editor is actually opened.
    const { default: Panzoom } = await import('@panzoom/panzoom');
    if (initId !== this.atelierPanzoomInitId || this.modal !== 'atelier-customize' || !canvas.isConnected || !svg.isConnected) return;
    const excluded = Array.from(svg.querySelectorAll<SVGElement>('[data-shape-node], [data-design-sticker], [data-sticker-move], [data-sticker-resize]'));
    const panzoom = Panzoom(svg, {
      canvas: true,
      minScale: .25,
      maxScale: 4,
      step: .16,
      startScale: this.atelierCanvasZoom,
      startX: this.atelierCanvasPanX,
      startY: this.atelierCanvasPanY,
      exclude: excluded,
      excludeClass: 'moveable-control',
      touchAction: 'none',
      cursor: 'grab',
      animate: false,
      disablePan: this.atelierDrawingEnabled,
    });
    const syncViewport = (event: Event) => {
      const detail = (event as CustomEvent<PanzoomEventDetail>).detail;
      if (!detail) return;
      this.atelierCanvasZoom = detail.scale;
      this.atelierCanvasPanX = detail.x;
      this.atelierCanvasPanY = detail.y;
      const output = this.dialog.querySelector<HTMLOutputElement>('.customizer-viewport-tools output');
      if (output) output.value = `${Math.round(detail.scale * 100)}%`;
      this.atelierStickerMoveable?.updateRect();
    };
    svg.addEventListener('panzoomchange', syncViewport);
    svg.addEventListener('panzoomstart', () => canvas.classList.add('is-panning'));
    svg.addEventListener('panzoomend', () => canvas.classList.remove('is-panning'));
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      panzoom.zoomWithWheel(event);
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    this.atelierPanzoom = panzoom;
    this.atelierPanzoomCanvas = canvas;
    this.atelierPanzoomWheel = wheel;
    void this.initAtelierStickerMoveable(canvas, svg);
    if (fitOnOpen) requestAnimationFrame(() => this.fitAtelierCanvas());
  }
  private async initAtelierStickerMoveable(canvas: HTMLElement, svg: SVGSVGElement) {
    this.atelierStickerMoveable?.destroy();
    this.atelierStickerMoveable = undefined;
    const sticker = this.atelierDesignStickers.find(item => item.id === this.atelierSelectedStickerId);
    const target = sticker ? svg.querySelector<SVGGElement>(`[data-design-sticker="${CSS.escape(sticker.id)}"]`) : null;
    if (!sticker || !target) return;
    const { default: Moveable } = await import('moveable');
    if (this.modal !== 'atelier-customize' || !canvas.isConnected || this.atelierSelectedStickerId !== sticker.id) return;
    const moveable = new Moveable(canvas, {
      target,
      draggable: true,
      scalable: true,
      rotatable: true,
      pinchable: true,
      keepRatio: true,
      origin: false,
      throttleDrag: 0,
      throttleScale: 0,
      throttleRotate: 1,
      renderDirections: ['nw', 'ne', 'sw', 'se'],
      rotationPosition: 'top',
    });
    let dragStart: ProductDesignPoint | undefined;
    let originX = sticker.x;
    let originY = sticker.y;
    const clientPoint = (input: PointerEvent | TouchEvent | MouseEvent) => {
      if ('touches' in input && input.touches.length) return input.touches[0];
      if ('changedTouches' in input && input.changedTouches.length) return input.changedTouches[0];
      return input as PointerEvent | MouseEvent;
    };
    const updateTarget = () => {
      target.setAttribute('transform', `translate(${sticker.x.toFixed(2)} ${sticker.y.toFixed(2)}) rotate(${sticker.rotation.toFixed(1)}) scale(${sticker.scale.toFixed(3)})`);
      moveable.updateRect();
    };
    moveable.on('dragStart', event => {
      const pointer = clientPoint(event.inputEvent);
      dragStart = this.atelierCanvasClientPoint(canvas, pointer.clientX, pointer.clientY);
      originX = sticker.x;
      originY = sticker.y;
    });
    moveable.on('drag', event => {
      if (!dragStart) return;
      const pointer = clientPoint(event.inputEvent);
      const point = this.atelierCanvasClientPoint(canvas, pointer.clientX, pointer.clientY);
      sticker.x = Math.max(6, Math.min(114, originX + point.x - dragStart.x));
      sticker.y = Math.max(7, Math.min(133, originY + point.y - dragStart.y));
      updateTarget();
    });
    moveable.on('scaleStart', event => event.set([sticker.scale, sticker.scale]));
    moveable.on('scale', event => {
      sticker.scale = Math.max(.35, Math.min(2.5, Math.abs(event.scale[0])));
      updateTarget();
    });
    moveable.on('rotateStart', event => event.set(sticker.rotation));
    moveable.on('rotate', event => {
      sticker.rotation = Math.max(-180, Math.min(180, event.beforeRotation));
      updateTarget();
    });
    this.atelierStickerMoveable = moveable;
  }
  private fitAtelierCanvas() {
    const panzoom = this.atelierPanzoom;
    const canvas = this.atelierPanzoomCanvas;
    const svg = canvas?.querySelector<SVGSVGElement>('svg');
    const artwork = svg?.querySelector<SVGGraphicsElement>('.atelier-editable-shape');
    if (!panzoom || !canvas || !svg || !artwork) return;
    panzoom.zoom(1, { animate: false });
    panzoom.pan(0, 0, { animate: false, force: true });
    requestAnimationFrame(() => {
      const canvasRect = canvas.getBoundingClientRect();
      const artworkRect = artwork.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height || !artworkRect.width || !artworkRect.height) return;
      const padding = Math.max(20, Math.min(canvasRect.width, canvasRect.height) * .08);
      const fitScale = Math.max(.25, Math.min(1,
        (canvasRect.width - padding * 2) / artworkRect.width,
        (canvasRect.height - padding * 2) / artworkRect.height,
      ));
      panzoom.zoom(fitScale, { animate: false });
      requestAnimationFrame(() => {
        const fittedCanvas = canvas.getBoundingClientRect();
        const fittedArtwork = artwork.getBoundingClientRect();
        const deltaX = fittedCanvas.left + fittedCanvas.width / 2 - fittedArtwork.left - fittedArtwork.width / 2;
        const deltaY = fittedCanvas.top + fittedCanvas.height / 2 - fittedArtwork.top - fittedArtwork.height / 2;
        panzoom.pan(deltaX, deltaY, { relative: true, animate: false, force: true });
      });
    });
  }
  private destroyAtelierPanzoom() {
    this.atelierPanzoomInitId += 1;
    this.atelierStickerMoveable?.destroy();
    this.atelierStickerMoveable = undefined;
    if (this.atelierPanzoomCanvas && this.atelierPanzoomWheel) {
      this.atelierPanzoomCanvas.removeEventListener('wheel', this.atelierPanzoomWheel);
    }
    this.atelierPanzoom?.destroy();
    this.atelierPanzoom = undefined;
    this.atelierPanzoomCanvas = undefined;
    this.atelierPanzoomWheel = undefined;
  }
  private atelierShapePathData() {
    const points = this.atelierShapePoints;
    if (!points.length) return '';
    if (!this.atelierShapeSmooth) return `M${points.map(point => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join('L')}Z`;
    const midpoint = (a: ProductDesignPoint, b: ProductDesignPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const start = midpoint(points.at(-1)!, points[0]);
    return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}${points.map((point, index) => {
      const end = midpoint(point, points[(index + 1) % points.length]);
      return `Q${point.x.toFixed(1)} ${point.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    }).join('')}Z`;
  }
  private syncAtelierDrawingLayer(canvas: HTMLElement) {
    const product = this.store.state.customProducts.find(item => item.id === this.atelierCustomizeProductId);
    const svg = canvas.querySelector<SVGSVGElement>('svg');
    if (!product || !svg) return;
    const rendered = productSvg({
      ...product,
      designColor: this.atelierDesignColor,
      designStrokes: this.atelierDesignStrokes,
      designMotif: 'none',
      designFormWidth: 1,
      designFormLength: 1,
      designShapePoints: this.atelierShapePoints,
      designShapeSmooth: this.atelierShapeSmooth,
      designStrokeColor: this.atelierShapeStrokeColor,
      designStrokeWidth: this.atelierShapeStrokeWidth,
      designStickers: this.atelierDesignStickers,
    });
    const renderedSvg = new DOMParser().parseFromString(rendered, 'image/svg+xml').documentElement;
    const nextLayer = renderedSvg.querySelector<SVGGElement>('.custom-product-drawing');
    const currentLayer = svg.querySelector<SVGGElement>('.custom-product-drawing');
    if (nextLayer) {
      const importedLayer = document.importNode(nextLayer, true);
      if (currentLayer) currentLayer.replaceWith(importedLayer);
      else svg.querySelector<SVGPathElement>('.atelier-editable-shape')?.parentElement?.parentElement?.append(importedLayer);
    } else {
      currentLayer?.remove();
    }
    svg.querySelector('.customizer-live-stroke')?.remove();
  }
  private refreshAtelierCustomizer() {
    if (this.modal !== 'atelier-customize') return;
    const product = this.store.state.customProducts.find(item => item.id === this.atelierCustomizeProductId);
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!product || !inner) return;
    const innerScrollTop = inner.scrollTop;
    const controlsScrollTop = inner.querySelector<HTMLElement>('.customizer-controls')?.scrollTop ?? 0;
    const nameInput = inner.querySelector<HTMLInputElement>('#customizer-product-name');
    if (nameInput) this.atelierCustomizeName = nameInput.value.slice(0, 32);
    this.destroyAtelierPanzoom();
    inner.innerHTML = atelierCustomizeModal(product, this.atelierCustomizerState());
    const restoredName = inner.querySelector<HTMLInputElement>('#customizer-product-name');
    if (restoredName) restoredName.value = this.atelierCustomizeName;
    const restoreScroll = () => {
      inner.scrollTop = innerScrollTop;
      const controls = inner.querySelector<HTMLElement>('.customizer-controls');
      if (controls) controls.scrollTop = controlsScrollTop;
    };
    restoreScroll();
    requestAnimationFrame(() => {
      restoreScroll();
      this.initAtelierPanzoom();
    });
  }
  private atelierCustomizerState() {
    return {
      baseColor: this.atelierDesignColor,
      strokes: this.atelierDesignStrokes,
      motif: this.atelierDesignMotif,
      accentColor: this.atelierDesignAccentColor,
      motifScale: this.atelierDesignMotifScale,
      motifX: this.atelierDesignMotifX,
      motifY: this.atelierDesignMotifY,
      formWidth: this.atelierDesignFormWidth,
      formLength: this.atelierDesignFormLength,
      motifRotation: this.atelierDesignMotifRotation,
      motifOpacity: this.atelierDesignMotifOpacity,
      motifRepeat: this.atelierDesignMotifRepeat,
      shapePoints: this.atelierShapePoints,
      shapeSelected: this.atelierShapeSelected,
      selectedNode: this.atelierSelectedNode,
      shapeSmooth: this.atelierShapeSmooth,
      strokeColor: this.atelierShapeStrokeColor,
      strokeWidth: this.atelierShapeStrokeWidth,
      brushEnabled: this.atelierDrawingEnabled,
      brushColor: this.atelierBrushColor,
      brushWidth: this.atelierBrushWidth,
      brushTip: this.atelierBrushTip,
      stickers: this.atelierDesignStickers,
      selectedStickerId: this.atelierSelectedStickerId,
      canvasZoom: this.atelierCanvasZoom,
      canvasPanX: this.atelierCanvasPanX,
      canvasPanY: this.atelierCanvasPanY,
    };
  }
  private refreshOnlineOrder() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const scrollTop = inner.querySelector<HTMLElement>('.online-handover-grid')?.scrollTop ?? 0;
    inner.innerHTML = onlineOrderModal(this.store.state, this.onlineOrderId, this.onlineHandoverProductIds);
    const restoreScroll = () => {
      const grid = inner.querySelector<HTMLElement>('.online-handover-grid');
      if (grid) grid.scrollTop = scrollTop;
    };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
  private refreshRegularOrderDetail() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    if (!this.store.state.regularOnlineOrders.some(order => order.id === this.regularOrderId)) {
      this.returnToOnlineDashboard();
      return;
    }
    const productsScrollTop = inner.querySelector<HTMLElement>('.regular-order-detail-product-scroll')?.scrollTop ?? 0;
    inner.innerHTML = regularOrderDetailModal(this.store.state, this.regularOrderId);
    const restore = () => {
      const list = inner.querySelector<HTMLElement>('.regular-order-detail-product-scroll');
      if (list) list.scrollTop = productsScrollTop;
    };
    restore();
    requestAnimationFrame(restore);
  }
  private refreshRegularPickup() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const scrollTop = inner.querySelector<HTMLElement>('.regular-pickup-modal > ul')?.scrollTop ?? 0;
    inner.innerHTML = regularPickupModal(this.store.state);
    const restoreScroll = () => {
      const list = inner.querySelector<HTMLElement>('.regular-pickup-modal > ul');
      if (list) list.scrollTop = scrollTop;
    };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
  openOnlineOrder(orderId: string) {
    if (!this.store.state.onlineOrders.some(order => order.id === orderId)) return;
    this.onlineOrderId = orderId;
    this.onlineHandoverProductIds = [];
    this.openModal('online-order', onlineOrderModal(this.store.state, orderId, []));
  }
  openNameShop(isFirstTime = false) {
    this.openModal('name-shop', nameShopModal(this.store.state, isFirstTime));
    const input = this.dialog.querySelector<HTMLInputElement>('#shop-name-input');
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 120);
    }
  }
  private scrollModalToTop() {
    const version = ++this.modalScrollResetVersion;
    const reset = () => {
      if (version !== this.modalScrollResetVersion) return;
      this.dialog.scrollTop = 0;
      const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
      if (!inner) return;
      inner.scrollTop = 0;
      inner.querySelectorAll<HTMLElement>('*').forEach(element => {
        if (element.scrollTop) element.scrollTop = 0;
      });
    };
    reset();
    requestAnimationFrame(() => {
      reset();
      requestAnimationFrame(reset);
    });
    window.setTimeout(reset, 80);
  }
  private openModal(type: Modal, html: string, resetScroll = true) {
    if (!this.dialog.open) this.beforeDialogFocus = document.activeElement as HTMLElement;
    this.modal = type;
    this.syncSceneInteraction();
    this.dialog.querySelector('.dialog-inner')!.innerHTML = html;
    this.dialog.className = `dialog-${type}`;
    if (!this.dialog.open) this.dialog.showModal();
    if (resetScroll) this.scrollModalToTop();
    else this.modalScrollResetVersion++;
    // Summary actions sit at the bottom. Focusing one makes iOS Safari scroll there.
    if (type === 'summary') {
      this.dialog.tabIndex = -1;
      this.dialog.focus({ preventScroll: true });
      if (resetScroll) this.scrollModalToTop();
    } else {
      // Focus the dismiss/continue action rather than a product to prevent accidental purchases.
      this.dialog.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    }
    this.updateDockVisibility();
    this.queueTutorialCue();
  }

  private getImportModalQuantity() {
    const [kind, id] = this.expandedImportPurchase.split(':');
    const minimum = supplierFor(this.store.state).minOrder;
    if (kind === 'look') return Math.max(minimum, this.lookQtys[id] ?? minimum);
    if (kind === 'material') return Math.max(minimum, this.materialQtys[id] ?? minimum);
    return Math.max(minimum, this.productImportQtys[id] ?? minimum);
  }

  private setImportModalQuantity(quantity: number) {
    const [kind, id] = this.expandedImportPurchase.split(':');
    if (!id) return;
    if (kind === 'look') this.lookQtys[id] = quantity;
    else if (kind === 'material') this.materialQtys[id] = quantity;
    else this.productImportQtys[id] = quantity;
  }

  private refreshImportQuantityModal() {
    if (this.modal !== 'import-quantity') return;
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (inner) inner.innerHTML = this.importQuantityModal();
  }

  private importQuantityModal() {
    const [kind, id] = this.expandedImportPurchase.split(':');
    const supplier = supplierFor(this.store.state);
    const quantity = this.getImportModalQuantity();
    let name = '';
    let subtitle = '';
    let artwork = '';
    let unitPrice = 0;
    let stockAfter = 0;

    if (kind === 'product') {
      const product = products.find(item => item.id === id);
      if (!product) return '';
      name = product.name;
      subtitle = `${product.style} · Sản phẩm`;
      artwork = productImage(product, `import-quantity-product import-art-${product.art}`);
      unitPrice = buyPrice(this.store.state, product);
      stockAfter = (this.store.state.inventory[id] ?? 0) + quantity;
    } else if (kind === 'look') {
      const look = looks.find(item => item.id === id);
      if (!look) return '';
      const items = look.items.map(itemId => products.find(product => product.id === itemId)!).filter(Boolean);
      name = look.name;
      subtitle = `${look.style} · ${items.length} món/bộ`;
      artwork = `<div class="import-quantity-look">${items.map(item => productImage(item, `import-quantity-product import-art-${item.art}`)).join('')}</div>`;
      unitPrice = items.reduce((sum, item) => sum + buyPrice(this.store.state, item), 0);
      stockAfter = quantity;
    } else {
      const material = atelierMaterials.find(item => item.id === id);
      if (!material) return '';
      name = material.name;
      subtitle = 'Vật liệu xưởng may';
      artwork = `<div class="import-quantity-material" style="--material:${material.color}">${atelierMaterialIllustration(material.id)}</div>`;
      unitPrice = Math.round(material.price * currentEvent(this.store.state).discount * supplier.priceFactor);
      stockAfter = (this.store.state.materialInventory[id] ?? 0) + quantity;
    }

    const total = unitPrice * quantity;
    const canConfirm = total <= this.store.state.money;
    const deliveryDays = supplier.deliveryDays + (kind === 'product' && (products.find(item => item.id === id)?.level ?? 0) >= 4 ? 3 : 0);
    return `<section class="import-quantity-modal">
      <header class="app-modal-header import-quantity-header">
        <span class="import-current-balance">${icon('coin')} <b>${money(this.store.state.money)}</b></span>
        <div><small>${escapeHtml(subtitle)}</small><h2>${escapeHtml(name)}</h2></div>
        <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </header>
      <div class="import-quantity-body">
        <div class="import-quantity-art">${artwork}</div>
        <div class="import-quantity-summary">
          <span><small>Đơn giá</small><b>${money(unitPrice)}</b></span>
          <span><small>${deliveryDays ? 'Thời gian giao' : 'Nhận hàng'}</small><b>${deliveryDays ? `${deliveryDays}–${deliveryDays + (supplier.reliability < 1 ? 1 : 0)} ngày` : 'Ngay lập tức'}</b></span>
          <span><small>${kind === 'look' ? 'Số bộ nhập' : 'Kho sau khi nhập'}</small><b>${stockAfter}</b></span>
        </div>
      </div>
      <div class="import-quantity-picker">
        <span>Số lượng</span>
        <div class="traditional-qty-control">
          <button type="button" data-action="import-modal-qty-step" data-id="-1" aria-label="Giảm số lượng" ${quantity <= supplier.minOrder ? 'disabled' : ''}>${icon('minus')}</button>
          <input class="import-modal-qty-input" type="number" inputmode="numeric" min="${supplier.minOrder}" max="30" step="1" value="${quantity}" aria-label="Số lượng nhập" />
          <button type="button" data-action="import-modal-qty-step" data-id="1" aria-label="Tăng số lượng" ${quantity >= 30 ? 'disabled' : ''}>${icon('plus')}</button>
        </div>
      </div>
      <footer class="import-quantity-actions">
        <div><small>Tổng thanh toán</small><strong>${money(total)}</strong></div>
        <button class="btn btn-primary" data-action="import-quantity-confirm" ${canConfirm ? '' : 'disabled'}>${icon(deliveryDays ? 'truck' : 'box')} Xác nhận nhập</button>
      </footer>
    </section>`;
  }
  private ordersArrivedHtml(items: ArrivedOrderSummary[]) {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    const materialsOnly = items.every(item => item.kind === 'material');
    const quantityLabel = materialsOnly ? 'đơn vị vật liệu' : 'món hàng';
    return `<section class="arrivals-modal">
      <header class="arrivals-header">
        <span class="arrivals-truck">${icon('truck')}</span>
        <div class="arrivals-heading"><small>GIAO HÀNG HOÀN TẤT</small><h2>Hàng mới đã về kho!</h2></div>
        <button class="staff-modal-close arrivals-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </header>
      <div class="arrivals-summary">
        <div><small>Đã nhận</small><strong>${total}</strong><span>${quantityLabel}</span></div>
        <div><small>Số kiện</small><strong>${items.length}</strong><span>đã kiểm nhận</span></div>
        <p>${icon('check')} Toàn bộ hàng đã được tự động cộng vào kho.</p>
      </div>
      <div class="arrivals-list" aria-label="Danh sách hàng vừa nhận">${items.map(item => {
      const product = products.find(candidate => candidate.id === item.productId);
      const material = item.kind === 'material' ? atelierMaterials.find(candidate => candidate.id === item.productId) : undefined;
      const supplier = suppliers.find(candidate => candidate.id === item.supplierId);
      return `<article class="${material ? 'is-material-arrival' : ''}"><div class="arrivals-product-art">${material ? atelierMaterialIllustration(material.id) : product ? productImage(product) : icon('box')}</div><div class="arrivals-item-info"><strong>${escapeHtml(item.productName)}</strong><small>${material ? 'Vật liệu' : 'Sản phẩm'} · ${supplier ? escapeHtml(supplier.name) : 'Đơn nhập hàng'}</small></div><b class="arrivals-item-quantity"><small>Số lượng</small>×${item.quantity}</b></article>`;
    }).join('')}</div>
      <footer class="arrivals-footer"><span>${icon('box')} Sẵn sàng sử dụng trong kho</span><button class="btn btn-primary arrivals-confirm" data-action="close-modal">Đã hiểu ${icon('check')}</button></footer>
    </section>`;
  }
  private closeModal(preserveTransferCheckout = false) {
    const closingModal = this.modal;
    const advanceAfterSummary = this.modal === 'summary' && this.store.state.phase === 'closed';
    const returnToSummary = (this.modal === 'debt-warning' || this.modal === 'finance') &&
      this.store.state.phase === 'closed' && !this.store.state.gameOverReason;
    if (this.modal === 'display-guide' && !this.store.state.claimed.includes(DISPLAY_GUIDE_SEEN)) {
      this.store.state.claimed.push(DISPLAY_GUIDE_SEEN);
      this.store.commit();
    }
    const showPreparationRecap = this.modal === 'display' && this.tutorialStep === 5 && this.tutorialActive();
    if (this.modal === 'tutorial-recap') this.finishGuidedTutorial();
    if (this.modal === 'serve') this.serveVisitId = '';
    if (this.modal === 'checkout' && !preserveTransferCheckout) this.clearCheckoutSession();
    if (this.modal === 'staff') this.staffDetailUid = '';
    if (closingModal === 'atelier-customize') {
      this.atelierDrawingStroke = undefined;
      this.atelierDrawingPointer = -1;
      this.destroyAtelierPanzoom();
    }
    if (closingModal === 'atelier-delete-confirm') this.pendingBlueprintDeleteId = '';
    if (closingModal === 'store-furniture-confirm') this.pendingStoreFurnitureUid = '';
    if (closingModal === 'import-quantity') this.expandedImportPurchase = '';
    this.modal = 'none';
    this.dialog.close();
    this.syncSceneInteraction();
    // The waiting-customer rail is hidden while a sale modal is open. A sale
    // commits its state before this dialog closes, so that earlier render still
    // sees the modal and leaves every remaining card hidden. Refresh the open
    // shop immediately after closing to restore the surviving customer cards.
    if (this.store.state.phase === 'open' && this.tab === 'shop') this.render();
    if (this.beforeDialogFocus?.isConnected) this.beforeDialogFocus.focus({ preventScroll: true });
    this.updateDockVisibility();
    this.queueTutorialCue();
    if (showPreparationRecap) {
      this.scene?.setMoveMode(false);
      this.advanceTutorial(6);
      this.showPreparationRecap();
    }
    this.queueDisplayGuide();
    this.queueCampaignUnlock();
    if (advanceAfterSummary) {
      this.store.nextDay();
      this.navigate('shop');
    } else if (returnToSummary) {
      this.openModal('summary', summaryModal(this.store.state));
    }
  }

  private queueDisplayGuide() {
    window.clearTimeout(this.displayGuideTimer);
    if (!needsDisplayGuide(this.store.state)) return;
    this.displayGuideTimer = window.setTimeout(() => {
      if (needsDisplayGuide(this.store.state) && this.modal === 'none' && this.tab === 'shop' && !this.moveMode) {
        this.openModal('display-guide', displayGuideModal());
      }
    }, 450);
  }

  private campaignUnlockAvailable() {
    const s = this.store.state;
    return s.level >= 3 && s.tutorialDone && !!s.hasNamedShop && s.phase !== 'open' &&
      !s.gameOverReason && !s.claimed.includes(CAMPAIGN_GUIDE_SEEN);
  }
  private queueCampaignUnlock() {
    window.clearTimeout(this.campaignGuideTimer);
    if (this.campaignUnlockPrompted || !this.campaignUnlockAvailable()) return;
    this.campaignGuideTimer = window.setTimeout(() => {
      if (this.campaignUnlockPrompted || !this.campaignUnlockAvailable() || needsDisplayGuide(this.store.state)) return;
      if (this.modal !== 'none' || this.tab !== 'shop' || this.moveMode) return;
      this.campaignUnlockPrompted = true;
      this.campaignGuideForced = false;
      this.openModal('campaign', campaignModal(this.store.state));
    }, 850);
  }

  private tutorialActive() {
    const s = this.store.state;
    return !s.tutorialDone && !!s.hasNamedShop && s.day === 1 && s.phase === 'preparation';
  }
  private queueTutorialCue() {
    window.clearTimeout(this.tutorialRetry);
    this.tutorialRetry = window.setTimeout(() => this.renderTutorialCue(), 80);
  }
  private renderTutorialCue() {
    document.querySelectorAll('.tutorial-focus').forEach(element => {
      element.classList.remove('tutorial-focus', 'tutorial-cue-left', 'tutorial-cue-below', 'tutorial-cue-below-left', 'tutorial-cue-inside', 'tutorial-cue-badge');
    });
    document.querySelectorAll('.tutorial-guide-layer').forEach(element => element.remove());
    document.body.classList.toggle('guided-tutorial-active', this.tutorialActive());
    if (!this.tutorialActive()) return;
    if (this.tutorialStep === 6) return;
    const choosingTutorialSource = this.tutorialStep === 1 && this.tab === 'import' && !this.importSourceSelected;
    const confirmingTutorialImport = this.tutorialStep === 1 && this.modal === 'import-quantity';
    const steps = [
      { selector: '.dock-btn-import', label: 'Bấm Nhập hàng', placement: 'left' },
      confirmingTutorialImport
        ? { selector: '[data-action="import-quantity-confirm"]', label: 'Xác nhận số lượng nhập', placement: 'above' }
        : choosingTutorialSource
        ? { selector: '.supplier-source-card:not([disabled])', label: 'Chọn nguồn hàng để tiếp tục', placement: 'above' }
        : { selector: '.import-btn:not([disabled])', label: 'Bấm để nhập mẫu đầu tiên', placement: 'above' },
      { selector: '.panel-close-btn[data-id="shop"]', label: 'Bấm Quay lại shop', placement: 'below' },
      { selector: '#game-canvas', label: 'Bấm vào sào quần áo', placement: 'inside' },
      { selector: '[data-action="display-add"]:not([disabled]) .tutorial-display-add-target', label: 'Bấm + để bày sản phẩm', placement: 'below-left' },
      { selector: '.dialog-display [data-action="close-modal"]', label: 'Bấm X để về shop', placement: 'badge' },
    ] as const;
    const step = steps[this.tutorialStep];
    if (!step) return;
    if (this.tutorialStep === 3) this.scene?.focusTutorialFurniture('starter-rack');
    const target = document.querySelector<HTMLElement>(step.selector);
    if (!target) { this.tutorialRetry = window.setTimeout(() => this.renderTutorialCue(), 250); return; }
    if (!target.closest('.inv-panel-header, .game-panel-header-card') && this.tutorialStep !== 3) {
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    }
    target.classList.add('tutorial-focus');
    const placementClass = `tutorial-cue-${step.placement}`;
    target.classList.add(placementClass);

    const host = this.dialog.open ? this.dialog : document.body;
    const layer = document.createElement('div');
    layer.className = `tutorial-guide-layer ${placementClass}${this.dialog.open ? ' is-dialog-layer' : ''}`;
    layer.setAttribute('aria-live', 'polite');
    const spotlight = document.createElement('span');
    spotlight.className = `tutorial-spotlight${this.tutorialStep === 3 ? ' is-canvas-target' : ''}`;
    const callout = document.createElement(this.tutorialStep === 3 ? 'button' : 'aside');
    callout.className = 'tutorial-callout';
    if (this.tutorialStep === 3) {
      (callout as HTMLButtonElement).type = 'button';
      callout.dataset.tutorialOpenRack = 'true';
    }
    callout.innerHTML = `<span class="tutorial-step-count">${String(this.tutorialStep + 1).padStart(2, '0')}<small>/07</small></span><span class="tutorial-callout-copy"><small>HƯỚNG DẪN NHANH</small><strong>${step.label}</strong></span><span class="tutorial-progress" aria-hidden="true">${Array.from({ length: 7 }, (_, index) => `<i class="${index <= this.tutorialStep ? 'is-done' : ''}"></i>`).join('')}</span>`;
    layer.append(spotlight, callout);
    host.append(layer);

    const hostRect = this.dialog.open
      ? this.dialog.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const targetRect = target.getBoundingClientRect();
    const relative = {
      left: targetRect.left - hostRect.left,
      top: targetRect.top - hostRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };
    const focusRect = this.tutorialStep === 3
      ? { left: relative.left + relative.width * .5 - 58, top: relative.top + relative.height * .46 - 48, width: 116, height: 96 }
      : relative;
    const focusPad = this.tutorialStep === 3 ? 0 : 6;
    spotlight.style.left = `${focusRect.left - focusPad}px`;
    spotlight.style.top = `${focusRect.top - focusPad}px`;
    spotlight.style.width = `${focusRect.width + focusPad * 2}px`;
    spotlight.style.height = `${focusRect.height + focusPad * 2}px`;

    const calloutWidth = callout.offsetWidth;
    const calloutHeight = callout.offsetHeight;
    let left = relative.left + relative.width / 2 - calloutWidth / 2;
    let top = relative.top - calloutHeight - 15;
    if (step.placement === 'left') {
      left = relative.left - calloutWidth - 16;
      top = relative.top + relative.height / 2 - calloutHeight / 2;
    } else if (step.placement === 'below' || step.placement === 'below-left' || step.placement === 'badge') {
      left = step.placement === 'badge' ? relative.left + relative.width - calloutWidth : left;
      top = relative.top + relative.height + 15;
    } else if (step.placement === 'inside') {
      left = relative.left + relative.width / 2 - calloutWidth / 2;
      top = relative.top + relative.height * .67 - calloutHeight / 2;
    }
    const edge = 10;
    left = Math.max(edge, Math.min(left, hostRect.width - calloutWidth - edge));
    top = Math.max(edge, Math.min(top, hostRect.height - calloutHeight - edge));
    callout.style.left = `${left}px`;
    callout.style.top = `${top}px`;
    const arrowX = Math.max(16, Math.min(relative.left + relative.width / 2 - left, calloutWidth - 16));
    const arrowY = Math.max(16, Math.min(relative.top + relative.height / 2 - top, calloutHeight - 16));
    callout.style.setProperty('--tutorial-arrow-x', `${arrowX}px`);
    callout.style.setProperty('--tutorial-arrow-y', `${arrowY}px`);
  }
  private advanceTutorial(step: number) {
    this.tutorialStep = step;
    this.queueTutorialCue();
  }
  private openTutorialRack() {
    if (this.tutorialStep !== 3 || !this.tutorialActive()) return;
    const fixture = this.store.state.layout.find(item => item.uid === 'starter-rack');
    if (!fixture) return;
    this.openDisplayFixture(fixture.uid);
    this.advanceTutorial(4);
  }
  private finishGuidedTutorial() {
    document.body.classList.remove('guided-tutorial-active');
    document.querySelectorAll('.tutorial-guide-layer').forEach(element => element.remove());
    document.querySelectorAll('.tutorial-focus').forEach(element => {
      element.classList.remove('tutorial-focus', 'tutorial-cue-left', 'tutorial-cue-below', 'tutorial-cue-below-left', 'tutorial-cue-inside', 'tutorial-cue-badge');
    });
    this.store.settings('tutorialDone', true);
  }
  private showPreparationRecap() {
    this.openModal('tutorial-recap', `
      <section class="preparation-recap" aria-labelledby="preparation-recap-title">
        <header class="preparation-recap-heading">
          <span class="preparation-recap-emblem">${icon('shop')}<b>07</b><small>/07</small></span>
          <div>
            <span class="eyebrow">SỔ TAY CHỦ TIỆM · BƯỚC 7/7</span>
            <h2 id="preparation-recap-title">Sẵn sàng cho ngày đầu mở cửa</h2>
            <p>Năm việc nhỏ để boutique luôn đủ hàng, đúng xu hướng và sẵn sàng đón vị khách đầu tiên.</p>
          </div>
          <span class="preparation-ready-badge">${icon('check')} ĐÃ HOÀN THÀNH</span>
        </header>
        <div class="preparation-recap-body">
          <aside class="preparation-recap-intro">
            <span class="preparation-intro-art">${icon('sparkle')}${icon('hanger')}</span>
            <small>CHU TRÌNH MỖI NGÀY</small>
            <strong>Chuẩn bị kỹ,<br>mở cửa thật vui.</strong>
            <p>Bạn có thể quay lại các khu vực này bất cứ lúc nào trước khi bắt đầu bán hàng.</p>
            <span class="preparation-time-chip">${icon('clock')} ${Math.floor(dayDuration(this.store.state) / 60)} phút${dayDuration(this.store.state) % 60 ? ` ${dayDuration(this.store.state) % 60} giây` : ''} · tốc độ 1×</span>
          </aside>
          <ol class="preparation-recap-steps">
            ${[
              ['trend', 'Xem xu hướng', 'Chọn những mẫu đang được khách yêu thích.'],
              ['bag', 'Nhập hàng vào kho', 'Chọn mẫu và số lượng hợp với ngân sách.'],
              ['coin', 'Kiểm tra giá bán', 'Xem giá vốn, lợi nhuận và chỉnh giá bán.'],
              ['hanger', 'Bày hàng lên sào, kệ', 'Lấy hàng từ kho ra khu trưng bày.'],
              ['shop', 'Mở cửa và tư vấn', 'Đón khách và chọn outfit đúng gu.'],
            ].map(([art, title, description], index) => `<li><span class="preparation-step-number">0${index + 1}</span><span class="preparation-step-icon">${icon(art)}</span><div><h3>${title}</h3><p>${description}</p></div>${index < 4 ? '<i></i>' : ''}</li>`).join('')}
          </ol>
        </div>
        <footer class="preparation-recap-actions">
          <span>${icon('sparkle')} Boutique của bạn đã sẵn sàng viết câu chuyện đầu tiên.</span>
          <button class="btn btn-primary" data-action="close-modal"><span><small>QUAY LẠI CỬA TIỆM</small><b>Đã hiểu, tiếp tục chuẩn bị</b></span>${icon('arrow')}</button>
        </footer>
      </section>
    `);
  }
  private prepareDayDrama() {
    const state = this.store.state;
    const dramas = Array.isArray(state.dramas) ? state.dramas : [];
    const nextDramaDay = Number.isFinite(state.nextDramaDay) ? state.nextDramaDay : state.day;
    if (state.day < nextDramaDay) return;
    if (this.pendingDayDramaDay === state.day || dramas.some(drama => drama.day === state.day)) return;
    const customer = customers[(state.day + dramas.length) % customers.length];
    const availableProducts = products.filter(product => (state.inventory[product.id] ?? 0) > 0);
    const featuredProducts = (availableProducts.length ? availableProducts : products).slice(0, 4);
    const context = {
      day: state.day,
      shopName: state.shopName || 'My Little Boutique',
      customerName: customer.name,
      customerHandle: customer.handle,
      personality: customer.personality,
      products: featuredProducts.map(product => product.name),
      total: featuredProducts.reduce((sum, product) => sum + (state.prices[product.id] ?? product.sellPrice), 0),
      budget: customer.budget,
      score: Math.round(Math.max(30, Math.min(95, state.reputation * 18))),
      success: state.reputation >= 3.5,
      viral: state.dramaHeat >= 60,
      reason: `${currentEvent(state).name}: ${currentEvent(state).description}`,
      heat: state.dramaHeat,
      trust: state.dramaTrust,
      recentDramas: dramas.slice(0, 6).map(drama => `${drama.title}: ${drama.post}`.slice(0, 240)),
    };
    this.pendingDayDramaDay = state.day;
    this.preparedDayDrama = undefined;
    const request = requestSocialDrama(context);
    this.pendingDayDrama = request;
    void request.then(drama => {
      if (this.pendingDayDrama === request && this.pendingDayDramaDay === drama.day) this.preparedDayDrama = drama;
    });
  }
  private publishPreparedDayDrama() {
    const day = this.pendingDayDramaDay;
    const request = this.pendingDayDrama;
    const prepared = this.preparedDayDrama;
    if (!day || (!request && !prepared)) return;
    this.pendingDayDramaDay = 0;
    this.pendingDayDrama = undefined;
    this.preparedDayDrama = undefined;
    const publish = (drama: SocialDrama) => {
      if (drama.day !== day || this.store.state.dramas.some(item => item.day === day)) return;
      this.store.addSocialDrama(drama);
    };
    if (prepared) publish(prepared);
    else if (request) void request.then(publish);
  }
  private submitFreeDramaResponse(button: HTMLButtonElement | null) {
    const dramaId = button?.dataset.drama ?? '';
    const drama = this.store.state.dramas.find(item => item.id === dramaId);
    const input = document.querySelector<HTMLTextAreaElement>(`textarea[data-drama-reply="${CSS.escape(dramaId)}"]`);
    const reply = input?.value.trim() ?? '';
    if (!drama || !reply) {
      this.toast('Hãy nhập câu trả lời của shop trước nhé!', 'error');
      input?.focus();
      return;
    }
    if (button) {
      button.disabled = true;
      const label = button.querySelector<HTMLElement>('span');
      if (label) label.textContent = 'Đang gửi...';
    }
    const scrollTop = document.querySelector<HTMLElement>('.social-drawer-content')?.scrollTop ?? 0;
    void requestDramaReplyEvaluation(drama, reply).then(evaluation => {
      if (!this.store.resolveSocialDramaCustom(
        dramaId,
        reply,
        evaluation.tone,
        evaluation.communityText,
        evaluation.communityAuthorName,
        evaluation.communityAuthorHandle,
        evaluation.source,
      )) return;
      if (this.tab === 'social') this.renderPanel();
      const scroller = document.querySelector<HTMLElement>('.social-drawer-content');
      if (scroller) scroller.scrollTop = scrollTop;
      requestAnimationFrame(() => {
        const card = document.querySelector<HTMLElement>(`[data-drama-card="${CSS.escape(dramaId)}"]`);
        card?.querySelector<HTMLElement>('.thread-reply-composer')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }).finally(() => {
      if (!button?.isConnected) return;
      button.disabled = false;
      const label = button.querySelector<HTMLElement>('span');
      if (label) label.textContent = 'Gửi';
    });
  }
  private crisisDetailMarkup() {
    const s = this.store.state;
    const crisis = s.reputationCrisis;
    if (!crisis) return '';
    const daysLeft = Math.max(0, crisis.deadlineDay - s.day + 1);
    const salesDone = Math.min(crisis.sales, crisis.targetSales);
    const reviewsDone = Math.min(crisis.positiveReviews, crisis.targetReviews);
    const salesProgress = Math.min(100, salesDone / crisis.targetSales * 100);
    const reviewProgress = Math.min(100, reviewsDone / crisis.targetReviews * 100);
    return `<section class="crisis-detail-modal" aria-labelledby="crisis-detail-title">
      <header class="crisis-detail-header">
        <span class="crisis-detail-emblem">${icon('hudCrisis')}<i></i></span>
        <div><small>CẢNH BÁO VẬN HÀNH</small><h2 id="crisis-detail-title">Khủng hoảng uy tín</h2><p>Khách đang mất niềm tin vào boutique. Hãy hoàn thành hai mục tiêu trước hạn để khôi phục hình ảnh shop.</p></div>
        <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </header>
      <div class="crisis-deadline-strip">
        <span>${icon('clock')}<small>THỜI GIAN CÒN LẠI</small></span>
        <strong>${daysLeft}<small> ngày</small></strong>
        <em>Hạn xử lý · Ngày ${crisis.deadlineDay}</em>
      </div>
      <div class="crisis-goal-list">
        <article class="crisis-goal-card ${salesDone >= crisis.targetSales ? 'is-complete' : ''}">
          <span class="crisis-goal-icon">${icon('bag')}</span>
          <div class="crisis-goal-copy"><small>MỤC TIÊU BÁN HÀNG</small><strong>Phục vụ đủ sản phẩm</strong><p>Bán thêm sản phẩm để chứng minh shop vẫn hoạt động ổn định.</p></div>
          <b>${salesDone}<small>/${crisis.targetSales}</small></b>
          <div class="crisis-goal-track"><i style="width:${salesProgress}%"></i></div>
        </article>
        <article class="crisis-goal-card ${reviewsDone >= crisis.targetReviews ? 'is-complete' : ''}">
          <span class="crisis-goal-icon is-review">${icon('star')}</span>
          <div class="crisis-goal-copy"><small>MỤC TIÊU ĐÁNH GIÁ</small><strong>Nhận đánh giá tốt</strong><p>Khách chấm từ 4 sao sẽ được tính vào tiến độ khôi phục uy tín.</p></div>
          <b>${reviewsDone}<small>/${crisis.targetReviews}</small></b>
          <div class="crisis-goal-track"><i style="width:${reviewProgress}%"></i></div>
        </article>
      </div>
      <div class="crisis-detail-outcomes">
        <span class="is-success">${icon('shield')}<b>Hoàn thành</b><small>Uy tín tối thiểu 3.8 · +40 người theo dõi</small></span>
        <span class="is-danger">${icon('warning')}<b>Quá hạn</b><small>Mất 20% người theo dõi · giảm 0.35 uy tín</small></span>
      </div>
      <footer class="crisis-detail-footer">
        <p>${icon('help')} Trong khủng hoảng, khách mới sẽ đến chậm hơn. Hãy ưu tiên tư vấn đúng gu và giữ đủ hàng trưng bày.</p>
        <button class="btn btn-primary" data-action="close-modal">Tiếp tục xử lý ${icon('arrow')}</button>
      </footer>
    </section>`;
  }
  private showHelp() {
    this.openModal('help', `<div class="modal-heading"><div><span class="eyebrow">HELLO, LITTLE SHOP OWNER</span><h2>Một giấc mơ, bốn bước nhỏ.</h2></div><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></div><div class="help-steps">${[
      ['01', 'hanger', 'Chọn đồ thật có gu', 'Kho ban đầu đang trống. Dùng 500.000₫ vốn có sẵn để nhập mẫu phù hợp và điều chỉnh giá bán.'],
      ['02', 'shop', 'Mở cửa đón khách', `Chạm trực tiếp nhân vật cần tư vấn trong shop, đọc gu và ngân sách rồi chọn tối đa ${MAX_OUTFIT_ITEMS} món khác loại. Set thay áo/quần/đầm; đầm thay áo/quần.`],
      ['03', 'heart', 'Biến outfit thành niềm vui', 'Đồ hợp gu mang về doanh thu, XP và người theo dõi. Influencer hài lòng có thể tạo khoảnh khắc viral.'],
      ['04', 'decor', 'Bày hàng trước khi mở cửa', 'Chạm sào, kệ, tủ hoặc ma-nơ-canh để lấy hàng từ kho ra trưng. Chỉ sản phẩm đang trưng mới được khách chọn mua.'],
    ].map(([n, i, title, description]) => `<div><span>${n}</span><div><h3>${icon(i)} ${title}</h3><p>${description}</p></div></div>`).join('')}</div><div class="notice">${icon('leaf')} Chơi thật thong thả. Thời gian chờ của khách tạm dừng khi xem kho hàng, xu hướng, bày trí shop, bảng tin hoặc chuyển sang tab trình duyệt khác.</div><button class="btn btn-primary full-width" data-action="tutorial-done">Mình sẵn sàng rồi ${icon('arrow')}</button>`);
  }
  private musicPlayerMarkup() {
    const s = this.store.state;
    const volume = Math.round(s.musicVolume * 100);
    const current = MUSIC_TRACKS.find(track => track.id === s.musicTrack) ?? MUSIC_TRACKS[0];
    const background = s.phase === 'open' ? SALE_BACKGROUND_MUSIC : BACKGROUND_MUSIC;
    const playerTrackPlaying = this.audio.isMusicTrackPlaying(current.id);
    const anyPlayerTrackPlaying = this.audio.isMusicTrackPlaying();
    const player = furniture.find(item => item.id === 'vinyl-player');
    return `<section class="music-player-modal ${anyPlayerTrackPlaying ? 'is-playing' : 'is-paused'}">
      <header class="music-player-header">
        <span class="music-player-header-icon">${icon('volume')}</span>
        <div><small>MELODY PLAYER</small><h2>Nhạc trong boutique</h2></div>
        <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </header>
      <div class="music-player-content">
        <div class="music-player-console">
          <div class="music-player-now">
            <div class="music-player-art">${player ? furnitureImage(player) : icon('volume')}<i></i><i></i><i></i></div>
            <div class="music-player-now-copy"><small>${playerTrackPlaying ? 'HỘP NHẠC ĐANG PHÁT' : s.music ? 'NHẠC NỀN ĐANG PHÁT' : 'NHẠC NỀN ĐANG TẮT'}</small><strong>${escapeHtml(playerTrackPlaying ? current.name : background.name)}</strong><span>${escapeHtml(playerTrackPlaying ? `${current.mood} · phát một lần` : background.mood)}</span></div>
            <button class="music-player-power ${anyPlayerTrackPlaying ? 'is-on' : ''}" data-action="music-player-stop" aria-label="Tắt nhạc của hộp nhạc" ${anyPlayerTrackPlaying ? '' : 'disabled'}>${icon(anyPlayerTrackPlaying ? 'volume' : 'mute')}<b>${anyPlayerTrackPlaying ? 'Tắt hộp nhạc' : 'Hộp nhạc đang tắt'}</b></button>
          </div>
          <label class="music-player-volume" for="music-volume">
            <span>${icon('volume')}<div><strong>Âm lượng</strong><small>Điều chỉnh trực tiếp</small></div></span>
            <input id="music-volume" data-music-volume type="range" min="0" max="100" step="5" value="${volume}" aria-label="Âm lượng nhạc">
            <output id="music-volume-value" data-music-volume-value for="music-volume">${volume}%</output>
          </label>
        </div>
        <section class="music-player-library">
          <div><small>BÀI TRONG HỘP NHẠC</small><span>Phát 1 lần · ${MUSIC_TRACKS.length} bài</span></div>
          <div class="music-track-list">${MUSIC_TRACKS.map((track, index) => { const playing = this.audio.isMusicTrackPlaying(track.id); return `<button class="music-track-card ${playing ? 'is-active' : ''}" data-action="music-player-track" data-id="${track.id}" aria-pressed="${playing}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(track.name)}</strong><small>${escapeHtml(track.mood)}</small></div><i>${playing ? icon('volume') : icon('arrow')}</i></button>`; }).join('')}</div>
        </section>
      </div>
    </section>`;
  }
  openMusicPlayer(playClick = true) {
    void this.audio.unlock();
    if (playClick) this.audio.play('click');
    this.openModal('music-player', this.musicPlayerMarkup());
  }
  private refreshMusicPlayer() {
    if (this.modal !== 'music-player') return;
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (inner) inner.innerHTML = this.musicPlayerMarkup();
  }
  refreshMusicPlayerPlayback() {
    document.querySelector<HTMLElement>('#music-edge-aura')?.classList.toggle('is-active', this.audio.isMusicTrackPlaying());
    this.refreshMusicPlayer();
  }
  private showSettings() {
    const s = this.store.state;
    const volume = Math.round(s.musicVolume * 100);
    const effectsVolume = Math.round(s.effectsVolume * 100);
    this.openModal('settings', `<section class="game-settings-modal">
      <header class="game-settings-header">
        <span class="game-settings-logo">${icon('settings')}</span>
        <div><small>GAME OPTIONS</small><h2>Cài đặt</h2></div>
        <button class="game-settings-close" data-action="close-modal" aria-label="Đóng cài đặt">${icon('close')}</button>
      </header>

      <div class="game-settings-content">
        <section class="settings-profile-card">
          <span class="settings-profile-avatar">${ownerPortrait(50)}</span>
          <div><small>BOUTIQUE CỦA BẠN</small><strong>${escapeHtml(s.shopName || 'My Little Boutique')}</strong></div>
          <button data-action="name-shop">${icon('edit')} Đổi tên</button>
        </section>

        <section class="settings-group" aria-labelledby="settings-audio-title">
          <h3 id="settings-audio-title">${icon('volume')} Âm thanh</h3>
          <div class="game-setting-row">
            <span class="game-setting-icon is-sound">${icon(s.sound ? 'volume' : 'mute')}</span>
            <div><strong>Hiệu ứng âm thanh</strong><small>Chuông cửa, đồng xu và các thao tác.</small></div>
            <button role="switch" aria-checked="${s.sound}" aria-label="Âm thanh tương tác" data-action="sound" class="game-settings-toggle ${s.sound ? 'is-on' : ''}"><i></i><b>${s.sound ? 'Bật' : 'Tắt'}</b></button>
          </div>
          <label class="game-volume-row ${s.sound ? '' : 'is-disabled'}" for="effects-volume">
            <span>${icon('volume')}<strong>Hiệu ứng</strong></span>
            <input id="effects-volume" data-effects-volume type="range" min="0" max="100" step="5" value="${effectsVolume}" aria-label="Âm lượng hiệu ứng">
            <output id="effects-volume-value" data-effects-volume-value for="effects-volume">${effectsVolume}%</output>
          </label>
          <div class="game-setting-row">
            <span class="game-setting-icon is-music">${icon('star')}</span>
            <div><strong>Nhạc nền</strong><small>Giai điệu nhẹ nhàng khi chăm shop.</small></div>
            <button role="switch" aria-checked="${s.music}" aria-label="Nhạc nền" data-action="music" class="game-settings-toggle ${s.music ? 'is-on' : ''}"><i></i><b>${s.music ? 'Bật' : 'Tắt'}</b></button>
          </div>
          <label class="game-volume-row ${s.music ? '' : 'is-disabled'}" for="music-volume">
            <span>${icon('volume')}<strong>Âm lượng nhạc</strong></span>
            <input id="music-volume" data-music-volume type="range" min="0" max="100" step="5" value="${volume}" aria-label="Âm lượng nhạc">
            <output id="music-volume-value" data-music-volume-value for="music-volume">${volume}%</output>
          </label>
        </section>

      </div>

      <footer class="game-settings-footer">
        <button class="settings-text-button" data-action="reset-confirm">${icon('rotate')} Chơi lại từ đầu</button>
        <button class="settings-help-button" data-action="help">${icon('help')} Hướng dẫn chơi</button>
      </footer>
    </section>`);
  }
  private toast(message: string, tone = 'success') {
    const container = document.querySelector<HTMLElement>('#toasts')!;
    if (container.classList.contains('is-selection-active')) return;
    const duration = Math.min(7000, Math.max(4000, message.length * 40));
    const el = document.createElement('span'); el.className = `toast toast-${tone} sale-text-toast`;
    el.style.setProperty('--toast-duration', `${duration}ms`);
    const text = document.createElement('span'); text.textContent = message;
    text.className = 'toast-message';
    el.append(text);
    while (container.children.length >= 3) container.firstElementChild?.remove();
    container.append(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 320); }, duration);
  }

  private animateMoneyDeduction(scope: 'import' | 'finance', amount: number) {
    window.requestAnimationFrame(() => {
      const balance = document.querySelector<HTMLElement>(`[data-animated-balance="${scope}"]`);
      if (!balance || amount <= 0) return;
      balance.classList.remove('is-money-deducted');
      void balance.offsetWidth;
      balance.classList.add('is-money-deducted');

      const deduction = document.createElement('span');
      deduction.className = 'money-deduction-float';
      deduction.textContent = `−${money(amount)}`;
      balance.append(deduction);
      deduction.addEventListener('animationend', () => deduction.remove(), { once: true });
      window.setTimeout(() => balance.classList.remove('is-money-deducted'), 650);
    });
  }
}
