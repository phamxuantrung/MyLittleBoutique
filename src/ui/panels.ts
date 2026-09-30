import { ownerPortrait } from '../art/svg';
import { shopReviewStats } from '../systems/reviews';
import { categories, customers, furniture, levels, products } from '../data/catalog';
import { fashionStyles } from '../data/fashion';
import { activeCustomer, activeEmployees, buyPrice, currentEvent, currentTrend, dailyRent, decorAppealScore, displayCapacity, displayedInventory, displayedQuantity, isOutOfTrend, isTrending, LOAN_DAILY_RATE, LOAN_MAX, LOAN_MIN, LOAN_PAYMENT_RATE, loyaltyMilestones, loyaltyTier, matchScore, MAX_OUTFIT_ITEMS, nextStaffRequirement, onlineOrderChance, previousTrend, sellPrice, staffCapacity, STAFF_RECRUITMENT_FEE, STAFF_SALARY_DEFAULT, STAFF_SALARY_MAX, STAFF_SALARY_MIN } from '../systems/rules';
import type { Furniture, GameState, OnlineOrder, Product, SaleResult, SocialPost, StaffAssignment, StaffFinancialNotice } from '../types';
import { avatarImage, compact, escapeHtml, furnitureImage, money, productImage, staffImage } from './format';
import { icon } from './icons';
import { CAMPAIGN_GUIDE_SEEN, campaignOffers, campaignRank, categoryNames, styleNames } from '../systems/campaigns';
import { gameDate } from '../systems/calendar';
export { stockPanel, inventoryPanel, importPanel, supplierSelectionPanel } from './catalogPanel';

export function campaignModal(s: GameState, forceGuide = false) {
  const active = s.activeCampaign;
  const rank = campaignRank(s.industryReputation);
  const season = String(s.campaignSeason).padStart(2, '0');
  const campaignLocked = s.level < 3;
  const showingGuide = forceGuide || !s.claimed.includes(CAMPAIGN_GUIDE_SEEN);
  const heading = `<header class="app-modal-header campaign-heading">
    <span class="app-header-chip">${icon('hudStudio')} STUDIO</span>
    <div class="campaign-heading-main">
      <div class="campaign-heading-copy"><small>BRAND COLLAB</small><h2>Studio hợp tác</h2></div>
      <div class="campaign-heading-meta">${campaignLocked
        ? `<span class="campaign-locked-meta">${icon('lock')}<strong>Cấp ${s.level} / 3</strong><b>Chưa mở khóa</b></span>`
        : `<span>${icon('star')}<strong>${escapeHtml(rank)}</strong><b>${s.industryReputation}</b></span><span>${icon('clock')}<strong>Mùa ${season}</strong><b>Chọn brief</b></span>`}
      </div>
    </div>
    <div class="campaign-heading-actions">${campaignLocked ? '' : `<button class="campaign-help-button ${showingGuide ? 'is-back' : ''}" data-action="${showingGuide ? 'campaign-guide-done' : 'campaign-guide'}" aria-label="${showingGuide ? 'Quay lại Studio' : 'Xem cách chơi'}">${icon(showingGuide ? 'arrow' : 'help')} ${showingGuide ? 'Quay lại Studio' : 'Cách chơi'}</button>`}<button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></div>
  </header>`;
  if (campaignLocked) return `<div class="campaign-shell">${heading}<section class="campaign-locked">
    <span class="campaign-locked-emblem">${icon('hudStudio')}<b>${icon('lock')}</b></span>
    <small>BRAND COLLABORATION</small>
    <h3>Studio đang chờ bạn</h3>
    <p>Đưa Boutique lên cấp 3 để nhận brief từ tạp chí, thương hiệu và mở những chiến dịch thời trang đầu tiên.</p>
    <ol class="campaign-unlock-path"><li class="is-done"><b>${icon('check')}</b><span>Cấp 1<small>Khởi đầu</small></span></li><li class="${s.level >= 2 ? 'is-done' : 'is-next'}"><b>${s.level >= 2 ? icon('check') : '02'}</b><span>Cấp 2<small>Phát triển</small></span></li><li class="is-locked"><b>${icon('lock')}</b><span>Cấp 3<small>Mở Studio</small></span></li></ol>
    <button class="btn btn-primary campaign-upgrade-link" data-action="upgrade-open">${icon('trophy')} Xem nâng cấp Boutique ${icon('arrow')}</button>
  </section></div>`;
  if (showingGuide) return `<div class="campaign-shell">${heading}
    <section class="campaign-guide">
      <div class="campaign-guide-intro"><div><h3>Xây tên tuổi qua từng chiến dịch</h3><p>Hợp đồng kéo dài qua nhiều ngày bán. Bạn cần lên kế hoạch nhập hàng, trưng bày và chọn kênh bán phù hợp.</p></div></div>
      <ol class="campaign-guide-steps">
        <li><b>01</b><div><strong>Chọn một brief</strong><p>Khi shop đang đóng, chọn 1 trong 3 hợp đồng. Brief khó hơn cho phần thưởng và Danh tiếng ngành cao hơn.</p></div></li>
        <li><b>02</b><div><strong>Chuẩn bị đúng hàng</strong><p>Nhập và trưng sản phẩm đúng <em>phong cách</em> hoặc <em>phân loại</em> ghi trên brief. Hàng không trưng sẽ không được khách tại shop mua.</p></div></li>
        <li><b>03</b><div><strong>Bán trong thời hạn</strong><p>Chỉ đơn thành công mới được tính. Với brief có chủ đề, số món và doanh thu chỉ tăng từ những món đúng yêu cầu; tiến độ được giữ qua các ngày.</p></div></li>
        <li><b>04</b><div><strong>Hoàn tất đủ mọi mục tiêu</strong><p>Brief đa kênh còn yêu cầu giao đơn online. Hoàn thành trước hạn rồi quay lại Studio để nhận tiền, XP, follower và Danh tiếng ngành.</p></div></li>
      </ol>
      <div class="campaign-guide-tips"><span>Ngày hết hạn vẫn được tính trọn vẹn.</span><span>Cấp 6–7 mở Fashion Week khó hơn.</span><span>Danh tiếng càng cao, hợp đồng càng lớn.</span></div>
    </section></div>`;
  if (active) {
    const daysLeft = Math.max(0, active.deadlineDay - s.day + 1);
    const ratios = [active.units / active.targetUnits, active.revenue / active.targetRevenue, active.targetOnline ? active.onlineOrders / active.targetOnline : 1];
    const progress = Math.max(0, Math.min(100, Math.round(Math.min(...ratios) * 100)));
    const focus = active.style ? `Phong cách ${styleNames[active.style]}` : active.category ? `Phân loại ${categoryNames[active.category]}` : 'Boutique & kênh online';
    return `<div class="campaign-shell">${heading}
      <section class="campaign-active campaign-${active.status}">
        <div class="campaign-active-top"><div><span class="campaign-client">${escapeHtml(active.client)}</span><h3>${escapeHtml(active.name)}</h3><p>${escapeHtml(active.description)}</p></div><span class="campaign-deadline">${icon('clock')} ${active.status === 'ready' ? 'Đã hoàn thành' : active.status === 'failed' ? 'Đã hết hạn' : `Hạn ${gameDate(active.deadlineDay)} · còn ${daysLeft} ngày`}</span></div>
        <div class="campaign-focus">${icon(active.kind === 'omnichannel' ? 'globe' : 'trend')} ${focus}</div>
        <div class="campaign-progress-track"><span style="width:${progress}%"></span></div>
        <div class="campaign-goals">
          <div class="${active.units >= active.targetUnits ? 'done' : ''}"><span>${icon('bag')} Sản phẩm đúng brief</span><strong>${Math.min(active.units, active.targetUnits)} / ${active.targetUnits}</strong></div>
          <div class="${active.revenue >= active.targetRevenue ? 'done' : ''}"><span>${icon('coin')} Doanh thu chiến dịch</span><strong>${money(active.revenue)} / ${money(active.targetRevenue)}</strong></div>
          ${active.targetOnline ? `<div class="${active.onlineOrders >= active.targetOnline ? 'done' : ''}"><span>${icon('globe')} Đơn online đã giao</span><strong>${Math.min(active.onlineOrders, active.targetOnline)} / ${active.targetOnline}</strong></div>` : ''}
        </div>
        <div class="campaign-reward"><span>Phần thưởng hợp đồng</span><strong>${money(active.rewardMoney)} · +${active.rewardXp} XP · +${active.rewardFollowers} follower · +${active.prestigeReward} danh tiếng</strong></div>
        <div class="campaign-actions">${active.status === 'ready'
          ? `<button class="btn btn-primary" data-action="campaign-claim">${icon('gift')} Nhận thưởng chiến dịch</button>`
          : active.status === 'failed'
            ? `<button class="btn btn-primary" data-action="campaign-abandon">Khép lại và nhận brief mới ${icon('arrow')}</button>`
            : `<button class="btn btn-secondary" data-action="campaign-abandon">Rút khỏi chiến dịch</button>`}</div>
      </section></div>`;
  }
  if (s.day < s.campaignAvailableDay) return `<div class="campaign-shell">${heading}<div class="campaign-waiting">${icon('clock')}<h3>Brief mới đang được chuẩn bị</h3><p>Đối tác tiếp theo sẽ liên hệ vào ${gameDate(s.campaignAvailableDay)}.</p></div></div>`;
  const offers = campaignOffers(s);
  return `<div class="campaign-shell">${heading}<div class="campaign-offers">${offers.map((offer, index) => {
      const focus = offer.style ? styleNames[offer.style] : offer.category ? categoryNames[offer.category] : 'Đa kênh';
      return `<article class="campaign-offer campaign-offer-${index + 1}"><div class="campaign-offer-number">0${index + 1}</div><span class="campaign-client">${escapeHtml(offer.client)}</span><h3>${escapeHtml(offer.name)}</h3><p>${escapeHtml(offer.description)}</p><div class="campaign-offer-focus">${icon(offer.kind === 'omnichannel' ? 'globe' : 'trend')} ${focus}</div><ul><li>${offer.targetUnits} sản phẩm đúng brief</li><li>${money(offer.targetRevenue)} doanh thu</li>${offer.targetOnline ? `<li>${offer.targetOnline} đơn online</li>` : ''}<li>${offer.durationDays} ngày thực hiện</li></ul><div class="campaign-offer-reward"><small>THƯỞNG</small><strong>${money(offer.rewardMoney)} · ${offer.rewardXp} XP</strong><span>+${offer.prestigeReward} danh tiếng ngành</span></div><button class="btn btn-primary" data-action="campaign-start" data-id="${offer.id}" ${s.phase === 'open' ? 'disabled' : ''}>Nhận brief ${icon('arrow')}</button></article>`;
    }).join('')}</div>${s.phase === 'open' ? '<p class="campaign-open-note">Hãy đóng cửa sau ngày bán để nhận một brief mới.</p>' : ''}</div>`;
}

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
        <h2>Ngày ${gameDate(s.day)}</h2>
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
                      ? ''
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

