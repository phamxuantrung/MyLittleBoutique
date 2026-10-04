import { customers, products } from '../data/catalog';
import type { GameState } from '../types';
import { avatarImage, escapeHtml, money } from './format';
import { icon } from './icons';
import { gameDate } from '../systems/calendar';
import { RETURN_EXCHANGE_SHIPPING_FEE } from '../systems/operations';

const categoryLabels: Record<string, string> = { tops: 'Áo', bottoms: 'Quần & chân váy', dresses: 'Đầm', sets: 'Set phối', outerwear: 'Áo khoác', shoes: 'Giày', bags: 'Túi', accessories: 'Phụ kiện' };
const locked = (level: number, text: string) => `<div class="operations-locked">${icon('lock')}<span>Mở ở cấp ${level}</span><small>${text}</small></div>`;

const careCustomerAvatar = (name: string) => {
  const exactCustomer = customers.find(customer => customer.name.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'));
  const seed = [...name].reduce((total, character) => total + character.codePointAt(0)!, 0);
  const appearance = exactCustomer ?? customers[seed % customers.length];
  return avatarImage({ ...appearance, id: appearance.id, name });
};

export function customerCareModal(s: GameState) {
  const activeClaims = s.returnCases.filter(item => item.availableDay <= s.day);
  const returnsHtml = s.level < 3 ? locked(3, 'Khách có thể yêu cầu đổi trả sau khi mua.') : activeClaims.length ? activeClaims.map(claim => {
    const product = products.find(item => item.id === claim.productId);
    return `<article class="case-row return-case-row">
      <span class="case-customer-mark">${careCustomerAvatar(claim.customerName)}</span>
      <div class="return-case-info">
        <div class="return-case-title"><strong>${escapeHtml(claim.customerName)}</strong><span>${escapeHtml(product?.name ?? 'Sản phẩm')}</span></div>
        <p>${escapeHtml(claim.reason)}</p>
        <small>${icon('clock')} Còn ${Math.max(0, claim.deadlineDay - s.day)} ngày để xử lý</small>
      </div>
      <div class="return-case-actions">
        <button class="return-action is-exchange" data-action="return-resolve" data-id="${claim.id}" data-value="exchange"><span><strong>Đổi món</strong><small>Phí ship ${money(RETURN_EXCHANGE_SHIPPING_FEE)}</small></span></button>
        <button class="return-action is-refund" data-action="return-resolve" data-id="${claim.id}" data-value="refund"><span><strong>Hoàn tiền</strong><small>${money(claim.amount)}</small></span></button>
        <button class="return-action is-deny danger-link" data-action="return-resolve" data-id="${claim.id}" data-value="deny"><span><strong>Từ chối</strong><small>Giảm uy tín</small></span></button>
      </div>
    </article>`;
  }).join('') : `<p class="operations-empty">${s.returnCases.length ? `${s.returnCases.length} yêu cầu sẽ xuất hiện vào ngày tới.` : 'Hiện không có yêu cầu đổi trả.'}</p>`;

  const vipHtml = s.level < 4 ? locked(4, 'Chuẩn bị đúng gu, phân loại và ngân sách cho đơn đặt trước.') : s.vipAppointments.length ? s.vipAppointments.map(appointment => `<article class="case-row vip-row">
    <span class="case-customer-mark is-vip">${careCustomerAvatar(appointment.customerName)}</span>
    <div class="vip-customer-info"><strong>${escapeHtml(appointment.customerName)}</strong><div class="vip-meta"><span>${appointment.style}</span><span>${categoryLabels[appointment.category]}</span><span>${appointment.minItems} món</span></div><small>Ngân sách <b>${money(appointment.budget)}</b> · thưởng <b>${money(appointment.reward)}</b></small></div>
    <div class="vip-row-actions">${appointment.status === 'offered' ? `<button class="primary-small" data-action="vip-accept" data-id="${appointment.id}">Nhận đơn</button><button class="danger-link" data-action="vip-decline" data-id="${appointment.id}">Từ chối</button>` : appointment.scheduledDay <= s.day ? '<b class="status-wait is-ready">Sẽ tới lấy khi mở cửa</b>' : `<b class="status-wait">Đã đặt trước · ${gameDate(appointment.scheduledDay)}</b>`}</div>
  </article>`).join('') : '<p class="operations-empty">Chưa có đơn đặt trước VIP. Lời mời mới thường xuất hiện mỗi 3 ngày.</p>';

  return `<section class="customer-care-modal"><header class="app-modal-header operations-heading"><span class="app-header-chip">${icon('hudCare')} CARE</span><div><small>CUSTOMER CARE</small><h2>Chăm sóc khách hàng</h2></div><button class="staff-modal-close" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></header>
    <div class="operations-grid customer-care-grid">
      <section class="operations-section is-returns"><header><span>${icon('rotate')}</span><div><h3>Đổi trả & khiếu nại</h3><small>Xử lý đúng hạn để bảo vệ uy tín của shop.</small></div><b class="operations-count">${activeClaims.length}</b></header><div class="operations-list">${returnsHtml}</div></section>
      <section class="operations-section is-vip"><header><span>${icon('star')}</span><div><h3>Đơn đặt trước VIP</h3><small>Chuẩn bị đúng gu trước ngày khách tới lấy.</small></div><b class="operations-count">${s.vipAppointments.length}</b></header><div class="operations-list">${vipHtml}</div></section>
    </div></section>`;
}
