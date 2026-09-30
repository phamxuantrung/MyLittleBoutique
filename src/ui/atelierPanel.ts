import type { CustomProduct, GameState, ProductDesignMotif, ProductDesignSticker, ProductDesignStroke, Style } from '../types';
import { ATELIER_PURCHASE_COST, atelierMaterials, atelierRecipes } from '../data/atelier';
import { icon } from './icons';
import { escapeHtml, money, productImage } from './format';
import { gameDate } from '../systems/calendar';
import { atelierMaterialIllustration } from '../art/atelierArt';
import { productSvg, svgUrl } from '../art/svg';

export type AtelierSection = 'design' | 'production';

const materialFormula = (materials: Record<string, number>) => Object.entries(materials).map(([id, quantity]) => {
  const material = atelierMaterials.find(item => item.id === id);
  return `<span style="--material:${material?.color ?? '#eee'}"><i class="recipe-material-art">${atelierMaterialIllustration(id)}</i>${escapeHtml(material?.name ?? id)} ×${quantity}</span>`;
}).join('');
const recipeIllustration = (recipe: typeof atelierRecipes[number]) => `<img class="recipe-product-art" src="${svgUrl(productSvg(recipe))}" alt="${escapeHtml(recipe.name)}" draggable="false" />`;

export function atelierPanel(
  s: GameState,
  section: AtelierSection,
  selection: Record<string, number>,
  selectedStyle: Style,
  batchQtys: Record<string, number>,
  historyOpen = false,
) {
  const atelierOwned = s.atelierOwned;
  const selectionCount = Object.values(selection).filter(Boolean).length;
  const unlockedRecipes = atelierRecipes.filter(recipe => Object.keys(recipe.materials).every(id => (atelierMaterials.find(material => material.id === id)?.level ?? 99) <= s.level));
  const totalMaterials = Object.values(s.materialInventory).reduce((sum, value) => sum + value, 0);
  const selectedIngredients = Object.entries(selection).filter((entry): entry is [string, number] => entry[1] > 0).map(([id, quantity]) => ({ material: atelierMaterials.find(item => item.id === id)!, quantity })).filter(item => item.material);
  const matchedRecipe = unlockedRecipes.find(recipe => recipe.style === selectedStyle
    && Object.keys(recipe.materials).length === selectedIngredients.length
    && selectedIngredients.every(item => recipe.materials[item.material.id] === item.quantity));
  const craftHistory = [...(s.atelierCraftHistory ?? [])].reverse();

  return `<section class="atelier-page">
    <header class="atelier-header atelier-compact-header">
      <nav class="atelier-tabs atelier-header-tabs" aria-label="Khu vực xưởng may">
        <button data-action="atelier-section" data-id="design" class="${section === 'design' ? 'active' : ''}">${icon('hanger')}<span>Phòng thiết kế</span><b>${unlockedRecipes.length}</b></button>
        <button data-action="atelier-section" data-id="production" class="${section === 'production' ? 'active' : ''}">${icon('shop')}<span>Sản xuất</span><b>${s.tailoringJobs.length}</b></button>
      </nav>
      <button class="atelier-close" data-action="nav" data-id="shop" aria-label="Quay lại shop">${icon('close')}</button>
    </header>

    ${!atelierOwned ? `<div class="atelier-locked-stage"><span>✂</span><small>TÀI SẢN BOUTIQUE · CẤP 8</small><h3>Sở hữu xưởng may của riêng bạn</h3><p>Đầu tư một lần để mở vĩnh viễn Phòng thiết kế và Chuyền sản xuất. Xưởng sẽ không có thời hạn sử dụng hay phí gia hạn.</p><button data-action="atelier-buy" ${s.money < ATELIER_PURCHASE_COST || s.phase === 'open' ? 'disabled' : ''}>${icon('shop')} Mua đứt xưởng · ${money(ATELIER_PURCHASE_COST)}</button></div>` : section === 'design' ? `
      <div class="atelier-design-layout craft-studio-layout">
        <section class="craft-material-library">
          <header><div><small>KHO NGUYÊN LIỆU</small><h3>Chọn chất liệu</h3></div><b>${totalMaterials}</b></header>
          <div class="design-material-picker craft-material-grid">${atelierMaterials.filter(material => material.level <= s.level).map(material => {
            const selected = selection[material.id] ?? 0;
            const stock = s.materialInventory[material.id] ?? 0;
            const typeLimitReached = selectionCount >= 3 && selected === 0;
            return `<article style="--material:${material.color}" class="${selected ? 'is-selected' : ''} ${stock ? '' : 'is-empty'} ${typeLimitReached ? 'is-type-locked' : ''}"><span>${atelierMaterialIllustration(material.id)}</span><div><strong>${escapeHtml(material.name)}</strong><small>${typeLimitReached ? 'Đã chọn đủ 3 loại' : stock ? `Trong kho ${stock}` : 'Đã hết nguyên liệu'}</small></div><div class="design-stepper"><button data-action="atelier-material-step" data-id="${material.id}" data-value="-1" ${selected <= 0 ? 'disabled' : ''}>−</button><b>${selected}</b><button data-action="atelier-material-step" data-id="${material.id}" data-value="1" ${selected >= stock || typeLimitReached ? 'disabled' : ''}>+</button></div></article>`;
          }).join('')}</div>
        </section>

        <section class="design-workbench craft-workbench">
          <header class="craft-board-heading"><div><small>BÀN CẮT MAY</small><h3>Craft thiết kế mới</h3></div><div class="craft-board-actions"><button class="craft-history-button" data-action="atelier-history-open">${icon('clock')}<span>Lịch sử craft</span><b>${craftHistory.length}</b></button></div></header>
          <div class="craft-style-selector"><span>01</span><div><small>CHỌN PHONG CÁCH</small><div class="design-style-strip">${Array.from(new Set(unlockedRecipes.map(recipe => recipe.style))).map(style => `<button data-action="atelier-style" data-id="${style}" class="${selectedStyle === style ? 'active' : ''}">${style}</button>`).join('')}</div></div></div>
          <div class="craft-formula-stage">
            <div class="craft-stage-label"><span>02</span><div><small>PHỐI NGUYÊN LIỆU</small><strong>${selectedIngredients.length ? `${selectedIngredients.length} chất liệu đã chọn` : 'Chọn ít nhất 2 chất liệu'}</strong></div></div>
            <div class="craft-equation">
              <div class="craft-ingredient-slots">${selectedIngredients.length ? selectedIngredients.map((item, index) => `${index ? '<i>+</i>' : ''}<article style="--material:${item.material.color}"><button class="craft-ingredient-remove" data-action="atelier-material-remove" data-id="${item.material.id}" aria-label="Bớt một ${escapeHtml(item.material.name)}"></button><span>${atelierMaterialIllustration(item.material.id)}</span><b>${escapeHtml(item.material.name)}</b><em>×${item.quantity}</em></article>`).join('') : Array.from({ length: 3 }, (_, index) => `${index ? '<i>+</i>' : ''}<article class="is-placeholder"><span>${index + 1}</span><b>Chất liệu</b></article>`).join('')}</div>
              <span class="craft-result-arrow">${icon('arrow')}</span>
              <article class="craft-result-preview ${matchedRecipe ? 'has-result' : ''}">
                ${matchedRecipe ? recipeIllustration(matchedRecipe) : `<span class="craft-mannequin">${icon('hanger')}</span>`}
                <div><small>${matchedRecipe ? 'MẪU CÓ THỂ TẠO' : 'KẾT QUẢ BÍ ẨN'}</small><strong>${matchedRecipe ? escapeHtml(matchedRecipe.name) : escapeHtml(selectedStyle)}</strong></div>
              </article>
            </div>
          </div>
          <footer class="craft-action-bar"><div>${icon('info')}<span><strong>Lưu ý</strong>Công thức sai vẫn tiêu hao nguyên liệu thử.</span></div>${s.atelierDraft ? `<button class="atelier-create-sample has-draft" data-action="atelier-review-draft">${icon('star')} Xem mẫu đang chờ duyệt</button>` : `<button class="atelier-create-sample" data-action="atelier-create-sample" ${selectionCount < 2 || s.phase === 'open' ? 'disabled' : ''}><span>Craft mẫu thử</span>${icon('arrow')}</button>`}</footer>
        </section>
      </div>` : `
      <div class="atelier-production-layout production-dashboard">
        <section class="production-blueprint-panel">
          <header class="production-panel-heading"><div><small>THƯ VIỆN BẢN THIẾT KẾ</small><h3>Chọn mẫu để đưa vào chuyền may</h3></div><div class="production-summary"><span><b>${s.customProducts.length}</b><small>Bản thiết kế</small></span><span><b>${s.tailoringJobs.reduce((sum, job) => sum + job.quantity, 0)}</b><small>Đang sản xuất</small></span></div></header>
          ${s.customProducts.length ? `<div class="blueprint-grid production-blueprint-grid">${s.customProducts.map(product => {
            const recipe = atelierRecipes.find(item => item.id === product.recipeId)!;
            const qty = Math.max(5, Math.min(50, batchQtys[product.id] ?? 5));
            const enough = Object.entries(recipe.materials).every(([id, amount]) => (s.materialInventory[id] ?? 0) >= amount * qty);
            const days = Math.ceil(qty / 5);
            return `<article class="blueprint-card production-blueprint-card ${enough ? '' : 'is-shortage'}">
              <button class="blueprint-delete-button" data-action="atelier-delete-blueprint" data-id="${product.id}" aria-label="Xóa bản thiết kế ${escapeHtml(product.name)}" title="Xóa bản thiết kế">${icon('trash')}</button>
              <div class="blueprint-art production-blueprint-art">${productImage(product)}</div>
              <div class="blueprint-copy production-blueprint-copy"><small>${product.style} · ${product.category}</small><div class="production-name-row"><label class="production-name-editor" title="Chạm để đổi tên sản phẩm"><span>${icon('edit')}</span><input class="production-name-input" data-custom-product="${product.id}" value="${escapeHtml(product.name)}" maxlength="32" aria-label="Tên sản phẩm ${escapeHtml(product.name)}" /></label><button class="open-design-studio" data-action="atelier-customize-open" data-id="${product.id}" aria-label="Mở Studio chỉnh mẫu ${escapeHtml(product.name)}" title="Phối màu và họa tiết">${icon('edit')}</button></div><div class="recipe-materials">${materialFormula(recipe.materials)}</div><div class="production-card-meta"><span>${icon('clock')} ${days} ngày</span><span>${icon('box')} Kho thành phẩm: ${s.inventory[product.id] ?? 0}</span></div></div>
              <div class="production-material-status ${enough ? 'is-ready' : ''}">${icon(enough ? 'check' : 'info')}<span><b>${enough ? 'Đủ nguyên liệu' : 'Thiếu nguyên liệu'}</b><small>Cho ${qty} sản phẩm</small></span></div>
              <div class="blueprint-actions production-card-actions"><div class="production-quantity"><small>SỐ LƯỢNG</small><div class="design-stepper"><button data-action="atelier-batch-step" data-id="${product.id}" data-value="-5" ${qty <= 5 ? 'disabled' : ''}>−</button><b>${qty}</b><button data-action="atelier-batch-step" data-id="${product.id}" data-value="5" ${qty >= 50 ? 'disabled' : ''}>+</button></div></div><button data-action="atelier-start-batch" data-id="${product.id}" ${!enough || s.phase === 'open' ? 'disabled' : ''}><span>Bắt đầu sản xuất</span>${icon('arrow')}</button></div>
            </article>`;
          }).join('')}</div>` : `<div class="atelier-empty production-empty"><span>${icon('edit')}</span><small>XƯỞNG ĐANG CHỜ Ý TƯỞNG</small><h3>Chưa có bản thiết kế</h3><p>Tạo và duyệt mẫu thử đầu tiên để mở dây chuyền sản xuất.</p><button data-action="atelier-section" data-id="design">Đến phòng thiết kế ${icon('arrow')}</button></div>`}
        </section>
        <aside class="tailoring-queue production-queue-panel"><header><div><small>CHUYỀN MAY</small><h3>Đang sản xuất</h3></div><b>${s.tailoringJobs.length}</b></header>${s.tailoringJobs.length ? `<div class="production-job-list">${s.tailoringJobs.map((job, index) => { const product = s.customProducts.find(item => item.id === job.productId); const remainingDays = Math.max(0, job.readyDay - s.day); return `<article class="production-job"><span class="production-job-index">${String(index + 1).padStart(2, '0')}</span><div class="production-job-art">${product ? productImage(product) : icon('hanger')}</div><div class="production-job-copy"><small>ĐƠN MAY · ×${job.quantity}</small><strong>${escapeHtml(product?.name ?? 'Thiết kế')}</strong><p>${icon('clock')} ${remainingDays ? `Còn ${remainingDays} ngày` : 'Hoàn thành hôm nay'}</p><div class="production-job-progress"><i style="width:${Math.max(12, 100 - remainingDays * 22)}%"></i></div><em>${gameDate(job.readyDay)}</em></div></article>`; }).join('')}</div>` : `<div class="production-queue-empty"><span>${icon('hanger')}</span><h4>Chuyền may đang trống</h4><p>Chọn một bản thiết kế và số lượng để bắt đầu đơn sản xuất mới.</p></div>`}</aside>
      </div>`}
    ${atelierOwned && section === 'design' ? `<button class="craft-history-backdrop ${historyOpen ? 'is-open' : ''}" data-action="atelier-history-close" aria-label="Đóng lịch sử craft"></button><aside class="craft-history-drawer ${historyOpen ? 'is-open' : ''}" aria-hidden="${historyOpen ? 'false' : 'true'}"><header><div><small>ATELIER ARCHIVE</small><h2>Lịch sử craft</h2><p>${craftHistory.length} lần thử đã được ghi lại</p></div><button data-action="atelier-history-close" aria-label="Đóng">${icon('close')}</button></header>${craftHistory.length ? `<div class="craft-history-list">${craftHistory.map((entry, index) => { const recipe = entry.recipeId ? atelierRecipes.find(item => item.id === entry.recipeId) : undefined; return `<article class="${entry.success ? 'is-success' : 'is-failed'}"><span class="craft-history-number">${String(craftHistory.length - index).padStart(2, '0')}</span><div class="craft-history-art">${entry.success && recipe ? recipeIllustration(recipe) : `<span class="craft-failed-art">${icon('close')}</span>`}</div><div class="craft-history-copy"><small>${entry.style}${recipe ? ` · ${recipe.category}` : ''} · ${gameDate(entry.day)}</small><h3>${recipe ? escapeHtml(recipe.name) : 'Công thức chưa thành công'}</h3><div class="recipe-materials">${materialFormula(entry.materials)}</div><p>${icon(entry.success ? 'check' : 'close')} ${entry.success ? 'Craft thành công' : 'Craft thất bại · đã mất nguyên liệu'}</p></div></article>`; }).join('')}</div>` : `<div class="craft-history-empty"><span>${icon('edit')}</span><h3>Cuốn sổ còn trống</h3><p>Mọi lần craft thành công hoặc thất bại sẽ được ghi lại tại đây.</p></div>`}<footer><span>${icon('info')} Lưu tối đa 50 lần craft gần nhất.</span></footer></aside>` : ''}
  </section>`;
}

