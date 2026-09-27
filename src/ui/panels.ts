import { categories, furniture, levels, products } from '../data/catalog';
import { fashionStyles } from '../data/fashion';
import { activeCustomer, activeEmployees, buyPrice, currentEvent, currentTrend, dailyRent, decorAppealScore, displayCapacity, displayLevel, displayUpgradeCost, displayedInventory, displayedQuantity, isOutOfTrend, isTrending, LOAN_DAILY_RATE, LOAN_MAX, LOAN_MIN, LOAN_PAYMENT_RATE, loyaltyMilestones, loyaltyTier, matchScore, MAX_OUTFIT_ITEMS, nextStaffRequirement, onlineOrderChance, previousTrend, sellPrice, staffCapacity } from '../systems/rules';
import type { Furniture, GameState, OnlineOrder, Product, SaleResult } from '../types';
import { avatarImage, compact, escapeHtml, furnitureImage, money, productImage, staffImage } from './format';
import { icon } from './icons';
export { stockPanel, inventoryPanel, importPanel } from './catalogPanel';

export function questPanel(s: GameState) {
  const quests = [
    { id: 'sales', label: 'Bán 3 món đồ', desc: 'Tư vấn hoặc bán lẻ sản phẩm cho khách ghé tiệm', count: s.stats.sold, target: 3, art: 'bag', rewardMoney: 35000, rewardXp: 10 },
    { id: 'trend', label: 'Bán 2 món hợp xu hướng', desc: 'Bán các món đồ đúng hot trend thời trang thịnh hành', count: s.stats.trendSales, target: 2, art: 'trend', rewardMoney: 35000, rewardXp: 10 },
  ];
  return `
    <div class="quest-modal-container">
      <button class="quest-close-btn" data-action="close-modal" aria-label="Đóng nhiệm vụ" title="Đóng">${icon('close')}</button>
      <header class="quest-modal-heading">
        <span class="quest-eyebrow-chip">${icon('star')} NHIỆM VỤ HÔM NAY</span>
        <h2>Ngày ${s.day}</h2>
      </header>

      <!-- Danh Sách Nhiệm Vụ -->
      <div class="daily-quests-list">
        ${quests.map(q => {
          const claimed = s.claimed.includes(`${s.day}:${q.id}`);
          const ready = q.count >= q.target;
          const current = Math.min(q.count, q.target);
          const percent = Math.min(100, Math.round((current / q.target) * 100));

          return `
            <article class="daily-quest-card ${claimed ? 'is-claimed' : ready ? 'is-ready' : 'is-progress'}" data-quest="${q.id}">
              <div class="quest-icon-bubble bubble-${q.art}">
                ${icon(q.art)}
              </div>

              <div class="quest-content-col">
                  <div class="quest-title-row">
                    <h3 class="quest-title">${q.label}</h3>
                    ${claimed 
                      ? `<span class="quest-status-chip chip-claimed">${icon('check')} Đã nhận</span>` 
                      : ready 
                      ? `<span class="quest-status-chip chip-ready">${icon('star')} Hoàn thành!</span>` 
                      : `<span class="quest-status-chip chip-waiting">Đang làm</span>`}
                  </div>

                  <p class="quest-desc">${q.desc}</p>

                  <!-- Reward Chips -->
                  <div class="quest-rewards-row">
                    <span class="reward-pill money-pill">${icon('coin')} +${money(q.rewardMoney)}</span>
                    <span class="reward-pill xp-pill">${icon('star')} +${q.rewardXp} XP</span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="quest-progress-container">
                    <div class="quest-progress-track">
                      <div class="quest-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="quest-counter-text">
                      <strong>${current}</strong> / ${q.target}
                    </span>
                  </div>
              </div>

              ${ready && !claimed ? `<div class="quest-card-footer"><button class="btn quest-claim-btn btn-ready" data-action="claim" data-id="${q.id}">${icon('gift')} Nhận thưởng</button></div>` : ''}
            </article>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

export function trendPanel(s: GameState, section: 'hot' | 'out' = 'hot') {
  const trend = currentTrend(s), event = currentEvent(s);
  const cooledTrend = previousTrend(s);
  const trendProds = products.filter(p => isTrending(s, p));
  const unlockedTrendProds = trendProds.filter(p => p.level <= s.level);
  const outTrendStock = products.filter(p => p.level <= s.level && isOutOfTrend(s, p) && (s.inventory[p.id] ?? 0) > 0);
  const heroProducts = trendProds.slice(0, 3);

  return `
    <div class="game-panel-header-card trend-panel-header">
      <div class="panel-header-left">
        <span class="panel-header-icon trend-header-icon">${icon('trend')}</span>
        <div class="panel-header-texts">
          <span class="panel-eyebrow">THE STYLE FORECAST</span>
          <h2>DỰ BÁO XU HƯỚNG</h2>
          <p>Nắm bắt phong cách thịnh hành, phối đồ chuẩn gu khách hàng</p>
        </div>
      </div>
      <div class="panel-header-right">
        <div class="heading-badges">
          <span class="panel-stat-chip">${icon('sun')} Ngày ${s.day}</span>
          <span class="panel-stat-chip highlight-trend">${icon('trend')} +${trend.bonus}% Style</span>
          <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">
            ${icon('close')} <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>

    <div class="trend-view-tabs" data-trend-view="${section}" role="tablist" aria-label="Nhóm xu hướng">
      <button class="trend-view-tab ${section === 'hot' ? 'active' : ''}" data-action="trend-section" data-id="hot" role="tab" aria-selected="${section === 'hot'}">
        ${icon('trend')} Đang thịnh hành
      </button>
      <button class="trend-view-tab ${section === 'out' ? 'active' : ''}" data-action="trend-section" data-id="out" role="tab" aria-selected="${section === 'out'}">
        ${icon('clock')} Hàng tồn cần xoay vòng <span>${outTrendStock.length}</span>
      </button>
    </div>

    <!-- Hero Lookbook Card -->
    <div class="trend-hero-card">
      <div class="trend-hero-content">
        <div class="trend-hero-badge-row">
          <span class="trend-hero-tag">${icon('trend')} XU HƯỚNG THỊNH HÀNH</span>
          <span class="trend-bonus-pill">${icon('trend')} +${trend.bonus}% Điểm phong cách</span>
        </div>
        <h3 class="trend-hero-title">${escapeHtml(trend.name)} <span class="trend-hero-sub">is in the air.</span></h3>
        <p class="trend-hero-desc">${escapeHtml(trend.subtitle)}</p>
        <div class="trend-tags-wrap">
          ${trend.tags.map(t => `<span class="trend-tag-pill">#${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="trend-style-match">
          <span class="trend-match-label">${icon('hanger')} Gu thời trang liên kết:</span>
          <strong class="trend-match-styles">${trend.styles.join(' • ')}</strong>
        </div>
        <p class="trend-hero-tip">
          Trang phục hợp xu hướng sẽ tăng điểm số hài lòng khi tư vấn. Vị khách <em>Trend Hunter</em> sẽ đặc biệt yêu thích!
        </p>
        <div class="trend-hero-actions">
          <button class="btn btn-primary" data-action="nav" data-id="stock">
            ${icon('hanger')} <span>Xem tủ đồ có sẵn</span>
          </button>
          <button class="btn btn-secondary" data-action="nav" data-id="import">
            ${icon('bag')} <span>Nhập hàng theo trend</span>
          </button>
        </div>
      </div>
      <div class="trend-lookbook-stack" aria-hidden="true">
        <div class="lookbook-frame lookbook-back">${heroProducts[1] ? productImage(heroProducts[1]) : ''}</div>
        <div class="lookbook-frame lookbook-mid">${heroProducts[2] ? productImage(heroProducts[2]) : ''}</div>
        <div class="lookbook-frame lookbook-front">
          ${heroProducts[0] ? productImage(heroProducts[0]) : ''}
          <div class="lookbook-caption">
            <span>trending now</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Event Banner -->
    <div class="trend-event-banner">
      <div class="trend-event-icon-box">${icon('sun')}</div>
      <div class="trend-event-info">
        <span class="eyebrow">BẢN TIN SỰ KIỆN HÔM NAY</span>
        <h4>${escapeHtml(event.name)}</h4>
        <p>${escapeHtml(event.description)}</p>
      </div>
      ${event.discount < 1 ? `<div class="event-pill-highlight">${icon('tag')} Giảm giá nhập -${Math.round((1 - event.discount) * 100)}%</div>` : ''}
      ${event.extra > 0 ? `<div class="event-pill-highlight">${icon('users')} +${event.extra} Khách ghé shop</div>` : ''}
    </div>

    <!-- Wishlist Suggestions -->
    <div class="section-title trend-section-title hot-trend-section-title">
      <div>
        <h3>Wishlist gợi ý cho boutique</h3>
        <p>${unlockedTrendProds.length} thiết kế hợp xu hướng đã mở khóa</p>
      </div>
      <span class="count-pill">Cấp ${s.level}</span>
    </div>

    <div class="trend-products-grid hot-trend-products-grid">
      ${unlockedTrendProds.map(p => {
        const inStock = s.inventory[p.id] ?? 0;
        return `
          <div class="trend-product-card">
            <div class="trend-card-media">
              <span class="trend-card-pill">${icon('trend')} Hot</span>
              ${productImage(p)}
            </div>
            <div class="trend-card-body">
              <div class="trend-card-style-tag">${p.style}</div>
              <strong class="trend-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</strong>
              <div class="trend-card-meta">
                <span class="trend-card-price">${money(sellPrice(s, p))}</span>
                <span class="trend-card-stock ${inStock > 0 ? 'is-instock' : 'is-empty'}">
                  ${inStock > 0 ? `Còn ${inStock} món` : 'Hết hàng'}
                </span>
              </div>
              <button class="btn ${inStock > 0 ? 'btn-secondary' : 'btn-primary'} btn-small trend-card-action" data-action="nav" data-id="${inStock > 0 ? 'stock' : 'import'}">
                ${icon(inStock > 0 ? 'hanger' : 'plus')} <span>${inStock > 0 ? 'Xem tủ đồ' : 'Nhập hàng'}</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${cooledTrend ? `
      <div class="out-trend-notice">
        <span class="out-trend-notice-icon">${icon('clock')}</span>
        <div>
          <span class="eyebrow">VỪA HẠ NHIỆT</span>
          <h3>${escapeHtml(cooledTrend.name)} đã out trend</h3>
          <p>Khách thường giảm 10 điểm hứng thú; Trend Hunter giảm 18 điểm. Hãy cân nhắc giảm giá và ưu tiên hàng đang hot.</p>
        </div>
        <span class="out-trend-count">${outTrendStock.length} mẫu còn kho</span>
      </div>
      ${outTrendStock.length ? `
        <div class="section-title trend-section-title out-trend-section-title">
          <div>
            <h3>Hàng tồn cần xoay vòng</h3>
            <p>Các mẫu trong kho từng hợp xu hướng ngày trước nhưng đã hạ nhiệt hôm nay</p>
          </div>
        </div>
        <div class="trend-products-grid out-trend-products-grid">
          ${outTrendStock.map(p => `
            <div class="trend-product-card is-out-trend">
              <div class="trend-card-media">
                <span class="trend-card-pill out-trend-pill">Hạ nhiệt</span>
                ${productImage(p)}
              </div>
              <div class="trend-card-body">
                <div class="trend-card-style-tag">${p.style}</div>
                <strong class="trend-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</strong>
                <div class="trend-card-meta">
                  <span class="trend-card-price">${money(sellPrice(s, p))}</span>
                  <span class="trend-card-stock is-instock">Còn ${s.inventory[p.id] ?? 0} món</span>
                </div>
                <button class="btn btn-secondary btn-small trend-card-action" data-action="nav" data-id="stock">
                  ${icon('tag')} <span>Điều chỉnh giá</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<div class="out-trend-empty">Kho không còn mẫu out trend — bạn đang xoay vòng hàng rất tốt.</div>`}
    ` : `
      <div class="out-trend-notice is-first-day">
        <span class="out-trend-notice-icon">${icon('clock')}</span>
        <div>
          <span class="eyebrow">CHƯA CÓ DỮ LIỆU</span>
          <h3>Chưa có xu hướng nào hạ nhiệt</h3>
          <p>Tab này sẽ theo dõi hàng tồn out trend từ ngày thứ 2 để bạn kịp điều chỉnh giá và trưng bày.</p>
        </div>
        <span class="out-trend-count">0 mẫu còn kho</span>
      </div>
      <div class="out-trend-empty">Hãy hoàn thành ngày đầu tiên để bắt đầu theo dõi vòng đời xu hướng.</div>
    `}
  `;
}

export const decorCategories: Record<string, { label: string; match: (f: Furniture) => boolean }> = {
  all: { label: 'Tất cả', match: () => true },
  display: { label: 'Thiết bị trưng bày', match: f => !!f.display },
  decoration: { label: 'Trang trí thuần túy', match: f => !f.display },
  mirror: { label: 'Gương & Check-in', match: f => ['mirror', 'coquette-mirror', 'wavy-mirror', 'fitting'].includes(f.id) },
  plants: { label: 'Cây & Hoa tươi', match: f => ['plant', 'flowers', 'monstera-plant'].includes(f.id) },
  seating: { label: 'Bàn ghế & Quầy', match: f => ['counter', 'beanbag', 'sofa', 'shell-sofa', 'coffee-corner', 'vinyl-player'].includes(f.id) },
  decor: { label: 'Thảm & Đèn chill', match: f => ['atelier-rug', 'heart-rug', 'checkered-rug', 'tulip-lamp', 'crystal-chandelier'].includes(f.id) },
  art: { label: 'Tranh & Đồ treo tường', match: f => ['boutique-window', 'blush-blinds', 'shop-sign', 'fashion-print', 'gallery-print', 'botanical-print', 'runway-print', 'parfum-print', 'shoe-sketch-print', 'ribbon-sign', 'neon-sign', 'lightbox-sign'].includes(f.id) },
};

function decorCard(s: GameState, f: Furniture, storedCount: number, placedCount: number) {
  const isLocked = f.level > s.level;
  const isAffordable = s.money >= f.price;
  const styleColor = f.style && fashionStyles[f.style as keyof typeof fashionStyles]
    ? fashionStyles[f.style as keyof typeof fashionStyles].color
    : '#d4429a';

  return `
    <article class="decor-card ${isLocked ? 'is-locked' : ''}" data-decor-id="${f.id}">
      <div class="decor-card-preview" style="--decor-color:${styleColor}22">
        ${furnitureImage(f)}
        <span class="decor-size-tag">${f.width}×${f.height} ô</span>
        <span class="fixture-type-tag ${f.display ? 'is-functional' : ''}">${f.display ? `Có công dụng · ${f.display.capacity} món` : 'Chỉ trang trí'}</span>
        ${placedCount > 0 ? `<span class="decor-placed-badge">${icon('check')} Đã đặt: ${placedCount}</span>` : ''}
        ${storedCount > 0 ? `<span class="decor-in-store-tag">${icon('box')} Kho: ${storedCount}</span>` : ''}
      </div>

      <div class="decor-card-body">
        <div class="decor-meta-strip">
          ${f.style ? `<span class="item-style-badge" style="border-color:${styleColor}88; color:${styleColor}">${f.style}</span>` : ''}
          <span class="decor-appeal-badge">${icon('decor')} +${f.appeal} Thẩm mỹ</span>
        </div>

        <h3 class="decor-card-title" title="${escapeHtml(f.name)}">${f.name}</h3>

        ${f.description ? `<p class="decor-card-desc">${escapeHtml(f.description)}</p>` : ''}

        <div class="decor-card-actions">
          ${storedCount > 0 ? `
            <button class="btn btn-primary decor-action-btn decor-place-stored-btn" data-action="place-stored" data-id="${f.id}">
              ${icon('box')} <span>Lấy từ kho (0₫)</span>
            </button>
            <button class="decor-buy-sub-btn" data-action="buy-furniture" data-id="${f.id}" title="Mua thêm mới với giá ${money(f.price)}" ${isLocked || !isAffordable ? 'disabled' : ''}>
              ${icon('plus')} Mua thêm · ${money(f.price)}
            </button>
          ` : `
            <button class="btn ${isLocked ? 'btn-muted' : isAffordable ? 'btn-primary' : 'btn-secondary'} decor-action-btn decor-buy-btn" data-action="buy-furniture" data-id="${f.id}" ${isLocked || !isAffordable ? 'disabled' : ''}>
              ${icon(isLocked ? 'lock' : 'plus')}
              <span>${isLocked ? `Mở ở Cấp ${f.level}` : isAffordable ? `Sắm ngay · ${money(f.price)}` : `Cần ${money(f.price)}`}</span>
            </button>
          `}
        </div>
      </div>
    </article>
  `;
}

export function decorCatalog(s: GameState, currentCategory = 'all') {
  const totalAppeal = decorAppealScore(s);
  const storedList = s.storedFurniture ?? [];
  const storedCounts = storedList.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueStoredIds = Object.keys(storedCounts);

  const activeCategory = decorCategories[currentCategory] ? currentCategory : 'all';
  const filterFn = decorCategories[activeCategory].match;
  const filteredFurniture = furniture.filter(filterFn);

  return `
    <div class="game-panel-header-card decor-panel-header">
      <div class="panel-header-left">
        <span class="panel-header-icon decor-header-icon">${icon('decor')}</span>
        <div class="panel-header-texts">
          <span class="panel-eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>BÀY TRÍ SHOP</h2>
          <p>Chọn đồ trang trí hoặc thiết bị thực tế để đưa hàng từ kho lên sàn bán</p>
        </div>
      </div>
      <div class="panel-header-right">
        <div class="heading-badges">
          <span class="panel-stat-chip panel-money-chip">${icon('coin')} ${money(s.money)}</span>
          <span class="panel-stat-chip highlight-decor">${icon('decor')} +${totalAppeal} Thẩm mỹ</span>
          <span class="panel-stat-chip">${icon('hanger')} ${s.layout.length} Đã đặt</span>
          ${storedList.length > 0 ? `<span class="panel-stat-chip store-chip">${icon('box')} ${storedList.length} Trong kho</span>` : ''}
          <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">
            ${icon('close')} <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hướng dẫn chế độ di chuyển riêng biệt -->
    <div class="decor-move-tip-banner">
      <span class="move-tip-icon">${icon('move')}</span>
      <div class="move-tip-content">
        <strong>Thiết bị trưng bày hoạt động theo hàng thật:</strong>
        <span>Chạm sào, kệ, tủ hoặc ma-nơ-canh để chọn hàng trong kho. Chỉ món đang trưng mới bán được. Khi cất thiết bị, hàng đang trưng tự trở về kho.</span>
      </div>
    </div>

    ${storedList.length > 0 ? `
      <!-- Mục nội thất đang cất trong kho -->
      <section class="decor-storage-section">
        <div class="storage-title-wrap">
          <span class="storage-icon">${icon('box')}</span>
          <div>
            <h3>Kho Nội Thất Đang Cất (${storedList.length} món)</h3>
            <p>Các món đồ bạn đã cất giữ. Chạm để bày ra shop hoàn toàn miễn phí!</p>
          </div>
        </div>
        <div class="decor-catalog-grid decor-storage-grid">
          ${uniqueStoredIds.map(id => {
            const f = furniture.find(item => item.id === id);
            if (!f) return '';
            const count = storedCounts[id];
            const placedCount = s.layout.filter(l => l.id === f.id).length;
            return decorCard(s, f, count, placedCount);
          }).join('')}
        </div>
      </section>
      <div class="storage-divider"></div>
    ` : ''}

    <!-- Toolbar Phân Loại Nội Thất -->
    <div class="decor-category-toolbar">
      <div class="category-scroll-strip" role="tablist" aria-label="Danh mục nội thất">
        ${Object.entries(decorCategories).map(([id, cat]) => `
          <button class="filter cat-chip ${id === activeCategory ? 'active' : ''}" data-action="decor-category" data-id="${id}" aria-pressed="${id === activeCategory}">
            ${cat.label}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="decor-catalog-grid">
      ${filteredFurniture.map(f => {
        const placedCount = s.layout.filter(l => l.id === f.id).length;
        const storedCount = storedCounts[f.id] ?? 0;
        return decorCard(s, f, storedCount, placedCount);
      }).join('')}
    </div>
  `;
}

export function toShopHandle(name: string): string {
  const clean = (name || 'boutique')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
  return clean ? `@${clean}` : '@boutique';
}

const staffStat = (label: string, value: number, tone: string) => `
  <div class="staff-stat"><span><i style="background:${tone}"></i>${label}</span><strong>${value}</strong><div><b style="width:${value}%;background:${tone}"></b></div></div>`;

export function debugPanel(s: GameState) {
  const phaseLabel = s.phase === 'open' ? 'Đang bán hàng' : s.phase === 'closed' ? 'Đã đóng cửa' : 'Chuẩn bị';
  return `<div class="debug-panel">
    <header class="debug-panel-header">
      <div class="debug-header-icon">${icon('settings')}</div>
      <div><span class="panel-eyebrow">TESTING TOOLKIT</span><h2>Debug boutique</h2><p>Thay đổi nhanh trạng thái để kiểm tra tính năng.</p></div>
      <button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
    </header>
    <div class="debug-warning">${icon('help')} Các thay đổi bên dưới được lưu vào tiến trình hiện tại.</div>
    <div class="debug-state-strip">
      <span>${icon('coin')} <b>${money(s.money)}</b></span>
      <span>${icon('crown')} <b>Cấp ${s.level}</b></span>
      <span>${icon('star')} <b>${s.xp} XP</b></span>
      <span>${icon('sun')} <b>Ngày ${s.day}</b></span>
      <span>${icon('decor')} <b>Mặt bằng cấp ${(s.landLevel ?? 0) + 1}</b></span>
      <span>${icon('shop')} <b>${phaseLabel}</b></span>
    </div>
    <section class="debug-section">
      <div class="debug-section-title"><span>KINH TẾ & TIẾN TRÌNH</span><small>Chuẩn bị tài nguyên thử nghiệm</small></div>
      <div class="debug-action-grid">
        <button data-action="debug-action" data-id="funds"><span>${icon('coin')}</span><div><strong>+1.000.000₫</strong><small>Thêm tiền mặt</small></div></button>
        <button data-action="debug-action" data-id="xp"><span>${icon('star')}</span><div><strong>+500 XP</strong><small>Thử nâng cấp shop</small></div></button>
        <button data-action="debug-action" data-id="stock"><span>${icon('hanger')}</span><div><strong>Đầy kho test</strong><small>10 món mỗi mẫu đã mở</small></div></button>
        <button data-action="debug-action" data-id="next-day"><span>${icon('sun')}</span><div><strong>Sang ngày kế</strong><small>Xử lý hồ sơ và nghỉ phép</small></div></button>
      </div>
    </section>
    <section class="debug-section">
      <div class="debug-section-title"><span>NHÂN VIÊN</span><small>${s.employees.length} nhân viên · ${s.staffApplicants.length} hồ sơ · ${s.staffLeaveRequests.length} đơn nghỉ</small></div>
      <div class="debug-action-grid">
        <button data-action="debug-action" data-id="recruitment-ready"><span>${icon('decor')}</span><div><strong>Mở khóa tuyển dụng</strong><small>Shop 3 · mặt bằng 3</small></div></button>
        <button data-action="debug-action" data-id="applicants"><span>${icon('social')}</span><div><strong>Tạo 3 hồ sơ</strong><small>Bỏ qua 2 ngày chờ</small></div></button>
        <button data-action="debug-action" data-id="hire"><span>${icon('users')}</span><div><strong>Nhận nhân viên</strong><small>Chọn hồ sơ đầu tiên</small></div></button>
        <button data-action="debug-action" data-id="leave"><span>${icon('clock')}</span><div><strong>Tạo đơn xin nghỉ</strong><small>Thử duyệt hoặc từ chối</small></div></button>
      </div>
    </section>
    <section class="debug-section debug-live-section">
      <div class="debug-section-title"><span>BÁN HÀNG</span><small>Mở shop và tạo tình huống trực tiếp</small></div>
      <div class="debug-live-actions">
        <button class="debug-customer-button" data-action="debug-action" data-id="customer">${icon('users')} <span><strong>Gọi một khách vào shop</strong><small>Panel sẽ đóng để bạn tương tác ngay</small></span>${icon('arrow')}</button>
        <button class="debug-customer-button is-online" data-action="debug-action" data-id="online-order">${icon('truck')} <span><strong>Gọi thử đơn online</strong><small>Tạo đơn và gọi shipper tới shop</small></span>${icon('arrow')}</button>
      </div>
    </section>
  </div>`;
}

function recruitmentBoard(s: GameState) {
  const capacity = staffCapacity(s);
  const requirement = nextStaffRequirement(s);
  const full = s.employees.length >= capacity && capacity > 0;
  const locked = !full && (s.level < requirement.level || (s.landLevel ?? 0) < requirement.landLevel);
  const applicants = s.staffApplicants;
  return `
    <section class="recruitment-board ${locked ? 'is-locked' : ''}">
      <div class="recruitment-heading">
        <div class="recruitment-heading-icon">${icon('users')}</div>
        <div><span class="panel-eyebrow">BOUTIQUE CAREERS</span><h3>Góc tuyển dụng</h3><p>Tìm một cộng sự giúp tư vấn khách và tăng cơ hội nhận tip.</p></div>
        <span class="staff-capacity-chip">${s.employees.length}/${capacity} nhân viên</span>
      </div>
      ${locked ? `
        <div class="recruitment-lock-card">${icon('lock')}<div><strong>Chưa đủ điều kiện mở vị trí tiếp theo</strong><span>Cần shop cấp ${requirement.level} và mặt bằng cấp ${requirement.landLevel + 1}. Hiện tại: cấp ${s.level}, mặt bằng cấp ${(s.landLevel ?? 0) + 1}.</span></div></div>
      ` : full ? `
        <div class="recruitment-complete-card">${icon('check')}<div><strong>Đội ngũ hiện đã đủ người</strong><span>Mở rộng mặt bằng và nâng cấp shop để tuyển thêm nhân viên.</span></div><button class="btn btn-secondary btn-small" data-action="staff-open">Quản lý đội ngũ</button></div>
      ` : applicants.length ? `
        <div class="applicant-intro"><div><strong>${applicants.length} hồ sơ mới</strong><span>Chọn một ứng viên phù hợp với hướng phát triển của boutique.</span></div><button class="btn-text" data-action="recruit-cancel">Đóng tin</button></div>
        <div class="applicant-grid">${applicants.map(candidate => `
          <article class="applicant-card">
            <div class="applicant-portrait">${staffImage(candidate.appearance, candidate.name)}<span>Ứng tuyển ngày ${candidate.appliedDay}</span></div>
            <div class="applicant-copy"><span class="staff-role">${escapeHtml(candidate.role)}</span><h4>${escapeHtml(candidate.name)}</h4><p>${escapeHtml(candidate.bio)}</p>
              <div class="staff-stats-compact">${staffStat('Tư vấn', candidate.service, '#e85aa6')}${staffStat('Chốt đơn', candidate.persuasion, '#8c68e8')}${staffStat('Duyên dáng', candidate.charm, '#e9ad35')}${staffStat('Ổn định', candidate.reliability, '#55b89a')}</div>
              <div class="applicant-footer"><span><small>Lương/ngày</small><strong>${money(candidate.salary)}</strong></span><button class="btn btn-primary btn-small" data-action="staff-hire" data-id="${candidate.id}">${icon('check')} Nhận vào làm</button></div>
            </div>
          </article>`).join('')}</div>
      ` : s.recruitmentPost ? `
        <div class="recruitment-waiting">
          <div class="waiting-paper">${icon('edit')}<span></span><span></span><span></span></div>
          <div><strong>Tin tuyển dụng đang được lan tỏa</strong><p>Lương đề xuất <b>${money(s.recruitmentPost.salary)}/ngày</b>. Hồ sơ dự kiến đến vào ngày ${s.recruitmentPost.applicantsDay}.</p></div>
          <button class="btn-text" data-action="recruit-cancel">Hủy tin</button>
        </div>
      ` : `
        <div class="recruitment-compose">
          <div class="compose-copy"><strong>Đăng tin tuyển cộng sự mới</strong><span>Lương cao giúp thu hút ứng viên có chỉ số tốt hơn, nhưng sẽ được trừ vào cuối mỗi ngày.</span></div>
          <label class="salary-field"><span>Mức lương/ngày</span><div><input id="staff-salary-input" type="number" min="30000" max="180000" step="5000" value="50000"/><b>₫</b></div><small>Gợi ý: 50.000₫ – 90.000₫</small></label>
          <button class="btn btn-primary recruitment-submit" data-action="recruit-post">${icon('social')} Đăng lên bảng tin</button>
        </div>
      `}
    </section>`;
}

export function staffManagementModal(s: GameState) {
  const working = activeEmployees(s);
  const wages = s.employees.reduce((sum, employee) => sum + employee.salary, 0);
  return `<div class="staff-modal">
    <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng quản lý nhân viên" title="Đóng">${icon('close')}</button>
    ${s.staffLeaveRequests.length ? `<section class="leave-request-section"><div class="staff-section-heading"><div><span>ĐƠN XIN NGHỈ</span><h3>Cần bạn duyệt</h3></div><b>${s.staffLeaveRequests.length}</b></div>${s.staffLeaveRequests.map(request => {
      const employee = s.employees.find(item => item.uid === request.employeeUid);
      if (!employee) return '';
      return `<article class="leave-request-card"><div class="leave-mini-avatar">${staffImage(employee.appearance, employee.name)}</div><div><strong>${escapeHtml(employee.name)} xin nghỉ ${request.days} ngày</strong><p>${escapeHtml(request.reason)}.</p><small>Từ chối nhiều lần sẽ làm tăng nguy cơ nhân viên nghỉ việc.</small></div><div class="leave-actions"><button class="btn btn-secondary btn-small" data-action="staff-leave-deny" data-id="${employee.uid}">Từ chối</button><button class="btn btn-primary btn-small" data-action="staff-leave-approve" data-id="${employee.uid}">Duyệt nghỉ</button></div></article>`;
    }).join('')}</section>` : ''}
    <div class="staff-section-heading staff-roster-heading"><div><span>ĐỘI NGŨ BOUTIQUE</span><h3>${s.employees.length ? 'Những cộng sự của bạn' : 'Chưa có nhân viên'}</h3><small>${working.length} đang làm · ${money(wages)}/ngày</small></div><b>${s.employees.length}/${staffCapacity(s)}</b></div>
      ${s.employees.length ? `<div class="staff-roster">${s.employees.map(employee => {
        const onLeave = !!employee.leaveUntilDay && employee.leaveUntilDay > s.day;
        const status = onLeave ? `Nghỉ đến ngày ${employee.leaveUntilDay}` : 'Đang làm việc';
        const skillLevel = employee.skillLevel ?? 1;
        const experience = employee.experience ?? 0;
        const experienceTarget = 35 + skillLevel * 15;
        return `<article class="employee-card ${onLeave ? 'is-on-leave' : ''}"><div class="employee-portrait">${staffImage(employee.appearance, employee.name)}</div><div class="employee-info"><div class="employee-card-head"><div><span class="staff-role">${escapeHtml(employee.role)}</span><h3>${escapeHtml(employee.name)}</h3><p>Gia nhập ngày ${employee.hiredDay} · Tinh thần ${employee.morale}/100</p></div><div class="employee-card-actions"><span class="employee-status">${status}</span><button class="employee-fire" data-action="staff-fire" data-id="${employee.uid}">${icon('close')} Cho nghỉ việc</button></div></div><div class="staff-stats-compact">${staffStat('Tư vấn', employee.service, '#e85aa6')}${staffStat('Chốt đơn', employee.persuasion, '#8c68e8')}${staffStat('Duyên dáng', employee.charm, '#e9ad35')}${staffStat('Ổn định', employee.reliability, '#55b89a')}</div><div class="employee-career"><span>${icon('star')} Cấp nghề ${skillLevel}</span><div><b style="width:${Math.min(100, experience / experienceTarget * 100)}%"></b></div><small>${experience}/${experienceTarget} EXP</small></div><div class="employee-record"><span>${icon('bag')} <b>${employee.sales}</b> đơn hỗ trợ</span><span>${icon('star')} <b>${money(employee.tipsEarned)}</b> tip</span><span>${icon('coin')} <b>${money(employee.salary)}</b>/ngày</span></div></div></article>`;
      }).join('')}</div>` : `<div class="staff-empty"><div>${icon('users')}</div><strong>Một mình bạn vẫn đang chăm cả boutique</strong><p>Đăng tin tuyển dụng tại Bảng tin khi đạt đủ cấp shop và mặt bằng.</p><button class="btn btn-primary" data-action="staff-recruit-go">Đến bảng tin tuyển dụng</button></div>`}
  </div>`;
}

export function socialPanel(s: GameState, section: 'feed' | 'recruitment' = 'feed') {
  const shopName = s.shopName || 'My Little Boutique';
  const handle = toShopHandle(shopName);

  return `
    <div class="game-panel-header-card social-panel-header">
      <div class="panel-header-left">
        <span class="panel-header-icon social-header-icon">${icon('social')}</span>
        <div class="panel-header-texts">
          <span class="panel-eyebrow">LITTLE MOMENTS, BIG LOVE</span>
          <h2>BẢNG TIN BOUTIQUE</h2>
          <p>Nhật ký thời trang & những phản hồi yêu thương từ khách hàng</p>
        </div>
      </div>
      <div class="panel-header-right">
        <div class="heading-badges">
          <span class="panel-stat-chip heart-chip">${icon('user')} ${s.followers.toLocaleString('vi-VN')} theo dõi</span>
          <span class="panel-stat-chip star-chip">${icon('star')} ${s.reputation.toFixed(1)} / 5</span>
          <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">
            ${icon('close')} <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>

    <nav class="social-inner-tabs" aria-label="Nội dung bảng tin">
      <button class="social-inner-tab ${section === 'feed' ? 'is-active' : ''}" data-action="social-section" data-id="feed" aria-pressed="${section === 'feed'}">
        <span>${icon('social')}</span><span><strong>Bảng tin</strong><small>Khoảnh khắc khách hàng</small></span>
      </button>
      <button class="social-inner-tab ${section === 'recruitment' ? 'is-active' : ''}" data-action="social-section" data-id="recruitment" aria-pressed="${section === 'recruitment'}">
        <span>${icon('users')}</span><span><strong>Tuyển dụng</strong><small>Đăng tin và xem hồ sơ</small></span>
        ${s.staffApplicants.length ? `<b>${s.staffApplicants.length}</b>` : s.recruitmentPost ? '<i></i>' : ''}
      </button>
    </nav>

    <div class="social-tab-content recruitment-tab-content" ${section === 'recruitment' ? '' : 'hidden'}>
      ${recruitmentBoard(s)}
    </div>

    <div class="social-tab-content feed-tab-content" ${section === 'feed' ? '' : 'hidden'}>

    <!-- Social Profile Card (Instagram/Threads Style) -->
    <div class="social-profile-card">
      <div class="profile-cover-banner" aria-hidden="true">
        <div class="cover-overlay-pattern"></div>
        <span class="cover-tag">${icon('star')} ${escapeHtml(shopName)} • Official Feed</span>
        <span class="cover-badge">${icon('crown')} Cấp ${s.level}</span>
      </div>

      <div class="profile-card-content">
        <div class="profile-main-row">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar-ring">
              <div class="profile-avatar-inner">
                ${icon('hanger')}
              </div>
            </div>
          </div>

          <div class="profile-details">
            <div class="profile-name-row">
              <h3 class="profile-name">${escapeHtml(shopName)}</h3>
              <span class="profile-verified-badge" title="Boutique chính hãng">${icon('check')}</span>
              <span class="profile-level-chip">Cấp ${s.level}</span>
              <button class="edit-shop-name-btn" data-action="name-shop" title="Đổi tên tiệm">
                ${icon('edit')}
              </button>
            </div>
            <span class="profile-handle">${handle} · Tiệm thời trang của bạn</span>
            <p class="profile-bio">
              Góc nhỏ của những điều xinh xắn. Tự do phối đồ, tôn vinh phong cách riêng. Mở cửa đón khách mỗi ngày! 💕
            </p>
            <div class="profile-tags-row">
              <span class="profile-tag-item">${icon('decor')} ${s.layout.length} nội thất</span>
              <span class="profile-tag-item">${icon('trend')} Thẩm mỹ ${decorAppealScore(s)}</span>
              <span class="profile-tag-item">${icon('sun')} ${s.dailyLuck ?? 'Thời tiết dịu dàng'}</span>
            </div>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="profile-stat-box">
            <span class="stat-icon-wrap">${icon('edit')}</span>
            <div class="stat-text-wrap">
              <strong class="stat-number">${s.posts.length}</strong>
              <span class="stat-label">Bài viết</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <span class="stat-icon-wrap stat-heart-wrap">${icon('user')}</span>
            <div class="stat-text-wrap">
              <strong class="stat-number">${s.followers.toLocaleString('vi-VN')}</strong>
              <span class="stat-label">Theo dõi</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <span class="stat-icon-wrap stat-star-wrap">${icon('star')}</span>
            <div class="stat-text-wrap">
              <strong class="stat-number">${s.reputation.toFixed(1)} <small>/ 5.0</small></strong>
              <span class="stat-label">Độ uy tín</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <span class="stat-icon-wrap stat-bag-wrap">${icon('bag')}</span>
            <div class="stat-text-wrap">
              <strong class="stat-number">${s.stats.sold}</strong>
              <span class="stat-label">Đã bán</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feed Section -->
    <div class="social-feed-section">
      <div class="section-title social-section-title">
        <div>
          <h3>${icon('heart')} Dòng thời gian Boutique</h3>
          <p>${s.posts.length ? `${s.posts.length} khách hàng đã chia sẻ khoảnh khắc tại boutique` : 'Hãy phục vụ khách để tạo nên câu chuyện đầu tiên'}</p>
        </div>
        <span class="count-pill">${icon('social')} ${s.posts.length} bài viết</span>
      </div>

      <div class="social-posts-feed">
        ${s.posts.length ? s.posts.map(p => {
          const reviewStars = Math.max(1, Math.min(5, p.reviewStars));
          const reviewLabel = reviewStars >= 4.5 ? 'Rất hài lòng' : reviewStars >= 4 ? 'Hài lòng' : reviewStars >= 3 ? 'Khá ổn' : 'Chưa hài lòng';
          return `
          <article class="social-post-card ${p.viral ? 'is-viral-card' : ''}">
            <div class="post-card-header">
              <div class="post-author-avatar" style="background:${escapeHtml(p.color)}">
                ${escapeHtml(p.name.slice(0, 1))}
              </div>
              <div class="post-author-meta">
                <div class="post-author-name-row">
                  <strong class="post-author-name">${escapeHtml(p.name)}</strong>
                  ${p.viral ? `<span class="post-viral-badge">${icon('social')} VIRAL MOMENT</span>` : ''}
                </div>
                <span class="post-author-handle">${escapeHtml(p.handle)} · Ngày ${p.day}</span>
              </div>
              <span class="post-heart-icon">${icon('heart')}</span>
            </div>

            <div class="post-card-body">
              <div class="post-quote-bubble">
                <p class="post-quote-text">“${escapeHtml(p.text)}”</p>
              </div>
              ${p.viral ? `
                <div class="post-viral-showcase">
                  <div class="viral-photo-frame">
                    <span class="viral-icon">${icon('hanger')}</span>
                    <span class="viral-quote-handwritten">small shop.<br><em>big main character energy.</em></span>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="post-card-footer">
              <div class="post-likes-count">
                <span class="post-like-heart">${icon('heart')}</span>
                <strong>${p.likes.toLocaleString('vi-VN')}</strong>
                <span>lượt yêu thích</span>
              </div>
              <span class="post-happy-tag">${icon('star')} ${reviewStars.toFixed(1)} sao · ${reviewLabel}</span>
            </div>
          </article>
        `; }).join('') : `
          <div class="empty-state social-empty-state">
            <div class="empty-illustration">
              <span class="empty-main-icon">${icon('social')}</span>
            </div>
            <h3>Những câu chuyện đang chờ được viết...</h3>
            <p>
              Tư vấn outfit thật chuẩn gu và đúng ngân sách. Mỗi khách hàng hài lòng sẽ đăng bài khen ngợi boutique trên mạng xã hội, và các Influencer có thể tạo nên cơn sốt Viral bùng nổ!
            </p>
            <button class="btn btn-primary" data-action="nav" data-id="shop">
              ${icon('shop')} <span>Về boutique đón khách</span> ${icon('arrow')}
            </button>
          </div>
        `}
      </div>
      <p class="social-subtle-footer">Mạng xã hội mô phỏng trong game • Mọi khoảnh khắc đều do chính tay bạn tạo dựng 💕</p>
    </div>
    </div>
  `;
}

export function nameShopModal(s: GameState, isFirstTime = false) {
  const currentName = s.shopName || 'My Little Boutique';
  const suggestions = [
    'Tiệm Nắng Mây',
    'Pastel Chic',
    'Mimi Boutique',
    'Dâu Tây Closet',
    'Mơ Màng Studio',
    'Pink Ribbon',
  ];

  return `
    <div class="name-shop-modal-container">
      <div class="name-shop-hero">
        <span class="hero-cute-badge">
          ${icon('sparkle')} ${isFirstTime ? 'WELCOME BOUTIQUE' : 'RENAME BOUTIQUE'}
        </span>
        <h2>${isFirstTime ? 'Chào mừng bạn đến với tiệm!' : 'Đặt lại tên cho boutique'}</h2>
        <p class="hero-desc">
          Tên boutique sẽ xuất hiện trên biển hiệu tường và trang cá nhân Bảng tin 💕
        </p>
      </div>

      <div class="name-shop-form">
        <div class="name-input-group">
          <div class="name-input-label">
            <span>Tên boutique của bạn:</span>
            <span class="char-hint">Tối đa 30 ký tự</span>
          </div>
          <div class="name-input-box">
            <span class="input-icon">${icon('hanger')}</span>
            <input
              type="text"
              id="shop-name-input"
              class="shop-name-text-input"
              maxlength="30"
              value="${escapeHtml(currentName)}"
              placeholder="Nhập tên boutique..."
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </div>

        <div class="name-suggestions-section">
          <span class="suggestions-label">${icon('star')} Gợi ý tên xinh xắn:</span>
          <div class="name-chips-wrap">
            ${suggestions.map(name => `
              <button
                type="button"
                class="name-chip-btn"
                data-action="pick-name"
                data-id="${escapeHtml(name)}"
                title="Chọn ${escapeHtml(name)}"
              >
                ${escapeHtml(name)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="name-shop-actions">
          <button type="button" class="btn btn-secondary btn-cancel-name" data-action="close-modal">
            ${isFirstTime ? 'Để sau' : 'Hủy'}
          </button>
          <button type="button" class="btn btn-primary btn-confirm-name" data-action="confirm-shop-name">
            ${icon('check')}
            <span>${isFirstTime ? 'Vào tiệm ngay' : 'Lưu tên mới'}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function displayFixtureModal(s: GameState, uid: string) {
  const placed = s.layout.find(item => item.uid === uid);
  const fixture = placed && furniture.find(item => item.id === placed.id);
  if (!placed || !fixture?.display) return '';
  const displayItems = placed.displayItems ?? [];
  const capacity = displayCapacity(fixture, placed);
  const fixtureName = placed.customName || fixture.name;
  const upgradeLevel = displayLevel(fixture, placed);
  const upgradeCost = displayUpgradeCost(fixture, placed);
  const availableByProduct = new Map<string, number>();
  const compatible = products.filter(product => {
    if (!fixture.display!.categories.includes(product.category) || (s.inventory[product.id] ?? 0) <= 0) return false;
    availableByProduct.set(product.id, Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id)));
    return true;
  });
  const availableModelCount = compatible.filter(product => (availableByProduct.get(product.id) ?? 0) > 0).length;
  const displayedGroups = Array.from(displayItems.reduce((groups, productId) => {
    groups.set(productId, (groups.get(productId) ?? 0) + 1);
    return groups;
  }, new Map<string, number>()).entries()).map(([productId, quantity]) => ({ product: products.find(item => item.id === productId), quantity })).filter((group): group is { product: typeof products[number]; quantity: number } => !!group.product);
  const kindLabels = { clothing: 'quần áo', shoes: 'giày', bags: 'túi xách', accessories: 'phụ kiện', outfit: 'outfit mẫu' };
  return `
    <div class="fixture-modal">
      <header class="fixture-modal-header">
        <h2 class="fixture-title-edit" contenteditable="true" role="textbox" aria-label="Đổi tên ${escapeHtml(fixture.name)}" data-fixture="${uid}" data-default-name="${escapeHtml(fixture.name)}" spellcheck="false">${escapeHtml(fixtureName)}</h2>
        <span class="fixture-capacity-chip">${displayItems.length}<i>/</i>${capacity}</span>
        <button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </header>
      ${fixture.display.upgrade ? `<button class="fixture-upgrade-strip" data-action="display-upgrade" data-fixture="${uid}" ${upgradeCost === undefined ? 'disabled' : ''}><span class="fixture-upgrade-icon">${icon('trend')}</span><span><strong>${upgradeCost === undefined ? 'Đã đạt cấp trưng bày tối đa' : `Nâng lên cấp ${upgradeLevel + 1}`}</strong><small>${upgradeCost === undefined ? `${capacity} slot tối đa` : `Thêm ${fixture.display.upgrade.slotsPerLevel} slot · ${money(upgradeCost)}`}</small></span><span class="fixture-upgrade-level">${upgradeLevel}/${fixture.display.upgrade.maxLevel}</span><span class="fixture-upgrade-action">${upgradeCost === undefined ? 'Hoàn tất' : 'Nâng cấp'}</span></button>` : `<div class="fixture-fixed-strip"><span>${icon('hanger')}</span><span>Ma-nơ-canh trưng duy nhất 1 sản phẩm set outfit.</span></div>`}
      <div class="fixture-studio">
        <section class="fixture-slot-panel">
          <div class="fixture-section-title"><div><span class="fixture-section-kicker">SÀN TRƯNG BÀY</span><h3>Slot ${kindLabels[fixture.display.kind]}</h3></div><span>${displayItems.length}/${capacity}</span></div>
          <div class="fixture-display-groups">
            ${displayedGroups.map(({ product, quantity }) => `<button class="fixture-display-group" data-action="display-remove" data-id="${product.id}" data-fixture="${uid}" aria-label="Cất ${escapeHtml(product.name)} về kho"><span class="fixture-display-thumb">${productImage(product)}</span><span class="fixture-display-copy"><strong>${escapeHtml(product.name)}</strong><small>${product.style}</small></span><span class="fixture-display-count">×${quantity}</span><span class="fixture-display-remove">${icon('close')}</span></button>`).join('')}
            ${displayedGroups.length === 0 && displayItems.length < capacity ? `<div class="fixture-free-slots is-empty-stage"><span class="fixture-slot-plus">${icon('plus')}</span><strong>${capacity - displayItems.length} slot sẵn sàng</strong><small>Chọn một mẫu ở kho để bắt đầu trưng bày</small></div>` : ''}
          </div>
        </section>
        <section class="fixture-warehouse-panel">
          <div class="fixture-section-title"><div><span class="fixture-section-kicker">KHO HÀNG</span><h3>Chọn món để trưng</h3></div><span>${availableModelCount}/${compatible.length} sẵn sàng</span></div>
          <div class="fixture-stock-grid">
          ${compatible.length ? compatible.map(product => {
            const available = availableByProduct.get(product.id) ?? 0;
            const full = displayItems.length >= capacity;
            return `<button class="fixture-stock-option ${!available ? 'is-unavailable' : ''}" data-action="display-add" data-id="${product.id}" data-fixture="${uid}" aria-label="Trưng lên: ${escapeHtml(product.name)}" ${!available || full ? 'disabled' : ''}><span class="fixture-stock-thumb">${productImage(product)}</span><span class="fixture-stock-copy"><strong>${escapeHtml(product.name)}</strong><small>${product.style}</small><em class="fixture-stock-status ${available ? 'is-ready' : ''}">${available ? `Kho còn ${available}` : 'Đang trưng ở kệ khác'}</em></span><span class="fixture-stock-add tutorial-display-add-target">${icon('plus')}</span></button>`;
          }).join('') : `<div class="fixture-empty"><strong>Chưa có hàng phù hợp</strong><span>Nhập thêm sản phẩm đúng loại rồi quay lại thiết bị này.</span></div>`}
          </div>
        </section>
      </div>
    </div>`;
}

const onlineOrderProductIds = (order: OnlineOrder) => order.productIds?.length ? order.productIds : [order.productId];

export function onlineChannelModal(s: GameState) {
  const listed = s.onlineListings.map(id => products.find(product => product.id === id)).filter(Boolean) as typeof products;
  const warehouse = products.filter(product => Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id)) > 0);
  const eligibleListings = listed.filter(product => {
    const reserved = s.onlineOrders.filter(order => onlineOrderProductIds(order).includes(product.id)).length;
    return Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id)) > reserved;
  });
  const orderChance = onlineOrderChance(s, eligibleListings.map(product => product.id));
  const chancePercent = Math.round(orderChance * 1000) / 10;
  const reachReady = orderChance >= .04;
  const reachLabel = orderChance < .01 ? 'Gần như chưa có lượt mua' : orderChance < .05 ? 'Có lượt xem, rất ít đơn' : orderChance < .16 ? 'Bắt đầu ra đơn' : orderChance < .34 ? 'Kênh đang tăng trưởng' : 'Nhu cầu đang rất tốt';
  const reachProgress = Math.round(Math.min(100, orderChance / .4 * 100));
  return `<div class="online-channel-modal">
    <div class="online-workspace">
      <section class="online-storefront-preview">
        <header class="storefront-preview-header"><span class="online-storefront-logo">${icon('shop')}</span><div><small>GIAN HÀNG ONLINE</small><h2>${escapeHtml(s.shopName)}</h2><p>${compact(s.followers)} người theo dõi <i>·</i> ${s.onlineRating.toFixed(1)} ${icon('star')}</p></div><button class="online-channel-toggle ${s.onlineChannelEnabled ? 'is-on' : ''}" data-action="online-toggle" aria-pressed="${s.onlineChannelEnabled}" ${s.phase === 'open' ? 'disabled' : ''}><i></i><span>${s.onlineChannelEnabled ? 'Đang mở' : 'Đang đóng'}</span></button></header>
        <div class="storefront-promo"><div><small>NEW COLLECTION</small><strong>Chọn một món thật hợp gu bạn</strong><span>Giao từ boutique trong ngày</span></div>${icon('bag')}</div>
        <div class="storefront-products-heading"><div><small>SẢN PHẨM</small><strong>${listed.length} mẫu đang bán</strong></div><span>${icon('filter')} Mới nhất</span></div>
        <div class="online-listing-grid storefront-product-grid">${listed.length ? listed.map(product => {
          const available = Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id));
          return `<article class="online-product-card is-listed"><span class="online-product-photo">${productImage(product)}<i>${escapeHtml(product.style)}</i></span><div class="online-product-info"><strong>${escapeHtml(product.name)}</strong><b>${money(s.prices[product.id] ?? product.sellPrice)}</b><small>${available ? `Còn ${available} sản phẩm` : 'Tạm hết hàng'}</small></div><button data-action="online-unlist" data-id="${product.id}" ${s.phase === 'open' ? 'disabled' : ''} aria-label="Gỡ ${escapeHtml(product.name)}" title="Gỡ khỏi gian hàng">${icon('close')}</button></article>`;
        }).join('') : `<div class="online-empty"><span>${icon('globe')}</span><strong>Gian hàng đang trống</strong><small>Chọn sản phẩm ở dashboard để bắt đầu bán online.</small></div>`}</div>
      </section>

      <section class="online-dashboard">
        <header class="online-dashboard-header"><div><small>QUẢN LÝ KÊNH</small><h2>Dashboard online</h2></div><div class="online-dashboard-header-actions"><span>${listed.length} sản phẩm</span><button class="icon-button online-channel-close" data-action="close-modal" aria-label="Đóng kênh bán hàng online">${icon('close')}</button></div></header>
        <div class="online-dashboard-metrics"><div><span>${icon('star')}</span><small>Đánh giá</small><strong>${s.onlineRating.toFixed(1)}</strong></div><div><span>${icon('user')}</span><small>Follower</small><strong>${compact(s.followers)}</strong></div><div><span>${icon('truck')}</span><small>Đã giao</small><strong>${s.onlineSales}</strong></div></div>
        <div class="online-dashboard-reach ${reachReady ? 'is-ready' : ''}"><div><small>${reachLabel}</small><strong>${chancePercent}% mỗi lượt kiểm tra</strong></div><div class="online-dashboard-reach-track"><b style="width:${reachProgress}%"></b></div><span>Xét điểm kênh, số review, uy tín shop, follower, giá bán và độ đa dạng sản phẩm.</span></div>
        <div class="online-dashboard-stock"><div class="dashboard-block-heading"><div><small>KHO HÀNG</small><strong>Chọn sản phẩm để đăng</strong></div><span>${warehouse.length} mẫu</span></div>
          <div class="online-dashboard-stock-list">${warehouse.length ? warehouse.map(product => {
            const available = Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id));
            const isListed = s.onlineListings.includes(product.id);
            return `<button class="online-dashboard-stock-item" data-action="online-list" data-id="${product.id}" ${isListed || s.phase === 'open' ? 'disabled' : ''}><span>${productImage(product)}</span><div><small>${escapeHtml(product.style)}</small><strong>${escapeHtml(product.name)}</strong><em>${money(s.prices[product.id] ?? product.sellPrice)} · Kho ${available}</em></div><i>${isListed ? icon('check') : icon('plus')}</i></button>`;
          }).join('') : `<div class="online-empty"><span>${icon('box')}</span><strong>Kho chưa có hàng sẵn sàng</strong><small>Nhập thêm hàng hoặc cất bớt sản phẩm khỏi kệ.</small></div>`}</div>
        </div>
        <footer class="online-dashboard-note">${icon('coin')} Phí nền tảng 14% mỗi đơn thành công.</footer>
      </section>
    </div>
  </div>`;
}

export function onlineOrderModal(s: GameState, orderId: string, selectedProductIds: string[] = []) {
  const order = s.onlineOrders.find(item => item.id === orderId);
  if (!order) return onlineChannelModal(s);
  const requestedIds = onlineOrderProductIds(order);
  const requestedProducts = requestedIds.map(id => products.find(item => item.id === id)).filter((product): product is Product => !!product);
  const rawWarehouseQuantity = (productId: string) => Math.max(0, (s.inventory[productId] ?? 0) - displayedQuantity(s, productId));
  const handoverQuantity = (productId: string) => Math.max(0, (s.inventory[productId] ?? 0) - s.onlineOrders.filter(candidate => candidate.id !== orderId && onlineOrderProductIds(candidate).includes(productId)).length);
  const warehouse = products.filter(product => (s.inventory[product.id] ?? 0) > 0);
  const selectedProducts = selectedProductIds.map(id => warehouse.find(product => product.id === id && handoverQuantity(product.id) > 0)).filter((product): product is Product => !!product);
  const readyToShip = selectedProducts.length === requestedProducts.length;
  return `<div class="online-handover-modal">
    <header class="handover-topbar"><button class="online-back-button" data-action="online-open">${icon('arrow')} Kênh online</button><div><small>GIAO ĐƠN ONLINE</small><strong>Shipper đang chờ tại shop</strong></div><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></header>
    <section class="handover-order-card">
      <div class="courier-mini-art">${icon('truck')}<b>${String(s.onlineOrders.indexOf(order) + 1).padStart(2, '0')}</b></div>
      <div class="handover-customer"><small>ĐƠN CỦA ${escapeHtml(order.customerHandle)}</small><h2>${escapeHtml(order.customerName)}</h2><span>Khách đặt ${requestedProducts.length} sản phẩm</span></div>
      <div class="handover-requested"><span class="handover-requested-images">${requestedProducts.map(product => productImage(product)).join('')}</span><div><small>${requestedProducts.length} SẢN PHẨM CẦN GIAO</small><strong>${requestedProducts.map(product => escapeHtml(product.name)).join(' · ')}</strong><em>${requestedProducts.map(product => `${product.colorName} (kho ${rawWarehouseQuantity(product.id)})`).join(' · ')}</em></div></div>
      <div class="handover-payout"><small>THU VỀ SAU PHÍ</small><strong>${money(order.price - order.fee)}</strong><span>Phí ${money(order.fee)}</span></div>
    </section>
    <div class="handover-list-heading"><div><small>TOÀN BỘ SẢN PHẨM TRONG KHO</small><h3>Chọn sản phẩm đưa cho shipper</h3><p>Bấm một lần để chọn, bấm lại để bỏ chọn.</p></div><span>${warehouse.length} mẫu</span></div>
    <div class="online-handover-grid">${warehouse.length ? warehouse.map(product => {
      const available = handoverQuantity(product.id);
      const displayed = displayedQuantity(s, product.id);
      const reserved = s.onlineOrders.filter(candidate => candidate.id !== orderId && onlineOrderProductIds(candidate).includes(product.id)).length;
      const stockLocation = displayed > 0 ? ` · ${displayed} đang trưng` : '';
      const unavailableReason = reserved > 0 ? `${reserved} món đều đã giữ cho đơn khác` : 'Không còn món khả dụng';
      const selected = selectedProductIds.includes(product.id);
      return `<button class="${selected ? 'is-selected' : ''} ${available < 1 ? 'is-unavailable' : ''}" data-action="online-hand-over-select" data-id="${product.id}" aria-pressed="${selected}" ${available < 1 ? 'disabled' : ''}><span>${productImage(product)}</span><div><strong>${escapeHtml(product.name)}</strong><small>${product.style} · ${product.colorName} · Tổng kho ${s.inventory[product.id] ?? 0}${stockLocation}</small><em>${available > 0 ? `Có thể giao: ${available}` : unavailableReason}</em></div><i>${selected ? icon('check') : available > 0 ? icon('plus') : icon('lock')}</i></button>`;
    }).join('') : `<div class="handover-empty">${icon('box')}<strong>Kho hiện không có sản phẩm</strong><span>Bạn có thể hủy đơn mà không ảnh hưởng tới shop.</span></div>`}</div>
    <footer class="handover-actions"><button class="handover-cancel" data-action="online-cancel-order" data-id="${order.id}">${icon('close')} Hủy đơn</button><div><span>Đã chọn <strong>${selectedProducts.length}/${requestedProducts.length} món</strong></span><button class="handover-submit" data-action="online-hand-over" data-order="${order.id}" ${readyToShip ? '' : 'disabled'}>${icon('truck')} Giao cho shipper</button></div></footer>
  </div>`;
}

export function serveModal(s: GameState, selected: string[], category = 'all') {
  const c = activeCustomer(s); if (!c) return '';
  const relationship = s.customerLoyalty[c.id];
  const relationshipTier = loyaltyTier(relationship);
  const nextLoyaltyMilestone = loyaltyMilestones.find(milestone => milestone.points > (relationship?.points ?? 0));
  const items = selected.map(id => products.find(p => p.id === id)!);
  const score = matchScore(s, c, items);
  const price = items.reduce((sum, p) => sum + sellPrice(s, p), 0);
  const isOverBudget = price > c.budget;
  const displayStock = displayedInventory(s);
  const stock = products.filter(p => (displayStock[p.id] ?? 0) > 0);
  const list = stock.filter(p => category === 'all' || p.category === category);

  return `
    <div class="fitting-studio-layout">
      <!-- CỘT TRÁI: KHÁCH HÀNG & PHÒNG ƯỚM THỬ (Full-height Showcase) -->
      <aside class="studio-col-left" aria-label="Phòng thử đồ & Khách hàng">
        <!-- Header khách hàng: Tên, tính cách, câu thoại, đồng hồ -->
        <div class="customer-profile-card">
          <div class="customer-profile-top">
            <div class="customer-info-tag">
              <span class="personality-tag">${escapeHtml(c.personality)}</span>
              <h2 class="customer-name">${escapeHtml(c.name)}</h2>
              <span class="loyalty-profile-chip" title="${nextLoyaltyMilestone ? `${nextLoyaltyMilestone.points - (relationship?.points ?? 0)} điểm nữa để lên ${nextLoyaltyMilestone.tier}` : 'Đã đạt bậc khách hàng cao nhất'}">
                ${icon('heart')} ${relationshipTier} · ${relationship?.points ?? 0} điểm
              </span>
            </div>
            <span id="modal-patience" class="studio-patience-chip" aria-label="Thời gian còn lại" title="Thời gian khách đợi">
              ${icon('clock')} <strong>${s.patience}s</strong>
            </span>
          </div>
          <div class="customer-speech-wrap">
            <p class="customer-speech-bubble">“${escapeHtml(c.goal)}”</p>
          </div>
        </div>

        <!-- Sân khấu người mẫu / Mannequin với ánh đèn spotlight -->
        <div class="fitting-stage-container">
          <div class="fitting-backdrop-arch">
            <div class="fitting-spotlight"></div>
            <div class="fitting-model">
              ${avatarImage(c, false, items)}
            </div>
            <div class="fitting-pedestal"></div>
          </div>
          <div class="fitting-stage-status ${items.length ? 'is-active' : ''}">
            ${items.length 
              ? `<span class="stage-tag active">${icon('sparkle')} Đang ướm thử (${items.length}/${MAX_OUTFIT_ITEMS} món)</span>` 
              : `<span class="stage-tag hint">Chạm đồ bên phải để ướm thử</span>`}
          </div>
        </div>

        <!-- Sở thích khách hàng (Gu, Màu & Ngân sách) -->
        <div class="customer-pref-box">
          <div class="pref-row">
            <span class="pref-label">${icon('sparkle')} Gu:</span>
            <div class="pref-chips">
              ${c.styles.map(st => `<span class="pref-chip style-chip">${escapeHtml(st)}</span>`).join('')}
            </div>
          </div>
          <div class="pref-row">
            <span class="pref-label">${icon('heart')} Màu:</span>
            <div class="pref-chips">
              ${c.colors.map(col => `<span class="pref-chip color-chip">${escapeHtml(col)}</span>`).join('')}
            </div>
          </div>
          <div class="pref-row budget-row">
            <span class="pref-label">${icon('coin')} Túi tiền:</span>
            <strong class="customer-budget-val">${money(c.budget)}</strong>
          </div>
        </div>

      </aside>

      <!-- CỘT PHẢI: TỦ ĐỒ CỬA HÀNG & THANH CHỐT OUTFIT -->
      <section class="studio-col-right" aria-label="Tủ đồ boutique & Chốt đơn">
        <!-- Header tủ đồ: Tiêu đề + Các tab danh mục + Nút đóng X -->
        <header class="studio-wardrobe-header">
          <div class="wardrobe-header-top">
            <div class="wardrobe-title-wrap">
              <span class="eyebrow">${icon('hanger')} BOUTIQUE WARDROBE</span>
              <h3>Tủ đồ của shop <span class="studio-stock-count">(${stock.length} mẫu có sẵn)</span></h3>
            </div>
            <button type="button" class="studio-close-btn" data-action="close-modal" aria-label="Đóng phòng thử đồ" title="Đóng">
              ${icon('close')}
            </button>
          </div>

          <!-- Danh mục bộ lọc cuộn ngang -->
          <div class="studio-categories" role="group" aria-label="Lọc loại trang phục">
            ${[['all', 'Tất cả'], ...Object.entries(categories)].map(([id, name]) => `
              <button class="category-pill ${category === id ? 'active' : ''}" data-action="outfit-category" data-id="${id}" aria-pressed="${category === id}">
                ${name}
              </button>
            `).join('')}
          </div>
        </header>

        <!-- Lưới sản phẩm (Cards rõ ràng, sắc nét, đẹp mắt) -->
        <div class="outfit-grid">
          ${list.length ? list.map(p => {
            const isSelected = selected.includes(p.id);
            const isMatchedStyle = c.styles.includes(p.style);
            const isMatchedColor = c.colors.some(col => p.colorName.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(p.colorName.toLowerCase()));
            const isTrendingItem = isTrending(s, p);
            const isProductOverBudget = sellPrice(s, p) > c.budget;

            return `
              <button class="outfit-option ${isSelected ? 'selected' : ''} ${isMatchedStyle ? 'is-matched-style' : ''}" 
                      data-action="select-product" 
                      data-id="${p.id}" 
                      aria-pressed="${isSelected}" 
                      aria-label="${isSelected ? 'Bỏ' : 'Chọn'} ${escapeHtml(p.name)}">
                <div class="outfit-thumb-container">
                  ${productImage(p)}
                  <span class="outfit-check ${isSelected ? 'is-checked' : ''}">
                    ${icon(isSelected ? 'check' : 'plus')}
                  </span>
                  ${isMatchedStyle 
                    ? `<span class="outfit-match-tag style-match">${icon('heart')} Hợp gu</span>` 
                    : isMatchedColor 
                    ? `<span class="outfit-match-tag color-match">${icon('sparkle')} Đúng màu</span>` 
                    : isTrendingItem 
                    ? `<span class="outfit-match-tag trend-match">${icon('trend')} Hot trend</span>` 
                    : ''}
                </div>
                <div class="outfit-meta-wrap">
                  <strong class="outfit-item-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</strong>
                  <div class="outfit-sub-info">
                    <span class="item-style-badge">${p.style}</span>
                    <span class="item-stock-badge">Đang trưng ${displayStock[p.id]}</span>
                  </div>
                  <div class="outfit-price-row">
                    <b class="outfit-price ${isProductOverBudget ? 'text-error' : ''}">
                      ${money(sellPrice(s, p))}
                    </b>
                    ${isProductOverBudget ? `<span class="over-budget-tag">Vượt ví</span>` : ''}
                  </div>
                </div>
              </button>
            `;
          }).join('') : `
            <div class="empty-state compact-empty">
              <div class="empty-icon">${icon('hanger')}</div>
              <h3>${stock.length ? 'Chưa có mẫu thuộc loại này' : 'Tủ đồ đang trống'}</h3>
              <p>${stock.length ? 'Chọn danh mục khác để tiếp tục phối đồ cho khách.' : 'Hãy hẹn khách lần sau và nhập thêm hàng mới nhé!'}</p>
              <button class="btn btn-secondary" data-action="${stock.length ? 'outfit-category' : 'close-modal'}" data-id="all">
                ${stock.length ? 'Xem tất cả mẫu' : 'Hẹn khách lần sau'}
              </button>
            </div>
          `}
        </div>

        <!-- Thanh chốt đơn tích hợp dưới đáy cột phải (Checkout Dock) -->
        <footer class="studio-checkout-dock">
          <div class="checkout-summary-wrap">
            <div class="checkout-price-block">
              <span class="lbl-total">Tổng tiền:</span>
              <strong class="val-total ${isOverBudget ? 'text-error' : ''}">${money(price)}</strong>
              <span class="lbl-budget-comp">/ ${money(c.budget)}</span>
            </div>

            <div class="checkout-match-block">
              ${!items.length 
                ? `<div class="match-badge neutral">${icon('sparkle')} Chọn tối đa ${MAX_OUTFIT_ITEMS} món</div>` 
                : isOverBudget 
                ? `<div class="match-badge error">${icon('close')} Vượt ngân sách +${money(price - c.budget)}!</div>` 
                : `<div class="match-badge success">
                     <span class="match-label">${icon('heart')} Hợp gu:</span>
                     <strong class="match-score">${score}%</strong>
                     <div class="match-mini-bar" title="Độ hợp gu ${score}%"><div class="match-mini-fill" style="width: ${Math.min(100, score)}%;"></div></div>
                   </div>`}
            </div>
          </div>

          <button class="studio-serve-btn ${!items.length ? 'is-empty' : isOverBudget ? 'is-over' : 'is-ready'}" data-action="serve" ${!items.length || isOverBudget ? 'disabled' : ''}>
            <span class="serve-btn-icon-wrap">
              ${icon(!items.length ? 'hanger' : isOverBudget ? 'close' : 'check')}
            </span>
            <span class="serve-btn-label">
              ${!items.length ? 'Chưa chọn đồ' : isOverBudget ? 'Vượt ngân sách' : 'Chốt outfit'}
            </span>
          </button>
        </footer>
      </section>
    </div>
  `;
}

export function resultModal(result: SaleResult) {
  const isSuccess = result.success;
  const isViral = result.viral;
  const c = result.customer;

  return `
    <div class="result-modal-container ${isViral ? 'is-viral' : isSuccess ? 'is-success' : 'is-missed'}">
      <button class="icon-button modal-close" data-action="continue" aria-label="Đóng">${icon('close')}</button>

      <!-- Status Pill -->
      <div class="result-badge-wrap">
        <span class="result-status-pill ${isViral ? 'pill-viral' : isSuccess ? 'pill-success' : 'pill-missed'}">
          ${isViral ? `${icon('star')} LÊN XU HƯỚNG TIKTOK` : isSuccess ? `${icon('check')} TƯ VẤN THÀNH CÔNG` : `${icon('heart')} CHƯA HỢP GU LẦN NÀY`}
        </span>
      </div>

      <!-- Hero Character Showcase -->
      <div class="result-hero-showcase">
        <div class="result-avatar-arch ${isSuccess ? 'arch-success' : 'arch-missed'}">
          <div class="avatar-backdrop-glow"></div>
          <div class="avatar-pedestal"></div>
          <div class="result-character-img">
            ${avatarImage(c, isSuccess, result.products)}
          </div>
        </div>
        <span class="result-reaction-bubble ${isSuccess ? 'bubble-happy' : 'bubble-missed'}">
          ${isViral ? 'Viral!' : isSuccess ? 'Mê ly!' : 'Hẹn sau'}
        </span>
      </div>

      <!-- Headline & Speech Quote -->
      <div class="result-content-body">
        <h2 class="result-main-title">
          ${isViral
            ? 'Shop mình bùng nổ xu hướng!'
            : isSuccess
            ? 'Phối đồ cực chuẩn, khách mê ly!'
            : 'Chưa phải outfit của mình'}
        </h2>
        <div class="result-quote-card">
          <span class="quote-author">${escapeHtml(c.name)}:</span>
          <p class="quote-message">“${escapeHtml(result.reason)}”</p>
          ${result.reviewStars ? `<span class="result-review-stars">${icon('star')} ${result.reviewStars.toFixed(1)}/5 đánh giá</span>` : ''}
        </div>
      </div>

      <!-- Rewards or Feedback Details -->
      ${isSuccess ? `
        <div class="result-rewards-tray">
          <div class="reward-card-item revenue">
            <span class="reward-icon-bubble">${icon('coin')}</span>
            <div class="reward-meta">
              <strong class="reward-val">+${money(result.total)}</strong>
              <span class="reward-lbl">Doanh thu</span>
            </div>
          </div>
          <div class="reward-card-item followers">
            <span class="reward-icon-bubble">${icon('user')}</span>
            <div class="reward-meta">
              <strong class="reward-val">+${result.followers}</strong>
              <span class="reward-lbl">Người theo dõi</span>
            </div>
          </div>
          <div class="reward-card-item xp">
            <span class="reward-icon-bubble">${icon('star')}</span>
            <div class="reward-meta">
              <strong class="reward-val">+${result.xpEarned ?? 0} XP</strong>
              <span class="reward-lbl">Kinh nghiệm</span>
            </div>
          </div>
        </div>
        ${result.staffName ? `<div class="staff-sale-credit">${icon('users')} <span><strong>${escapeHtml(result.staffName)}</strong> đã hỗ trợ tư vấn${result.tip ? ` · Khách tip <b>+${money(result.tip)}</b>` : ''}</span></div>` : ''}
        ${result.loyaltyTier ? `<div class="loyalty-sale-credit ${result.loyaltyReward ? 'tier-up' : ''}">${icon('heart')} <span>${result.loyaltyPoints ? `+${result.loyaltyPoints} điểm thân thiết · ` : ''}<strong>${result.loyaltyReward ? escapeHtml(result.loyaltyReward) : escapeHtml(result.loyaltyTier)}</strong></span></div>` : ''}
      ` : `
        <div class="result-feedback-guide">
          <div class="guide-header">
            <span class="guide-title">${icon('hanger')} Gu của ${escapeHtml(c.name)}</span>
            <span class="guide-budget">Ngân sách: <strong>${money(c.budget)}</strong></span>
          </div>
          <div class="guide-styles">
            <span class="guide-styles-label">Phong cách:</span>
            <div class="guide-chips">
              ${c.styles.map(s => `<span class="style-mini-chip">${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>
          <div class="guide-reminder">
            ${icon('heart')} Món đồ vẫn ở trong kho. Hãy chú ý gu và ngân sách của khách tiếp theo nhé.
          </div>
        </div>
      `}

      <!-- Action Button -->
      <button class="btn btn-primary result-submit-cta" data-action="continue">
        <span>${isSuccess ? 'Tiếp tục đón khách' : 'Đón khách tiếp theo'}</span>
        ${icon('arrow')}
      </button>
    </div>
  `;
}

export function summaryModal(s: GameState) {
  const isSlowDay = s.stats.sold === 0;
  const appeal = decorAppealScore(s);
  const walkouts = s.stats.walkouts ?? Math.max(0, s.stats.served - s.stats.happy);
  const netProfit = s.stats.revenue - s.stats.costOfGoods - s.stats.rent - s.stats.loanInterest - s.stats.staffWages;
  return `
    <div class="summary-modal-card ${isSlowDay ? 'is-slow-day' : 'is-success-day'}">
      <!-- Hero Banner với bầu trời hoàng hôn/ánh nắng ấm áp -->
      <div class="summary-hero-banner">
        <div class="summary-hero-pattern"></div>
        <div class="summary-hero-top">
          <span class="summary-eyebrow-chip">
            ${icon('sparkle')} ${isSlowDay ? 'A TOUGH LITTLE DAY' : 'THE END OF A LOVELY DAY'}
          </span>
          <span class="summary-day-badge">NGÀY ${s.day}</span>
        </div>

        <div class="summary-celestial-wrapper">
          <div class="summary-celestial-halo"></div>
          <div class="summary-celestial-icon">
            ${icon(isSlowDay ? 'cloud' : 'sun')}
          </div>
        </div>

        <h2 class="summary-hero-title">
          ${isSlowDay ? `Ngày ${s.day} vắng đơn nhưng đầy hy vọng` : `Ngày ${s.day}, khép lại trọn vẹn!`}
        </h2>
        <p class="summary-hero-subtitle">
          ${isSlowDay
            ? 'Đôi khi tiệm có ngày lắng đọng. Hãy xem lại cách bài trí và đón đầu xu hướng ngày mai!'
            : 'Gấp lại một ngày buôn may bán đắt, mở ra bước tiến mới cho tiệm thời trang của bạn.'}
        </p>
      </div>

      <div class="summary-body">
        <!-- Spotlight Tài Chính: Doanh thu, Chi phí thuê, Lợi nhuận ròng -->
        <div class="summary-finance-spotlight">
          <div class="finance-header-row">
            <span class="finance-label">${icon('coins')} TỔNG KẾT DOANH THU</span>
            <span class="finance-happy-pill">
              ${icon('heart')} ${s.stats.happy} nụ cười ${walkouts > 0 ? `· <small>${walkouts} khách về</small>` : ''}
            </span>
          </div>

          <div class="finance-revenue-display">
            <span class="finance-revenue-label">Doanh thu hôm nay</span>
            <strong class="finance-amount ${isSlowDay ? 'is-zero' : ''}">${money(s.stats.revenue)}</strong>
            <span class="finance-sub-info">
              ${isSlowDay ? 'Chưa phát sinh doanh thu hôm nay' : `Đạt được từ ${s.stats.sold} sản phẩm được yêu thích`}
            </span>
          </div>

          <div class="finance-breakdown-box">
            <div class="breakdown-item">
              <span class="breakdown-title">Giá vốn hàng đã bán</span>
              <span class="breakdown-value ${s.stats.costOfGoods > 0 ? 'rent-cost' : 'rent-free'}">
                ${s.stats.costOfGoods > 0 ? `-${money(s.stats.costOfGoods)}` : '0₫'}
              </span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-title">
                Tiền thuê phát sinh
              </span>
              <span class="breakdown-value ${s.stats.rent > 0 ? 'rent-cost' : 'rent-free'}">
                ${s.stats.rent > 0 ? `-${money(s.stats.rent)}` : '0₫'}
              </span>
            </div>
            ${s.loan ? `<div class="breakdown-item"><span class="breakdown-title">Lãi vay trong ngày</span><span class="breakdown-value ${s.stats.loanInterest ? 'rent-cost' : 'rent-free'}">${s.stats.loanInterest ? `-${money(s.stats.loanInterest)}` : '0₫'}</span></div>` : ''}
            ${s.employees.length || s.stats.staffWages ? `<div class="breakdown-item"><span class="breakdown-title">Lương nhân viên ${s.stats.tips ? `<span class="free-rent-tag">Tip +${money(s.stats.tips)}</span>` : ''}</span><span class="breakdown-value ${s.stats.staffWages ? 'rent-cost' : 'rent-free'}">${s.stats.staffWages ? `-${money(s.stats.staffWages)}` : '0₫'}</span></div>` : ''}
            <div class="breakdown-item net-profit-item">
              <span class="breakdown-title">Lợi nhuận ròng hôm nay</span>
              <strong class="breakdown-value net-profit-value ${netProfit > 0 ? 'profit-pos' : netProfit === 0 ? 'profit-neutral' : 'profit-neg'}">
                ${netProfit > 0 ? `+${money(netProfit)}` : netProfit === 0 ? '0₫' : `-${money(Math.abs(netProfit))}`}
              </strong>
            </div>
          </div>
        </div>

        <!-- Lưới 4 chỉ số thống kê nổi bật -->
        <div class="summary-highlights-grid">
          <div class="highlight-stat-card stat-sold">
            <div class="stat-icon-bubble bubble-bag">${icon('bag')}</div>
            <div class="stat-meta">
              <strong class="stat-val">${s.stats.sold}</strong>
              <span class="stat-name">Món đồ đã bán</span>
            </div>
          </div>

          <div class="highlight-stat-card stat-visitors">
            <div class="stat-icon-bubble bubble-users">${icon('users')}</div>
            <div class="stat-meta">
              <strong class="stat-val">${s.stats.served}</strong>
              <span class="stat-name">Khách ghé tiệm</span>
            </div>
          </div>

          <div class="highlight-stat-card stat-appeal">
            <div class="stat-icon-bubble bubble-appeal">${icon('decor')}</div>
            <div class="stat-meta">
              <strong class="stat-val">${appeal}</strong>
              <span class="stat-name">Điểm thẩm mỹ</span>
            </div>
          </div>

          <div class="highlight-stat-card stat-trend">
            <div class="stat-icon-bubble bubble-trend">${icon(isSlowDay ? 'star' : 'trend')}</div>
            <div class="stat-meta">
              <strong class="stat-val">${isSlowDay ? `${s.reputation.toFixed(1)}/5` : s.stats.trendSales}</strong>
              <span class="stat-name">${isSlowDay ? 'Độ uy tín' : 'Món hợp xu hướng'}</span>
            </div>
          </div>
        </div>

        <!-- Hộp bí kíp ngày ế hoặc Lời chúc mừng ngày đông khách -->
        ${isSlowDay ? `
          <div class="summary-tips-card">
            <div class="tip-card-header">
              <span class="tip-sparkle-icon">${icon('sparkle')}</span>
              <strong>Mẹo để ngày mai đông khách & nổ đơn:</strong>
            </div>
            <ul class="tip-bullet-list">
              <li>
                <b>Trang trí quán đẹp hơn:</b> Sắm thêm gương, thảm lông, sofa để tăng <i>Điểm thẩm mỹ</i>, kích thích khách ghé nhiều hơn!
              </li>
              <li>
                <b>Đón đầu xu hướng:</b> Xem trước tab <i>Xu hướng</i> và nhập các mẫu hot trend để khách ưng ý ngay từ ánh nhìn đầu tiên.
              </li>
              <li>
                <b>Cân đối mức giá:</b> Điều chỉnh giá vừa túi tiền của nhóm khách quen và giới trẻ.
              </li>
            </ul>
          </div>
        ` : `
          <div class="summary-cheer-banner">
            <span class="cheer-heart-icon">${icon('heart')}</span>
            <div class="cheer-text">
              <strong>Boutique ngày càng lan tỏa sức hút!</strong>
              <p>Mỗi vị khách rời đi với nụ cười là một lời khẳng định cho gu thẩm mỹ tuyệt vời của bạn.</p>
            </div>
          </div>
        `}

        <!-- Nút hành động chính và phụ -->
        <div class="summary-actions-group">
          <button class="btn btn-primary summary-primary-btn" data-action="next-day">
            <span>${isSlowDay ? 'Cố gắng vào ngày mai' : 'Chào một ngày mới rực rỡ'}</span>
            ${icon('sun')}
          </button>
          <button class="btn btn-secondary summary-secondary-btn" data-action="close-modal">
            Ở lại ngắm shop một chút
          </button>
        </div>
      </div>
    </div>
  `;
}

export function financeModal(s: GameState) {
  const borrowed = s.loan?.principal ?? 0;
  const balance = s.loan?.balance ?? 0;
  const remaining = Math.max(0, LOAN_MAX - borrowed);
  const minimum = Math.min(LOAN_MIN, remaining);
  const suggested = Math.min(700000, remaining);
  const canBorrow = s.phase !== 'open' && remaining > 0;
  const installment = s.loan?.paymentDue ?? 0;
  const rentPerDay = dailyRent(s);
  return `
    <div class="finance-modal">
      <div class="modal-heading finance-modal-heading">
        <div><span class="eyebrow">QUẢN LÝ DÒNG TIỀN</span><h2>Tài chính boutique</h2><p>Chủ động vốn vay và các khoản phải trả mỗi ngày.</p></div>
        <button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </div>
      <div class="finance-balance-grid">
        <article class="is-cash"><i>${icon('coins')}</i><div><span>Tiền mặt</span><strong>${money(s.money)}</strong></div></article>
        <article><i>${icon('tag')}</i><div><span>Dư nợ vay</span><strong>${money(balance)}</strong></div></article>
        <article><i>${icon('shop')}</i><div><span>Thuê mỗi ngày</span><strong>${money(rentPerDay)}</strong></div></article>
      </div>
      <div class="finance-main-grid">
        <section class="finance-loan-box">
          <div class="finance-section-title"><div><span class="eyebrow">VỐN KINH DOANH</span><h3>Vay thêm vốn</h3></div><span class="finance-rate">${(LOAN_DAILY_RATE * 100).toFixed(1)}%/ngày</span></div>
          <p class="finance-limit">${remaining > 0 ? `Có thể vay ${money(minimum)} – ${money(remaining)}` : 'Bạn đã dùng hết hạn mức vay.'}</p>
          <div class="finance-loan-control">
            <label for="loan-amount-input">Số tiền muốn vay</label>
            <div><input id="loan-amount-input" type="number" min="${minimum}" max="${remaining}" step="10000" value="${suggested}" ${canBorrow ? '' : 'disabled'} aria-label="Số tiền muốn vay"><span>₫</span></div>
          </div>
          <button class="btn btn-primary finance-borrow-btn" data-action="take-loan" ${canBorrow ? '' : 'disabled'}>Nhận khoản vay</button>
          <div class="finance-terms"><span>Lãi <b>${(LOAN_DAILY_RATE * 100).toFixed(1)}%/ngày</b></span><span>Kỳ trả <b>${(LOAN_PAYMENT_RATE * 100).toFixed(0)}% vốn/ngày</b></span><span>Bắt đầu <b>ngày 3</b></span></div>
          <small>Hạn mức trọn đời: ${money(LOAN_MAX)} · Đã vay: ${money(borrowed)}</small>
        </section>
        <section class="finance-bills-box">
          <div class="finance-section-title"><div><span class="eyebrow">HÓA ĐƠN</span><h3>Cần thanh toán</h3></div><span class="finance-due-count">${Number(installment > 0) + Number(s.rentDue > 0)} khoản</span></div>
          <div class="finance-bill-row ${s.loanOverdueDays >= 6 ? 'is-danger' : ''}"><div><span>Kỳ vay</span><strong>${money(installment)}</strong><small>${installment > 0 ? `Đang nợ ${s.loanOverdueDays}/7 ngày` : `Dư nợ ${money(balance)}`}</small></div><button class="btn btn-secondary btn-small" data-action="pay-loan" ${installment <= 0 || s.money < installment || s.phase === 'open' ? 'disabled' : ''}>Trả ngay</button></div>
          <div class="finance-bill-row ${s.rentOverdueDays >= 6 ? 'is-danger' : ''}"><div><span>Thuê mặt bằng</span><strong>${money(s.rentDue)}</strong><small>${s.rentDue > 0 ? `${money(rentPerDay)}/ngày · nợ ${s.rentOverdueDays}/7 ngày` : `${money(rentPerDay)}/ngày · chưa có nợ`}</small></div><button class="btn btn-secondary btn-small" data-action="pay-rent" ${s.rentDue <= 0 || s.money < s.rentDue || s.phase === 'open' ? 'disabled' : ''}>Trả ngay</button></div>
          <p class="finance-footnote">Các khoản chưa trả được cộng dồn và không tự trừ tiền mặt.</p>
        </section>
      </div>
    </div>`;
}

export function financialGameOverModal(s: GameState) {
  const creditor = s.gameOverReason === 'creditor';
  return `
    <div class="financial-gameover">
      <div class="gameover-symbol">${icon(creditor ? 'coins' : 'shop')}</div>
      <span class="eyebrow">BOUTIQUE ĐÃ KHÉP LẠI</span>
      <h2>${creditor ? 'Chủ nợ đã tới thu hồi shop' : 'Chủ nhà đã lấy lại mặt bằng'}</h2>
      <p>${creditor
        ? 'Khoản vay đã quá hạn hơn 7 ngày. Các tài sản trong boutique được thu hồi để xử lý khoản nợ.'
        : 'Tiền thuê mặt bằng đã quá hạn hơn 7 ngày. Bạn không thể tiếp tục kinh doanh tại địa điểm này.'}</p>
      <div class="gameover-debt"><span>Ngày kết thúc</span><strong>Ngày ${s.day}</strong><span>Khoản chưa trả</span><strong>${money(creditor ? (s.loan?.paymentDue ?? 0) : s.rentDue)}</strong></div>
      <button class="btn btn-primary" data-action="reset">Bắt đầu boutique mới</button>
    </div>`;
}

export function debtWarningModal(s: GameState) {
  const maxDays = Math.max(s.loanOverdueDays, s.rentOverdueDays);
  const daysLeft = Math.max(0, 7 - maxDays);
  const finalDay = daysLeft === 0;
  return `
    <div class="debt-warning-modal ${finalDay ? 'is-final' : ''}">
      <header class="debt-warning-hero">
        <div class="debt-warning-icon">${icon('clock')}</div>
        <div class="debt-warning-copy">
          <span class="eyebrow">CẢNH BÁO TÀI CHÍNH</span>
          <h2>${finalDay ? 'Hôm nay là hạn cuối!' : `Còn ${daysLeft} ngày để thanh toán`}</h2>
          <p>${finalDay ? 'Nếu kết thúc thêm một ngày mà chưa trả, boutique sẽ bị thu hồi.' : 'Khoản nợ sắp chạm giới hạn 7 ngày. Hãy cân đối tiền mặt và thanh toán sớm.'}</p>
        </div>
      </header>
      <div class="debt-warning-list">
        ${s.loanOverdueDays >= 5 ? `<div><span>Kỳ vay <small>${s.loanOverdueDays}/7 ngày</small></span><strong>${money(s.loan?.paymentDue ?? 0)}</strong><i><b style="width:${Math.min(100, s.loanOverdueDays / 7 * 100)}%"></b></i></div>` : ''}
        ${s.rentOverdueDays >= 5 ? `<div><span>Thuê mặt bằng <small>${s.rentOverdueDays}/7 ngày</small></span><strong>${money(s.rentDue)}</strong><i><b style="width:${Math.min(100, s.rentOverdueDays / 7 * 100)}%"></b></i></div>` : ''}
      </div>
      <div class="debt-warning-actions">
        <button class="btn btn-primary" data-action="finance-open">Thanh toán ngay</button>
        <button class="btn btn-secondary" data-action="summary">Xem tổng kết ngày</button>
      </div>
    </div>`;
}

export function upgradeModal(s: GameState) {
  const next = levels[s.level];
  const canAfford = s.money >= (next?.cost ?? 0);
  const hasXp = s.xp >= (next?.xp ?? 0);
  const canUpgrade = !!next && canAfford && hasXp;
  const newProducts = next ? products.filter(p => p.level === s.level + 1) : [];
  const newFurniture = next ? furniture.filter(f => f.level === s.level + 1) : [];

  return `
    <div class="upgrade-modal-wrapper">
      <!-- Modal Header -->
      <div class="modal-heading upgrade-modal-heading">
        <div>
          <span class="eyebrow">${next ? 'ROOM FOR YOUR DREAMS' : 'MILESTONE ACHIEVED'}</span>
          <h2>${next ? 'Nâng Cấp Boutique Của Bạn' : 'Boutique Đã Vươn Tầm Thế Giới'}</h2>
        </div>
        <button class="icon-button modal-close-btn" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </div>

      <!-- Hero Card Cấp Mới -->
      <div class="upgrade-hero-card">
        <div class="upgrade-crown-badge">
          <span class="upgrade-crown-icon">${icon('trophy')}</span>
          <span class="upgrade-level-num">${String(Math.min(7, s.level + 1)).padStart(2, '0')}</span>
        </div>
        <div class="upgrade-hero-titles">
          <h3 class="upgrade-hero-name">${escapeHtml(next?.name ?? levels[6].name)}</h3>
          <p class="upgrade-hero-label">${escapeHtml(next?.label ?? 'Cảm ơn bạn đã nuôi lớn giấc mơ này')}</p>
        </div>
        <span class="upgrade-hero-status-pill ${canUpgrade ? 'is-ready' : ''}">
          ${canUpgrade ? `${icon('check')} Sẵn sàng nâng cấp!` : `${icon('clock')} Đang tích lũy`}
        </span>
      </div>

      ${next ? `
        <!-- Khối Unlock Điều Mới Đang Chờ Bạn -->
        <div class="upgrade-unlock-section">
          <div class="upgrade-section-header">
            <h4>${icon('trophy')} Đặc quyền & Mở khóa cấp ${s.level + 1}</h4>
            <span class="unlock-counter-pill">${newProducts.length + newFurniture.length + 1} điều mới</span>
          </div>

          <!-- Grid các item unlock (gọn gàng, cuộn mượt không làm tràn modal) -->
          <div class="upgrade-unlock-grid">
            <!-- Thêm khách ghé shop -->
            <div class="unlock-item-card perk-card">
              <div class="unlock-icon-bubble perk-bubble">${icon('users')}</div>
              <div class="unlock-item-meta">
                <strong>Thêm khách ghé shop</strong>
                <span>Nhiều cơ hội tư vấn & doanh thu</span>
              </div>
              <span class="unlock-check-badge">${icon('check')}</span>
            </div>

            <!-- Các sản phẩm thời trang mới -->
            ${newProducts.map(p => `
              <div class="unlock-item-card product-unlock-card">
                <div class="unlock-thumb-box">${productImage(p)}</div>
                <div class="unlock-item-meta">
                  <strong title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</strong>
                  <span>${p.style} · Thời trang</span>
                </div>
                <span class="unlock-check-badge">${icon('check')}</span>
              </div>
            `).join('')}

            <!-- Các nội thất mới -->
            ${newFurniture.map(f => `
              <div class="unlock-item-card furniture-unlock-card">
                <div class="unlock-thumb-box">${furnitureImage(f)}</div>
                <div class="unlock-item-meta">
                  <strong title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</strong>
                  <span>+${f.appeal} Thẩm mỹ · Nội thất</span>
                </div>
                <span class="unlock-check-badge">${icon('check')}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Yêu Cầu Nâng Cấp (XP & Tiền) -->
        <div class="upgrade-requirements-box">
          <!-- Cột XP -->
          <div class="req-stat-card ${hasXp ? 'is-met' : 'is-unmet'}">
            <div class="req-stat-header">
              <span class="req-stat-icon star-bubble">${icon('star')}</span>
              <div class="req-stat-info">
                <span class="req-stat-label">Kinh nghiệm (XP)</span>
                <strong class="req-stat-val">${s.xp} / ${next.xp} XP</strong>
              </div>
            </div>
            <div class="req-progress-bar">
              <div class="req-progress-fill" style="width: ${Math.min(100, Math.round((s.xp / next.xp) * 100))}%"></div>
            </div>
            <span class="req-status-tag ${hasXp ? 'tag-met' : 'tag-unmet'}">
              ${hasXp ? `${icon('check')} Đã đạt` : `Cần thêm ${next.xp - s.xp} XP`}
            </span>
          </div>

          <!-- Cột Tiền -->
          <div class="req-stat-card ${canAfford ? 'is-met' : 'is-unmet'}">
            <div class="req-stat-header">
              <span class="req-stat-icon coin-bubble">${icon('coin')}</span>
              <div class="req-stat-info">
                <span class="req-stat-label">Chi phí nâng cấp</span>
                <strong class="req-stat-val">${money(next.cost)}</strong>
              </div>
            </div>
            <div class="req-wallet-sub">
              <span>Ví của bạn:</span>
              <strong class="${canAfford ? 'text-green' : 'text-danger'}">${money(s.money)}</strong>
            </div>
            <span class="req-status-tag ${canAfford ? 'tag-met' : 'tag-unmet'}">
              ${canAfford ? `${icon('check')} Đủ tiền` : `Thiếu ${money(next.cost - s.money)}`}
            </span>
          </div>
        </div>

        <!-- Nút CTA Nâng Cấp -->
        <div class="upgrade-modal-footer">
          <button class="btn btn-primary full-width upgrade-confirm-btn ${canUpgrade ? 'is-pulse' : ''}" data-action="upgrade" ${!canUpgrade ? 'disabled' : ''}>
            ${icon('trophy')} <span>Nâng cấp boutique lên Cấp ${s.level + 1}</span> ${icon('arrow')}
          </button>
        </div>
      ` : `
        <div class="max-level-celebration">
          <div class="max-level-icon">${icon('crown')}</div>
          <h3>Đỉnh Cao Thời Trang!</h3>
          <p>Boutique của bạn đã đạt cấp độ tối đa. Hãy tiếp tục sáng tạo outfit và làm đẹp cho từng vị khách ghé thăm!</p>
        </div>
      `}
    </div>
  `;
}
