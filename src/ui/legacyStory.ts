import type { GameState } from '../types';
import { icon } from './icons';
import { escapeHtml, money } from './format';

const restorationSteps = [
  { title: 'Dọn căn phòng', cost: 2000000, reward: 'Mở cuốn nhật ký và bản đồ bị xé' },
  { title: 'Sửa tấm gương', cost: 5000000, reward: 'Đánh thức tấm gương biết nói' },
  { title: 'Khôi phục tủ đồ', cost: 8000000, reward: 'Mở cánh cửa đầu tiên' },
  { title: 'Sửa cầu thang', cost: 15000000, reward: 'Mở tầng trên của boutique' },
  { title: 'Khôi phục nhà ga', cost: 30000000, reward: 'Gọi chuyến tàu lúc 00:00' },
];

export function legacyPrologueModal(s: GameState) {
  const story = s.legacyStory;
  if (story.stage === 'arrival') return `<section class="legacy-story-modal legacy-prologue">
    <div class="legacy-midnight"><span>00:00</span><i></i></div>
    <header><small>SAU GIỜ ĐÓNG CỬA</small><h2>Chuông cửa vừa vang lên.</h2><p>Đèn trong ${escapeHtml(s.shopName)} chớp tắt. Một cô gái lạ đứng trước phòng thử đồ, mặc chiếc váy giống thiết kế của bạn nhưng đã cũ hàng chục năm.</p></header>
    <blockquote>“Cuối cùng cũng có người đưa boutique trở lại như trước.”</blockquote>
    <div class="legacy-stranger"><span>${icon('sparkle')}</span><div><small>VỊ KHÁCH KHÔNG TÊN</small><strong>Cô ấy đang nhìn về phía phòng thử đồ.</strong></div></div>
    <nav class="legacy-dialogue-choices" aria-label="Chọn câu trả lời">
      <button data-action="legacy-choice" data-id="curious"><span>01</span><div><strong>“Bạn là ai?”</strong><small>Chủ động hỏi về cô gái.</small></div>${icon('arrow')}</button>
      <button data-action="legacy-choice" data-id="dress"><span>02</span><div><strong>“Chiếc váy đó từ đâu?”</strong><small>Tập trung vào dấu vết kỳ lạ.</small></div>${icon('arrow')}</button>
      <button data-action="legacy-choice" data-id="observe"><span>03</span><div><strong>Im lặng quan sát</strong><small>Không để cô ấy biết bạn đang nghĩ gì.</small></div>${icon('arrow')}</button>
    </nav>
  </section>`;

  return `<section class="legacy-story-modal legacy-evidence">
    <div class="legacy-evidence-art"><span>${icon('shop')}</span><i></i><b>27 năm trước</b></div>
    <div class="legacy-evidence-copy"><small>MẢNH KÝ ỨC 01</small><h2>Cô gái đã biến mất.</h2><p>Khi tấm rèm được kéo ra, phòng thử đồ hoàn toàn trống. Trên sàn chỉ còn một chiếc chìa khóa bạc, một hóa đơn cũ và bức ảnh của chính boutique này.</p><blockquote>Trong bức ảnh có một cánh cửa phía sau phòng thử đồ—cánh cửa chưa từng tồn tại trong shop của bạn.</blockquote><div class="legacy-clues"><span>${icon('check')} Chìa khóa bạc</span><span>${icon('check')} Hóa đơn cũ</span><span>${icon('check')} Bức ảnh năm xưa</span></div></div>
    <footer><p>${icon('clock')} Nhiệm vụ mới: Tìm cánh cửa trong bức ảnh</p><button data-action="legacy-continue">Giữ lại các manh mối ${icon('arrow')}</button></footer>
  </section>`;
}

export function legacyRoomModal(s: GameState) {
  const story = s.legacyStory;
  if (story.stage === 'room-search') return `<section class="legacy-story-modal legacy-room-search">
    <header><span>${icon('sparkle')}</span><div><small>NHẬT KÝ BÍ MẬT</small><h2>Cánh cửa sau phòng thử đồ</h2></div><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></header>
    <div class="legacy-photo"><div><span>${icon('shop')}</span><i></i></div><b>Ảnh chụp 27 năm trước</b></div>
    <div class="legacy-search-copy"><small>NHIỆM VỤ HIỆN TẠI</small><h3>Đối chiếu bức ảnh với boutique</h3><p>Mép tường phía sau phòng thử đồ có một đường nối rất mảnh. Lớp giấy dán tường dường như mới hơn phần còn lại.</p><button data-action="legacy-find-room">Lật lớp giấy dán tường ${icon('arrow')}</button></div>
  </section>`;

  const level = story.restorationLevel;
  const next = restorationSteps[level];
  const progress = Math.round(level / restorationSteps.length * 100);
  return `<section class="legacy-story-modal legacy-room-hub">
    <header><span>${icon(level >= 2 ? 'sparkle' : 'lock')}</span><div><small>PHÍA SAU PHÒNG THỬ ĐỒ</small><h2>Căn phòng bị lãng quên</h2></div><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></header>
    <div class="legacy-room-scene level-${level}"><div class="legacy-mirror"><i></i></div><div class="legacy-wardrobe"><i></i><i></i></div><div class="legacy-stairs"></div><span>${level ? `${progress}% đã khôi phục` : 'Bụi phủ kín mọi thứ'}</span></div>
    <div class="legacy-room-progress"><div><small>TIẾN ĐỘ KHÔI PHỤC</small><strong>${level}/${restorationSteps.length} hạng mục</strong></div><i><b style="width:${progress}%"></b></i></div>
    <ol class="legacy-restoration-list">${restorationSteps.map((step, index) => `<li class="${index < level ? 'is-complete' : index === level ? 'is-current' : ''}"><span>${index < level ? icon('check') : String(index + 1).padStart(2, '0')}</span><div><strong>${step.title}</strong><small>${step.reward}</small></div><b>${money(step.cost)}</b></li>`).join('')}</ol>
    <footer>${next ? `<div><small>BƯỚC TIẾP THEO</small><strong>${next.title}</strong><span>${money(next.cost)}</span></div><button data-action="legacy-restore" ${s.phase === 'open' || s.money < next.cost ? 'disabled' : ''}>${icon('coin')} Khôi phục</button>` : `<div><small>CHƯƠNG 1 HOÀN THÀNH</small><strong>Chuyến tàu đang chờ lúc 00:00</strong><span>Một hành trình mới sắp mở ra</span></div><button disabled>${icon('check')} Đã hoàn tất</button>`}</footer>
  </section>`;
}
