import { furniture, levels, products } from '../data/catalog';
import { looks } from '../data/fashion';
import type { GameStore } from '../systems/store';
import type { AudioSystem } from '../systems/audio';
import { activeCustomer, activeVisit, currentEvent, currentTrend, DAY_DURATION, customerNeedsAdvice, decorAppealScore, MAX_OUTFIT_ITEMS, nextLandExpansion, validOutfit, smartOutfitSelection } from '../systems/rules';
import { defaultFilters } from '../systems/catalog';
import { icon } from './icons';
import { ownerPortrait } from '../art/svg';
import { compact, escapeHtml, money, productImage } from './format';
import { debugPanel, debtWarningModal, decorCatalog, displayFixtureModal, financeModal, financialGameOverModal, importPanel, inventoryPanel, nameShopModal, onlineChannelModal, onlineOrderModal, questPanel, resultModal, serveModal, socialPanel, staffManagementModal, summaryModal, trendPanel, upgradeModal } from './panels';
import type { ShopScene } from '../scenes/ShopScene';

type Tab = 'shop' | 'stock' | 'import' | 'looks' | 'trend' | 'decor' | 'social';
type Modal = 'none' | 'serve' | 'display' | 'result' | 'summary' | 'finance' | 'debt-warning' | 'gameover' | 'upgrade' | 'help' | 'settings' | 'reset' | 'quests' | 'name-shop' | 'staff' | 'online' | 'online-order' | 'debug' | 'close-shop-confirm';
const MONEY_PURCHASE_ACTIONS = new Set(['buy', 'order-import', 'buy-look', 'buy-furniture']);
const navItems: { id: Tab; label: string; icon: string; subtitle: string }[] = [
  { id: 'stock', label: 'Kho hàng', icon: 'hanger', subtitle: 'Hàng đang có' },
  { id: 'import', label: 'Nhập hàng', icon: 'bag', subtitle: 'Bổ sung kho & Lookbook' },
  { id: 'trend', label: 'Xu hướng', icon: 'trend', subtitle: 'Một chút cảm hứng' },
  { id: 'decor', label: 'Bày trí', icon: 'decor', subtitle: 'Nội thất & trưng hàng' },
  { id: 'social', label: 'Bảng tin', icon: 'social', subtitle: 'Chuyện của boutique' },
];

export class GameUI {
  tab: Tab = 'shop';
  modal: Modal = 'none';
  private scene?: ShopScene;
  private saleSpeed: 1 | 2 | 4 = 1;
  private saleTickProgress = 0;
  private selected: string[] = [];
  private outfitCategory = 'all';
  private selectedFurniture?: string;
  private filter = 'all';
  private importFilters = defaultFilters();
  private lookFilters = defaultFilters();
  private importMode: 'products' | 'looks' = 'products';
  private sort = 'level';
  private quantity = 1;
  private importQty = 1;
  private productImportQtys: Record<string, number> = {};
  private lookQtys: Record<string, number> = {};
  private decorCategory = 'all';
  private trendSection: 'hot' | 'out' = 'hot';
  private socialSection: 'feed' | 'recruitment' = 'feed';
  private dialog!: HTMLDialogElement;
  private beforeDialogFocus?: HTMLElement;
  private lastAnnouncement = '';
  private moveMode = false;
  private tutorialStep = 0;
  private tutorialRetry = 0;
  private onlineOrderId = '';
  private suppressSuccessToastAudio = false;
  private onlineHandoverProductIds: string[] = [];
  private serveVisitId = '';

