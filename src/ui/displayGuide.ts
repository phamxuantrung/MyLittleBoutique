import { furniture } from '../data/catalog';
import type { GameState } from '../types';
import { furnitureImage } from './format';
import { icon } from './icons';
import './displayGuide.css';

export const DISPLAY_GUIDE_SEEN = 'guide:day-two-display';

export function needsDisplayGuide(state: GameState) {
  return state.day === 2 && state.phase === 'preparation' && state.hasNamedShop &&
    !state.gameOverReason && !state.claimed.includes(DISPLAY_GUIDE_SEEN);
}

export function displayGuideModal() {
  const examples = [
    ['rack', 'Quần áo → Sào đồ', 'Áo, quần, váy, đầm, set và áo khoác.'],
    ['shoe-shelf', 'Giày → Kệ / tủ giày', 'Chỉ nhận sản phẩm thuộc loại giày.'],
    ['bag-stand', 'Túi → Kệ / tủ túi', 'Túi xách cần thiết bị trưng túi riêng.'],
    ['table', 'Phụ kiện → Bàn phụ kiện', 'Nơ và các món thuộc loại phụ kiện.'],
  ];
  return `<section class="display-guide" aria-labelledby="display-guide-title">
    <header class="display-guide-heading">
      <span class="eyebrow">NGÀY 02 · MẸO CHUẨN BỊ SHOP</span>
      <h2 id="display-guide-title">Có hàng trong kho chưa đủ để bán!</h2>
      <p>Khách tại shop chỉ mua được <strong>những món đang trưng bày</strong>. Hãy đưa hàng lên đúng sào, kệ hoặc tủ trước khi mở cửa.</p>
    </header>
    <div class="display-guide-flow" aria-label="Nhập hàng, trưng đúng loại, rồi mở cửa bán">
      <span>${icon('box')} Nhập vào kho</span>${icon('arrow')}<strong>${icon('hanger')} Trưng đúng loại</strong>${icon('arrow')}<span>${icon('shop')} Mở cửa bán</span>
    </div>
    <ul class="display-guide-types">
      ${examples.map(([id, title, description]) => `<li>${furnitureImage(furniture.find(item => item.id === id)!)}<div><h3>${title}</h3><p>${description}</p></div></li>`).join('')}
    </ul>
    <p class="display-guide-extra">Ma-nơ-canh chỉ trưng <strong>set phối sẵn</strong>. Gương, cây và đồ trang trí không dùng để bày hàng bán.</p>
    <ol class="display-guide-steps">
      <li>Chạm sào, kệ hoặc tủ trong shop → chọn <strong>Mở</strong>.</li>
      <li>Ở mục <strong>Kho hàng</strong>, bấm <strong>+</strong> trên món muốn trưng. Chỉ các món đúng phân loại mới xuất hiện.</li>
      <li>Kiểm tra số món đã trưng rồi mở cửa. Khi bán hết, nhớ lấy thêm hàng từ kho ra bày.</li>
    </ol>
    <footer class="display-guide-actions">
      <button class="btn btn-secondary" data-action="close-modal">Đã hiểu</button>
      <button class="btn btn-primary" data-action="display-guide-start">${icon('hanger')} Trưng đồ ngay</button>
    </footer>
  </section>`;
}
