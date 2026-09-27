import { products } from '../data/catalog';
import { categories, fashionStyles, looks, occasions, subcategories } from '../data/fashion';
import { bulkDiscountFactor, bulkDiscountRate, buyPrice, currentEvent, isOutOfTrend, isTrending, sellPrice } from '../systems/rules';
import { defaultFilters, filterProducts, searchText, type CatalogFilters } from '../systems/catalog';
import type { GameState, Product } from '../types';
import { compact, escapeHtml, money, productImage } from './format';
import { icon } from './icons';

const options = (values: Record<string, string>, selected: string, allLabel: string) =>
  `<option value="all">${allLabel}</option>${Object.entries(values).map(([id, label]) => `<option value="${id}" ${selected === id ? 'selected' : ''}>${label}</option>`).join('')}`;

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
        const qty = lookQtys[look.id] ?? 1;
        const discountRate = bulkDiscountRate(qty);
        const discount = 1 - discountRate;
        const baseCostPerSet = items.reduce((sum, p) => sum + buyPrice(s, p), 0);
        const unitCost = Math.round(baseCostPerSet * discount);
        const totalCost = Math.round(baseCostPerSet * qty * discount);
        const retailPerSet = items.reduce((sum, p) => sum + sellPrice(s, p), 0);
        const totalRetail = retailPerSet * qty;
        const profit = totalRetail - totalCost;
        const saved = Math.round(baseCostPerSet * qty * discountRate);
        const allOwned = items.every(p => (s.inventory[p.id] ?? 0) > 0);
        const isMaxed = items.some(p => (s.inventory[p.id] ?? 0) + qty > 999);

        return `<article class="import-card look-card ${locked ? 'locked' : ''}" data-look-id="${look.id}">
          <div class="import-visual look-visual" style="--item-color:${fashionStyles[look.style].color}22">
            <div class="look-outfit-collage">
              ${items.map(p => `<div class="look-mini-item" title="${escapeHtml(p.name)}">${productImage(p)}</div>`).join('')}
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
                ${saved > 0 ? `<del class="old-price">${money(baseCostPerSet)}</del>` : ''}
                <strong class="import-unit-price">${money(unitCost)}</strong>
                <small class="per-unit">/bộ</small>
              </div>

              <div class="import-cost-summary">
                <span class="total-label">${icon('coin')} Tổng (${qty} bộ · ${items.length * qty} món):</span>
                <strong class="total-amount">${money(totalCost)}</strong>
              </div>

              ${saved > 0 ? `
                <div class="discount-saved-pill">
                  ${icon('tag')} Tiết kiệm ${money(saved)}
                </div>
              ` : ''}

              <div class="discount-saved-pill look-profit-pill">
                ${icon('coin')} Lãi dự kiến +${money(profit)}
              </div>
            </div>

            <!-- Bộ chọn số lượng sỉ đồng bộ sản phẩm lẻ -->
            <div class="import-qty-section">
              <div class="qty-header-row">
                <span class="qty-label">Số lượng bộ outfit:</span>
                ${discountRate > 0 ? `<span class="qty-discount-badge">Giảm ${Math.round(discountRate * 100)}%</span>` : ''}
              </div>
              <div class="import-qty-pills">
                ${[1, 3, 5, 10, 20].map(n => {
                  const d = bulkDiscountRate(n);
                  return `<button type="button" class="import-qty-btn ${n === qty ? 'active' : ''}" data-action="look-qty" data-look="${look.id}" data-id="${n}" aria-label="Nhập ${n} bộ">
                    <span class="btn-qty-num">×${n}</span>
                    ${d > 0 ? `<small class="btn-qty-rate">-${Math.round(d * 100)}%</small>` : '<small class="btn-qty-rate">Gốc</small>'}
                  </button>`;
                }).join('')}
              </div>
            </div>

            <button class="btn ${locked ? 'btn-muted' : 'btn-primary'} import-btn" data-action="buy-look" data-id="${look.id}" ${locked || totalCost > s.money || isMaxed ? 'disabled' : ''}>
              ${icon(locked ? 'lock' : 'bag')}
              <span>${locked ? `Mở đủ ở cấp ${level}` : qty > 1 ? `Nhập ×${qty} bộ · ${money(totalCost)}` : `Nhập trọn bộ · ${money(totalCost)}`}</span>
            </button>
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

    ${currentEvent(s).discount < 1 ? `<div class="notice discount-banner">${icon('gift')} Hôm nay giảm 20% giá nhập toàn bộ sản phẩm và outfit!</div>` : ''}

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
export function inventoryPanel(s: GameState) {
  const ownedProducts = products.filter(p => (s.inventory[p.id] ?? 0) > 0);
  const pendingOrders = s.pendingOrders ?? [];
  const pendingCount = pendingOrders.length;
  const totalStock = Object.values(s.inventory).reduce((a, b) => a + b, 0);

  return `
    <div class="inv-panel-header">
      <div class="inv-header-info">
        <span class="inv-header-icon">${icon('box')}</span>
        <div>
          <h2>KHO HÀNG BOUTIQUE</h2>
          <p>${ownedProducts.length} mẫu mã · ${totalStock} món sẵn có · Quản lý giá bán</p>
        </div>
      </div>
      <div class="heading-badges">
        ${pendingCount > 0 ? `<span class="pending-badge">${icon('plane')} ${pendingCount} kiện đang về</span>` : ''}
        <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">${icon('close')} <span>Quay lại</span></button>
      </div>
    </div>

    ${pendingCount > 0 ? `
      <div class="pending-orders-section">
        <div class="section-title">
          <h3>${icon('plane')} Đơn hàng quốc tế đang vận chuyển</h3>
          <span>${pendingCount} kiện hàng</span>
        </div>
        <div class="pending-list">
          ${pendingOrders.map(o => {
            const p = products.find(x => x.id === o.productId);
            if (!p) return '';
            const daysLeft = o.arrivalDay - s.day;
            return `<div class="pending-card">
              <div class="pending-visual">${productImage(p)}</div>
              <div class="pending-info">
                <strong>${p.name}</strong>
                <span class="pending-sub">×${o.quantity} sản phẩm · ${money(o.cost)}</span>
              </div>
              <div class="pending-eta ${daysLeft <= 0 ? 'arriving-now' : daysLeft === 1 ? 'arriving-soon' : ''}">
                ${daysLeft <= 0
                  ? `${icon('box')} <span>Đã đến · Chờ chỗ trong kho</span>`
                  : daysLeft === 1
                  ? `${icon('truck')} <span>Ngày mai về kho</span>`
                  : `${icon('clock')} <span>Còn ${daysLeft} ngày</span>`}
              </div>
            </div>`;
          }).join('')}
        </div>
        <button class="btn btn-secondary" data-action="collect-orders">${icon('box')} Nhận hàng đã đến</button>
      </div>
    ` : ''}

    ${ownedProducts.length === 0 ? `
      <div class="empty-state inv-empty-state">
        <div class="empty-state-icon">${icon('box')}</div>
        <h3>Kho hàng hiện đang trống</h3>
        <p>Boutique chưa có món đồ nào trong kho. Hãy sang quầy <strong>Nhập hàng</strong> để chọn các mẫu thiết kế trendy mới nhất!</p>
        <button class="btn btn-primary" data-action="nav" data-id="import">
          ${icon('bag')} <span>Đi nhập hàng ngay</span> ${icon('arrow')}
        </button>
      </div>
    ` : `
      <div class="section-title">
        <h3>${icon('hanger')} Danh mục hàng trong kho (${ownedProducts.length})</h3>
        <span class="sub-hint">Chọn mức giá bán để tối ưu lợi nhuận</span>
      </div>
      <div class="inv-grid">
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
                    <input id="inv-price-${p.id}" class="inv-price-input" data-price="${p.id}" inputmode="numeric" value="${sell}" aria-describedby="price-hint-${p.id}" aria-label="Giá bán ${escapeHtml(p.name)}">
                    <span class="inv-price-currency">₫</span>
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
  `;
}

