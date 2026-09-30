import { products } from '../data/catalog';
import { categories, fashionStyles, looks, occasions, subcategories } from '../data/fashion';
import { buyPrice, currentEvent, isOutOfTrend, isTrending, sellPrice } from '../systems/rules';
import { defaultFilters, filterProducts, searchText, type CatalogFilters } from '../systems/catalog';
import type { GameState, Product } from '../types';
import { compact, escapeHtml, money, productImage } from './format';
import { icon } from './icons';
import { supplierFor, suppliers } from '../systems/operations';
import { gameDate } from '../systems/calendar';
import { atelierMaterials, ATELIER_UNLOCK_LEVEL } from '../data/atelier';
import { atelierMaterialIllustration } from '../art/atelierArt';

const options = (values: Record<string, string>, selected: string, allLabel: string) =>
  `<option value="all">${allLabel}</option>${Object.entries(values).map(([id, label]) => `<option value="${id}" ${selected === id ? 'selected' : ''}>${label}</option>`).join('')}`;

const supplierSourceIcon = (id: 'local' | 'wholesale' | 'global') => id === 'local'
  ? `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M8 17h28v19H8z" fill="#fff7e9"/><path d="m7 17 4-9h22l4 9" fill="#f7a5c8"/><path d="M8 17c0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0" fill="#ffd8e8"/><path d="M14 24h7v12h-7zm12 0h6v7h-6z" fill="#bde8e0"/><path d="M8 17h28v19H8M7 17l4-9h22l4 9M13 8l-1 9m7-9-.5 9m7.5-9 .5 9M33 8l1 9M14 24h7v12m5-12h6v7h-6" fill="none" stroke="#713653" stroke-width="1.7" stroke-linejoin="round"/></svg>`
  : id === 'wholesale'
  ? `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="m8 14 13-6 13 6-13 7z" fill="#d8c9ff"/><path d="M8 14v15l13 7V21zm26 0v15l-13 7V21z" fill="#f6c9df"/><path d="m21 21 13-7M21 21 8 14m13 7v15M8 14l13-6 13 6v15l-13 7-13-7z" fill="none" stroke="#713653" stroke-width="1.7" stroke-linejoin="round"/><path d="m15 11 13 6v7" fill="none" stroke="#fff7e9" stroke-width="2"/><path d="M30 31h7m-3-3 3 3-3 3" fill="none" stroke="#9168d8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M18 8h8l2 7 6 4-5 6 3 11H12l3-11-5-6 6-4z" fill="#ffe7a6"/><path d="M18 8c0 5 8 5 8 0m-10 7 6 5 6-5M15 25h14M12 36h20" fill="none" stroke="#713653" stroke-width="1.7" stroke-linejoin="round"/><path d="m22 20 2 3 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z" fill="#f29abd" stroke="#713653" stroke-width="1"/></svg>`;