export function trendPanel(s: GameState, _section: 'hot' | 'out' = 'hot') {
  const trend = currentTrend(s), event = currentEvent(s);
  const cooledTrend = previousTrend(s);
  const trendProds = products.filter(p => isTrending(s, p));
  const unlockedTrendProds = trendProds.filter(p => p.level <= s.level);
  const outTrendStock = products.filter(p => p.level <= s.level && isOutOfTrend(s, p) && (s.inventory[p.id] ?? 0) > 0);
  const heroProducts = trendProds.slice(0, 3);
  const eventKind = s.day === 1 ? 'opening' : event.discount < 1 ? 'discount' : event.extra > 0 ? 'busy' : event.extra < 0 ? 'weather' : 'normal';
  const eventIcon = eventKind === 'opening' ? 'gift' : eventKind === 'discount' ? 'tag' : eventKind === 'busy' ? 'users' : eventKind === 'weather' ? 'daySun' : 'sun';
  const eventImpact = eventKind === 'opening'
    ? `${icon('sparkle')} Ngày đầu tiên`
    : event.discount < 1
      ? `${icon('tag')} Giảm ${Math.round((1 - event.discount) * 100)}% giá nhập`
      : event.extra > 0
        ? `${icon('users')} +${event.extra} khách ghé shop`
        : event.extra < 0
          ? `${icon('users')} ${event.extra} lượt khách dự kiến`
          : `${icon('sun')} Nhịp bán bình thường`;

  return `
    <!-- Hero Lookbook Card -->
    <div class="trend-hero-card trend-panel-start">
      <div class="trend-hero-content">
        <div class="trend-hero-badge-row">
          <span class="trend-hero-tag">${icon('trend')} ĐANG THỊNH HÀNH</span>
          <span class="trend-bonus-pill">+${trend.bonus}% điểm gu</span>
        </div>
        <h3 class="trend-hero-title">${escapeHtml(trend.name)}</h3>
        <p class="trend-hero-desc">${escapeHtml(trend.subtitle)}</p>
        <div class="trend-style-match">
          <span class="trend-match-label">${icon('hanger')} Hợp gu</span>
          <strong class="trend-match-styles">${trend.styles.join(' · ')}</strong>
        </div>
        <div class="trend-hero-actions">
          <button class="btn btn-primary" data-action="nav" data-id="shop">
            ${icon('shop')} <span>Quay lại shop</span>
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
    <div class="trend-event-banner is-${eventKind}">
      <div class="trend-event-icon-box">${icon(eventIcon)}</div>
      <div class="trend-event-info">
        <span class="eyebrow">SỰ KIỆN HÔM NAY</span>
        <h4>${escapeHtml(event.name)}</h4>
        <p>${escapeHtml(event.description)}</p>
      </div>
      <div class="event-pill-highlight">${eventImpact}</div>
      <i class="trend-event-glow" aria-hidden="true"></i>
    </div>

    <!-- Wishlist Suggestions -->
    <div class="section-title trend-section-title hot-trend-section-title">
      <div>
        <h3>Sản phẩm hợp xu hướng</h3>
        <p>${unlockedTrendProds.length} mẫu đã mở khóa · vuốt ngang để xem</p>
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
          <p>Ưu tiên bán sớm hoặc điều chỉnh giá những mẫu còn tồn.</p>
        </div>
        <span class="out-trend-count">${outTrendStock.length} mẫu còn kho</span>
      </div>
      ${outTrendStock.length ? `
        <div class="section-title trend-section-title out-trend-section-title">
          <div>
            <h3>Hàng tồn cần xoay vòng</h3>
            <p>${outTrendStock.length} mẫu đã hạ nhiệt · vuốt ngang để xem</p>
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

export const decorCategories: Record<string, { label: string; icon: string; match: (f: Furniture) => boolean }> = {
  all: { label: 'Tất cả', icon: 'shop', match: () => true },
  display: { label: 'Trưng bày', icon: 'hanger', match: f => !!f.display },
  decoration: { label: 'Trang trí', icon: 'decor', match: f => !f.display },
  mirror: { label: 'Gương & Check-in', icon: 'camera', match: f => ['mirror', 'coquette-mirror', 'wavy-mirror', 'fitting'].includes(f.id) },
  plants: { label: 'Cây & Hoa', icon: 'leaf', match: f => ['plant', 'flowers', 'monstera-plant'].includes(f.id) },
  seating: { label: 'Bàn ghế & Quầy', icon: 'home', match: f => ['counter', 'beanbag', 'sofa', 'shell-sofa', 'coffee-corner', 'vinyl-player'].includes(f.id) },
  decor: { label: 'Thảm & Đèn', icon: 'sun', match: f => ['atelier-rug', 'heart-rug', 'checkered-rug', 'tulip-lamp', 'crystal-chandelier'].includes(f.id) },
  art: { label: 'Đồ treo tường', icon: 'camera', match: f => ['boutique-window', 'blush-blinds', 'shop-sign', 'fashion-print', 'gallery-print', 'botanical-print', 'runway-print', 'parfum-print', 'shoe-sketch-print', 'ribbon-sign', 'neon-sign', 'lightbox-sign'].includes(f.id) },
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
        <span class="decor-preview-floor" aria-hidden="true"></span>
        ${furnitureImage(f)}
        <span class="decor-size-tag">${f.width}×${f.height} ô</span>
        <span class="fixture-type-tag ${f.display ? 'is-functional' : ''}">${f.display ? `Có công dụng · ${f.display.capacity} món` : 'Chỉ trang trí'}</span>
        ${placedCount > 0 ? `<span class="decor-placed-badge">${icon('check')} Đã đặt: ${placedCount}</span>` : ''}
        ${storedCount > 0 ? `<span class="decor-in-store-tag">${icon('box')} Kho: ${storedCount}</span>` : ''}
        ${isLocked ? `<span class="decor-lock-ribbon">${icon('lock')} Cấp ${f.level}</span>` : ''}
      </div>

      <div class="decor-card-body">
        <div class="decor-meta-strip">
          ${f.style ? `<span class="item-style-badge" style="border-color:${styleColor}88; color:${styleColor}">${f.style}</span>` : ''}
          <span class="decor-appeal-badge">${icon('decor')} +${f.appeal} Thẩm mỹ</span>
        </div>

        <h3 class="decor-card-title" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</h3>

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
    <section class="decor-catalog-page">
    <div class="game-panel-header-card decor-panel-header">
      <div class="panel-header-left">
        <span class="panel-header-icon decor-header-icon">${icon('hudDecor')}</span>
        <div class="panel-header-texts">
          <span class="panel-eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>BÀY TRÍ SHOP</h2>
          <p>Chọn đồ trang trí hoặc thiết bị thực tế để đưa hàng từ kho lên sàn bán</p>
        </div>
      </div>
      <div class="panel-header-right">
        <div class="heading-badges">
          <span class="panel-stat-chip panel-money-chip">${icon('coin')} ${money(s.money)}</span>
          <span class="panel-stat-chip highlight-decor">${icon('hudAppeal')} ${totalAppeal} Thẩm mỹ</span>
          <span class="panel-stat-chip">${icon('hanger')} ${s.layout.length} Đã đặt</span>
          ${storedList.length > 0 ? `<span class="panel-stat-chip store-chip">${icon('box')} ${storedList.length} Trong kho</span>` : ''}
          <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">
            ${icon('close')} <span>Quay lại</span>
          </button>
        </div>
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
            ${icon(cat.icon)} <span>${cat.label}</span>
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
    </section>
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
  const atelierMaterialCount = Object.values(s.materialInventory).reduce((sum, quantity) => sum + quantity, 0);
  const atelierOwnershipLabel = s.level < 8
    ? 'Chưa mở khóa'
    : s.atelierOwned ? 'Đã sở hữu vĩnh viễn' : 'Chưa mua xưởng';
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
      <span>${icon('sun')} <b>${gameDate(s.day)}</b></span>
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
    <section class="debug-section debug-feature-section">
      <div class="debug-section-title"><span>TÍNH NĂNG VẬN HÀNH MỚI</span><small>Tạo toàn bộ tình huống để kiểm tra ngay</small></div>
      <button class="debug-customer-button debug-feature-seed" data-action="debug-action" data-id="advanced-features">${icon('shield')} <span><strong>Fake dữ liệu tính năng mới</strong><small>Cấp 5 · nhân viên · đổi trả · VIP · couture · khủng hoảng · hai đơn đang giao</small></span>${icon('arrow')}</button>
    </section>
    <section class="debug-section debug-atelier-section">
      <div class="debug-section-title"><span>XƯỞNG MAY CÁ NHÂN</span><small>${atelierOwnershipLabel} · ${atelierMaterialCount} vật liệu · ${s.customProducts.length} bản thiết kế · ${s.tailoringJobs.length} đơn đang may</small></div>
      <div class="debug-action-grid">
        <button data-action="debug-action" data-id="atelier-ready"><span>${icon('hanger')}</span><div><strong>Mở xưởng cấp 8</strong><small>Sở hữu xưởng · vật liệu cơ bản</small></div></button>
        <button data-action="debug-action" data-id="atelier-max"><span>${icon('crown')}</span><div><strong>Mở toàn bộ cấp 10</strong><small>Mặt bằng tối đa · vật liệu hiếm</small></div></button>
        <button data-action="debug-action" data-id="atelier-sample"><span>${icon('edit')}</span><div><strong>Tạo mẫu chờ duyệt</strong><small>Mở Xưởng may để thêm hoặc xóa</small></div></button>
        <button data-action="debug-action" data-id="atelier-wrong-recipe"><span>${icon('close')}</span><div><strong>Thử công thức sai</strong><small>Mất Cotton ×1 và Ruy băng ×1</small></div></button>
        <button data-action="debug-action" data-id="atelier-blueprint"><span>${icon('check')}</span><div><strong>Duyệt bản thiết kế</strong><small>Thêm mẫu cá nhân vào Kho hàng</small></div></button>
        <button data-action="debug-action" data-id="atelier-batch"><span>${icon('box')}</span><div><strong>Tạo đơn may ×10</strong><small>Đơn hoàn thành sau 2 ngày</small></div></button>
        <button data-action="debug-action" data-id="atelier-deliver"><span>${icon('truck')}</span><div><strong>Hoàn tất đơn may</strong><small>Nhập ngay toàn bộ hàng vào kho</small></div></button>
      </div>
    </section>
    <section class="debug-section">
      <div class="debug-section-title"><span>NHÂN VIÊN</span><small>${s.employees.length} nhân viên · ${s.staffApplicants.length} hồ sơ · ${s.staffLeaveRequests.length} đơn nghỉ</small></div>
      <div class="debug-action-grid">
        <button data-action="debug-action" data-id="recruitment-ready"><span>${icon('decor')}</span><div><strong>Mở khóa tuyển dụng</strong><small>Shop 3 · mặt bằng 3</small></div></button>
        <button data-action="debug-action" data-id="applicants"><span>${icon('social')}</span><div><strong>Tạo 3 hồ sơ</strong><small>Bỏ qua 2 ngày chờ</small></div></button>
        <button data-action="debug-action" data-id="hire"><span>${icon('users')}</span><div><strong>Nhận nhân viên</strong><small>Chọn hồ sơ đầu tiên</small></div></button>
        <button data-action="debug-action" data-id="leave"><span>${icon('clock')}</span><div><strong>Nhân viên xin nghỉ</strong><small>Tạo đơn ngẫu nhiên 1–5 ngày</small></div></button>
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
  const locked = s.level < requirement.level || (s.landLevel ?? 0) < requirement.landLevel;
  const assigned = s.employees.filter(employee => (employee.assignment ?? 'service') !== 'off').length;
  const applicants = s.staffApplicants;
  return `
    <section class="recruitment-board ${locked ? 'is-locked' : ''}">
      <div class="recruitment-heading">
        <div class="recruitment-heading-icon">${icon('users')}</div>
        <div><span class="panel-eyebrow">BOUTIQUE CAREERS</span><h3>Góc tuyển dụng</h3><p>Tìm một cộng sự giúp tư vấn khách và tăng cơ hội nhận tip.</p></div>
        <span class="staff-capacity-chip">${s.employees.length} nhân viên · ca ${Math.min(assigned, capacity)}/${capacity}</span>
      </div>
      ${locked ? `
        <div class="recruitment-lock-card">${icon('lock')}<div><strong>Chưa đủ điều kiện mở vị trí tiếp theo</strong><span>Cần shop cấp ${requirement.level} và mặt bằng cấp ${requirement.landLevel + 1}. Hiện tại: cấp ${s.level}, mặt bằng cấp ${(s.landLevel ?? 0) + 1}.</span></div></div>
      ` : applicants.length ? `
        <div class="applicant-intro"><div><strong>${applicants.length} hồ sơ mới</strong><span>Chọn một ứng viên phù hợp với hướng phát triển của boutique.</span></div><button class="btn-text" data-action="recruit-cancel">Đóng tin</button></div>
        <div class="applicant-grid">${applicants.map(candidate => `
          <article class="applicant-card">
            <div class="applicant-portrait">${staffImage(candidate.appearance, candidate.name)}<span>Ứng tuyển ${gameDate(candidate.appliedDay)}</span></div>
            <div class="applicant-copy"><span class="staff-role">${escapeHtml(candidate.role)}</span><h4>${escapeHtml(candidate.name)}</h4><p>${escapeHtml(candidate.bio)}</p>
              <div class="staff-stats-compact">${staffStat('Tư vấn', candidate.service, '#e85aa6')}${staffStat('Chốt đơn', candidate.persuasion, '#8c68e8')}${staffStat('Duyên dáng', candidate.charm, '#e9ad35')}${staffStat('Ổn định', candidate.reliability, '#55b89a')}</div>
              <div class="applicant-footer"><span><small>Lương/ca</small><strong>${money(candidate.salary)}</strong></span><button class="btn btn-primary btn-small" data-action="staff-hire" data-id="${candidate.id}">${icon('check')} Nhận vào làm</button></div>
            </div>
          </article>`).join('')}</div>
      ` : s.recruitmentPost ? `
        <div class="recruitment-waiting">
          <div class="waiting-paper">${icon('edit')}<span></span><span></span><span></span></div>
          <div><strong>Tin tuyển dụng đang được lan tỏa</strong><p>Lương đề xuất <b>${money(s.recruitmentPost.salary)}/ca</b>. Hồ sơ dự kiến đến vào ${gameDate(s.recruitmentPost.applicantsDay)}.</p></div>
          <button class="btn-text" data-action="recruit-cancel">Hủy tin</button>
        </div>
      ` : `
        <div class="recruitment-compose">
          <div class="compose-copy"><strong>Đăng tin tuyển cộng sự mới</strong><span>Lương cao thu hút ứng viên tốt hơn. Lương chỉ phát sinh theo ca thực tế và được thanh toán trong Tài chính.</span></div>
          <label class="salary-field"><span>Mức lương/ca</span><div><input id="staff-salary-input" type="number" min="${STAFF_SALARY_MIN}" max="${STAFF_SALARY_MAX}" step="5000" value="${STAFF_SALARY_DEFAULT}"/><b>₫</b></div><small>Khoảng tuyển: ${money(STAFF_SALARY_MIN)} – ${money(STAFF_SALARY_MAX)}</small></label>
          <button class="btn btn-primary recruitment-submit" data-action="recruit-post" ${s.money < STAFF_RECRUITMENT_FEE ? 'disabled' : ''}>${icon('social')} Đăng tin · ${money(STAFF_RECRUITMENT_FEE)}</button>
        </div>
      `}
    </section>`;
}

export function staffManagementModal(s: GameState, detailUid = '') {
  const working = activeEmployees(s);
  const wages = s.employees.reduce((sum, employee) => sum + employee.salary, 0);
  const assignmentLabels: Record<StaffAssignment, string> = { off: 'Nghỉ hồi sức', service: 'Tư vấn', cashier: 'Thu ngân', stock: 'Kho hàng' };
  const capacity = staffCapacity(s);
  const modalHeader = `<header class="staff-modal-header"><strong>${working.length}/${capacity}</strong><h2>Nhân viên</h2><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng quản lý nhân viên" title="Đóng">${icon('close')}</button></header>`;
  const detailEmployee = s.employees.find(employee => employee.uid === detailUid);
  if (detailEmployee) {
    const onLeave = !!detailEmployee.leaveUntilDay && detailEmployee.leaveUntilDay > s.day;
    const assignment = detailEmployee.assignment ?? 'service';
    const energy = detailEmployee.energy ?? 100;
    const skillLevel = detailEmployee.skillLevel ?? 1;
    const experience = detailEmployee.experience ?? 0;
    const experienceTarget = 35 + skillLevel * 15;
    const status = onLeave ? `Nghỉ phép đến ${gameDate(detailEmployee.leaveUntilDay!)}` : assignment === 'off' ? 'Nghỉ chờ xếp ca' : 'Đang trong ca';
    const detailHeader = `<header class="staff-modal-header employee-profile-header"><strong>${working.length}/${capacity}</strong><h2>${escapeHtml(detailEmployee.name)} <em>Cấp ${skillLevel}</em></h2><button class="staff-modal-close staff-modal-back" data-action="staff-detail-close" aria-label="Quay lại danh sách nhân viên" title="Quay lại">${icon('arrow')}</button></header>`;
    return `<div class="staff-modal staff-detail-mode">
      ${detailHeader}
      <section class="employee-detail-sheet ${onLeave ? 'is-on-leave' : ''}">
        <div class="employee-detail-hero">
          <div class="employee-detail-portrait">${staffImage(detailEmployee.appearance, detailEmployee.name)}</div>
          <div class="employee-detail-hero-copy"><span class="employee-detail-role">${escapeHtml(detailEmployee.role)}</span><strong>${status}</strong><p>${escapeHtml(detailEmployee.bio)}</p></div>
        </div>
        <div class="employee-detail-content">
          <div class="employee-detail-stat-grid">
            <span>${icon('heart')}<small>Tinh thần</small><b>${detailEmployee.morale}</b></span>
            <span>${icon('sun')}<small>Năng lượng</small><b>${energy}</b></span>
            <span>${icon('coin')}<small>Lương/ca</small><b>${money(detailEmployee.salary)}</b></span>
            <span>${icon('users')}<small>Tư vấn</small><b>${detailEmployee.service}</b></span>
            <span>${icon('bag')}<small>Chốt đơn</small><b>${detailEmployee.persuasion}</b></span>
            <span>${icon('heart')}<small>Duyên dáng</small><b>${detailEmployee.charm}</b></span>
            <span>${icon('shield')}<small>Ổn định</small><b>${detailEmployee.reliability}</b></span>
            <span>${icon('star')}<small>Kinh nghiệm</small><b>${experience}/${experienceTarget}</b></span>
          </div>
          <div class="employee-shift-control employee-detail-shift">
            <strong class="employee-detail-label">Phân công ca làm</strong>
            <div class="shift-options" role="group" aria-label="Xếp ca cho ${escapeHtml(detailEmployee.name)}">${(Object.keys(assignmentLabels) as StaffAssignment[]).map(value => `<button data-action="staff-assignment" data-id="${detailEmployee.uid}" data-value="${value}" class="${value === assignment ? 'is-active' : ''}" ${onLeave || s.phase === 'open' ? 'disabled' : ''}>${assignmentLabels[value]}</button>`).join('')}</div>
            <small>Tư vấn tự chốt đơn · Thu ngân giữ đánh giá · Kho rút ngắn giao hàng · Nghỉ để hồi năng lượng.</small>
          </div>
          <footer class="employee-detail-footer"><div class="employee-record employee-detail-record"><span>${icon('bag')} <b>${detailEmployee.sales}</b> đơn hỗ trợ</span><span>${icon('star')} <b>${money(detailEmployee.tipsEarned)}</b> tip</span><span>${icon('sun')} Gia nhập ${gameDate(detailEmployee.hiredDay)}</span></div><button class="employee-fire employee-detail-fire" data-action="staff-fire" data-id="${detailEmployee.uid}">${icon('close')} Cho nghỉ việc</button></footer>
        </div>
      </section>
    </div>`;
  }
  return `<div class="staff-modal">
    ${modalHeader}
    ${s.staffLeaveRequests.length ? `<section class="leave-request-section"><div class="staff-section-heading"><div><span>ĐƠN XIN NGHỈ</span><h3>Cần bạn duyệt</h3></div><b>${s.staffLeaveRequests.length}</b></div>${s.staffLeaveRequests.map(request => {
      const employee = s.employees.find(item => item.uid === request.employeeUid);
      if (!employee) return '';
      return `<article class="leave-request-card"><div class="leave-mini-avatar">${staffImage(employee.appearance, employee.name)}</div><div><strong>${escapeHtml(employee.name)} xin nghỉ ${request.days} ngày</strong><p>${escapeHtml(request.reason)}.</p><small>Từ chối nhiều lần sẽ làm tăng nguy cơ nhân viên nghỉ việc.</small></div><div class="leave-actions"><button class="btn btn-secondary btn-small" data-action="staff-leave-deny" data-id="${employee.uid}">Từ chối</button><button class="btn btn-primary btn-small" data-action="staff-leave-approve" data-id="${employee.uid}">Duyệt nghỉ</button></div></article>`;
    }).join('')}</section>` : ''}
    <p class="staff-roster-summary">${s.employees.length ? `${s.employees.length} nhân viên · tối đa ${money(wages)}/ca` : 'Chưa có nhân viên trong đội ngũ'}</p>
      ${s.employees.length ? `<div class="staff-roster">${s.employees.map(employee => {
        const onLeave = !!employee.leaveUntilDay && employee.leaveUntilDay > s.day;
        const assignment = employee.assignment ?? 'service';
        const status = onLeave ? `Nghỉ phép đến ${gameDate(employee.leaveUntilDay!)}` : assignment === 'off' ? 'Nghỉ chờ xếp ca' : 'Đang trong ca';
        const statusClass = onLeave ? 'is-leave' : assignment === 'off' ? 'is-waiting' : 'is-working';
        const statusIcon = onLeave || assignment === 'off' ? 'clock' : assignment === 'cashier' ? 'coin' : assignment === 'stock' ? 'box' : 'users';
        const energy = employee.energy ?? 100;
        return `<article class="employee-card employee-roster-card ${onLeave ? 'is-on-leave ' : ''}${statusClass} assignment-${assignment}" data-action="staff-detail" data-id="${employee.uid}" role="button" tabindex="0" aria-label="Xem chi tiết ${escapeHtml(employee.name)}">
          <header class="employee-roster-name"><div><small>${escapeHtml(employee.role)}</small><h3>${escapeHtml(employee.name)}</h3></div><button class="employee-detail-button" data-action="staff-detail" data-id="${employee.uid}" aria-label="${status}" title="${status}">${icon(statusIcon)}</button></header>
          <div class="employee-portrait">${staffImage(employee.appearance, employee.name)}<span class="employee-status ${statusClass}">${status}</span></div>
          <div class="employee-card-summary">
            <div class="employee-summary-row"><span>${icon('users')} ${assignmentLabels[assignment]}</span><span>${icon('sun')} ${energy}%</span></div>
            <div class="employee-summary-energy"><i><b style="width:${energy}%"></b></i></div>
            <div class="employee-summary-footer"><span>Nợ <b>${employee.unpaidShifts ?? 0}/3 công</b></span><strong>${money(employee.salary)}<small>/ca</small></strong></div>
          </div>
        </article>`;
      }).join('')}</div>` : `<div class="staff-empty"><div>${icon('users')}</div><strong>Một mình bạn vẫn đang chăm cả boutique</strong><p>Đăng tin tuyển dụng tại Bảng tin khi đạt đủ cấp shop và mặt bằng.</p><button class="btn btn-primary" data-action="staff-recruit-go">Đến bảng tin tuyển dụng</button></div>`}
  </div>`;
}

function legacySocialPanel(s: GameState, section: 'feed' | 'recruitment' = 'feed') {
  const shopName = s.shopName || 'My Little Boutique';
  const handle = toShopHandle(shopName);
  const rating = shopReviewStats(s);
  const ratingText = rating.average === null ? '—' : rating.average.toFixed(1);

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
          <span class="panel-stat-chip star-chip" title="Uy tín tổng hợp từ trải nghiệm phục vụ và bán hàng">${icon('shield')} Uy tín ${s.reputation.toFixed(1)}</span>
          <span class="panel-stat-chip star-chip" title="Điểm trung bình các phản hồi công khai">${icon('star')} Đánh giá ${ratingText}</span>
          <button class="panel-close-btn" data-action="nav" data-id="shop" aria-label="Quay lại shop">
            ${icon('close')} <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>

      <section class="social-profile-card" aria-label="Trang cá nhân boutique">
        <div class="profile-cover-banner" aria-hidden="true">
          <div class="profile-cover-art">
            ${['ribbon', 'baby-tee', 'ribbon-dress', 'jeans', 'hoodie'].map(id => `<figure class="cover-fashion-print">${productImage(products.find(p => p.id === id)!)}</figure>`).join('')}
          </div>
          <span class="cover-fashion-sparkle is-left">${icon('sparkle')}</span>
          <span class="cover-fashion-sparkle is-right">${icon('sparkle')}</span>
          <span class="cover-fashion-heart">${icon('heart')}</span>
        </div>
        <div class="profile-card-content">
          <div class="profile-identity-bar">
            <div class="profile-avatar" role="img" aria-label="Ảnh đại diện chủ tiệm">${ownerPortrait(96)}</div>
            <button class="profile-edit-button" data-action="name-shop">${icon('edit')} Chỉnh sửa tên</button>
          </div>
          <div class="profile-details">
            <div class="profile-name-row">
              <h3 class="profile-name">${escapeHtml(shopName)}</h3>
              <span class="profile-verified-badge" title="Boutique chính hãng">${icon('check')}</span>
            </div>
            <span class="profile-handle">${handle}</span>
            <p class="profile-bio">Góc nhỏ của những điều xinh xắn.<br>Tự do phối đồ, kể câu chuyện của riêng mình. 💕</p>
            <div class="profile-facts" aria-label="Giới thiệu boutique">
              <span>${icon('shop')} Tiệm thời trang</span>
              <span>${icon('trophy')} Cấp ${String(s.level).padStart(2, '0')}</span>
              <span>${icon('decor')} ${decorAppealScore(s)} điểm thẩm mỹ</span>
              <span>${icon('sun')} ${escapeHtml(s.dailyLuck ?? 'Thời tiết dịu dàng')}</span>
            </div>
          </div>
          <dl class="profile-statistics" aria-label="Thống kê boutique">
            <div><dt>Bài viết</dt><dd>${s.posts.length}</dd></div>
            <div><dt>Người theo dõi</dt><dd>${s.followers.toLocaleString('vi-VN')}</dd></div>
            <div><dt>Độ uy tín</dt><dd>${s.reputation.toFixed(1)} <small>/ 5</small></dd></div>
            <div class="profile-shop-rating"><dt>Đánh giá shop <small>(${rating.count.toLocaleString('vi-VN')} lượt)</small></dt><dd>${ratingText}${rating.count ? ' <small>/ 5</small>' : ''}</dd></div>
            <div><dt>Đã bán hôm nay</dt><dd>${s.stats.sold}</dd></div>
          </dl>
          <p class="profile-rating-note">${rating.count ? 'Đánh giá shop là trung bình sao từ phản hồi công khai.' : 'Shop chưa có đánh giá công khai.'} Uy tín còn tính trải nghiệm phục vụ, khách rời đi và bán online.</p>
        </div>
      </section>

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

    <!-- Feed Section -->
    <div class="social-feed-section">
      <div class="social-posts-feed">
        ${s.posts.length ? s.posts.map(p => {
          const reviewStars = Math.max(1, Math.min(5, p.reviewStars));
          const reviewLabel = reviewStars >= 4.5 ? 'Rất hài lòng' : reviewStars >= 4 ? 'Hài lòng' : reviewStars >= 3 ? 'Khá ổn' : 'Chưa hài lòng';
          return `
          <article class="social-post-card ${p.viral ? 'is-viral-card' : ''}">
            <div class="post-card-header">
              <span class="post-initial-avatar" style="background:${escapeHtml(p.color)}" aria-hidden="true">${escapeHtml(p.name.slice(0, 1))}</span>
              <div class="post-author-meta">
                <div class="post-author-name-row">
                  <strong class="post-author-name">${escapeHtml(p.name)}</strong>
                  ${p.viral ? `<span class="post-viral-badge">${icon('trend')} Đang được yêu thích</span>` : ''}
                </div>
                <span class="post-author-handle">${escapeHtml(p.handle)}</span>
              </div>
              <span class="post-date">${gameDate(p.day)}</span>
            </div>

            <div class="post-card-body">
              <p class="post-quote-text">${escapeHtml(p.text)}</p>
            </div>

            <div class="post-card-footer">
              <div class="post-likes-count">
                <span class="post-like-heart">${icon('heart')}</span>
                <strong>${p.likes.toLocaleString('vi-VN')}</strong>
                <span>lượt yêu thích</span>
              </div>
              <span class="post-review" aria-label="${Math.round(reviewStars)} trên 5 sao, ${reviewLabel}">
                <span class="post-stars" aria-hidden="true"><span>★★★★★</span><span style="width:${reviewStars / 5 * 100}%">★★★★★</span></span>
                <b>${Math.round(reviewStars)}</b><span class="post-review-label">${reviewLabel}</span>
              </span>
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

function socialDrawerRecruitment(s: GameState) {
  const requirement = nextStaffRequirement(s);
  const locked = s.level < requirement.level || (s.landLevel ?? 0) < requirement.landLevel;
  const applicants = s.staffApplicants;
  if (locked) return `<div class="social-drawer-state social-drawer-locked">${icon('lock')}<strong>Chưa thể đăng tin</strong><span>Cần shop cấp ${requirement.level} và mặt bằng cấp ${requirement.landLevel + 1}.</span></div>`;
  if (applicants.length) return `<section class="drawer-applicants">
    <div class="drawer-section-title">
      <strong>${applicants.length} hồ sơ ứng viên</strong>
      <div class="drawer-section-actions">
        <button data-action="recruit-cancel">Đóng tin</button>
        <button class="is-primary" data-action="recruit-new">Đăng tin mới</button>
      </div>
    </div>
    <div class="drawer-applicant-list">${applicants.map(candidate => `<article class="drawer-applicant-card">
      <div class="drawer-applicant-art">${staffImage(candidate.appearance, candidate.name)}</div>
      <div class="drawer-applicant-profile">
        <div class="drawer-applicant-heading">
          <div class="drawer-applicant-copy"><small>${escapeHtml(candidate.role)}</small><strong>${escapeHtml(candidate.name)}</strong></div>
          <span class="drawer-applicant-salary"><small>Lương/ca</small><b>${money(candidate.salary)}</b></span>
        </div>
        <p>${escapeHtml(candidate.bio)}</p>
        <div class="drawer-applicant-stats">
          <span style="--stat-tone:#de4d98"><small>Tư vấn</small><b>${candidate.service}</b></span>
          <span style="--stat-tone:#7962d8"><small>Chốt đơn</small><b>${candidate.persuasion}</b></span>
          <span style="--stat-tone:#d99a24"><small>Duyên dáng</small><b>${candidate.charm}</b></span>
          <span style="--stat-tone:#42a984"><small>Tin cậy</small><b>${candidate.reliability}</b></span>
        </div>
        <div class="drawer-applicant-footer">
          <span>Ứng tuyển ${gameDate(candidate.appliedDay)}</span>
          <button data-action="staff-hire" data-id="${candidate.id}" aria-label="Nhận ${escapeHtml(candidate.name)} vào làm">${icon('check')}<span>Nhận vào làm</span></button>
        </div>
      </div>
    </article>`).join('')}</div>
  </section>`;
  if (s.recruitmentPost) return `<div class="social-drawer-state social-drawer-waiting">
    ${icon('clock')}<strong>Tin tuyển dụng đang hoạt động</strong>
    <span>Lương ${money(s.recruitmentPost.salary)}/ca · Có hồ sơ vào ${gameDate(s.recruitmentPost.applicantsDay)}</span>
    <button data-action="recruit-cancel">Hủy tin</button>
  </div>`;
  return `<form class="drawer-recruit-compose" onsubmit="return false">
    <span class="drawer-compose-icon">${icon('users')}</span>
    <strong>Đăng tin tuyển nhân viên</strong>
    <label for="staff-salary-input">Lương mỗi ca</label>
    <div class="drawer-salary-input"><input id="staff-salary-input" type="number" min="${STAFF_SALARY_MIN}" max="${STAFF_SALARY_MAX}" step="5000" value="${STAFF_SALARY_DEFAULT}"/><b>₫</b></div>
    <small>${money(STAFF_SALARY_MIN)} – ${money(STAFF_SALARY_MAX)} · Phí đăng ${money(STAFF_RECRUITMENT_FEE)}</small>
    <button class="drawer-recruit-submit" data-action="recruit-post" ${s.money < STAFF_RECRUITMENT_FEE ? 'disabled' : ''}>${icon('social')}<span>Đăng tin</span></button>
  </form>`;
}

function reviewAvatar(post: SocialPost) {
  const seed = Array.from(post.handle).reduce((total, character) => total + character.charCodeAt(0), 0);
  const base = customers.find(customer => customer.handle === post.handle)
    ?? customers[seed % customers.length];
  return avatarImage({
    ...base,
    ...post.avatar,
    id: post.avatar?.id ?? base.id,
    name: post.name,
    handle: post.handle,
    outfit: post.avatar?.outfit ?? post.color,
  }, true);
}

export function socialPanel(s: GameState, section: 'feed' | 'recruitment' = 'feed') {
  const shopStats = shopReviewStats(s);
  const reviewCount = shopStats.count + s.onlineReviews;
  const reviewTotal = shopStats.total + s.onlineRating * s.onlineReviews;
  const reviewAverage = reviewCount ? reviewTotal / reviewCount : 0;
  const reviewFill = Math.max(0, Math.min(100, reviewAverage / 5 * 100));
  return `<section class="social-drawer-panel">
    <header class="social-drawer-header">
      <nav class="social-drawer-tabs" aria-label="Bảng tin và tuyển dụng">
        <button class="${section === 'feed' ? 'is-active' : ''}" data-action="social-section" data-id="feed" aria-pressed="${section === 'feed'}">${icon('social')}<span>Bảng tin</span></button>
        <button class="${section === 'recruitment' ? 'is-active' : ''}" data-action="social-section" data-id="recruitment" aria-pressed="${section === 'recruitment'}">${icon('edit')}<span>Đăng tin</span>${s.staffApplicants.length ? `<b>${s.staffApplicants.length}</b>` : ''}</button>
      </nav>
    </header>
    <div class="social-drawer-content">
      ${section === 'recruitment' ? socialDrawerRecruitment(s) : `<section class="drawer-review-feed">
        <div class="drawer-review-summary">
          <div class="drawer-review-score"><strong>${reviewCount ? reviewAverage.toFixed(1) : '—'}</strong><span>/5</span></div>
          <div class="drawer-review-overview">
            <strong>Đánh giá khách hàng</strong>
            <span class="drawer-stars-meter" aria-label="${reviewCount ? `${reviewAverage.toFixed(1)} trên 5 sao` : 'Chưa có đánh giá'}"><i>★★★★★</i><i style="width:${reviewFill}%">★★★★★</i></span>
            <small>${reviewCount.toLocaleString('vi-VN')} lượt · tại shop và online</small>
          </div>
        </div>
        <div class="drawer-review-list">
        ${s.posts.length ? s.posts.slice().sort((a, b) => b.day - a.day).map(post => {
          const stars = Math.max(1, Math.min(5, post.reviewStars));
          return `<article class="drawer-review-card ${post.viral ? 'is-viral' : ''}">
            <span class="drawer-review-avatar" style="--review-color:${escapeHtml(post.color)}">${reviewAvatar(post)}</span>
            <div class="drawer-review-main">
              <div class="drawer-review-author"><div><strong>${escapeHtml(post.name)}</strong><span>${escapeHtml(post.handle)}</span></div><time>${gameDate(post.day)}</time></div>
              <span class="drawer-review-stars" aria-label="${stars} trên 5 sao"><span class="drawer-stars-meter"><i>★★★★★</i><i style="width:${stars / 5 * 100}%">★★★★★</i></span><b>${stars}</b></span>
              <p>${escapeHtml(post.text)}</p>
              <footer>${post.channel === 'online' ? `<span class="drawer-review-channel is-online">${icon('globe')} Kênh online</span>` : post.viral ? `<span class="drawer-review-viral">${icon('trend')} Nổi bật</span>` : `<span class="drawer-review-channel">${icon('shop')} Tại cửa hàng</span>`}<button class="drawer-review-likes ${post.likedByShop ? 'is-liked' : ''}" data-action="review-like" data-id="${escapeHtml(post.id)}" aria-label="${post.likedByShop ? 'Bỏ tim' : 'Thả tim'} đánh giá của ${escapeHtml(post.name)}" aria-pressed="${post.likedByShop ? 'true' : 'false'}">${icon('heart')}<span>${post.likes.toLocaleString('vi-VN')}</span></button></footer>
            </div>
          </article>`;
        }).join('') : `<div class="social-drawer-state social-drawer-empty">${icon('social')}<strong>Chưa có đánh giá</strong><span>Phục vụ khách hàng để nhận những phản hồi đầu tiên.</span></div>`}
        </div>
      </section>`}
    </div>
    <button class="social-drawer-handle" data-action="nav" data-id="shop" aria-label="Thu gọn bảng tin" title="Thu gọn">${icon('arrow')}</button>
  </section>`;
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

  if (isFirstTime) return `
    <main class="game-intro-screen">
      <aside class="landscape-banner intro-portrait-gate" aria-label="Yêu cầu xoay ngang thiết bị">
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
      </aside>
      <div class="game-intro-aurora intro-aurora-one"></div>
      <div class="game-intro-aurora intro-aurora-two"></div>
      <div class="game-intro-grain"></div>

      <header class="game-intro-brand">
        <span class="game-intro-monogram">ML</span>
        <span><b>MY LITTLE</b><strong>BOUTIQUE</strong></span>
      </header>

      <section class="game-intro-copy">
        <span class="game-intro-kicker"><i></i> A BOUTIQUE STORY <i></i></span>
        <h1>Một cửa tiệm nhỏ.<br><em>Một giấc mơ thật lớn.</em></h1>
        <p>Tự tay dựng nên boutique của riêng bạn, phối những outfit đầy cá tính và biến mỗi vị khách thành một câu chuyện đáng nhớ.</p>
        <ul class="game-intro-features" aria-label="Điểm nổi bật">
          <li>${icon('sparkle')}<span><b>Tự do sáng tạo</b><small>Bày trí theo gu của bạn</small></span></li>
          <li>${icon('hanger')}<span><b>Hàng trăm outfit</b><small>Phối đồ không giới hạn</small></span></li>
          <li>${icon('star')}<span><b>Xây thương hiệu</b><small>Từ tiệm nhỏ đến biểu tượng</small></span></li>
        </ul>
      </section>

      <section class="game-intro-showcase" aria-hidden="true">
        <span class="intro-spark intro-spark-one">✦</span>
        <span class="intro-spark intro-spark-two">✧</span>
        <span class="intro-spark intro-spark-three">✦</span>
        <div class="intro-fashion-card intro-card-back">
          <span>NEW<br>SEASON</span>
          <i class="intro-dress-art"></i>
        </div>
        <div class="intro-fashion-card intro-card-front">
          <span class="intro-card-label">YOUR STORY</span>
          <div class="intro-owner-portrait">${ownerPortrait(150)}</div>
          <strong>Be your own icon.</strong>
          <small>STYLE · DREAM · GROW</small>
        </div>
        <div class="intro-shop-sign">${icon('shop')}<span><small>WELCOME TO</small><b>YOUR BOUTIQUE</b></span></div>
      </section>

      <form class="game-intro-start" onsubmit="return false">
        <div class="game-intro-start-copy">
          <span>BƯỚC ĐẦU TIÊN</span>
          <strong>Đặt tên cho boutique của bạn</strong>
        </div>
        <label class="game-intro-name-field" for="shop-name-input">
          ${icon('shop')}
          <input
            type="text"
            id="shop-name-input"
            class="shop-name-text-input"
            maxlength="30"
            value="${escapeHtml(currentName)}"
            placeholder="Tên boutique..."
            autocomplete="off"
            spellcheck="false"
          />
          <small>30</small>
        </label>
        <button type="submit" class="game-intro-play" data-action="confirm-shop-name">
          <span><small>BẮT ĐẦU HÀNH TRÌNH</small><b>Chơi ngay</b></span>
          ${icon('arrow')}
        </button>
        <div class="game-intro-suggestions">
          <span>Hoặc chọn nhanh</span>
          ${suggestions.slice(0, 4).map(name => `<button type="button" data-action="pick-name" data-id="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('')}
        </div>
      </form>

      <footer class="game-intro-footer"><span>✦</span> Mỗi boutique đều bắt đầu từ một giấc mơ <span>✦</span></footer>
    </main>`;

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
  const displayKind = fixture.display.kind;
  const capacity = displayCapacity(fixture, placed);
  const fixtureName = placed.customName || fixture.name;
  const availableByProduct = new Map<string, number>();
  const compatible = products.filter(product => {
    if (!fixture.display!.categories.includes(product.category) || (s.inventory[product.id] ?? 0) <= 0) return false;
    availableByProduct.set(product.id, Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id)));
    return true;
  });
  const displayedGroups = Array.from(displayItems.reduce((groups, productId) => {
    groups.set(productId, (groups.get(productId) ?? 0) + 1);
    return groups;
  }, new Map<string, number>()).entries()).map(([productId, quantity]) => ({ product: products.find(item => item.id === productId), quantity })).filter((group): group is { product: typeof products[number]; quantity: number } => !!group.product);
  const warehouseProducts = compatible.filter(product => (availableByProduct.get(product.id) ?? 0) > 0);
  const groupsByCategory = fixture.display.categories.map(category => ({
    category,
    groups: displayedGroups.filter(group => group.product.category === category),
  })).filter(group => group.groups.length);
  const shelfRows: typeof groupsByCategory[] = [[], []];
  if (displayKind === 'clothing') {
    groupsByCategory.forEach(group => shelfRows[group.category === 'bottoms' ? 1 : 0].push(group));
  } else if (displayKind === 'shoes' || displayKind === 'bags' || displayKind === 'accessories') {
    const lowerShoeTypes = new Set(['heel', 'boot']);
    const lowerBagTypes = new Set(['tote', 'bucket', 'hobo', 'crossbody', 'satchel']);
    const lowerAccessoryTypes = new Set(['jewelry', 'socks']);
    displayedGroups.forEach(group => {
      const goesOnSecondRow = displayKind === 'shoes'
        ? lowerShoeTypes.has(group.product.subcategory) || group.product.art === 'platform'
        : displayKind === 'bags'
          ? lowerBagTypes.has(group.product.subcategory)
          : lowerAccessoryTypes.has(group.product.subcategory);
      const row = shelfRows[goesOnSecondRow ? 1 : 0];
      const categoryGroup = row.find(item => item.category === group.product.category);
      if (categoryGroup) categoryGroup.groups.push(group);
      else row.push({ category: group.product.category, groups: [group] });
    });
  } else {
    groupsByCategory.forEach((group, index) => shelfRows[index % shelfRows.length].push(group));
  }
  const usesHanger = displayKind !== 'shoes' && displayKind !== 'bags' && displayKind !== 'accessories';
  const kindLabels = { clothing: 'quần áo', shoes: 'giày', bags: 'túi xách', accessories: 'phụ kiện', outfit: 'outfit mẫu' };
  return `
    <div class="fixture-modal">
      <header class="fixture-modal-header">
        <span class="fixture-capacity-chip">${displayItems.length}<i>/</i>${capacity}</span>
        <h2 class="fixture-title-edit" contenteditable="true" role="textbox" aria-label="Đổi tên ${escapeHtml(fixture.name)}" data-fixture="${uid}" data-default-name="${escapeHtml(fixture.name)}" spellcheck="false">${escapeHtml(fixtureName)}</h2>
        <button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
      </header>
      <div class="fixture-studio">
        <section class="fixture-slot-panel">
          <div class="fixture-section-title"><div><span class="fixture-section-kicker">TỦ TRƯNG BÀY</span><h3>Kệ ${kindLabels[fixture.display.kind]}</h3></div><span>${displayItems.length}/${capacity}</span></div>
          <div class="fixture-display-groups fixture-hanging-display">
            ${shelfRows.map((row, rowIndex) => `<div class="fixture-hanging-row" data-row="${rowIndex + 1}">
              <div class="fixture-hanging-products">
                ${row.length ? row.map(categoryGroup => `<div class="fixture-hanging-category" data-category="${categoryGroup.category}">
                  ${categoryGroup.groups.map(({ product, quantity }) => `<button class="fixture-hanging-product" data-action="display-remove" data-id="${product.id}" data-fixture="${uid}" aria-label="Cất một ${escapeHtml(product.name)} về kho" title="${escapeHtml(product.name)}">${usesHanger ? `<span class="fixture-item-hanger">${icon('hanger')}</span>` : ''}<span class="fixture-hanging-thumb">${productImage(product)}</span><span class="fixture-hanging-count">×${quantity}</span><span class="fixture-hanging-price">${money(sellPrice(s, product))}</span><span class="fixture-hanging-remove">${icon('close')}</span></button>`).join('')}
                </div>`).join('') : `<span class="fixture-hanging-empty">Hàng ${rowIndex + 1} đang trống</span>`}
              </div>
            </div>`).join('')}
          </div>
          <div class="fixture-shelf-foot"><span>${capacity - displayItems.length} chỗ trống</span><small>${displayKind === 'shoes' || displayKind === 'bags' || displayKind === 'accessories' ? 'Sản phẩm được chia hàng theo kiểu dáng.' : 'Các món cùng phân loại được xếp cùng nhóm.'}</small></div>
        </section>
        <section class="fixture-warehouse-panel">
          <div class="fixture-section-title"><div><span class="fixture-section-kicker">KHO HÀNG</span><h3>Chọn món để trưng</h3></div><span>${warehouseProducts.length} mẫu</span></div>
          <div class="fixture-stock-grid">
          ${warehouseProducts.length ? warehouseProducts.map(product => {
            const available = availableByProduct.get(product.id) ?? 0;
            const full = displayItems.length >= capacity;
            return `<button class="fixture-stock-option" data-action="display-add" data-id="${product.id}" data-fixture="${uid}" aria-label="Trưng lên: ${escapeHtml(product.name)}" title="${escapeHtml(product.name)}" ${full ? 'disabled' : ''}><span class="fixture-stock-thumb">${productImage(product)}</span><span class="fixture-stock-quantity">×${available}</span><span class="fixture-stock-price">${money(sellPrice(s, product))}</span><span class="fixture-stock-add tutorial-display-add-target">${icon('plus')}</span></button>`;
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
        <header class="online-dashboard-header"><div><small>QUẢN LÝ KÊNH</small><h2>Dashboard online</h2></div><div class="online-dashboard-header-actions"><span>${s.onlineChannelEnabled ? 'Đang hoạt động' : 'Đang tạm đóng'}</span><button class="staff-modal-close online-channel-close" data-action="close-modal" aria-label="Đóng kênh bán hàng online">${icon('close')}</button></div></header>
        <div class="online-dashboard-metrics"><div><span>${icon('star')}</span><small>Đánh giá</small><strong>${s.onlineRating.toFixed(1)}</strong></div><div><span>${icon('user')}</span><small>Follower</small><strong>${compact(s.followers)}</strong></div><div><span>${icon('truck')}</span><small>Đã giao</small><strong>${s.onlineSales}</strong></div></div>
        <div class="online-dashboard-reach ${reachReady ? 'is-ready' : ''}"><div><small>${reachLabel}</small><strong>${chancePercent}% mỗi lượt kiểm tra</strong></div><div class="online-dashboard-reach-track"><b style="width:${reachProgress}%"></b></div><span>Xét điểm kênh, số review, uy tín shop, follower, giá bán và độ đa dạng sản phẩm.</span></div>
        <div class="online-dashboard-stock"><div class="dashboard-block-heading"><div><small>KHO HÀNG</small><strong>Chọn sản phẩm để đăng</strong></div><span>${warehouse.length} mẫu</span></div>
          <div class="online-dashboard-stock-list">${warehouse.length ? warehouse.map(product => {
            const available = Math.max(0, (s.inventory[product.id] ?? 0) - displayedQuantity(s, product.id));
            const isListed = s.onlineListings.includes(product.id);
            return `<button class="online-dashboard-stock-item ${isListed ? 'is-listed' : ''}" data-action="online-list" data-id="${product.id}" ${isListed || s.phase === 'open' ? 'disabled' : ''}><b class="online-stock-quantity">×${available}</b><span>${productImage(product)}</span><div><small>${escapeHtml(product.style)}</small><strong>${escapeHtml(product.name)}</strong><em>${money(s.prices[product.id] ?? product.sellPrice)}</em></div><i>${isListed ? icon('check') : icon('plus')}</i></button>`;
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
  const preferenceColorClasses: Record<string, string> = {
    'Hồng': 'pink', 'Tím': 'purple', 'Kem': 'cream', 'Xanh': 'blue', 'Xanh lá': 'green',
    'Nâu': 'brown', 'Đen': 'black', 'Bạc': 'silver', 'Đỏ': 'red', 'Vàng': 'yellow',
  };

  return `
    <div class="fitting-studio-layout consultation-modal">
      <!-- CỘT TRÁI: KHÁCH HÀNG & PHÒNG ƯỚM THỬ (Full-height Showcase) -->
      <aside class="studio-col-left" aria-label="Phòng thử đồ & Khách hàng">
        <div class="consultation-budget-bar">
          <span>${icon('coin')} Ngân sách</span>
          <strong>${money(c.budget)}</strong>
          <span id="modal-patience" class="studio-patience-chip" aria-label="Thời gian còn lại" title="Thời gian khách đợi">${icon('clock')} <strong>${s.patience}s</strong></span>
        </div>
        <div class="consultation-customer-heading">
          <h2 class="customer-name">${escapeHtml(c.name)}</h2>
          <span class="personality-tag">${escapeHtml(c.personality)}</span>
          <span class="loyalty-profile-chip" title="${nextLoyaltyMilestone ? `${nextLoyaltyMilestone.points - (relationship?.points ?? 0)} điểm nữa để lên ${nextLoyaltyMilestone.tier}` : 'Đã đạt bậc khách hàng cao nhất'}">
            ${icon('heart')} ${relationshipTier} · ${relationship?.points ?? 0} điểm
          </span>
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
            <span class="pref-label">Màu:</span>
            <div class="pref-chips">
              ${c.colors.map(col => `<span class="pref-chip color-chip color-${preferenceColorClasses[col] ?? 'neutral'}">${escapeHtml(col)}</span>`).join('')}
            </div>
          </div>
        </div>

      </aside>

      <!-- CỘT PHẢI: TỦ ĐỒ CỬA HÀNG & THANH CHỐT OUTFIT -->
      <section class="studio-col-right" aria-label="Tủ đồ boutique & Chốt đơn">
        <section class="consultation-request" aria-label="Yêu cầu của khách">
          <div class="consultation-request-copy">
            <span class="eyebrow">${icon('sparkle')} YÊU CẦU CỦA ${escapeHtml(c.name)}</span>
            <p>“${escapeHtml(c.goal)}”</p>
          </div>
          <button type="button" class="studio-close-btn" data-action="close-modal" aria-label="Đóng tư vấn" title="Đóng">${icon('close')}</button>
        </section>
        <!-- Header tủ đồ: Tiêu đề + Các tab danh mục + Nút đóng X -->
        <header class="studio-wardrobe-header">
          <div class="wardrobe-header-top">
            <div class="wardrobe-title-wrap">
              <span class="eyebrow">${icon('hanger')} BOUTIQUE WARDROBE</span>
              <h3>Tủ đồ của shop <span class="studio-stock-count">(${stock.length} mẫu có sẵn)</span></h3>
            </div>
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
                  <span class="outfit-stock-corner" aria-label="Đang trưng ${displayStock[p.id]} sản phẩm">×${displayStock[p.id]}</span>
                  <span class="outfit-check ${isSelected ? 'is-checked' : ''}">
                    ${icon(isSelected ? 'check' : 'plus')}
                  </span>
                  ${isMatchedStyle 
                    ? `<span class="outfit-match-tag style-match">${icon('heart')} Hợp gu</span>` 
                    : isMatchedColor 
                    ? `<span class="outfit-match-tag color-match">${icon('sparkle')} Đúng màu</span>` 
                    : isTrendingItem 
                    ? `<span class="outfit-match-tag trend-match">${icon('trend')} Hot trend</span>` 
                    : `<span class="outfit-match-tag style-label">${escapeHtml(p.style)}</span>`}
                  <b class="outfit-price ${isProductOverBudget ? 'text-error' : ''}">${money(sellPrice(s, p))}</b>
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
            <span class="serve-btn-copy">
              <strong class="serve-btn-label">${!items.length ? 'Chưa chọn đồ' : isOverBudget ? 'Vượt ngân sách' : 'Chốt outfit'}</strong>
              <small>${!items.length ? 'Chọn món phù hợp cho khách' : isOverBudget ? `Cần giảm ${money(price - c.budget)}` : `${items.length} món · ${money(price)}`}</small>
            </span>
            <span class="serve-btn-arrow" aria-hidden="true">${icon('arrow')}</span>
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
          ${result.reviewStars ? `<span class="result-review-stars">${icon('star')} ${Math.round(result.reviewStars)}/5 đánh giá</span>` : ''}
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
          <span class="summary-day-badge">${gameDate(s.day)}</span>
        </div>

        <div class="summary-celestial-wrapper">
          <div class="summary-celestial-halo"></div>
          <div class="summary-celestial-icon">
            ${icon(isSlowDay ? 'star' : 'daySun')}
          </div>
        </div>

        <h2 class="summary-hero-title">
          ${isSlowDay ? `${gameDate(s.day)} vắng đơn nhưng đầy hy vọng` : `${gameDate(s.day)}, khép lại trọn vẹn!`}
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
            Đóng tổng kết
          </button>
        </div>
      </div>
    </div>
  `;
}

export function financeModal(s: GameState, section: 'loan' | 'payroll' | 'land' = 'loan') {
  const borrowed = s.loan?.principal ?? 0;
  const balance = s.loan?.balance ?? 0;
  const remaining = Math.max(0, LOAN_MAX - borrowed);
  const minimum = Math.min(LOAN_MIN, remaining);
  const suggested = Math.min(700000, remaining);
  const canBorrow = s.phase !== 'open' && remaining > 0;
  const installment = s.loan?.paymentDue ?? 0;
  const rentPerDay = dailyRent(s);
  const payrollEmployees = s.employees.filter(employee => (employee.unpaidWages ?? 0) > 0);
  const payrollDue = payrollEmployees.reduce((sum, employee) => sum + (employee.unpaidWages ?? 0), 0);
  const payrollContent = `<section class="finance-tab-card finance-payroll-box">
    <div class="finance-section-title finance-payroll-title"><div><span class="eyebrow">BẢNG LƯƠNG</span><h3>Thanh toán theo ca thực tế</h3></div>${payrollDue > 0 ? `<button class="btn btn-primary btn-small finance-payroll-pay-all" data-action="pay-all-staff-wages" ${s.money < payrollDue || s.phase === 'open' ? 'disabled' : ''}>${icon('coin')}<span>Trả tất cả</span><b>${money(payrollDue)}</b></button>` : `<span class="finance-rate">${icon('check')} Đã thanh toán</span>`}</div>
    <p class="finance-payroll-note">Chỉ nhân viên có mặt trong ca mới phát sinh lương. Quá 3 công chưa trả, nhân viên sẽ nghỉ việc và công nợ bị trừ tự động.</p>
    <div class="finance-payroll-list">${s.employees.length ? s.employees.map(employee => {
      const shifts = employee.unpaidShifts ?? 0;
      const due = employee.unpaidWages ?? 0;
      return `<article class="finance-payroll-row ${shifts >= 3 ? 'is-danger' : ''} ${due <= 0 ? 'is-paid' : ''}"><div class="finance-payroll-avatar">${staffImage(employee.appearance, employee.name)}</div><div class="finance-payroll-person"><strong>${escapeHtml(employee.name)}</strong><span>${money(employee.salary)}<small>/ca</small></span><em>${icon('clock')} Đã làm ${employee.totalShiftsWorked ?? 0} ca</em></div><div class="finance-payroll-debt"><small>${due > 0 ? 'Công nợ' : 'Trạng thái'}</small><b>${due > 0 ? money(due) : `${icon('check')} Đã trả`}</b><em>${shifts}/3 công</em></div><button class="btn btn-secondary btn-small" data-action="pay-staff-wages" data-id="${employee.uid}" ${due <= 0 || s.money < due || s.phase === 'open' ? 'disabled' : ''}>${due > 0 ? 'Trả lương' : 'Hoàn tất'}</button></article>`;
    }).join('') : '<p class="finance-payroll-empty">Chưa có nhân viên trong đội ngũ.</p>'}</div>
  </section>`;
  const loanContent = `<section class="finance-tab-card finance-loan-box">
    <div class="finance-tab-summary"><span>Dư nợ vay <b>${money(balance)}</b></span><span>Kỳ cần trả <b>${money(installment)}</b></span><span>Quá hạn <b>${s.loanOverdueDays}/7 ngày</b></span><span>Hạn mức còn lại <b>${money(remaining)}</b></span></div>
    <div class="finance-section-title"><div><span class="eyebrow">VỐN KINH DOANH</span><h3>Vay thêm vốn</h3></div><span class="finance-rate">${(LOAN_DAILY_RATE * 100).toFixed(1)}%/ngày</span></div>
    <div class="finance-loan-control"><label for="loan-amount-input">Số tiền muốn vay</label><div><input id="loan-amount-input" type="number" min="${minimum}" max="${remaining}" step="10000" value="${suggested}" ${canBorrow ? '' : 'disabled'} aria-label="Số tiền muốn vay"><span>₫</span></div></div>
    <div class="finance-tab-actions"><button class="btn btn-primary finance-borrow-btn" data-action="take-loan" ${canBorrow ? '' : 'disabled'}>Nhận khoản vay</button><button class="btn btn-secondary" data-action="pay-loan" ${installment <= 0 || s.money < installment || s.phase === 'open' ? 'disabled' : ''}>Trả kỳ vay · ${money(installment)}</button></div>
    <div class="finance-terms"><span>Lãi <b>${(LOAN_DAILY_RATE * 100).toFixed(1)}%/ngày</b></span><span>Kỳ trả <b>${(LOAN_PAYMENT_RATE * 100).toFixed(0)}% vốn/ngày</b></span><span>Đã vay <b>${money(borrowed)}</b></span></div>
  </section>`;
  const landContent = `<section class="finance-tab-card finance-land-box ${s.rentOverdueDays >= 6 ? 'is-danger' : ''}">
    <div class="finance-land-hero">${icon('shop')}<div><span class="eyebrow">MẶT BẰNG BOUTIQUE</span><h3>${money(rentPerDay)}/ngày</h3><p>Tiền thuê được cộng vào công nợ sau mỗi ngày bán.</p></div></div>
    <div class="finance-tab-summary"><span>Đang nợ <b>${money(s.rentDue)}</b></span><span>Quá hạn <b>${s.rentOverdueDays}/7 ngày</b></span><span>Tiền mặt <b>${money(s.money)}</b></span></div>
    <button class="btn btn-primary finance-land-pay" data-action="pay-rent" ${s.rentDue <= 0 || s.money < s.rentDue || s.phase === 'open' ? 'disabled' : ''}>Thanh toán tiền mặt bằng · ${money(s.rentDue)}</button>
    <p class="finance-footnote">Công nợ mặt bằng được cộng dồn và chỉ thanh toán khi bạn chủ động bấm trả.</p>
  </section>`;
  return `<div class="finance-modal finance-tabs-modal">
    <header class="finance-game-header"><span class="import-balance finance-header-balance" data-animated-balance="finance">${icon('importMoney')} ${money(s.money)}</span><h2>Tài chính</h2><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng tài chính">${icon('close')}</button></header>
    <nav class="finance-tabs" aria-label="Các mục tài chính">
      <button class="${section === 'loan' ? 'is-active' : ''}" data-action="finance-section" data-id="loan">${icon('coins')}<span>Vay vốn</span>${installment > 0 ? '<b>!</b>' : ''}</button>
      <button class="${section === 'payroll' ? 'is-active' : ''}" data-action="finance-section" data-id="payroll">${icon('users')}<span>Lương</span>${payrollDue > 0 ? `<b>${payrollEmployees.length}</b>` : ''}</button>
      <button class="${section === 'land' ? 'is-active' : ''}" data-action="finance-section" data-id="land">${icon('shop')}<span>Mặt bằng</span>${s.rentDue > 0 ? '<b>!</b>' : ''}</button>
    </nav>
    <div class="finance-tab-content">${section === 'payroll' ? payrollContent : section === 'land' ? landContent : loanContent}</div>
  </div>`;
}

export function financialGameOverModal(s: GameState) {
  const creditor = s.gameOverReason === 'creditor';
  const overdueDays = creditor ? s.loanOverdueDays : s.rentOverdueDays;
  const amount = creditor ? (s.loan?.paymentDue ?? 0) : s.rentDue;
  return `
    <div class="financial-gameover financial-deadline-modal">
      <header class="financial-deadline-header"><span class="eyebrow">BÁO CÁO TÀI CHÍNH</span><h2>Quá hạn thanh toán</h2></header>
      <section class="financial-deadline-hero">
        <div class="gameover-symbol">${icon(creditor ? 'coins' : 'shop')}</div>
        <div><span class="financial-deadline-tag">QUÁ HẠN ${overdueDays} NGÀY</span><h3>${creditor ? 'Khoản vay đã vượt giới hạn' : 'Mặt bằng đã bị thu hồi'}</h3><p>${creditor
          ? 'Khoản vay chưa được thanh toán sau thời hạn 7 ngày. Chủ nợ đã thu hồi tài sản của boutique.'
          : 'Tiền thuê chưa được thanh toán sau thời hạn 7 ngày. Chủ nhà đã chấm dứt hợp đồng mặt bằng.'}</p></div>
      </section>
      <div class="gameover-debt">
        <span>Loại công nợ</span><strong>${creditor ? 'Vay vốn' : 'Thuê mặt bằng'}</strong>
        <span>Ngày kết thúc</span><strong>${gameDate(s.day)}</strong>
        <span>Số ngày quá hạn</span><strong>${overdueDays} ngày</strong>
        <span>Khoản chưa trả</span><strong class="is-danger">${money(amount)}</strong>
      </div>
      <p class="financial-deadline-note">Hãy cân đối dòng tiền và thanh toán trong tab Tài chính trước khi công nợ vượt quá 7 ngày ở lượt chơi tiếp theo.</p>
      <button class="btn btn-primary" data-action="reset">${icon('sparkle')} Bắt đầu boutique mới</button>
    </div>`;
}

export function debtWarningModal(s: GameState, staff: StaffFinancialNotice = { payrollAtRisk: [], departures: [] }) {
  const maxDays = Math.max(s.loanOverdueDays, s.rentOverdueDays);
  const daysLeft = Math.max(0, 7 - maxDays);
  const finalDay = daysLeft === 0;
  const hasDebtWarning = s.loanOverdueDays >= 5 || s.rentOverdueDays >= 5;
  const hasDeparture = staff.departures.length > 0;
  const hasPayrollRisk = staff.payrollAtRisk.length > 0;
  const heading = hasDeparture
    ? `${staff.departures.length} nhân viên đã nghỉ việc`
    : hasPayrollRisk
      ? 'Lương đã quá hạn 3 công'
      : finalDay ? 'Hôm nay là hạn cuối!' : `Còn ${daysLeft} ngày để thanh toán`;
  const description = hasDeparture
    ? 'Công nợ lương đã được tự động thanh toán khi nhân viên rời shop. Số dư tiền mặt đã được cập nhật.'
    : hasPayrollRisk
      ? 'Hãy trả lương trước ca tiếp theo. Nếu công nợ tăng quá 3 công, nhân viên sẽ nghỉ việc và shop vẫn phải thanh toán toàn bộ lương còn thiếu.'
      : finalDay
        ? 'Nếu kết thúc thêm một ngày mà chưa trả, boutique sẽ bị thu hồi.'
        : 'Khoản nợ sắp chạm giới hạn 7 ngày. Hãy cân đối tiền mặt và thanh toán sớm.';
  return `
    <div class="debt-warning-modal finance-report-modal ${finalDay ? 'is-final' : ''} ${hasDeparture ? 'has-departure' : ''}">
      <header class="finance-report-header">
        <span class="import-balance finance-report-balance">${icon('importMoney')} ${money(s.money)}</span>
        <div><span class="eyebrow">BÁO CÁO CUỐI NGÀY</span><h2>Tài chính</h2></div>
        <button class="staff-modal-close" data-action="summary" aria-label="Đóng báo cáo">${icon('close')}</button>
      </header>
      <section class="finance-report-hero">
        <span class="finance-report-icon">${icon(hasDeparture ? 'users' : hasPayrollRisk ? 'coins' : 'clock')}</span>
        <div><span class="eyebrow">${hasDeparture ? 'BIẾN ĐỘNG NHÂN SỰ' : hasPayrollRisk ? 'CẢNH BÁO BẢNG LƯƠNG' : 'CÔNG NỢ CẦN CHÚ Ý'}</span><h3>${heading}</h3><p>${description}</p></div>
      </section>
      <div class="finance-report-list">
        ${staff.departures.map(employee => `<article class="finance-report-row is-departure"><span class="finance-report-row-icon">${icon('users')}</span><div><strong>${escapeHtml(employee.name)} đã nghỉ việc</strong><small>Lương còn nợ được trừ tự động</small></div><b>−${money(employee.amount)}</b></article>`).join('')}
        ${staff.payrollAtRisk.map(employee => `<article class="finance-report-row is-payroll"><span class="finance-report-row-icon">${icon('clock')}</span><div><strong>${escapeHtml(employee.name)}</strong><small>Đã nợ ${employee.shifts}/3 công · cần trả trước ca tiếp theo</small></div><b>${money(employee.amount)}</b></article>`).join('')}
        ${s.loanOverdueDays >= 5 ? `<article class="finance-report-row is-debt"><span class="finance-report-row-icon">${icon('coins')}</span><div><strong>Kỳ vay</strong><small>Quá hạn ${s.loanOverdueDays}/7 ngày</small></div><b>${money(s.loan?.paymentDue ?? 0)}</b></article>` : ''}
        ${s.rentOverdueDays >= 5 ? `<article class="finance-report-row is-debt"><span class="finance-report-row-icon">${icon('shop')}</span><div><strong>Thuê mặt bằng</strong><small>Quá hạn ${s.rentOverdueDays}/7 ngày</small></div><b>${money(s.rentDue)}</b></article>` : ''}
      </div>
      <p class="finance-report-note">${hasDeparture ? `${staff.departures.reduce((sum, employee) => sum + employee.amount, 0).toLocaleString('vi-VN')}₫ đã được ghi nhận vào chi phí lương.` : hasDebtWarning || hasPayrollRisk ? 'Mở Tài chính để xử lý các khoản đến hạn.' : ''}</p>
      <div class="debt-warning-actions">
        <button class="btn btn-primary" data-action="finance-open">${icon('coins')} Mở tài chính</button>
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
  const atelierUnlocks = next && s.level + 1 === 8
    ? [{ icon: 'hanger', title: 'Xưởng may cá nhân', copy: 'Thuê xưởng, mua nguyên liệu và tạo thiết kế chữ ký' }]
    : next && s.level + 1 === 9
      ? [{ icon: 'star', title: 'Nguyên liệu cao cấp', copy: 'Mở khóa wool, lụa Mulberry và da Nappa' }]
      : next && s.level + 1 === 10
        ? [{ icon: 'crown', title: 'Vật liệu couture', copy: 'Mở khóa pha lê Aurora và cashmere Ivory' }]
        : [];
  if (!next) return `<section class="upgrade-modal-wrapper is-max-level">
        <section class="max-level-celebration">
          <span class="max-level-sparkle sparkle-one">${icon('star')}</span>
          <span class="max-level-sparkle sparkle-two">${icon('star')}</span>
          <span class="max-level-sparkle sparkle-three">${icon('star')}</span>
          <div class="max-level-emblem">${ownerPortrait(92)}<b>${icon('trophy')}</b></div>
          <span class="max-level-kicker">FASHION LEGACY</span>
          <h3>Di Sản Thời Trang</h3>
          <p>Boutique và xưởng may của bạn đã đạt cấp độ tối đa, tạo nên những thiết kế mang chữ ký riêng được cả thế giới biết đến.</p>
          <div class="max-level-legacy-stats">
            <article><span>${icon('crown')}</span><div><small>Cấp boutique</small><strong>10 · Tối đa</strong></div></article>
            <article><span>${icon('star')}</span><div><small>Kinh nghiệm</small><strong>${s.xp.toLocaleString('vi-VN')} XP</strong></div></article>
            <article><span>${icon('hudFollowers')}</span><div><small>Người theo dõi</small><strong>${s.followers.toLocaleString('vi-VN')}</strong></div></article>
            <article><span>${icon('star')}</span><div><small>Danh tiếng ngành</small><strong>${s.industryReputation}</strong></div></article>
          </div>
          <button class="btn btn-primary max-level-return" data-action="close-modal">${icon('shop')} Tiếp tục hành trình tại shop ${icon('arrow')}</button>
        </section>
      </section>`;

  const unlockCount = newProducts.length + newFurniture.length + atelierUnlocks.length + 1;
  const xpPercent = Math.min(100, Math.round((s.xp / next.xp) * 100));
  return `<section class="upgrade-workspace">
    <header class="app-modal-header upgrade-workspace-header">
      <span class="app-header-chip">${icon('trophy')} CẤP ${s.level} → ${s.level + 1}</span>
      <hgroup><small>PHÁT TRIỂN BOUTIQUE</small><h2>Nâng cấp cửa hàng</h2></hgroup>
      <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button>
    </header>
    <main class="upgrade-layout">
      <section class="upgrade-benefits">
        <header><h3>${icon('gift')} Đặc quyền mở khóa</h3><span>${unlockCount} điều mới</span></header>
        <ul class="upgrade-benefit-list">
          <li><span class="upgrade-benefit-art is-perk">${icon('users')}</span><p><strong>Thêm khách ghé shop</strong><small>Nhiều cơ hội tư vấn và tăng doanh thu</small></p><i>${icon('check')}</i></li>
          ${atelierUnlocks.map(unlock => `<li><span class="upgrade-benefit-art is-perk">${icon(unlock.icon)}</span><p><strong>${unlock.title}</strong><small>${unlock.copy}</small></p><i>${icon('check')}</i></li>`).join('')}
          ${newProducts.map(product => `<li><span class="upgrade-benefit-art">${productImage(product)}</span><p><strong title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</strong><small>${product.style} · Thời trang</small></p><i>${icon('check')}</i></li>`).join('')}
          ${newFurniture.map(item => `<li><span class="upgrade-benefit-art">${furnitureImage(item)}</span><p><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><small>+${item.appeal} Thẩm mỹ · Nội thất</small></p><i>${icon('check')}</i></li>`).join('')}
        </ul>
      </section>
      <aside class="upgrade-checklist">
        <header><small>ĐIỀU KIỆN · CẤP ${s.level + 1}</small><h3>${canUpgrade ? 'Đã sẵn sàng nâng cấp' : 'Hoàn thành hai mục tiêu'}</h3><b class="upgrade-readiness ${canUpgrade ? 'is-ready' : ''}">${icon(canUpgrade ? 'check' : 'clock')} ${canUpgrade ? 'Sẵn sàng' : 'Đang tích lũy'}</b></header>
        <article class="${hasXp ? 'is-met' : ''}"><span>${icon('star')}</span><p><small>Kinh nghiệm</small><strong>${s.xp.toLocaleString('vi-VN')} / ${next.xp.toLocaleString('vi-VN')} XP</strong></p><b>${hasXp ? `${icon('check')} Đã đạt` : `Thiếu ${(next.xp - s.xp).toLocaleString('vi-VN')} XP`}</b><progress max="100" value="${xpPercent}">${xpPercent}%</progress></article>
        <article class="${canAfford ? 'is-met' : ''}"><span>${icon('coin')}</span><p><small>Chi phí nâng cấp</small><strong>${money(next.cost)}</strong><em>Đang có ${money(s.money)}</em></p><b>${canAfford ? `${icon('check')} Đủ tiền` : `Thiếu ${money(next.cost - s.money)}`}</b></article>
        <button class="btn btn-primary upgrade-submit" data-action="upgrade" ${!canUpgrade ? 'disabled' : ''}>${icon('trophy')} Nâng cấp lên Cấp ${s.level + 1} ${icon('arrow')}</button>
      </aside>
    </main>
  </section>`;
}

export function boutiqueProfileModal(s: GameState) {
  const shopName = s.shopName || 'My Little Boutique';
  const currentLevel = levels[Math.max(0, s.level - 1)] ?? levels[0];
  const nextLevel = levels[s.level];
  const isMaxLevel = !nextLevel;
  const levelStartXp = currentLevel.xp;
  const levelTargetXp = nextLevel?.xp ?? Math.max(s.xp, levelStartXp + 1);
  const progress = nextLevel
    ? Math.max(0, Math.min(100, (s.xp - levelStartXp) / Math.max(1, levelTargetXp - levelStartXp) * 100))
    : 100;
  const rating = shopReviewStats(s);
  const inventoryCount = Object.values(s.inventory).reduce((sum, quantity) => sum + quantity, 0);
  const reviewText = rating.average === null ? '—' : rating.average.toFixed(1);

  return `<section class="boutique-profile-modal ${isMaxLevel ? 'is-max-level' : ''}">
    <header class="app-modal-header boutique-profile-header">
      <span class="app-header-chip">${icon(isMaxLevel ? 'crown' : 'shop')} ${isMaxLevel ? 'MAX LEVEL' : 'HỒ SƠ SHOP'}</span>
      <div><small>TRANG CÁ NHÂN</small><h2>${escapeHtml(shopName)}</h2></div>
      <button class="staff-modal-close" data-action="close-modal" aria-label="Đóng trang cá nhân">${icon('close')}</button>
    </header>

    <section class="boutique-profile-hero">
      ${isMaxLevel ? `<span class="max-profile-glow glow-left">${icon('sparkle')}</span><span class="max-profile-glow glow-right">${icon('sparkle')}</span>` : ''}
      <div class="boutique-profile-avatar">${ownerPortrait(108)}<span>${icon(isMaxLevel ? 'crown' : 'check')}</span></div>
      <div class="boutique-profile-intro">
        <span class="eyebrow">${isMaxLevel ? 'THƯƠNG HIỆU TOÀN CẦU' : escapeHtml(currentLevel.name)}</span>
        <h3>${escapeHtml(shopName)}</h3>
        <p>${toShopHandle(shopName)} · ${isMaxLevel ? 'Đỉnh cao của hành trình boutique' : escapeHtml(currentLevel.label)}</p>
        <div class="boutique-profile-level"><span><b>Cấp ${s.level}</b><em>${nextLevel ? `${s.xp.toLocaleString('vi-VN')} / ${levelTargetXp.toLocaleString('vi-VN')} XP` : 'Đã đạt cấp cao nhất'}</em></span><i><b style="width:${progress}%"></b></i></div>
      </div>
      <button class="boutique-profile-edit" data-action="name-shop">${icon('edit')} Đổi tên</button>
    </section>

    ${isMaxLevel ? `<section class="boutique-max-banner"><span class="boutique-max-emblem">${icon('trophy')}</span><div><small>THÀNH TỰU CAO NHẤT</small><strong>Around the world</strong><p>Boutique của bạn đã trở thành một thương hiệu thời trang được biết đến trên toàn thế giới.</p></div><b>${icon('star')} CẤP 07</b></section>` : ''}

    <div class="boutique-profile-stats">
      <article><span>${icon('hudFollowers')}</span><div><small>Người theo dõi</small><strong>${s.followers.toLocaleString('vi-VN')}</strong></div></article>
      <article><span>${icon('star')}</span><div><small>Đánh giá</small><strong>${reviewText}<em>${rating.count ? ` · ${rating.count} lượt` : ''}</em></strong></div></article>
      <article><span>${icon('hudReputation')}</span><div><small>Uy tín</small><strong>${s.reputation.toFixed(1)}<em>/5</em></strong></div></article>
      <article><span>${icon('hudAppeal')}</span><div><small>Thẩm mỹ</small><strong>${decorAppealScore(s)}</strong></div></article>
    </div>

    <div class="boutique-profile-details">
      <article><span>${icon('bag')}</span><small>Đã bán hôm nay</small><strong>${s.stats.sold} món</strong></article>
      <article><span>${icon('box')}</span><small>Hàng trong kho</small><strong>${inventoryCount} món</strong></article>
      <article><span>${icon('decor')}</span><small>Đồ đang đặt</small><strong>${s.layout.length} món</strong></article>
      <article><span>${icon('star')}</span><small>Danh tiếng ngành</small><strong>${s.industryReputation}</strong></article>
    </div>

    <footer class="boutique-profile-actions">
      ${isMaxLevel
        ? `<span class="boutique-max-complete">${icon('crown')} Đã hoàn thành mọi cột mốc boutique</span>`
        : `<button class="btn btn-secondary" data-action="upgrade-open">${icon('trophy')} Xem nâng cấp</button>`}
      <button class="btn btn-primary" data-action="close-modal">${icon('check')} Quay lại shop</button>
    </footer>
  </section>`;
}