/* ==============================================================================
   NHẬP HÀNG - importPanel: Nhập hàng với giảm giá bulk + order quốc tế
   ============================================================================== */

function importProductCard(s: GameState, p: Product, qty: number) {
  const locked = p.level > s.level;
  const basePrice = buyPrice(s, p);
  const discountRate = bulkDiscountRate(qty);
  const discount = 1 - discountRate;
  const unitPrice = Math.round(basePrice * discount);
  const totalCost = Math.round(basePrice * qty * discount);
  const saved = Math.round(basePrice * qty * discountRate);
  const isInternational = p.level >= 4 || p.buyPrice >= 200000;
  const trending = isTrending(s, p);
  const outOfTrend = isOutOfTrend(s, p);
  const currentStock = s.inventory[p.id] ?? 0;
  const pendingQty = (s.pendingOrders ?? []).filter(o => o.productId === p.id).reduce((sum, o) => sum + o.quantity, 0);

  return `<article class="import-card ${locked ? 'locked' : ''} ${isInternational ? 'international' : 'local'}" data-product-id="${p.id}">
    <div class="import-visual" style="--item-color:${p.color}22">
      ${productImage(p)}
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
          ${saved > 0 ? `<del class="old-price">${money(basePrice)}</del>` : ''}
          <strong class="import-unit-price">${money(unitPrice)}</strong>
          <small class="per-unit">/món</small>
        </div>

        <div class="import-cost-summary">
          <span class="total-label">${icon('coin')} Tổng (${qty} món):</span>
          <strong class="total-amount">${money(totalCost)}</strong>
        </div>

        ${saved > 0 ? `
          <div class="discount-saved-pill">
            ${icon('tag')} Tiết kiệm ${money(saved)}
          </div>
        ` : ''}

        ${isInternational ? `
          <div class="ship-lead-time">
            ${icon('truck')} Vận chuyển: <strong>${p.level >= 5 ? '3' : '2'} ngày</strong> về kho
          </div>
        ` : ''}
      </div>

      <div class="import-qty-section">
        <div class="qty-header-row">
          <span class="qty-label">Chọn số lượng:</span>
          ${discountRate > 0 ? `<span class="qty-discount-badge">Giảm ${Math.round(discountRate * 100)}%</span>` : ''}
        </div>
        <div class="import-qty-pills">
          ${[1, 3, 5, 10, 20].map(n => {
            const d = bulkDiscountRate(n);
            return `<button type="button" class="import-qty-btn ${n === qty ? 'active' : ''}" data-action="product-import-qty" data-product="${p.id}" data-id="${n}" aria-label="Nhập ${n} món">
              <span class="btn-qty-num">×${n}</span>
              ${d > 0 ? `<small class="btn-qty-rate">-${Math.round(d * 100)}%</small>` : '<small class="btn-qty-rate">Gốc</small>'}
            </button>`;
          }).join('')}
        </div>
      </div>

      <button class="btn ${locked ? 'btn-muted' : 'btn-primary'} import-btn"
        data-action="order-import" data-id="${p.id}"
        ${locked || totalCost > s.money || currentStock + pendingQty + qty > 999 ? 'disabled' : ''}>
        ${icon(locked ? 'lock' : isInternational ? 'plane' : 'box')}
        <span>${locked ? `Mở ở cấp ${p.level}` : isInternational ? `Đặt hàng quốc tế · ${money(totalCost)}` : `Nhập vào kho · ${money(totalCost)}`}</span>
      </button>
    </div>
  </article>`;
}