export function atelierSampleModal(s: GameState, failed = false) {
  const product = s.atelierDraft;
  if (failed || !product) return `<div class="atelier-result-modal is-failed"><button class="atelier-result-close" data-action="close-modal">${icon('close')}</button><span class="atelier-result-symbol">×</span><small>THỬ NGHIỆM THẤT BẠI</small><h2>Công thức chưa tạo thành sản phẩm</h2><p>Các chất liệu đã được cắt và không thể hoàn lại. Hãy đối chiếu phong cách cùng định lượng trong sổ công thức rồi thử lại.</p><button class="btn btn-primary" data-action="close-modal">Quay lại bàn thiết kế</button></div>`;
  const recipe = atelierRecipes.find(item => item.id === product.recipeId)!;
  return `<div class="atelier-result-modal"><button class="atelier-result-close" data-action="close-modal">${icon('close')}</button><div class="atelier-result-art">${productImage(product)}<i>01</i></div><small>MẪU THỬ HOÀN THÀNH</small><h2>${escapeHtml(product.name)}</h2><p>${product.style} · Chất lượng ${product.quality}/100 · Giá đề xuất ${money(product.sellPrice)}</p><div class="recipe-materials">${materialFormula(recipe.materials)}</div><div class="atelier-result-actions"><button class="btn btn-secondary" data-action="atelier-discard-sample">${icon('close')} Xoá mẫu</button><button class="btn btn-primary" data-action="atelier-accept-sample">${icon('check')} Thêm mẫu vào kho</button></div></div>`;
}