  constructor(private store: GameStore, private audio: AudioSystem) {
    this.shell(); this.render(); this.bind();
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
        this.render();
        if (this.modal === 'serve' && activeVisit(store.state)?.uid !== this.serveVisitId) this.closeModal();
        if (this.modal === 'quests') this.dialog.querySelector('.dialog-inner')!.innerHTML = questPanel(store.state);
        if (this.modal === 'staff') this.dialog.querySelector('.dialog-inner')!.innerHTML = staffManagementModal(store.state);
        if (this.modal === 'online') this.refreshOnlineChannel();
        if (this.modal === 'online-order') this.dialog.querySelector('.dialog-inner')!.innerHTML = onlineOrderModal(store.state, this.onlineOrderId, this.onlineHandoverProductIds);
        if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(store.state);
        if (this.modal === 'debug') this.dialog.querySelector('.dialog-inner')!.innerHTML = debugPanel(store.state);
        this.queueTutorialCue();
      }
      if (event.type === 'toast') {
        this.toast(event.message, event.tone);
        if (event.tone === 'error') audio.play('error');
        else if (!this.suppressSuccessToastAudio) audio.play('click');
      }
      if (event.type === 'sale') {
        if (!event.result.isSelfPick && !event.result.isStaffAssisted) {
          this.openModal('result', resultModal(event.result));
        } else {
          this.toast(
            event.result.success
              ? event.result.isStaffAssisted
                ? `${event.result.staffName ?? 'Nhân viên'} đã tư vấn và chốt đơn cho ${event.result.customer.name} (+${money(event.result.total)})!`
                : `${event.result.customer.name} chốt đơn (+${money(event.result.total)})!`
              : `${event.result.customer.name} rời shop (chưa hợp gu)`,
            event.result.success ? 'success' : 'error'
          );
        }
        audio.play(event.result.viral ? 'reward' : event.result.success ? 'sale' : 'error');
      }
      if (event.type === 'summary') this.openModal('summary', summaryModal(store.state));
      if (event.type === 'debt-warning') this.openModal('debt-warning', debtWarningModal(store.state));
      if (event.type === 'game-over') this.openModal('gameover', financialGameOverModal(store.state));
      if (event.type === 'customer') audio.play('bell');
    });
    setInterval(() => {
      const modalPausesSale = this.modal !== 'none' && this.modal !== 'serve';
      const paused = document.hidden || this.moveMode || this.tab !== 'shop' || modalPausesSale;
      if (!paused && this.store.state.phase === 'open') {
        this.saleTickProgress += this.saleSpeed / 4;
        if (this.saleTickProgress >= 1) {
          this.saleTickProgress -= 1;
          this.store.tick();
        }
      }
      this.updatePatience();
    }, 250);
    window.addEventListener('pagehide', () => store.save.write(store.state));
    document.addEventListener('visibilitychange', () => { if (document.hidden) store.save.write(store.state); });
  }
  attachScene(scene: ShopScene) {
    this.scene = scene;
    this.scene.setMoveModeCallback((active, uid) => this.handleMoveMode(active, uid));
  }
  private shell() {
    document.querySelector('#app')!.innerHTML = `
      <div class="game-viewport">
        <!-- Blocking fallback for mobile browsers that cannot lock orientation. -->
        <div class="landscape-banner" id="landscape-hint">
          <span class="banner-icon">${icon('rotate')}</span>
          <strong class="banner-title">Vui lòng xoay ngang màn hình</strong>
          <span class="banner-text">Game sẽ tiếp tục ngay khi thiết bị ở chế độ ngang.</span>
        </div>

        <div class="game-stage">
          <!-- Top HUD Bar: Level, Day, Currencies, Quick Controls (Fixed trên đỉnh toàn bộ game) -->
          <header class="game-top-bar">
            <!-- LEFT: Level + Day trong 1 capsule nhỏ gọn -->
            <div class="top-left-cluster">
              <button class="level-capsule" data-action="upgrade-open" title="Nâng cấp boutique">
                <span class="level-crown">${icon('crown')}</span>
                <span class="level-title" id="shop-level-pill">Cấp 1</span>
              </button>
              <div id="day-card"></div>
              <div id="shop-status"></div>
            </div>

            <!-- RIGHT: HUD Capsule + Tool Buttons -->
            <div class="top-right-cluster">
              <section class="hud" id="hud" aria-label="Chỉ số cửa hàng"></section>
              <div class="quick-tools-bar">
                <button class="hud-circle-btn quest-hud-button" data-action="quests" title="Nhiệm vụ ngày" aria-label="Nhiệm vụ ngày">${icon('gift')}<b id="quest-ready-badge" class="quest-ready-badge" hidden></b></button>
                <button class="hud-circle-btn" data-action="settings" id="settings-button" aria-label="Cài đặt boutique" title="Cài đặt">${icon('settings')}</button>
                <button class="owner-avatar hud-circle-btn" data-action="home" aria-label="Về trang chủ boutique" title="Về trang chủ boutique">${ownerPortrait(36)}<span class="avatar-home-badge" title="Về trang chủ">${icon('home')}</span></button>
              </div>
            </div>
          </header>

          <!-- Shop Screen View (Canvas + Shop Floating HUD) -->
          <div id="shop-view" class="shop-main-view">
            <div id="game-canvas" role="img" aria-label="Cửa hàng thời trang 2D.">
              <div class="game-loading"><span>${icon('hanger')}</span>Đang mở một giấc mơ nhỏ…</div>
            </div>

            <!-- In-Game Floating HUD Layer (Shop controls only) -->
            <div class="game-hud-layer">
              <button id="staff-manager-button" class="staff-manager-fab" data-action="staff-open" aria-label="Quản lý nhân viên" title="Quản lý nhân viên">
                <span class="staff-fab-icon">${icon('users')}</span><span class="staff-fab-copy"><strong>Đội ngũ</strong><small id="staff-fab-status">Chưa tuyển</small></span><b id="staff-fab-badge" hidden></b>
              </button>
              <button id="online-channel-button" class="online-channel-fab" data-action="online-open" aria-label="Kênh bán hàng online" title="Quản lý kênh bán hàng online">
                <span class="staff-fab-icon online-fab-icon">${icon('globe')}</span><span class="staff-fab-copy"><strong>Kênh online</strong><small id="online-fab-status">Chưa đăng hàng</small></span><b id="online-fab-badge" hidden></b>
              </button>
              <button id="land-expand-button" class="land-expand-fab" data-hold-action="expand-land" aria-label="Nhấn giữ để mở rộng mặt bằng" title="Nhấn giữ 1,2 giây để mở rộng mặt bằng">
                <span class="land-expand-progress" aria-hidden="true"></span>
                <span class="staff-fab-icon land-fab-icon">${icon('expand')}</span><span class="staff-fab-copy"><strong>Mở rộng</strong><small id="land-expand-status">Giữ 1,2 giây</small></span>
              </button>
              <!-- Center Zone: Sub-HUD Tools -->
              <div class="game-center-hud"></div>

              <!-- Bottom Zone: Customer Card, Move Toolbar & Dock Nav -->
              <footer class="game-bottom-hud">
                <div id="sale-controls" class="sale-controls" hidden></div>
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
  private bind() {
    const landButton = document.querySelector<HTMLButtonElement>('#land-expand-button');
    if (landButton) {
      const landHoldDuration = 1200;
      let holdTimer = 0;
      let holdFrame = 0;
      let startTime = 0;
      let startX = 0;
      let startY = 0;
      let draggingShop = false;
      let activePointerId: number | null = null;
      const resetHold = () => {
        window.clearTimeout(holdTimer);
        window.cancelAnimationFrame(holdFrame);
        holdTimer = 0;
        holdFrame = 0;
        landButton.classList.remove('is-holding');
        landButton.style.setProperty('--hold-progress', '0%');
      };
      const drawProgress = () => {
        const progress = Math.min(1, (performance.now() - startTime) / landHoldDuration);
        landButton.style.setProperty('--hold-progress', `${Math.round(progress * 100)}%`);
        if (progress < 1) holdFrame = window.requestAnimationFrame(drawProgress);
      };
      landButton.addEventListener('pointerdown', event => {
        if (event.button !== 0 || landButton.disabled || this.store.state.phase === 'open') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        resetHold();
        activePointerId = event.pointerId;
        this.scene?.setHudPointerBlocked(true);
        startTime = performance.now();
        startX = event.clientX;
        startY = event.clientY;
        draggingShop = false;
        landButton.setPointerCapture(event.pointerId);
        landButton.classList.add('is-holding');
        holdFrame = window.requestAnimationFrame(drawProgress);
        holdTimer = window.setTimeout(() => {
          holdTimer = 0;
          landButton.classList.add('is-complete');
          this.store.expandLand();
          window.setTimeout(() => landButton.classList.remove('is-complete'), 260);
          resetHold();
        }, landHoldDuration);
      });
      landButton.addEventListener('pointermove', event => {
        if (event.pointerId === activePointerId) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        if (!holdTimer && !draggingShop) return;
        if (!draggingShop && Math.hypot(event.clientX - startX, event.clientY - startY) > 10) {
          resetHold();
          draggingShop = true;
          this.scene?.beginHudPan(startX, startY);
        }
        if (draggingShop) this.scene?.moveHudPan(event.clientX, event.clientY);
      });
      const finishLandInteraction = (event: PointerEvent) => {
        if (activePointerId !== null && event.pointerId !== activePointerId) return;
        if (activePointerId !== null) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        resetHold();
        if (draggingShop) this.scene?.endHudPan();
        draggingShop = false;
        activePointerId = null;
        // Keep Phaser disabled until this pointer event has fully left the DOM.
        // Otherwise iOS may deliver the same release to an item under the HUD.
        window.setTimeout(() => this.scene?.setHudPointerBlocked(false), 0);
      };
      landButton.addEventListener('pointerup', finishLandInteraction);
      landButton.addEventListener('pointercancel', finishLandInteraction);
      landButton.addEventListener('lostpointercapture', finishLandInteraction);
      landButton.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); });
      landButton.addEventListener('contextmenu', event => { event.preventDefault(); event.stopImmediatePropagation(); });
      landButton.addEventListener('dragstart', event => { event.preventDefault(); event.stopImmediatePropagation(); });
    }
    document.addEventListener('pointerdown', event => {
      if ((event.target as HTMLElement).closest('#move-toolbar')) this.scene?.preserveSelectionForUiAction();
    });
    document.querySelector<HTMLElement>('#game-canvas')?.addEventListener('pointerup', event => {
      if (this.tutorialStep !== 3 || !this.tutorialActive()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.openTutorialRack();
    }, true);
    document.addEventListener('click', event => {
      const clicked = event.target as HTMLElement;
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
      const isMoneyPurchase = MONEY_PURCHASE_ACTIONS.has(action);
      const moneyBefore = this.store.state.money;
      if (!isMoneyPurchase) this.audio.play('click');
      this.suppressSuccessToastAudio = isMoneyPurchase;
      try {
        this.action(action, target.dataset.id ?? '', target);
      } finally {
        this.suppressSuccessToastAudio = false;
      }
      if (isMoneyPurchase && this.store.state.money < moneyBefore) this.audio.play('spend');
    });
    document.addEventListener('change', event => {
      const target = event.target as HTMLSelectElement;
      if (target.id === 'music-volume') {
        const volume = Number(target.value) / 100;
        this.store.setMusicVolume(volume);
        this.audio.setMusicVolume(volume);
      }
      if (target.id === 'stock-sort') { this.sort = target.value; this.renderPanel(); }
      if (target.dataset.price) {
        const rawPrice = target.value.trim();
        const price = Number(rawPrice.replace(/[^0-9]/g, ''));
        if (rawPrice && this.store.setPrice(target.dataset.price, price)) this.renderPanel();
      }
      if (target.id === 'decor-select') this.selectFurniture(target.value || undefined);
      const field = { 'catalog-style': 'style', 'catalog-occasion': 'occasion', 'catalog-availability': 'availability' }[target.id] as 'style' | 'occasion' | 'availability' | undefined;
      if (field) { this.lookFilters[field] = target.value; this.renderPanel(); }
      const importField = { 'import-style': 'style', 'import-occasion': 'occasion' }[target.id] as 'style' | 'occasion' | undefined;
      if (importField) { this.importFilters[importField] = target.value; this.renderPanel(); }
    });
    document.addEventListener('input', event => {
      const target = event.target as HTMLInputElement;
      if (target.id === 'music-volume') {
        const volume = Number(target.value) / 100;
        this.audio.setMusicVolume(volume);
        const output = this.dialog.querySelector<HTMLOutputElement>('#music-volume-value');
        if (output) output.value = `${Math.round(volume * 100)}%`;
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
        this.renderPanel();
        document.getElementById(target.id)?.focus({ preventScroll: true });
      }
    });
    document.addEventListener('focusout', event => {
      const target = event.target as HTMLElement;
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
      if (target.matches('.fixture-title-edit') && event.key === 'Enter') { event.preventDefault(); target.blur(); return; }
      if (this.tab !== 'decor' || !this.selectedFurniture || this.modal !== 'none' || (event.target as HTMLElement).matches('input,select,textarea')) return;
      const moves: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (moves[event.key]) { event.preventDefault(); this.moveSelected(...moves[event.key]); }
    });
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); if (this.modal === 'gameover') return; this.modal === 'result' ? this.continueAfterSale() : this.closeModal(); });
    this.dialog.addEventListener('click', event => {
      if (event.target !== this.dialog || this.modal === 'none' || this.modal === 'gameover') return;
      const bounds = this.dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (!outside) return;
      event.preventDefault();
      this.modal === 'result' ? this.continueAfterSale() : this.closeModal();
    });
    window.addEventListener('boutique-display', event => {
      const uid = (event as CustomEvent<string>).detail;
      if (uid && this.tab === 'shop' && this.modal === 'none' && !this.moveMode) {
        this.openDisplayFixture(uid);
        if (this.tutorialStep === 3) this.advanceTutorial(4);
      }
    });
  }
  private action(action: string, id: string, target?: HTMLElement) {
    switch (action) {
      case 'nav': {
        if (this.store.state.phase === 'open' && (id === 'import' || id === 'decor' || id === 'looks' || id === 'social')) {
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
        break;
      }
      case 'serve-open': this.openServe(); break;
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
      case 'quantity': this.quantity = Number(id); this.renderPanel(); break;
      case 'import-mode': {
        this.importMode = id === 'looks' ? 'looks' : 'products';
        this.renderPanel();
        break;
      }
      case 'catalog-mode': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách!', 'info');
          return;
        }
        this.importMode = id === 'looks' ? 'looks' : 'products';
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
      case 'order-import': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
          return;
        }
        const qty = this.productImportQtys[id] ?? this.importQty ?? 1;
        const ordered = this.store.orderImport(id, qty);
        if (ordered && this.tutorialStep === 1) this.advanceTutorial(2);
        break;
      }
      case 'collect-orders': this.store.collectOrders(); break;
      case 'look-qty': {
        const lookId = target?.getAttribute('data-look') ?? target?.dataset.look;
        if (lookId) {
          this.lookQtys[lookId] = Number(id) || 1;
          this.renderPanel();
        }
        break;
      }
      case 'buy-look': {
        if (this.store.state.phase === 'open') {
          this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
          return;
        }
        const look = looks.find(l => l.id === id);
        const qty = this.lookQtys[id] ?? 1;
        if (look) this.store.buyOutfit(look.items, qty);
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
      case 'staff-open': this.openModal('staff', staffManagementModal(this.store.state)); break;
      case 'online-open': this.openModal('online', onlineChannelModal(this.store.state)); break;
      case 'online-list': this.store.listOnlineProduct(id); break;
      case 'online-unlist': this.store.removeOnlineProduct(id); break;
      case 'online-toggle': this.store.toggleOnlineChannel(); break;
      case 'online-order-open': this.openOnlineOrder(id); break;
      case 'online-hand-over-select': {
        this.onlineHandoverProductIds = this.onlineHandoverProductIds.includes(id)
          ? this.onlineHandoverProductIds.filter(productId => productId !== id)
          : [...this.onlineHandoverProductIds, id];
        this.dialog.querySelector('.dialog-inner')!.innerHTML = onlineOrderModal(this.store.state, this.onlineOrderId, this.onlineHandoverProductIds);
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
      case 'debug-open': this.openModal('debug', debugPanel(this.store.state)); break;
      case 'debug-action':
        if (id === 'customer' || id === 'online-order') this.closeModal();
        this.store.debug(id);
        break;
      case 'social-section':
        if (id === 'feed' || id === 'recruitment') {
          this.socialSection = id;
          this.renderPanel();
        }
        break;
      case 'recruit-post': {
        const input = document.querySelector<HTMLInputElement>('#staff-salary-input');
        this.store.postRecruitment(Number(input?.value ?? 0));
        break;
      }
      case 'recruit-cancel': this.store.cancelRecruitment(); break;
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
        this.outfitCategory = id;
        this.dialog.querySelector('.dialog-inner')!.innerHTML = serveModal(this.store.state, this.selected, this.outfitCategory);
        this.dialog.querySelector<HTMLButtonElement>(`[data-action="outfit-category"][data-id="${id}"]`)?.focus({ preventScroll: true });
        break;
      case 'outfit-clear':
        this.selected = [];
        this.dialog.querySelector('.dialog-inner')!.innerHTML = serveModal(this.store.state, this.selected, this.outfitCategory);
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
        this.store.upgradeDisplay(uid);
        this.refreshDisplayFixture(uid);
        break;
      }
      case 'select-product': {
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

        const scroll = this.dialog.querySelector('.outfit-grid')?.scrollTop ?? 0;
        this.dialog.querySelector('.dialog-inner')!.innerHTML = serveModal(this.store.state, this.selected, this.outfitCategory);
        const grid = this.dialog.querySelector('.outfit-grid'); if (grid) grid.scrollTop = scroll;
        this.dialog.querySelector<HTMLButtonElement>(`[data-action="select-product"][data-id="${id}"]`)?.focus({ preventScroll: true });
        break;
      }
      case 'serve': this.store.serve(this.selected); break;
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
        this.saleSpeed = this.saleSpeed === 1 ? 2 : this.saleSpeed === 2 ? 4 : 1;
        this.scene?.setSaleSpeed(this.saleSpeed);
        this.render();
        document.querySelector<HTMLButtonElement>('[data-action="sale-speed"]')?.focus({ preventScroll: true });
        break;
      }
      case 'continue': this.continueAfterSale(); break;
      case 'summary': this.openModal('summary', summaryModal(this.store.state)); break;
      case 'finance-open': this.openModal('finance', financeModal(this.store.state)); break;
      case 'take-loan': {
        const input = this.dialog.querySelector<HTMLInputElement>('#loan-amount-input');
        this.store.takeLoan(Number(input?.value));
        if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state);
        break;
      }
      case 'pay-loan': {
        this.store.payLoanDue();
        if (this.modal === 'summary') {
          this.dialog.querySelector('.dialog-inner')!.innerHTML = summaryModal(this.store.state);
          this.scrollModalToTop();
        }
        else if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state);
        break;
      }
      case 'pay-rent': {
        this.store.payRentDue();
        if (this.modal === 'summary') {
          this.dialog.querySelector('.dialog-inner')!.innerHTML = summaryModal(this.store.state);
          this.scrollModalToTop();
        }
        else if (this.modal === 'finance') this.dialog.querySelector('.dialog-inner')!.innerHTML = financeModal(this.store.state);
        break;
      }
      case 'next-day': this.closeModal(); this.store.nextDay(); this.navigate('shop'); break;
      case 'close-modal': {
        const closedDisplay = this.modal === 'display';
        this.closeModal();
        if (closedDisplay) this.scene?.setMoveMode(false);
        if (this.tutorialStep === 5) this.finishGuidedTutorial();
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
      case 'expand-land': {
        this.store.expandLand();
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
        if (this.selectedFurniture) {
          this.store.storeFurniture(this.selectedFurniture);
          this.selectedFurniture = undefined;
          this.scene?.setMoveMode(true, undefined);
          this.renderMoveToolbar();
        }
        break;
      }
      case 'move-start': if (this.selectedFurniture) this.scene?.setMoveMode(true, this.selectedFurniture); break;
      case 'display-open': {
        const uid = this.selectedFurniture;
        if (uid) { this.scene?.setMoveMode(false); this.openDisplayFixture(uid); }
        break;
      }
      case 'move-sell': {
        if (this.selectedFurniture) {
          this.store.sellFurniture(this.selectedFurniture);
          this.selectedFurniture = undefined;
          this.scene?.setMoveMode(true, undefined);
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
      case 'snapshot': this.scene?.snapshot(); break;
      case 'upgrade-open': {
        if (this.store.state.phase === 'open') {
          this.toast('Đang trong giờ bán hàng! Bạn có thể nâng cấp tiệm sau khi đóng cửa nhé.', 'info');
          return;
        }
        this.openModal('upgrade', upgradeModal(this.store.state));
        break;
      }
      case 'upgrade': this.store.upgrade(); this.closeModal(); this.scene?.burst(500, 300, true); this.audio.play('reward'); break;
      case 'sound': this.store.settings('sound', !this.store.state.sound); this.audio.enabled = this.store.state.sound; if (this.modal === 'settings') this.showSettings(); break;
      case 'music': this.store.settings('music', !this.store.state.music); this.audio.setMusicVolume(this.store.state.musicVolume); this.audio.music(this.store.state.music); this.showSettings(); break;
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
      case 'reset': this.closeModal(); this.store.reset(); this.audio.enabled = true; this.audio.setMusicVolume(this.store.state.musicVolume); this.audio.music(this.store.state.music); this.productImportQtys = {}; this.lookQtys = {}; this.decorCategory = 'all'; this.navigate('shop'); setTimeout(() => this.openNameShop(true), 100); break;
    }
  }
  navigate(tab: Tab) {
    if (tab === 'looks') {
      this.importMode = 'looks';
      tab = 'import';
    }
    if (tab !== 'shop' && !navItems.some(n => n.id === tab)) return;
    if (this.store.state.phase === 'open' && (tab === 'import' || tab === 'decor' || tab === 'social')) {
      tab = 'shop';
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
    panel.hidden = showShop;
    const canvasEl = document.querySelector<HTMLElement>('#game-canvas');
    if (canvasEl) {
      canvasEl.style.pointerEvents = showShop ? 'auto' : 'none';
      const innerCanvas = canvasEl.querySelector('canvas');
      if (innerCanvas) innerCanvas.style.pointerEvents = showShop ? 'auto' : 'none';
    }
    this.scene?.setTab(tab);
    this.scene?.setEdit(false);
    this.updateDockVisibility();
    this.render();
    panel.scrollTop = 0;
    requestAnimationFrame(() => { panel.scrollTop = 0; });
    requestAnimationFrame(() => this.scene?.scale?.refresh());
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
    const debugButton = document.querySelector<HTMLElement>('#debug-button');
    if (debugButton) debugButton.hidden = hiddenFromShop;
    const landButton = document.querySelector<HTMLElement>('#land-expand-button');
    if (landButton) landButton.hidden = hiddenFromShop || this.store.state.phase === 'open';
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
    const availableItems = isOpen
      ? navItems.filter(n => n.id === 'stock' || n.id === 'trend')
      : navItems;
    dockNav.innerHTML = availableItems.map(n => `
      <button data-action="nav" data-id="${n.id}" class="dock-item standalone-dock-btn dock-btn-${n.id}" aria-label="${n.label}">
        <div class="dock-icon-bubble dock-bubble-${n.id}">
          ${icon(n.icon)}
        </div>
        <span class="dock-btn-label">${n.label}</span>
      </button>
    `).join('');
  }
  private render() {
    const s = this.store.state;
    const isOpen = s.phase === 'open';
    if (!isOpen) {
      this.saleSpeed = 1;
      this.saleTickProgress = 0;
      this.scene?.setSaleSpeed(1);
    }
    const showShop = this.tab === 'shop';

    document.querySelector('#day-card')!.innerHTML = `<span class="day-sun-icon">${icon('sun')}</span><strong class="day-num">${String(s.day).padStart(2, '0')}</strong>`;
    document.querySelector('#hud')!.innerHTML = `<div class="hud-item wallet"><span class="hud-icon">${icon('coin')}</span><strong data-testid="money">${money(s.money)}</strong></div><div class="hud-item"><span class="hud-icon star-icon">${icon('star')}</span><strong>${s.reputation.toFixed(1)}</strong></div><div class="hud-item"><span class="hud-icon heart-icon">${icon('user')}</span><strong>${compact(s.followers)}</strong></div>`;
    const soundBtn = document.querySelector('#sound-button');
    if (soundBtn) {
      soundBtn.innerHTML = icon(s.sound ? 'volume' : 'mute');
      soundBtn.setAttribute('aria-pressed', String(s.sound));
    }
    const pill = document.querySelector('#shop-level-pill'); if (pill) pill.textContent = `Cấp ${s.level}`;

    const timerVal = s.dayTimer ?? DAY_DURATION;
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const rem = sec % 60;
      return `${m}:${rem < 10 ? '0' : ''}${rem}`;
    };
    const saleControls = document.querySelector<HTMLElement>('#sale-controls')!;
    saleControls.innerHTML = isOpen ? `          <button class="close-shop-button" data-action="close-shop" title="Kết thúc ngày bán và xem tổng kết">
            <span class="sale-btn-icon">${icon('shop')}</span>
            <span class="sale-btn-text">Đóng cửa sớm</span>
          </button>
          <button class="sale-speed-button" data-action="sale-speed" aria-label="Tốc độ bán hàng ${this.saleSpeed}x" title="Đổi tốc độ: 1x → 2x → 4x → 1x" data-speed="${this.saleSpeed}">
            <span class="speed-icon-wrap">${icon('arrow')}</span>
            <strong class="speed-val">${this.saleSpeed}x</strong>
          </button>` : '';
    saleControls.hidden = !isOpen || this.tab !== 'shop' || this.modal !== 'none' || this.moveMode;
    const appeal = decorAppealScore(s);

    if (isOpen) {
      const isUrgent = timerVal <= 15;
      document.querySelector('#shop-status')!.innerHTML = `
        <span class="status-pill is-open"><i class="status-dot"></i><span class="status-label">Mở cửa</span></span>
        <span class="status-countdown-pill ${isUrgent ? 'is-urgent' : ''}" id="day-countdown-box" title="Thời gian bán hàng hôm nay">${icon('clock')} <strong id="day-timer-label">${formatTime(timerVal)}</strong></span>
      `;
    } else if (s.phase === 'preparation') {
      const appeal = decorAppealScore(s);
      document.querySelector('#shop-status')!.innerHTML = `
        <span class="status-pill is-prep"><i class="status-dot"></i><span class="status-label">Chuẩn bị</span></span>
        <span class="status-appeal-pill" title="Điểm thẩm mỹ từ trang trí">${icon('decor')} <span>${appeal}</span></span>
      `;
    } else {
      document.querySelector('#shop-status')!.innerHTML = `<span class="status-pill is-closed"><i class="status-dot"></i><span class="status-label">Đóng cửa</span></span>`;
    }

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
    const staffButton = document.querySelector<HTMLElement>('#staff-manager-button');
    if (staffButton) {
      staffButton.hidden = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || isOpen;
      const status = staffButton.querySelector<HTMLElement>('#staff-fab-status');
      if (status) status.textContent = s.employees.length ? `${s.employees.length} nhân viên` : 'Chưa tuyển';
      const badge = staffButton.querySelector<HTMLElement>('#staff-fab-badge');
      const notices = s.staffLeaveRequests.length + s.staffApplicants.length;
      if (badge) { badge.hidden = notices === 0; badge.textContent = String(notices); }
    }
    const onlineButton = document.querySelector<HTMLElement>('#online-channel-button');
    if (onlineButton) {
      onlineButton.hidden = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode || isOpen;
      const status = onlineButton.querySelector<HTMLElement>('#online-fab-status');
      if (status) status.textContent = !s.onlineChannelEnabled ? 'Đang tạm đóng' : s.onlineOrders.length ? `${s.onlineOrders.length} shipper đang chờ` : s.onlineListings.length ? `${s.onlineListings.length} mẫu đang bán` : 'Chưa đăng hàng';
      const badge = onlineButton.querySelector<HTMLElement>('#online-fab-badge');
      if (badge) { badge.hidden = s.onlineOrders.length === 0; badge.textContent = String(s.onlineOrders.length); }
    }
    const debugButton = document.querySelector<HTMLElement>('#debug-button');
    if (debugButton) debugButton.hidden = this.tab !== 'shop' || this.modal !== 'none' || this.moveMode;
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
    const financeAlert = s.rentDue > 0 || (s.loan?.paymentDue ?? 0) > 0;
    let html = '';
    if (s.phase === 'preparation') {
      html = `<div class="welcome-card"><div class="welcome-text"><span class="eyebrow">${s.day === 1 ? 'YOUR STORY STARTS HERE' : 'A FRESH LITTLE START'}</span><h3>${s.day === 1 ? 'Khởi đầu boutique của riêng bạn' : 'Mở cửa đón những điều dễ thương?'}</h3><p>${s.day === 1 ? 'Bạn bắt đầu với 500.000₫ và kho trống. Hãy nhập hàng, trưng sản phẩm rồi mở cửa; có thể vay thêm vốn nếu cần.' : currentEvent(s).description}</p></div><div class="welcome-actions"><button class="btn btn-secondary finance-entry-btn ${financeAlert ? 'has-finance-alert' : ''}" data-action="finance-open">Tài chính</button><button class="btn btn-primary" data-action="open">Mở cửa đón khách ${icon('arrow')}</button></div></div>`;
    } else if (c) {
      card.hidden = true;
      const announcement = `Khách ${c.name}. ${c.goal}`;
      if (announcement !== this.lastAnnouncement) { document.querySelector('#announcer')!.textContent = announcement; this.lastAnnouncement = announcement; }
    } else if (s.phase === 'open') {
      card.hidden = true;
    } else {
      const isSlowDay = s.stats.sold === 0;
      html = `<div class="welcome-card closing-card ${isSlowDay ? 'slow-day-card' : ''}"><span class="welcome-illustration">${icon(isSlowDay ? 'cloud' : 'sun')}</span><div><span class="eyebrow">${isSlowDay ? 'A QUIET LITTLE DAY' : 'YOU MADE SOMEONE\'S DAY'}</span><h3>${isSlowDay ? 'Hôm nay tiệm hơi vắng đơn...' : 'Một ngày xinh đã khép lại.'}</h3><p>${isSlowDay ? `Đã đón ${s.stats.served} khách, 0 món tìm được chủ mới.` : `${s.stats.happy} nụ cười, ${s.stats.sold} món đồ tìm được chủ mới.`}</p></div><div class="welcome-actions"><button class="btn btn-secondary finance-entry-btn ${financeAlert ? 'has-finance-alert' : ''}" data-action="finance-open">Tài chính</button><button class="btn btn-primary" data-action="summary">Xem tổng kết ${icon('arrow')}</button></div></div>`;
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
    let contentHtml = '';
    if (this.tab === 'stock') {
      contentHtml = inventoryPanel(this.store.state);
    } else if (this.tab === 'import') {
      contentHtml = importPanel(this.store.state, this.importFilters, this.productImportQtys, this.importMode, this.lookQtys);
    } else if (this.tab === 'looks') {
      contentHtml = importPanel(this.store.state, this.importFilters, this.productImportQtys, 'looks', this.lookQtys);
    } else if (this.tab === 'trend') {
      contentHtml = trendPanel(this.store.state, this.trendSection);
    } else if (this.tab === 'social') {
      contentHtml = socialPanel(this.store.state, this.socialSection);
    } else if (this.tab === 'decor') {
      contentHtml = decorCatalog(this.store.state, this.decorCategory);
    }
    if (contentHtml) {
      panel.innerHTML = `<div class="game-panel-body">${contentHtml}</div>`;
    } else {
      panel.innerHTML = '';
    }
  }
  private updatePatience() {
    const s = this.store.state, c = activeCustomer(s);
    const visit = activeVisit(s);
    const label = document.querySelector('#patience-label'); if (label) label.textContent = `${s.patience}s`;
    const bar = document.querySelector<HTMLElement>('#patience-bar'); if (bar && c) bar.style.width = `${visit ? visit.patience / visit.maxPatience * 100 : 0}%`;
    const modal = document.querySelector('#modal-patience'); if (modal) modal.innerHTML = `${icon('clock')} ${s.patience}s`;

    if (s.phase === 'open') {
      const timerVal = s.dayTimer ?? DAY_DURATION;
      const m = Math.floor(timerVal / 60);
      const rem = timerVal % 60;
      const timerStr = `${m}:${rem < 10 ? '0' : ''}${rem}`;
      const timerEl = document.querySelector('#day-timer-label');
      if (timerEl) timerEl.textContent = timerStr;
      const countdownBox = document.querySelector('#day-countdown-box');
      if (countdownBox) countdownBox.classList.toggle('is-urgent', timerVal <= 15);
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
    if (!this.selectedFurniture || this.tab !== 'shop' || this.modal !== 'none') {
      el.hidden = true;
      el.innerHTML = '';
      el.classList.remove('is-selection-toolbar');
      return;
    }
    el.hidden = false;
    const s = this.store.state;
    const sel = s.layout.find(f => f.uid === this.selectedFurniture);
    const data = sel ? furniture.find(f => f.id === sel.id) : null;
    if (!this.moveMode) {
      el.classList.add('is-selection-toolbar');
      el.innerHTML = `
        <div class="move-toolbar-pill is-selection">
          <div class="move-item-meta">
            <span class="move-item-icon">${icon('decor')}</span>
            <div class="move-item-texts">
              <span class="move-item-badge">ĐÃ CHỌN</span>
              <strong class="move-item-name">${sel?.customName || (data ? data.name : 'Đồ vật')}</strong>
            </div>
          </div>
          <div class="move-toolbar-actions">
            ${data?.id === 'shop-sign'
              ? `<button class="move-tool-btn open-btn" data-action="name-shop" title="Đổi tên trên biển hiệu" aria-label="Đổi tên shop"><span class="tool-btn-icon">${icon('edit')}</span><span class="tool-btn-text">Đổi tên</span></button>`
              : `<button class="move-tool-btn open-btn" data-action="display-open" ${!data?.display ? 'disabled' : ''} title="${data?.display ? 'Mở khu trưng bày' : 'Đồ trang trí này không có kho trưng bày'}" aria-label="Mở"><span class="tool-btn-icon">${icon('hanger')}</span><span class="tool-btn-text">Mở</span></button>`}
            <button class="move-tool-btn move-btn" data-action="move-start" title="Di chuyển đồ vật này" aria-label="Di chuyển"><span class="tool-btn-icon">${icon('move')}</span><span class="tool-btn-text">Di chuyển</span></button>
          </div>
        </div>
      `;
      return;
    }
    el.classList.remove('is-selection-toolbar');
    el.innerHTML = `
      <div class="move-toolbar-pill">
        <div class="move-item-meta">
          <span class="move-item-icon">${icon('decor')}</span>
          <div class="move-item-texts">
            <span class="move-item-badge">ĐANG SẮP XẾP</span>
            <strong class="move-item-name">${sel?.customName || (data ? data.name : 'Chạm đồ vật để chọn')}</strong>
          </div>
        </div>
        <div class="move-toolbar-actions">
          ${data?.display ? `<button class="move-tool-btn open-btn" data-action="display-open" title="Mở khu trưng bày hàng" aria-label="Mở"><span class="tool-btn-icon">${icon('hanger')}</span><span class="tool-btn-text">Mở</span></button>` : ''}
          <button class="move-tool-btn rotate-btn" data-action="move-rotate" ${!sel ? 'disabled' : ''} title="Xoay hướng đồ vật" aria-label="Xoay">
            <span class="tool-btn-icon">${icon('rotate')}</span>
            <span class="tool-btn-text">Xoay</span>
          </button>
          <button class="move-tool-btn store-btn" data-action="move-store" ${!sel ? 'disabled' : ''} title="Cất đồ vào kho (giữ nguyên không mất tiền)" aria-label="Cất đồ">
            <span class="tool-btn-icon">${icon('box')}</span>
            <span class="tool-btn-text">Cất</span>
          </button>
          <button class="move-tool-btn sell-btn" data-action="move-sell" ${!sel ? 'disabled' : ''} title="Thu hồi hoàn 50% tiền" aria-label="Thu hồi">
            <span class="tool-btn-icon">${icon('trash')}</span>
            <span class="tool-btn-text">Bán</span>
          </button>
          <button class="move-tool-btn done-btn" data-action="move-done" title="Xong sắp xếp" aria-label="Xong">
            <span class="tool-btn-icon">${icon('check')}</span>
            <span class="tool-btn-text">Xong</span>
          </button>
        </div>
      </div>
    `;
  }
  private moveSelected(dx: number, dy: number) { const f = this.store.state.layout.find(f => f.uid === this.selectedFurniture); if (f) this.store.moveFurniture(f.uid, f.x + dx, f.y + dy); }
  private openDisplayFixture(uid: string) {
    const html = displayFixtureModal(this.store.state, uid);
    if (html) this.openModal('display', html);
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
  openServe() {
    const customer = activeCustomer(this.store.state);
    const visit = activeVisit(this.store.state);
    if (!customer || !visit || !customerNeedsAdvice(this.store.state, customer)) return;
    if (this.saleSpeed !== 1) {
      this.saleSpeed = 1;
      this.saleTickProgress = 0;
      this.scene?.setSaleSpeed(1);
      const speedButton = document.querySelector<HTMLButtonElement>('[data-action="sale-speed"]');
      if (speedButton) {
        speedButton.dataset.speed = '1';
        speedButton.setAttribute('aria-label', 'Tốc độ bán hàng 1x');
        const speedValue = speedButton.querySelector<HTMLElement>('.speed-val');
        if (speedValue) speedValue.textContent = '1x';
      }
    }
    this.serveVisitId = visit.uid;
    this.selected = [];
    this.outfitCategory = 'all';
    this.openModal('serve', serveModal(this.store.state, this.selected, this.outfitCategory));
  }
  private refreshOnlineChannel() {
    const inner = this.dialog.querySelector<HTMLElement>('.dialog-inner');
    if (!inner) return;
    const stockScroll = inner.querySelector<HTMLElement>('.online-dashboard-stock-list')?.scrollTop ?? 0;
    const storefrontScroll = inner.querySelector<HTMLElement>('.storefront-product-grid')?.scrollTop ?? 0;
    inner.innerHTML = onlineChannelModal(this.store.state);
    const restoreScroll = () => {
      const stock = inner.querySelector<HTMLElement>('.online-dashboard-stock-list');
      const storefront = inner.querySelector<HTMLElement>('.storefront-product-grid');
      if (stock) stock.scrollTop = stockScroll;
      if (storefront) storefront.scrollTop = storefrontScroll;
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
    const reset = () => {
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
  private openModal(type: Modal, html: string) {
    if (!this.dialog.open) this.beforeDialogFocus = document.activeElement as HTMLElement;
    this.modal = type;
    const canvasEl = document.querySelector<HTMLElement>('#game-canvas');
    if (canvasEl) {
      canvasEl.style.pointerEvents = 'none';
      const innerCanvas = canvasEl.querySelector('canvas');
      if (innerCanvas) innerCanvas.style.pointerEvents = 'none';
    }
    if (this.scene) this.scene.input.enabled = false;
    this.dialog.querySelector('.dialog-inner')!.innerHTML = html;
    this.dialog.className = `dialog-${type}`;
    if (!this.dialog.open) this.dialog.showModal();
    this.scrollModalToTop();
    // Summary actions sit at the bottom. Focusing one makes iOS Safari scroll there.
    if (type === 'summary') {
      this.dialog.tabIndex = -1;
      this.dialog.focus({ preventScroll: true });
      this.scrollModalToTop();
    } else {
      // Focus the dismiss/continue action rather than a product to prevent accidental purchases.
      this.dialog.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    }
    this.updateDockVisibility();
    this.queueTutorialCue();
  }
  private closeModal() {
    if (this.modal === 'serve') this.serveVisitId = '';
    this.modal = 'none';
    this.dialog.close();
    const showShop = this.tab === 'shop';
    const canvasEl = document.querySelector<HTMLElement>('#game-canvas');
    if (canvasEl) {
      canvasEl.style.pointerEvents = showShop ? 'auto' : 'none';
      const innerCanvas = canvasEl.querySelector('canvas');
      if (innerCanvas) innerCanvas.style.pointerEvents = showShop ? 'auto' : 'none';
    }
    if (this.scene) this.scene.input.enabled = (this.tab === 'shop' || this.tab === 'decor');
    if (this.beforeDialogFocus?.isConnected) this.beforeDialogFocus.focus({ preventScroll: true });
    this.updateDockVisibility();
    this.queueTutorialCue();
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
      element.querySelector(':scope > .tutorial-callout')?.remove();
    });
    document.body.classList.toggle('guided-tutorial-active', this.tutorialActive());
    if (!this.tutorialActive()) return;
    const steps = [
      { selector: '.dock-btn-import', label: 'Bấm Nhập hàng', placement: 'left' },
      { selector: '.import-btn:not([disabled])', label: 'Bấm để nhập mẫu đầu tiên', placement: 'above' },
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
    target.classList.add('tutorial-focus');
    if (step.placement === 'left') target.classList.add('tutorial-cue-left');
    if (step.placement === 'below') target.classList.add('tutorial-cue-below');
    if (step.placement === 'below-left') target.classList.add('tutorial-cue-below-left');
    if (step.placement === 'inside') target.classList.add('tutorial-cue-inside');
    if (step.placement === 'badge') target.classList.add('tutorial-cue-badge');
    const callout = document.createElement('span');
    callout.className = 'tutorial-callout';
    callout.setAttribute('aria-hidden', 'true');
    callout.innerHTML = `<b>${this.tutorialStep + 1}/6</b><span>${step.label}</span>`;
    target.append(callout);
    target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
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
    document.querySelectorAll('.tutorial-focus').forEach(element => {
      element.classList.remove('tutorial-focus', 'tutorial-cue-left', 'tutorial-cue-below', 'tutorial-cue-below-left', 'tutorial-cue-inside', 'tutorial-cue-badge');
      element.querySelector(':scope > .tutorial-callout')?.remove();
    });
    this.store.settings('tutorialDone', true);
  }
  private continueAfterSale() {
    if (this.store.state.phase === 'closed') this.openModal('summary', summaryModal(this.store.state));
    else this.closeModal();
  }
  private showHelp() {
    this.openModal('help', `<div class="modal-heading"><div><span class="eyebrow">HELLO, LITTLE SHOP OWNER</span><h2>Một giấc mơ, bốn bước nhỏ.</h2></div><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></div><div class="help-steps">${[
      ['01', 'hanger', 'Chọn đồ thật có gu', 'Kho ban đầu đang trống. Dùng 500.000₫ vốn có sẵn để nhập mẫu phù hợp và điều chỉnh giá bán.'],
      ['02', 'shop', 'Mở cửa đón khách', `Chạm trực tiếp nhân vật cần tư vấn trong shop, đọc gu và ngân sách rồi chọn tối đa ${MAX_OUTFIT_ITEMS} món khác loại. Set thay áo/quần/đầm; đầm thay áo/quần.`],
      ['03', 'heart', 'Biến outfit thành niềm vui', 'Đồ hợp gu mang về doanh thu, XP và người theo dõi. Influencer hài lòng có thể tạo khoảnh khắc viral.'],
      ['04', 'decor', 'Bày hàng trước khi mở cửa', 'Chạm sào, kệ, tủ hoặc ma-nơ-canh để lấy hàng từ kho ra trưng. Chỉ sản phẩm đang trưng mới được khách chọn mua.'],
    ].map(([n, i, title, description]) => `<div><span>${n}</span><div><h3>${icon(i)} ${title}</h3><p>${description}</p></div></div>`).join('')}</div><div class="notice">${icon('leaf')} Chơi thật thong thả. Thời gian chờ của khách tạm dừng khi xem kho hàng, xu hướng, bày trí shop, bảng tin hoặc chuyển sang tab trình duyệt khác.</div><button class="btn btn-primary full-width" data-action="tutorial-done">Mình sẵn sàng rồi ${icon('arrow')}</button>`);
  }
  private showSettings() {
    const s = this.store.state;
    this.openModal('settings', `<div class="modal-heading"><div><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Cài đặt & Tùy chỉnh</h2></div><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></div>
    
    <div class="ios-pwa-card">
      <div class="pwa-header-row">
        <span class="pwa-app-icon">${icon('hanger')}</span>
        <div>
          <h3>Cài App trên iOS (iPhone/iPad)</h3>
          <p>Chơi mượt mà 100% toàn màn hình, không thanh trình duyệt</p>
        </div>
      </div>
      <div class="pwa-steps-list">
        <div class="pwa-step-item">
          <span class="step-num">1</span>
          <div>Mở game trên trình duyệt <strong>Safari</strong>, chạm nút <strong>Chia sẻ (⎋)</strong> ở thanh dưới cùng.</div>
        </div>
        <div class="pwa-step-item">
          <span class="step-num">2</span>
          <div>Cuộn tìm và chọn mục <strong>"Thêm vào MH chính"</strong> (Add to Home Screen).</div>
        </div>
        <div class="pwa-step-item">
          <span class="step-num">3</span>
          <div>Chạm <strong>Thêm</strong> ở góc trên bên phải. Icon Boutique sẽ xuất hiện ngay trên màn hình iPhone!</div>
        </div>
      </div>
    </div>

    <div class="setting-row"><div><h3>Tên boutique của bạn</h3><p>${escapeHtml(s.shopName || 'My Little Boutique')}</p></div><button class="btn btn-small btn-primary" data-action="name-shop">${icon('edit')} Đổi tên</button></div>
    <div class="setting-row"><div><h3>Âm thanh tương tác</h3><p>Tiếng chuông cửa, đồng xu và những niềm vui nhỏ.</p></div><button role="switch" aria-checked="${s.sound}" aria-label="Âm thanh tương tác" data-action="sound" class="toggle ${s.sound ? 'on' : ''}"><span></span></button></div>
    <div class="setting-row setting-music-row"><div><h3>Nhạc nền boutique</h3><p>Giai điệu pastel pop nhẹ nhàng trong lúc chăm shop.</p></div><button role="switch" aria-checked="${s.music}" aria-label="Nhạc nền" data-action="music" class="toggle ${s.music ? 'on' : ''}"><span></span></button></div>
    <label class="music-volume-control ${s.music ? '' : 'is-muted'}" for="music-volume">
      <span><strong>Âm lượng nhạc</strong><small>Kéo để chọn mức âm lượng dịu tai.</small></span>
      <span class="music-volume-slider">${icon('volume')}<input id="music-volume" type="range" min="0" max="100" step="5" value="${Math.round(s.musicVolume * 100)}" aria-label="Âm lượng nhạc"><output id="music-volume-value" for="music-volume">${Math.round(s.musicVolume * 100)}%</output></span>
    </label>
    <div class="setting-row"><div><h3>Tiến trình của bạn</h3><p>${this.store.save.available ? 'Tự động lưu trên trình duyệt này sau mỗi thao tác.' : 'Trình duyệt đang chặn lưu trữ. Tiến trình có thể mất khi đóng trang.'}</p></div>${icon(this.store.save.available ? 'check' : 'help')}</div>
    <div class="setting-row"><div><h3>Một khởi đầu mới</h3><p>Xóa tiến trình hiện tại và bắt đầu từ ngày đầu tiên.</p></div><button class="btn btn-small btn-white" data-action="reset-confirm">Chơi lại</button></div>
    <button class="btn btn-secondary full-width" data-action="help">${icon('help')} Xem hướng dẫn chơi</button>`);
  }
  private toast(message: string, tone = 'success') {
    const el = document.createElement('div'); el.className = `toast toast-${tone}`;
    const ico = document.createElement('span'); ico.innerHTML = icon(tone === 'error' ? 'close' : tone === 'info' ? 'help' : 'check');
    const text = document.createElement('span'); text.textContent = message; el.append(ico, text);
    const container = document.querySelector('#toasts')!; if (container.children.length > 2) container.firstElementChild?.remove(); container.append(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 250); }, 4000);
  }
}