export function importPanel(
  s: GameState,
  filterArg: CatalogFilters | string = 'all',
  quantityOrMap: number | Record<string, number> = {},
  mode: 'products' | 'looks' = 'products',
  lookQtys: Record<string, number> = {}
) {
  const f: CatalogFilters = typeof filterArg === 'string' ? { ...defaultFilters(), category: filterArg } : filterArg;
  const list = filterProducts(s, { ...f, availability: 'all' });
  const localList = list.filter(p => !(p.level >= 4 || p.buyPrice >= 200000));
  const intlList = list.filter(p => p.level >= 4 || p.buyPrice >= 200000);
  const getQty = (pId: string) => typeof quantityOrMap === 'number' ? quantityOrMap : (quantityOrMap[pId] ?? 1);

  return `
    <div class="inv-panel-header">
      <div class="inv-header-info">
        <span class="inv-header-icon">${icon(mode === 'looks' ? 'hanger' : 'bag')}</span>
        <div>
          <h2>NHẬP HÀNG & PHÂN PHỐI</h2>
          <p>Nhập sỉ trang phục lẻ · Nhập trọn bộ outfit theo Lookbook</p>
        </div>
      </div>
      <div class="heading-badges">
        <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">${icon('close')} <span>Quay lại</span></button>
      </div>
    </div>

    <!-- Segmented Control: Nhập lẻ/sỉ vs Lookbook trọn bộ -->
    <div class="catalog-modes" role="group" aria-label="Hình thức nhập hàng">
      <button data-action="import-mode" data-id="products" class="${mode === 'products' ? 'active' : ''}" aria-pressed="${mode === 'products'}">
        ${icon('bag')} <span>Sản phẩm lẻ & Nhập sỉ</span>
      </button>
      <button data-action="import-mode" data-id="looks" class="${mode === 'looks' ? 'active' : ''}" aria-pressed="${mode === 'looks'}">
        ${icon('heart')} <span>Lookbook phối sẵn</span> <span class="mode-count">${looks.length}</span>
      </button>
    </div>

    ${currentEvent(s).discount < 1 ? `<div class="notice discount-banner">${icon('gift')} Hôm nay giảm 20% giá nhập toàn bộ sản phẩm và outfit!</div>` : ''}

    ${mode === 'looks' ? `
      ${lookbook(s, f, lookQtys)}
    ` : `
      <!-- Toolbar bộ lọc và tìm kiếm -->
      <div class="inventory-toolbar">
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

      ${localList.length > 0 ? `
        <div class="section-title">
          <h3>${icon('shop')} Hàng nội địa (Có sẵn)</h3>
          <span class="sub-hint">Nhập ngay, hàng vào kho lập tức</span>
        </div>
        <div class="import-grid">
          ${localList.map(p => importProductCard(s, p, getQty(p.id))).join('')}
        </div>
      ` : ''}

      ${intlList.length > 0 ? `
        <div class="section-title" style="margin-top:24px">
          <h3>${icon('globe')} Hàng quốc tế độc quyền (Order)</h3>
          <span class="sub-hint">${icon('truck')} Cần đặt trước, vận chuyển 2-3 ngày về kho</span>
        </div>
        <div class="import-grid">
          ${intlList.map(p => importProductCard(s, p, getQty(p.id))).join('')}
        </div>
      ` : ''}

      ${list.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${icon('search')}</div>
          <h3>Không tìm thấy sản phẩm phù hợp</h3>
          <p>Thử tìm với từ khóa khác hoặc bỏ chọn bộ lọc để xem toàn bộ sản phẩm.</p>
          <button class="btn btn-secondary" data-action="import-clear">Xóa tìm kiếm và bộ lọc</button>
        </div>
      ` : ''}
    `}
  `;
}