const designerPalette = ['#4a2d5a', '#d4429a', '#f177ad', '#ffcf63', '#52b7a5', '#68a6df', '#9373d8', '#ffffff'];

export interface AtelierCustomizerState {
  baseColor: string;
  strokes: ProductDesignStroke[];
  motif: ProductDesignMotif;
  accentColor: string;
  motifScale: number;
  motifX: number;
  motifY: number;
  formWidth: number;
  formLength: number;
  motifRotation: number;
  motifOpacity: number;
  motifRepeat: 1 | 3 | 5;
  shapePoints: ProductDesignStroke['points'];
  selectedNode: number;
  shapeSmooth: boolean;
  strokeColor: string;
  strokeWidth: number;
  stickers: ProductDesignSticker[];
  selectedStickerId: string;
}

const motifOptions: Array<{ id: ProductDesignMotif; label: string; preview: string }> = [
  { id: 'none', label: 'Trơn', preview: '—' },
  { id: 'heart', label: 'Trái tim', preview: '♥' },
  { id: 'star', label: 'Ngôi sao', preview: '★' },
  { id: 'bow', label: 'Nơ', preview: '⋈' },
  { id: 'flower', label: 'Hoa', preview: '✿' },
  { id: 'stripes', label: 'Kẻ chéo', preview: '╱╱' },
];