function productCard(s: GameState, p: Product, quantity: number) {
  const locked = p.level > s.level;
  const count = s.inventory[p.id] ?? 0;
  const trending = isTrending(s, p);
  const outOfTrend = isOutOfTrend(s, p);
  const cost = buyPrice(s, p);
  const sell = sellPrice(s, p);
  const profit = sell - cost;

  return `<article class="product-card ${locked ? 'locked' : ''}" data-product-id="${p.id}" data-category="${p.category}" data-style="${p.style}" data-subcategory="${p.subcategory}">
    <div class="product-visual" style="--item-color:${p.color}22">
      ${productImage(p)}
      <span class="stock-badge ${count > 0 ? 'has-stock' : ''}">
        ${locked ? `${icon('lock')} Cấp ${p.level}` : count > 0 ? `Còn ${count}` : 'Hết hàng'}
      </span>
      ${trending ? `<span class="trend-badge">${icon('trend')} HOT</span>` : outOfTrend ? `<span class="trend-badge out-trend-badge">OUT TREND</span>` : ''}
    </div>
    <div class="product-detail">
      <div class="product-meta-row">
        <span class="item-style-badge" style="border-color:${p.color}88; color:${p.color}">${p.style}</span>
        <span class="item-occasion-tag">${occasions[p.occasions[0]]}</span>
      </div>
      <h3 class="product-name" title="${escapeHtml(p.name)}">${p.name}</h3>
      
      <div class="price-matrix">
        <div class="price-row">
          <span>Giá nhập</span>
          <strong class="cost-value">${money(cost)}</strong>
        </div>
        <div class="price-row sale-price-row">
          <label for="price-${p.id}">Giá bán</label>
          <div class="select-pill-wrap">
            <select id="price-${p.id}" class="price-select" data-price="${p.id}" ${locked ? 'disabled' : ''}>
              ${[.8, 1, 1.2, 1.5].map(m => Math.round(p.sellPrice * m)).map(price => `<option value="${price}" ${price === sell ? 'selected' : ''}>${money(price)}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="profit-indicator">
        <span class="profit-label">Lãi dự kiến</span>
        <span class="profit-amount">+${money(profit)}</span>
      </div>

      <button class="btn ${locked ? 'btn-muted' : 'btn-primary'} buy-button" data-action="buy" data-id="${p.id}" ${locked || cost * quantity > s.money || count + quantity > 999 ? 'disabled' : ''}>
        ${icon(locked ? 'lock' : 'plus')}
        <span>${locked ? `Mở ở cấp ${p.level}` : `Nhập ×${quantity} · ${compact(cost * quantity)}₫`}</span>
      </button>
    </div>
  </article>`;
}

export function lookbook(s: GameState, f: CatalogFilters, lookQtys: Record<string, number> = {}) {
  const supplier = supplierFor(s);
  const list = looks.filter(look => {
    const items = look.items.map(id => products.find(p => p.id === id)!);
    return (f.style === 'all' || look.style === f.style) && (f.occasion === 'all' || look.occasion === f.occasion) &&
      (f.availability !== 'unlocked' || items.every(p => p.level <= s.level)) &&
      (f.availability !== 'owned' || items.every(p => (s.inventory[p.id] ?? 0) > 0)) &&
      (!f.query || searchText(`${look.name} ${look.description} ${look.style}`).includes(searchText(f.query)));
  });

  return `<div class="catalog-result">
      <span class="catalog-result-left">${icon('heart')} ${list.length} bộ phối gợi ý · ${looks.length} lookbook có sẵn</span>
      <span class="catalog-result-right">${icon('tag')} Nhập trọn bộ outfit theo lô tiết kiệm</span>
    </div>
    <div class="lookbook-grid import-grid">
      ${list.map(look => {
        const items = look.items.map(id => products.find(p => p.id === id)!);
        const level = Math.max(...items.map(p => p.level));
        const locked = level > s.level;
        const qty = Math.max(supplier.minOrder, lookQtys[look.id] ?? supplier.minOrder);
        const baseCostPerSet = items.reduce((sum, p) => sum + buyPrice(s, p), 0);
        const unitCost = baseCostPerSet;
        const totalCost = baseCostPerSet * qty;
        const retailPerSet = items.reduce((sum, p) => sum + sellPrice(s, p), 0);
        const totalRetail = retailPerSet * qty;
        const profit = totalRetail - totalCost;
        const allOwned = items.every(p => (s.inventory[p.id] ?? 0) > 0);
        const isMaxed = items.some(p => (s.inventory[p.id] ?? 0) + qty > 999);
        const internationalDays = items.some(item => item.level >= 4 || item.buyPrice >= 200000) ? 3 : 0;
        const deliveryMinDays = internationalDays + supplier.deliveryDays;
        const deliveryMaxDays = deliveryMinDays + (supplier.deliveryDays && supplier.reliability < 1 ? 1 : 0);

        return `<article class="import-card look-card ${locked ? 'locked' : ''}" data-look-id="${look.id}">
          <div class="import-visual look-visual" style="--item-color:${fashionStyles[look.style].color}22">
            <div class="look-outfit-collage">
              ${items.map(p => `<div class="look-mini-item" title="${escapeHtml(p.name)}">${productImage(p, `look-product-art look-art-${p.art}`)}</div>`).join('')}
            </div>
            <span class="stock-badge ${allOwned ? 'has-stock' : ''}">
              ${locked ? `${icon('lock')} Cấp ${level}` : allOwned ? `${icon('check')} Đã có hàng` : `${icon('hanger')} ${items.length} món/bộ`}
            </span>
            <span class="look-count-tag">${items.length} món</span>
          </div>

          <div class="import-detail look-detail">
            <div class="import-name-row">
              <span class="item-style-badge" style="border-color:${fashionStyles[look.style].color}88; color:${fashionStyles[look.style].color}">${look.style}</span>
              <span class="item-occasion-tag">${occasions[look.occasion]}</span>
            </div>
            <h3 class="product-name" title="${escapeHtml(look.name)}">${look.name}</h3>

            <!-- Danh sách món mini dạng chips trực quan -->
            <div class="look-items-strip">
              ${items.map(p => `<span class="look-item-pill" title="${escapeHtml(p.name)} · Bán ${money(sellPrice(s, p))}">${p.name}</span>`).join('')}
            </div>

            <!-- Khối giá đồng bộ với import-price-block -->
            <div class="import-price-block look-price-block">
              <div class="import-unit-line">
                <span class="unit-price-label">Giá nhập:</span>
                <strong class="import-unit-price">${money(unitCost)}</strong>
                <small class="per-unit">/bộ</small>
              </div>

              <div class="import-cost-summary">
                <span class="total-label">${icon('coin')} Tổng (${qty} bộ · ${items.length * qty} món):</span>
                <strong class="total-amount">${money(totalCost)}</strong>
              </div>

              <div class="ship-lead-time look-delivery-time">
                ${icon(deliveryMinDays ? 'truck' : 'box')}
                ${deliveryMinDays
                  ? `Vận chuyển: <strong>${deliveryMinDays}${deliveryMaxDays > deliveryMinDays ? `–${deliveryMaxDays}` : ''} ngày</strong> về kho`
                  : '<strong>Nhận ngay vào kho</strong>'}
              </div>

              <div class="discount-saved-pill look-profit-pill">
                ${icon('coin')} Lãi dự kiến +${money(profit)}
              </div>
            </div>

            <!-- Bộ chọn số lượng và nút nhập nằm chung một hàng -->
            <div class="import-purchase-row">
              <div class="import-qty-section">
                <div class="qty-header-row">
                  <span class="qty-label">Số lượng bộ outfit:</span>
                </div>
                <div class="traditional-qty-control">
                  <button type="button" data-action="look-qty-step" data-look="${look.id}" data-id="-1" aria-label="Giảm số lượng" ${qty <= supplier.minOrder ? 'disabled' : ''}>${icon('minus')}</button>
                  <input class="look-qty-input" data-look="${look.id}" type="number" inputmode="numeric" min="${supplier.minOrder}" max="30" step="1" value="${qty}" aria-label="Số bộ outfit" />
                  <button type="button" data-action="look-qty-step" data-look="${look.id}" data-id="1" aria-label="Tăng số lượng" ${qty >= 30 ? 'disabled' : ''}>${icon('plus')}</button>
                </div>
              </div>

              <button class="btn ${locked ? 'btn-muted' : 'btn-primary'} import-btn" data-action="buy-look" data-id="${look.id}" ${locked || qty < supplier.minOrder || totalCost > s.money || isMaxed ? 'disabled' : ''}>
                ${icon(locked ? 'lock' : deliveryMinDays ? 'truck' : 'bag')}
                <span class="import-btn-copy">
                  <b>${locked ? `Mở đủ ở cấp ${level}` : deliveryMinDays ? `Đặt ×${qty} bộ` : qty > 1 ? `Nhập ×${qty} bộ` : 'Nhập trọn bộ'}</b>
                  ${!locked && qty >= supplier.minOrder ? `<small>${money(totalCost)}</small>` : ''}
                </span>
              </button>
            </div>
          </div>
        </article>`;
      }).join('')}
    </div>
    ${list.length ? '' : emptyFilters()}`;
}

const emptyFilters = () => `<div class="empty-state catalog-empty">
  ${icon('hanger')}
  <h3>Chưa có món nào hợp bộ lọc</h3>
  <p>Thử đổi phong cách, kiểu dáng hoặc chọn danh mục khác để tìm thêm cảm hứng.</p>
  <button class="btn btn-secondary" data-action="clear-filters">Xóa bộ lọc</button>
</div>`;

export function stockPanel(s: GameState, filterArg: CatalogFilters | string = 'all', quantity: number = 1, mode: 'catalog' | 'looks' = 'catalog') {
  const f: CatalogFilters = typeof filterArg === 'string' ? { ...defaultFilters(), category: filterArg } : filterArg;
  const list = filterProducts(s, f);
  const totalStock = Object.values(s.inventory).reduce((a, b) => a + b, 0);

  return `
    <div class="stock-compact-header">
      <div class="stock-header-info">
        <span class="stock-header-icon">${icon('hanger')}</span>
        <div>
          <h2>TỦ ĐỒ BOUTIQUE</h2>
          <p>${products.length} thiết kế xinh xắn · Thời trang Gen Z</p>
        </div>
      </div>
      <div class="stock-header-badges">
        <span class="stock-count-chip">${icon('bag')} <strong>${totalStock}</strong> món trong kho</span>
        <button class="panel-close-btn btn btn-small btn-secondary" data-action="nav" data-id="shop" aria-label="Quay lại shop">${icon('close')} <span>Quay lại shop</span></button>
      </div>
    </div>

    <!-- Segmented Control Chế độ: Bộ sưu tập vs Lookbook -->
    <div class="catalog-modes" role="group" aria-label="Chế độ tủ đồ">
      <button data-action="catalog-mode" data-id="catalog" class="${mode === 'catalog' ? 'active' : ''}" aria-pressed="${mode === 'catalog'}">
        ${icon('hanger')} <span>Bộ sưu tập</span>
      </button>
      <button data-action="catalog-mode" data-id="looks" class="${mode === 'looks' ? 'active' : ''}" aria-pressed="${mode === 'looks'}">
        ${icon('heart')} <span>Lookbook phối đồ</span> <span class="mode-count">${looks.length}</span>
      </button>
    </div>

    ${currentEvent(s).discount < 1 ? `<p class="discount-banner">Hôm nay giảm ${Math.round((1 - currentEvent(s).discount) * 100)}% giá nhập toàn bộ sản phẩm và outfit!</p>` : ''}

    <!-- Toolbar bộ lọc và thao tác nhanh -->
    <div class="inventory-toolbar">
      ${mode === 'catalog' ? `
        <!-- Thanh trượt ngang danh mục thời trang -->
        <div class="category-scroll-strip" role="tablist" aria-label="Loại sản phẩm">
          ${Object.entries({ all: 'Tất cả', ...categories }).map(([id, label]) => `
            <button class="filter cat-chip ${id === f.category ? 'active' : ''}" data-action="filter" data-id="${id}" aria-pressed="${id === f.category}">
              ${label}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Bộ lọc và tìm kiếm tinh gọn -->
      <div class="fashion-filters">
        <label class="catalog-search">
          <span class="sr-only">Tìm sản phẩm</span>
          <span class="search-icon-inside">${icon('search')}</span>
          <input id="catalog-search" type="search" placeholder="Tìm đồ xinh, phong cách, màu sắc…" value="${escapeHtml(f.query)}" maxlength="80" autocomplete="off" />
        </label>
        
        <div class="filter-controls-row">
          <label class="select-label">
            <span class="sr-only">Phong cách</span>
            <select id="catalog-style">
              ${options(Object.fromEntries(Object.keys(fashionStyles).map(k => [k, k])), f.style, 'Mọi phong cách')}
            </select>
          </label>
          <label class="select-label">
            <span class="sr-only">Dịp mặc</span>
            <select id="catalog-occasion">
              ${options(occasions, f.occasion, 'Mọi cuộc hẹn')}
            </select>
          </label>
          <label class="select-label">
            <span class="sr-only">Trạng thái</span>
            <select id="catalog-availability">
              ${options({ unlocked: 'Đã mở khóa', owned: 'Có trong kho' }, f.availability, 'Tất cả trạng thái')}
            </select>
          </label>
        </div>
      </div>

      ${mode === 'catalog' ? `
        <div class="stock-options">
          <label class="sort-label">
            <span>Sắp xếp:</span>
            <select id="stock-sort">
              ${[['level', 'Cấp mở khóa'], ['price', 'Giá nhập thấp nhất'], ['trend', 'Đang xu hướng'], ['stock', 'Tồn kho nhiều nhất']].map(([id, label]) => `<option value="${id}" ${f.sort === id ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </label>
          <div class="quantity-picker" title="Chọn số lượng nhập mỗi lần bấm">
            <span>Số lượng:</span>
            <div class="quantity-pills">
              ${[1, 5, 10].map(n => `<button data-action="quantity" data-id="${n}" class="${n === quantity ? 'active' : ''}" aria-label="Nhập ${n} món">×${n}</button>`).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    </div>

    ${f.style !== 'all' && f.style in fashionStyles ? `
      <div class="style-context">
        <span style="background:${fashionStyles[f.style as keyof typeof fashionStyles].color}"></span>
        <p><strong>${f.style}</strong> ${fashionStyles[f.style as keyof typeof fashionStyles].description}</p>
      </div>
    ` : ''}

    ${mode === 'looks' ? lookbook(s, f) : `
      <div class="catalog-result" aria-live="polite">
        <span>Hiển thị <strong>${list.length}</strong> / ${products.length} thiết kế</span>
        ${f.query || f.category !== 'all' || f.style !== 'all' || f.occasion !== 'all' || f.availability !== 'all' ? `
          <button class="clear-filter-btn" data-action="clear-filters">Xóa bộ lọc ${icon('close')}</button>
        ` : ''}
      </div>
      <div class="product-grid">
        ${list.map(p => productCard(s, p, quantity)).join('')}
      </div>
      ${list.length ? '' : emptyFilters()}
    `}

    ${s.money < Math.min(...products.filter(p => p.level <= s.level).map(p => buyPrice(s, p))) && !Object.values(s.inventory).some(n => n > 0) ? `
      <div class="notice rescue-notice">
        <div>
          <strong>Boutique cần vốn nhập hàng?</strong>
          <p>Mở mục Tài chính để chọn khoản vay, sau đó tự nhập những mẫu bạn muốn bày bán.</p>
        </div>
        <button class="btn btn-primary" data-action="finance-open">Vay vốn nhập hàng</button>
      </div>
    ` : ''}
  `;
}

/* ==============================================================================
   KHO HÀNG - InventoryPanel: chỉ xem hàng tồn kho + điều chỉnh giá bán
   ============================================================================== */
export function inventoryPanel(s: GameState, category = 'all', mode: 'stock' | 'pending' | 'custom' = 'stock') {
  const customIds = new Set(s.customProducts.map(product => product.id));
  const allOwnedProducts = products.filter(p => (s.inventory[p.id] ?? 0) > 0 && (mode === 'custom' ? customIds.has(p.id) : !customIds.has(p.id)));
  const ownedProducts = allOwnedProducts.filter(p => category === 'all' || p.category === category);
  const pendingOrders = s.pendingOrders ?? [];
  const pendingCount = pendingOrders.length;
  const customCount = s.customProducts.reduce((sum, product) => sum + (s.inventory[product.id] ?? 0), 0);
  const totalStock = Object.values(s.inventory).reduce((a, b) => a + b, 0);

  return `
    <section class="import-panel-shell inventory-panel-shell">
      <h2 class="sr-only">KHO HÀNG BOUTIQUE</h2>
      <div class="import-panel-corner-actions">
        <span class="import-balance inventory-summary-pill">${icon('hudStock')} <strong>${totalStock}</strong> món</span>
        <button class="panel-close-btn import-panel-close" data-action="nav" data-id="shop" aria-label="Quay lại shop">${icon('close')}</button>
      </div>

      <div class="catalog-modes import-primary-tabs inventory-primary-tabs" role="tablist" aria-label="Nội dung kho hàng">
        <button data-action="inventory-mode" data-id="stock" class="${mode === 'stock' ? 'active' : ''}" aria-pressed="${mode === 'stock'}">
          ${icon('box')} <span>Trong kho</span> <span class="mode-count">${totalStock}</span>
        </button>
        <button data-action="inventory-mode" data-id="pending" class="${mode === 'pending' ? 'active' : ''}" aria-pressed="${mode === 'pending'}">
          ${icon('truck')} <span>Đang về</span> <span class="mode-count">${pendingCount}</span>
        </button>
        ${s.level >= 8 ? `<button data-action="inventory-mode" data-id="custom" class="${mode === 'custom' ? 'active' : ''}" aria-pressed="${mode === 'custom'}">
          ${icon('hanger')} <span>Cá nhân</span> <span class="mode-count">${customCount}</span>
        </button>` : ''}
      </div>

      ${mode === 'pending' ? `
        <div class="inventory-panel-note">
          <strong>Đơn hàng đang về</strong>
          <span>${pendingCount ? `${pendingCount} kiện · tự nhập kho khi đến ngày giao` : 'Chưa có kiện hàng nào đang vận chuyển'}</span>
        </div>
        ${pendingCount ? `<div class="pending-list inventory-pending-rail" aria-label="Đơn hàng đang vận chuyển">
          ${pendingOrders.map(o => {
            const p = products.find(x => x.id === o.productId);
            if (!p) return '';
            const source = suppliers.find(supplier => supplier.id === o.supplierId);
            const daysLeft = o.arrivalDay - s.day;
            return `<article class="pending-card">
              <div class="pending-visual">${productImage(p)}</div>
              <div class="pending-info">
                <span class="pending-source">${icon('truck')} ${source ? escapeHtml(source.name) : 'Nguồn hàng'}</span>
                <strong>${p.name}</strong>
                <span class="pending-sub"><b>×${o.quantity} món</b><i>${money(o.cost)}</i></span>
              </div>
              <div class="pending-eta ${daysLeft <= 0 ? 'arriving-now' : daysLeft === 1 ? 'arriving-soon' : ''}">
                ${daysLeft <= 0
                  ? `${icon('box')} <span>Kho đầy · sẽ tự nhập khi có chỗ</span>`
                  : daysLeft === 1
                  ? `${icon('truck')} <span>Ngày mai về kho</span>`
                  : `${icon('clock')} <span>Về ${gameDate(o.arrivalDay)} · còn ${daysLeft} ngày</span>`}
              </div>
            </article>`;
          }).join('')}
        </div>` : `
          <div class="empty-state inv-empty-state inventory-fit-empty">
            <div class="empty-state-icon">${icon('truck')}</div>
            <h3>Không có đơn đang vận chuyển</h3>
            <p>Các đơn cần chờ giao sẽ xuất hiện tại đây.</p>
            <button class="btn btn-primary" data-action="nav" data-id="import">${icon('bag')} Đi nhập hàng</button>
          </div>
        `}
      ` : `
        ${mode === 'custom' ? `<div class="inventory-panel-note"><strong>Bộ sưu tập chữ ký</strong><span>${s.customProducts.length ? `${s.customProducts.length} bản thiết kế đã duyệt` : 'Chưa có mẫu cá nhân nào'}</span></div>` : `<div class="category-scroll-strip inventory-category-tabs" role="tablist" aria-label="Phân loại hàng trong kho">
          ${Object.entries({ all: 'Tất cả', ...categories }).map(([id, label]) =>
            `<button class="filter cat-chip ${id === category ? 'active' : ''}" data-action="inventory-filter" data-id="${id}" aria-pressed="${id === category}">${label}</button>`
          ).join('')}
        </div>`}

    ${allOwnedProducts.length === 0 ? `
      <div class="empty-state inv-empty-state">
        <div class="empty-state-icon">${icon('box')}</div>
        <h3>${mode === 'custom' ? 'Chưa có sản phẩm cá nhân' : 'Kho hàng hiện đang trống'}</h3>
        <p>${mode === 'custom' ? 'Tạo mẫu thành công tại xưởng may rồi duyệt mẫu để đưa thiết kế vào kho.' : 'Boutique chưa có món đồ nào trong kho. Hãy sang quầy <strong>Nhập hàng</strong> để chọn các mẫu thiết kế trendy mới nhất!'}</p>
        <button class="btn btn-primary" data-action="nav" data-id="${mode === 'custom' ? 'atelier' : 'import'}">
          ${icon(mode === 'custom' ? 'hanger' : 'bag')} <span>${mode === 'custom' ? 'Đến xưởng may' : 'Đi nhập hàng ngay'}</span> ${icon('arrow')}
        </button>
      </div>
    ` : ownedProducts.length === 0 ? `
      <div class="empty-state inv-empty-state inventory-fit-empty">
        <div class="empty-state-icon">${icon('search')}</div>
        <h3>Danh mục này chưa có hàng</h3>
        <p>Chọn danh mục khác hoặc nhập thêm sản phẩm mới.</p>
        <button class="btn btn-secondary" data-action="inventory-filter" data-id="all">Xem tất cả</button>
      </div>
    ` : `
      <div class="inv-grid inventory-horizontal-rail" aria-label="Hàng trong kho, vuốt ngang để xem thêm">
        ${ownedProducts.map(p => {
          const count = s.inventory[p.id] ?? 0;
          const cost = buyPrice(s, p);
          const sell = sellPrice(s, p);
          const profit = sell - cost;
          const profitRate = cost > 0 ? Math.round((profit / cost) * 100) : 0;
          const trending = isTrending(s, p);
          const outOfTrend = isOutOfTrend(s, p);
          const priceTone = sell < cost ? 'loss' : sell > p.sellPrice * 1.5 ? 'risky' : sell > p.sellPrice ? 'high' : 'fair';
          const priceHint = priceTone === 'loss'
            ? 'Dưới giá vốn · bán ra sẽ lỗ'
            : priceTone === 'risky'
              ? 'Quá cao · khách rất dễ từ chối'
              : priceTone === 'high'
                ? 'Lãi cao · khách cân nhắc kỹ hơn'
                : `Giá gợi ý: ${money(p.sellPrice)}`;
          return `<article class="inv-card" data-product-id="${p.id}">
            <div class="inv-visual" style="--item-color:${p.color}22">
              ${productImage(p)}
              <span class="inv-stock-count">${icon('box')} Còn ${count}</span>
              ${trending ? `<span class="trend-badge">${icon('trend')} HOT</span>` : outOfTrend ? `<span class="trend-badge out-trend-badge">OUT TREND</span>` : ''}
            </div>
            <div class="inv-detail">
              <div class="inv-name-row">
                <span class="item-style-badge" style="border-color:${p.color}88; color:${p.color}">${p.style}</span>
                <span class="item-occasion-tag">${occasions[p.occasions[0]]}</span>
              </div>
              <h3 class="product-name" title="${escapeHtml(p.name)}">${p.name}</h3>

              <div class="inv-pricing-console">
                <div class="inv-cost-line">
                  <span>Giá nhập vốn</span>
                  <strong>${money(cost)}</strong>
                </div>
                <div class="inv-sell-control">
                  <label for="inv-price-${p.id}">Giá bán ra</label>
                  <div class="inv-select-wrapper">
                    <div class="inv-price-field"><input id="inv-price-${p.id}" class="inv-price-input" data-price="${p.id}" inputmode="numeric" enterkeyhint="done" autocomplete="off" value="${sell.toLocaleString('vi-VN')}" aria-describedby="price-hint-${p.id}" aria-label="Giá bán ${escapeHtml(p.name)}"><span class="inv-price-currency">₫</span></div>
                    <button class="inv-price-save" data-action="inventory-price-save" data-id="${p.id}">Lưu</button>
                  </div>
                </div>
                <div id="price-hint-${p.id}" class="inv-price-hint ${priceTone}">${priceHint}</div>
              </div>

              <div class="inv-profit-row ${profit > 0 ? 'positive' : 'neutral'}">
                <span class="profit-label">${icon('coin')} Lợi nhuận:</span>
                <strong class="profit-val">${profit >= 0 ? '+' : '−'}${money(Math.abs(profit))}</strong>
                <span class="profit-rate">(${profitRate > 0 ? `+${profitRate}%` : `${profitRate}%`})</span>
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    `}
      `}
    </section>
  `;
}

/* ==============================================================================
   NHẬP HÀNG - importPanel: Nhập hàng với giảm giá bulk + order quốc tế
   ============================================================================== */

function importProductCard(s: GameState, p: Product, qty: number) {
  const locked = p.level > s.level;
  const basePrice = buyPrice(s, p);
  const unitPrice = basePrice;
  const totalCost = basePrice * qty;
  const isInternational = p.level >= 4 || p.buyPrice >= 200000;
  const trending = isTrending(s, p);
  const outOfTrend = isOutOfTrend(s, p);
  const currentStock = s.inventory[p.id] ?? 0;
  const pendingQty = (s.pendingOrders ?? []).filter(o => o.productId === p.id).reduce((sum, o) => sum + o.quantity, 0);
  const supplier = supplierFor(s);
  const supplierDelivery = (isInternational ? 3 : 0) + supplier.deliveryDays;

  return `<article class="import-card ${locked ? 'locked' : ''} ${isInternational ? 'international' : 'local'}" data-product-id="${p.id}">
    <div class="import-visual" style="--item-color:${p.color}22">
      ${productImage(p, `import-product-art import-art-${p.art}`)}
      <span class="stock-badge ${currentStock > 0 ? 'has-stock' : ''}">
        ${locked ? `${icon('lock')} Cấp ${p.level}` : currentStock > 0 ? `${icon('box')} Kho: ${currentStock}` : 'Chưa có'}
      </span>
      ${trending ? `<span class="trend-badge">${icon('trend')} HOT</span>` : outOfTrend ? `<span class="trend-badge out-trend-badge">OUT TREND</span>` : ''}
      ${isInternational ? `<span class="intl-badge">${icon('plane')} Quốc tế</span>` : ''}
    </div>

    <div class="import-detail">
      <div class="import-name-row">
        <span class="item-style-badge" style="border-color:${p.color}88; color:${p.color}">${p.style}</span>
        ${pendingQty > 0 ? `<span class="on-the-way-chip">${icon('truck')} ${pendingQty} đang về</span>` : ''}
      </div>
      <h3 class="product-name" title="${escapeHtml(p.name)}">${p.name}</h3>

      <div class="import-price-block">
        <div class="import-unit-line">
          <span class="unit-price-label">Đơn giá:</span>
          <strong class="import-unit-price">${money(unitPrice)}</strong>
          <small class="per-unit">/món</small>
        </div>

        <div class="import-cost-summary">
          <span class="total-label">${icon('coin')} Tổng (${qty} món):</span>
          <strong class="total-amount">${money(totalCost)}</strong>
        </div>

        ${supplierDelivery ? `
          <div class="ship-lead-time">
            ${icon('truck')} Vận chuyển: <strong>${supplierDelivery}–${supplierDelivery + (supplier.reliability < 1 ? 1 : 0)} ngày</strong> về kho
          </div>
        ` : ''}
      </div>

      <div class="import-purchase-row">
        <div class="import-qty-section">
          <div class="qty-header-row">
            <span class="qty-label">Chọn số lượng:</span>
          </div>
          <div class="traditional-qty-control">
            <button type="button" data-action="product-qty-step" data-product="${p.id}" data-id="-1" aria-label="Giảm số lượng" ${qty <= supplier.minOrder ? 'disabled' : ''}>${icon('minus')}</button>
            <input class="product-import-qty-input" data-product="${p.id}" type="number" inputmode="numeric" min="${supplier.minOrder}" max="30" step="1" value="${qty}" aria-label="Số lượng nhập ${escapeHtml(p.name)}" />
            <button type="button" data-action="product-qty-step" data-product="${p.id}" data-id="1" aria-label="Tăng số lượng" ${qty >= 30 ? 'disabled' : ''}>${icon('plus')}</button>
          </div>
        </div>

        <button class="btn ${locked ? 'btn-muted' : 'btn-primary'} import-btn"
          data-action="order-import" data-id="${p.id}"
          ${locked || qty < supplier.minOrder || totalCost > s.money || currentStock + pendingQty + qty > 999 ? 'disabled' : ''}>
          ${icon(locked ? 'lock' : supplierDelivery ? 'truck' : 'box')}
          <span class="import-btn-copy">
            <b>${locked ? `Mở ở cấp ${p.level}` : qty < supplier.minOrder ? `Tối thiểu ${supplier.minOrder} món` : supplierDelivery ? 'Đặt hàng' : 'Nhập vào kho'}</b>
            ${!locked && qty >= supplier.minOrder ? `<small>${money(totalCost)}</small>` : ''}
          </span>
        </button>
      </div>
    </div>
  </article>`;
}

function importMaterialCard(s: GameState, material: typeof atelierMaterials[number], qty: number) {
  const supplier = supplierFor(s);
  const locked = s.level < material.level;
  const unitPrice = Math.round(material.price * currentEvent(s).discount * supplier.priceFactor);
  const totalCost = unitPrice * qty;
  const currentStock = s.materialInventory[material.id] ?? 0;
  const pendingQty = (s.pendingMaterialOrders ?? []).filter(order => order.materialId === material.id).reduce((sum, order) => sum + order.quantity, 0);
  const deliveryMax = supplier.deliveryDays + (supplier.deliveryDays && supplier.reliability < 1 ? 1 : 0);
  return `<article class="import-card material-import-card ${locked ? 'locked' : ''}" data-material-id="${material.id}" style="--material:${material.color}">
    <div class="import-visual material-import-visual" style="--item-color:${material.color}33">
      <div class="material-import-art">${atelierMaterialIllustration(material.id)}</div>
      <span class="stock-badge ${currentStock > 0 ? 'has-stock' : ''}">${locked ? `${icon('lock')} Cấp ${material.level}` : `${icon('box')} Kho: ${currentStock}`}</span>
      ${pendingQty ? `<span class="on-the-way-chip material-way-chip">${icon('truck')} ${pendingQty} đang về</span>` : ''}
    </div>
    <div class="import-detail">
      <h3 class="product-name" title="${escapeHtml(material.name)}">${escapeHtml(material.name)}</h3>
      <p class="material-import-description">${escapeHtml(material.description)}</p>
      <div class="import-price-block">
        <div class="import-unit-line"><span class="unit-price-label">Đơn giá:</span><strong class="import-unit-price">${money(unitPrice)}</strong><small class="per-unit">/đơn vị</small></div>
        <div class="import-cost-summary"><span class="total-label">${icon('coin')} Tổng (${qty} đơn vị):</span><strong class="total-amount">${money(totalCost)}</strong></div>
        ${supplier.deliveryDays ? `<div class="ship-lead-time">${icon('truck')} Vận chuyển: <strong>${supplier.deliveryDays}–${deliveryMax} ngày</strong> về kho</div>` : '<div class="ship-lead-time is-instant">✓ Nhận ngay vào kho nguyên liệu</div>'}
      </div>
      <div class="import-purchase-row">
        <div class="import-qty-section"><div class="qty-header-row"><span class="qty-label">Số lượng:</span></div><div class="traditional-qty-control">
          <button type="button" data-action="material-qty-step" data-material="${material.id}" data-id="-1" aria-label="Giảm số lượng" ${qty <= supplier.minOrder ? 'disabled' : ''}>${icon('minus')}</button>
          <input class="material-import-qty-input" data-material="${material.id}" type="number" inputmode="numeric" min="${supplier.minOrder}" max="30" value="${qty}" aria-label="Số lượng ${escapeHtml(material.name)}" />
          <button type="button" data-action="material-qty-step" data-material="${material.id}" data-id="1" aria-label="Tăng số lượng" ${qty >= 30 ? 'disabled' : ''}>${icon('plus')}</button>
        </div></div>
        <button class="btn ${locked ? 'btn-muted' : 'btn-primary'} import-btn" data-action="order-material" data-id="${material.id}" ${locked || totalCost > s.money || currentStock + pendingQty + qty > 9999 ? 'disabled' : ''}>
          ${icon(locked ? 'lock' : supplier.deliveryDays ? 'truck' : 'box')}<span class="import-btn-copy"><b>${locked ? `Mở ở cấp ${material.level}` : supplier.deliveryDays ? 'Đặt nguyên liệu' : 'Nhập vào kho'}</b>${!locked ? `<small>${money(totalCost)}</small>` : ''}</span>
        </button>
      </div>
    </div>
  </article>`;
}

const supplierCards = (s: GameState) => `<div class="supplier-bar-options">${suppliers.map(supplier => {
  const active = s.activeSupplierId === supplier.id;
  const locked = s.level < supplier.unlockLevel;
  const saving = Math.round((1 - supplier.priceFactor) * 100);
  return `<button data-action="supplier-select" data-id="${supplier.id}" class="supplier-source-card source-${supplier.id} ${active ? 'is-active' : ''}" ${locked ? 'disabled' : ''} title="${escapeHtml(supplier.description)}">
    <span class="supplier-card-icon">${supplierSourceIcon(supplier.id)}</span>
    <span class="supplier-card-copy"><b>${supplier.name}</b><small>${escapeHtml(supplier.description)}</small></span>
    ${active ? `<em class="supplier-card-status">${icon('check')} Hoạt động</em>` : locked ? `<em class="supplier-card-status">${icon('lock')} Cấp ${supplier.unlockLevel}</em>` : '<em class="supplier-card-status is-ready">Có thể chọn</em>'}
    <span class="supplier-card-terms"><span><small>Chiết khấu</small><b>${saving ? `${saving}%` : 'Giá gốc'}</b></span><i></i><span><small>Giao hàng</small><b>${supplier.deliveryDays ? `${supplier.deliveryDays}–${supplier.deliveryDays + (supplier.reliability < 1 ? 1 : 0)} ngày` : 'Nhận ngay'}</b></span><i></i><span><small>Đơn tối thiểu</small><b>${supplier.minOrder} món</b></span></span>
  </button>`;
}).join('')}</div>`;

export function supplierSelectionPanel(s: GameState) {
  return `<section class="import-panel-shell supplier-choice-screen">
    <div class="import-panel-corner-actions">
      <span class="import-balance" data-animated-balance="import">${icon('importMoney')} ${money(s.money)}</span>
      <button class="panel-close-btn import-panel-close" data-action="nav" data-id="shop" aria-label="Đóng và quay lại shop">${icon('close')}</button>
    </div>
    <p class="supplier-choice-hint">Chọn nguồn hàng để xem sản phẩm</p>
    ${supplierCards(s)}
  </section>`;
}

export function importPanel(
  s: GameState,
  filterArg: CatalogFilters | string = 'all',
  quantityOrMap: number | Record<string, number> = {},
  mode: 'products' | 'looks' | 'materials' = 'products',
  lookQtys: Record<string, number> = {},
  materialQtys: Record<string, number> = {}
) {
  const f: CatalogFilters = typeof filterArg === 'string' ? { ...defaultFilters(), category: filterArg } : filterArg;
  const activeSupplier = supplierFor(s);
  const supplierSaving = Math.round((1 - activeSupplier.priceFactor) * 100);
  const list = filterProducts(s, { ...f, availability: 'all' });
  const getQty = (pId: string) => Math.max(activeSupplier.minOrder, typeof quantityOrMap === 'number' ? quantityOrMap : (quantityOrMap[pId] ?? activeSupplier.minOrder));
  const getMaterialQty = (materialId: string) => Math.max(activeSupplier.minOrder, materialQtys[materialId] ?? activeSupplier.minOrder);
  return `
    <section class="import-panel-shell import-catalog-screen">
    <div class="import-panel-corner-actions">
      <span class="import-balance" data-animated-balance="import">${icon('importMoney')} ${money(s.money)}</span>
      <button class="panel-close-btn import-panel-close" data-action="nav" data-id="shop" aria-label="Đóng và quay lại shop">${icon('close')}</button>
    </div>

    <div class="catalog-modes import-primary-tabs" role="tablist" aria-label="Hình thức nhập hàng">
      <button data-action="import-mode" data-id="products" class="${mode === 'products' ? 'active' : ''}" aria-pressed="${mode === 'products'}">
        ${icon('bag')} <span>Sản phẩm</span>
      </button>
      <button data-action="import-mode" data-id="looks" class="${mode === 'looks' ? 'active' : ''}" aria-pressed="${mode === 'looks'}">
        ${icon('heart')} <span>Lookbook</span> <span class="mode-count">${looks.length}</span>
      </button>
      <button data-action="import-mode" data-id="materials" class="${mode === 'materials' ? 'active' : ''}" aria-pressed="${mode === 'materials'}" ${s.level < ATELIER_UNLOCK_LEVEL ? 'disabled' : ''}>
        ${icon(s.level < ATELIER_UNLOCK_LEVEL ? 'lock' : 'box')} <span>Vật liệu</span> <span class="mode-count">${s.level < ATELIER_UNLOCK_LEVEL ? `Cấp ${ATELIER_UNLOCK_LEVEL}` : atelierMaterials.length}</span>
      </button>
    </div>

    ${currentEvent(s).discount < 1 ? `<p class="discount-banner">Hôm nay giảm ${Math.round((1 - currentEvent(s).discount) * 100)}% giá nhập toàn bộ sản phẩm và outfit!</p>` : ''}

    ${mode === 'looks' ? `
      <div class="category-scroll-strip import-category-tabs" role="tablist" aria-label="Phong cách lookbook">
        ${Object.entries({ all: 'Tất cả', ...Object.fromEntries(Object.keys(fashionStyles).map(style => [style, style])) }).map(([id, label]) =>
          `<button class="filter cat-chip ${id === f.style ? 'active' : ''}" data-action="import-look-style" data-id="${id}" aria-pressed="${id === f.style}">${label}</button>`
        ).join('')}
      </div>
      ${lookbook(s, f, lookQtys)}
    ` : mode === 'materials' ? `
      <div class="import-grid import-horizontal-rail material-import-grid" aria-label="Danh sách vật liệu">
        ${atelierMaterials.map(material => importMaterialCard(s, material, getMaterialQty(material.id))).join('')}
      </div>
    ` : `
      <div class="inventory-toolbar import-filter-toolbar">
        <div class="category-scroll-strip" role="tablist" aria-label="Danh mục hàng hóa">
          ${Object.entries({ all: 'Tất cả', ...categories }).map(([id, label]) =>
            `<button class="filter cat-chip ${id === f.category ? 'active' : ''}" data-action="import-filter" data-id="${id}" aria-pressed="${id === f.category}">${label}</button>`
          ).join('')}
        </div>
        <div class="fashion-filters">
          <label class="catalog-search">
            <span class="sr-only">Tìm sản phẩm</span>
            <span class="search-icon-inside">${icon('search')}</span>
            <input id="import-search" type="search" placeholder="Tìm kiếm trang phục cần nhập…" value="${escapeHtml(f.query)}" maxlength="80" autocomplete="off" />
          </label>
        </div>
      </div>

      <div class="import-grid import-horizontal-rail product-import-grid" aria-label="Danh sách sản phẩm, vuốt ngang để xem thêm">
        ${list.map(p => importProductCard(s, p, getQty(p.id))).join('')}
      </div>

      ${list.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${icon('search')}</div>
          <h3>Không tìm thấy sản phẩm phù hợp</h3>
          <p>Thử tìm với từ khóa khác hoặc bỏ chọn bộ lọc để xem toàn bộ sản phẩm.</p>
          <button class="btn btn-secondary" data-action="import-clear">Xóa tìm kiếm và bộ lọc</button>
        </div>
      ` : ''}
    `}
    <footer class="import-source-signature" title="${escapeHtml(activeSupplier.description)}">
      <span>Nguồn hàng</span>
      <strong>${escapeHtml(activeSupplier.name)}</strong>
      <em>${supplierSaving ? `Giảm ${supplierSaving}%` : 'Giá gốc'} · ${activeSupplier.deliveryDays ? `giao ${activeSupplier.deliveryDays}–${activeSupplier.deliveryDays + (activeSupplier.reliability < 1 ? 1 : 0)} ngày` : 'nhận ngay'} · tối thiểu ${activeSupplier.minOrder} món</em>
    </footer>
    </section>
  `;
}