const designDetailGroups = [
  { label: 'Cổ áo', items: [['round-collar', '◡', 'Cổ tròn'], ['vest-collar', 'W', 'Cổ vest'], ['polo-collar', 'Y', 'Cổ polo']] },
  { label: 'Chi tiết may', items: [['pleats', '▥', 'Xếp ly'], ['buttons', '•••', 'Hàng cúc'], ['pocket', '▱', 'Túi'], ['zipper', '↕', 'Khóa kéo'], ['belt', '▭', 'Thắt lưng'], ['seam', '⌁', 'Đường may'], ['cuffs', '][', 'Bo tay']] },
  { label: 'Sticker', items: [['heart', '♥', 'Trái tim'], ['star', '★', 'Ngôi sao'], ['bow', '⋈', 'Nơ'], ['flower', '✿', 'Hoa']] },
] as const;

export function atelierCustomizeModal(product: CustomProduct, design: AtelierCustomizerState) {
  const preview = productSvg({
    ...product,
    designColor: design.baseColor,
    designStrokes: [],
    designMotif: 'none',
    designAccentColor: design.accentColor,
    designMotifScale: design.motifScale,
    designMotifX: design.motifX,
    designMotifY: design.motifY,
    designFormWidth: 1,
    designFormLength: 1,
    designMotifRotation: design.motifRotation,
    designMotifOpacity: design.motifOpacity,
    designMotifRepeat: design.motifRepeat,
    designShapePoints: design.shapePoints,
    designShapeSmooth: design.shapeSmooth,
    designStrokeColor: design.strokeColor,
    designStrokeWidth: design.strokeWidth,
    designStickers: design.stickers,
  });
  const selectedSticker = design.stickers.find(sticker => sticker.id === design.selectedStickerId);
  const nodeOverlay = selectedSticker ? '' : `<g class="customizer-node-overlay"><polygon points="${design.shapePoints.map(point => `${point.x},${point.y}`).join(' ')}"/><g>${design.shapePoints.map((point, index) => `<circle data-shape-node="${index}" class="${design.selectedNode === index ? 'active' : ''}" cx="${point.x}" cy="${point.y}" r="${design.selectedNode === index ? 4.2 : 3.2}"/>`).join('')}</g></g>`;
  const stickerSelection = selectedSticker ? `<g class="customizer-sticker-selection" transform="translate(${selectedSticker.x} ${selectedSticker.y}) rotate(${selectedSticker.rotation}) scale(${selectedSticker.scale})"><rect data-sticker-move="${selectedSticker.id}" x="-20" y="-20" width="40" height="40" rx="3"/><circle data-sticker-resize="${selectedSticker.id}" cx="20" cy="20" r="5"/><path d="M15 20h10M20 15v10"/></g>` : '';
  const editablePreview = preview.replace('</svg>', `${nodeOverlay}${stickerSelection}</svg>`);
  const stickerCanvasTools = selectedSticker ? `<div class="customizer-canvas-toolbar"><label title="Màu chi tiết"><span>Màu</span><input id="customizer-sticker-color" type="color" value="${selectedSticker.color}" aria-label="Màu chi tiết đang chọn" /></label><button data-action="atelier-sticker-rotate" data-id="-15" aria-label="Xoay trái 15 độ">↶ <span>Xoay trái</span></button><button data-action="atelier-sticker-rotate" data-id="15" aria-label="Xoay phải 15 độ"><span>Xoay phải</span> ↷</button><button data-action="atelier-sticker-duplicate">${icon('plus')} <span>Nhân bản</span></button><button class="is-danger" data-action="atelier-sticker-delete">${icon('trash')} <span>Xóa</span></button></div>` : '';
  return `<section class="atelier-customizer-modal">
    <header class="customizer-header"><div><small>VECTOR DESIGN LAB</small><h2>Studio dựng phom</h2><p>Kéo điểm neo để bẻ đường nét và tạo silhouette riêng cho sản phẩm.</p></div><button class="customizer-close" data-action="close-modal" aria-label="Đóng Studio chỉnh mẫu">${icon('close')}</button></header>
    <div class="customizer-workspace">
      <section class="customizer-canvas-panel">
        <div class="customizer-canvas-heading"><span><b>01</b><strong>Biên dạng sản phẩm</strong></span><em>${design.shapePoints.length} điểm neo</em></div>
        <div class="customizer-canvas customizer-preview customizer-shape-canvas" data-shape-canvas>${editablePreview}</div>
        ${stickerCanvasTools}
        <p class="customizer-canvas-hint">Chạm một điểm rồi kéo để thay đổi đường viền · các đường nối là khung dựng phom.</p>
      </section>
      <aside class="customizer-controls">
        <label class="customizer-name-field"><span>TÊN THIẾT KẾ</span><input id="customizer-product-name" maxlength="32" value="${escapeHtml(product.name)}" /></label>
        <nav class="customizer-mobile-nav" aria-label="Chuyển nhanh công cụ"><button data-action="atelier-customizer-jump" data-id="shape">Phom</button><button data-action="atelier-customizer-jump" data-id="color">Màu</button><button data-action="atelier-customizer-jump" data-id="line">Nét</button><button data-action="atelier-customizer-jump" data-id="details">Chi tiết</button></nav>
        <div class="customizer-control-block customizer-vector-tools ${selectedSticker ? 'is-hidden-for-sticker' : ''}" data-customizer-section="shape"><header><span><b>02</b><strong>Công cụ điểm neo</strong></span><em>${design.selectedNode >= 0 ? `Điểm ${design.selectedNode + 1}` : 'Chưa chọn điểm'}</em></header><div class="customizer-node-actions"><button data-action="atelier-shape-add">${icon('plus')} Thêm điểm</button><button data-action="atelier-shape-delete" ${design.selectedNode < 0 || design.shapePoints.length <= 6 ? 'disabled' : ''}>${icon('trash')} Xóa điểm</button><button data-action="atelier-shape-mirror">${icon('move')} Đối xứng</button><button data-action="atelier-shape-reset">${icon('rotate')} Phom gốc</button></div><div class="customizer-node-nudge" aria-label="Tinh chỉnh điểm neo"><button data-action="atelier-shape-nudge" data-id="-1,0" ${design.selectedNode < 0 ? 'disabled' : ''}>←</button><button data-action="atelier-shape-nudge" data-id="0,-1" ${design.selectedNode < 0 ? 'disabled' : ''}>↑</button><button data-action="atelier-shape-nudge" data-id="0,1" ${design.selectedNode < 0 ? 'disabled' : ''}>↓</button><button data-action="atelier-shape-nudge" data-id="1,0" ${design.selectedNode < 0 ? 'disabled' : ''}>→</button></div></div>
        <div class="customizer-control-block" data-customizer-section="color"><header><span><b>03</b><strong>Màu vải</strong></span><input id="customizer-base-color" type="color" value="${design.baseColor}" aria-label="Màu nền vải" /></header><div class="customizer-fabric-swatches">${designerPalette.slice(1, 7).map(color => `<button data-action="atelier-customize-base" data-id="${color}" style="--swatch:${color}" class="${color.toLowerCase() === design.baseColor.toLowerCase() ? 'active' : ''}" aria-label="Chọn màu nền ${color}"></button>`).join('')}</div></div>
        <div class="customizer-control-block customizer-line-tools" data-customizer-section="line"><header><span><b>04</b><strong>Đường nét</strong></span><input id="customizer-stroke-color" type="color" value="${design.strokeColor}" aria-label="Màu đường viền" /></header><div class="customizer-line-options"><div>${[[1, 'Mảnh'], [2, 'Vừa'], [3.2, 'Đậm']].map(([width, label]) => `<button data-action="atelier-shape-stroke" data-id="${width}" class="${design.strokeWidth === width ? 'active' : ''}"><i style="--line:${width}px"></i>${label}</button>`).join('')}</div><div><button data-action="atelier-shape-smooth" data-id="smooth" class="${design.shapeSmooth ? 'active' : ''}">Bo cong</button><button data-action="atelier-shape-smooth" data-id="sharp" class="${!design.shapeSmooth ? 'active' : ''}">Góc cạnh</button></div></div></div>
        <div class="customizer-control-block customizer-sticker-tools" data-customizer-section="details"><header><span><b>05</b><strong>Chi tiết & Sticker</strong></span><em>${design.stickers.length}/24 lớp</em></header><div class="customizer-detail-library">${designDetailGroups.map(group => `<section><small>${group.label}</small><div class="customizer-sticker-library">${group.items.map(([kind, symbol, label]) => `<button data-action="atelier-sticker-add" data-id="${kind}"><i>${symbol}</i><span>${label}</span></button>`).join('')}</div></section>`).join('')}</div><p class="customizer-sticker-empty">${selectedSticker ? 'Đang chọn một chi tiết · công cụ chỉnh sửa nằm dưới khung sản phẩm bên trái.' : 'Thêm hoặc chạm vào chi tiết trên sản phẩm để chỉnh sửa.'}</p></div>
        <div class="customizer-edit-actions"><button data-action="atelier-customize-undo" ${design.strokes.length ? '' : 'disabled'}>${icon('arrow')} Hoàn tác cũ</button><button data-action="atelier-shape-reset">${icon('rotate')} Khôi phục phom</button></div>
      </aside>
    </div>
    <footer class="customizer-footer"><span>${icon('info')} Phom vector đã lưu sẽ được dùng cho ảnh sản phẩm ở mọi màn hình.</span><div><button data-action="close-modal">Hủy</button><button class="customizer-save" data-action="atelier-customize-save">${icon('check')} Lưu phom thiết kế</button></div></footer>
  </section>`;
}
