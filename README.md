# My Little Boutique · Fashion Shop

Game quản lý cửa hàng thời trang 2D bằng **Phaser 3 + TypeScript + Vite**, giao diện tiếng Việt, ưu tiên điện thoại. Đây là bản MVP chơi được, xây theo tài liệu Fashion Shop trong workspace.

## Chạy game

Yêu cầu Node.js 22.12+ hoặc 24+.

```sh
npm install
npm run dev
```

Mở URL Vite hiển thị, mặc định **http://127.0.0.1:5173**.

```sh
npm run build        # Kiểm tra TypeScript và xuất bản production vào dist/
npm run preview      # Chơi thử bản production
npm run test         # Kiểm thử luật chơi, kinh tế, lưu trữ
npm run test:e2e     # Kiểm thử Chrome, cần Google Chrome đã cài
```

Để chơi từ điện thoại cùng mạng Wi-Fi, chạy `npm run dev -- --host 0.0.0.0`, rồi mở địa chỉ Network do Vite hiển thị. Máy tính cần cho phép kết nối qua firewall. Khi phát hành, đưa thư mục `dist/` lên dịch vụ static hosting có HTTPS; không cần backend.

## Chơi như thế nào

1. Bắt đầu với **500.000₫ và 8 món đồ khai trương**. Xem xu hướng, nhập thêm hàng và chọn giá bán trong tab **Tủ đồ**.
2. Bấm **Mở cửa** để bắt đầu ngày bán dài **5 phút**. Khách được chọn ngẫu nhiên trong nhóm đã mở khóa, có khoảng nghỉ không có khách giữa các lượt. Không giới hạn ngày theo số khách.
3. Khách cần tư vấn chờ **25–40 giây**. Chạm trực tiếp nhân vật trong shop để vào phòng thử đồ, lọc danh mục và chọn tối đa **5 món khác loại**; set thay áo/quần/đầm, đầm không phối cùng áo/quần. Nhân vật, điểm hợp gu và tổng giá cập nhật khi chọn. Có thể gỡ từng món hoặc bỏ chọn tất cả. Nút **Chốt outfit** chỉ bật khi có đồ và không vượt ngân sách.
4. Khách quyết định mua dựa trên gu, màu sắc, chất lượng, giá và xu hướng. Bán hàng đem lại tiền, XP, đánh giá và người theo dõi.
5. Khách tự chọn đồ tự mua hoặc rời shop sau **8–15 giây**, không mở tư vấn. Ngày chỉ tổng kết khi hết giờ hoặc bấm **Đóng cửa sớm**. Sau đó nhận thưởng nhiệm vụ đã hoàn thành và chuyển sang ngày mới.
6. Tab **Trang trí** cho phép mua, kéo thả theo ô, xoay và bán nội thất. Có thể chọn món trong danh sách và dùng nút hướng hoặc phím mũi tên thay cho kéo thả.
7. Đủ tiền và XP, bấm **Nâng cấp boutique** để mở sản phẩm, nội thất và thêm khách.

Đồng hồ bán hàng, thời gian chờ tư vấn và tự mua đều tạm dừng khi xem các tab quản lý, hộp thoại kết quả/cài đặt hoặc khi tab trình duyệt bị ẩn. Khách hiện tại, chế độ mua và khoảng nghỉ được lưu để tiếp tục khi tải lại trang. Nếu hết hàng và không đủ tiền nhập món rẻ nhất, Tủ đồ có gói hỗ trợ miễn phí để tránh kẹt lượt chơi.

## Đã triển khai

- Cửa hàng phối cảnh với artwork SVG tự vẽ, raster hóa thành texture Phaser; không sử dụng thương hiệu hoặc tài sản game khác.
- Nhân vật đi vào/ra, chuyển động chờ, phản ứng, hiệu ứng thưởng và giao diện có animation.
- 16 sản phẩm, 10 phong cách, 8 hồ sơ khách với sở thích và ngân sách riêng, 10 loại nội thất.
- 7 cấp boutique; sản phẩm và nội thất mở dần ở cấp 1–4, lượng khách tăng theo cấp.
- Nhập ×1/×5/×10, lọc danh mục, sắp xếp và 4 mức giá bán.
- Xu hướng và sự kiện luân phiên theo ngày: ưu đãi nhập hàng, mưa, cuối tuần đông khách.
- Trang trí theo lưới 7×7, kiểm tra va chạm, giữ ô phục vụ và lối vào, hoàn 50% giá khi bán nội thất.
- Điểm phù hợp outfit, điều kiện ngân sách, danh tiếng, XP, mục tiêu hằng ngày và tổng kết.
- Feed mô phỏng sinh từ giao dịch thực tế; influencer rất hài lòng tạo bài viral và thêm 132 người theo dõi.
- Âm thanh tổng hợp WebAudio, nhạc nền tùy chọn, chụp cửa hàng thành PNG.
- LocalStorage có phiên bản và kiểm tra dữ liệu; xác nhận trước khi xóa tiến trình.
- Font chữ cục bộ; không gọi dịch vụ bên ngoài trong gameplay.
- Bố cục responsive cho 375×667, 390×844, 393×852, 430×932 và desktop 1280×720.

## Kiến trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `src/main.ts` | Khởi tạo Phaser, store, UI và audio |
| `src/types.ts` | Kiểu dữ liệu và sự kiện game |
| `src/data/catalog.ts` | Sản phẩm, khách, xu hướng, nội thất, sự kiện và cấp độ |
| `src/systems/store.ts` | Các giao dịch và chuyển trạng thái game |
| `src/systems/rules.ts` | Luật phối đồ, tính điểm, giá và vị trí nội thất |
| `src/systems/save.ts` | Lưu trữ, phục hồi và kiểm tra dữ liệu |
| `src/systems/audio.ts` | Nhạc và hiệu ứng âm thanh |
| `src/scenes/ShopScene.ts` | Cảnh Phaser, nhân vật, kéo thả và snapshot |
| `src/art/svg.ts` | Artwork tham số hóa, dùng chung cho scene và UI |
| `src/ui/` | Điều hướng, dialog có quản lý focus và giao diện quản lý |
| `tests/` | Unit test và hành trình chơi trên trình duyệt |

Luật chơi được tách khỏi Phaser để kiểm thử trực tiếp. `GameStore` là nguồn trạng thái duy nhất; scene và giao diện HTML đăng ký nhận sự kiện từ store. Dùng DOM cho bảng hàng hóa và dialog giúp điều hướng bàn phím, cuộn trên điện thoại và kiểm thử ổn định. Renderer Phaser dùng chế độ [FIT](https://docs.phaser.io/phaser/concepts/scale-manager) và một không gian tọa độ cố định cho cửa hàng.

## Phạm vi và bước tiếp theo

Đã hoàn thành milestone nền tảng, vòng chơi chính và phần polish của MVP. Các phần của bản thiết kế đầy đủ chưa triển khai: mở rộng diện tích sàn thật sự, 30+ sản phẩm, nhân viên/marketing, sự kiện theo mùa, chuỗi hướng dẫn 10 phút có kịch bản, atlas asset sản xuất và kiểm chứng hiệu năng trên thiết bị iPhone/Android thật. Các cấp 5–7 hiện là mục tiêu kinh tế dài hạn, chưa có cơ chế độc quyền cho từng cấp.

Save nằm trong trình duyệt, không đồng bộ thiết bị. Xóa dữ liệu website sẽ xóa tiến trình. Chưa triển khai lên URL công khai. Kiểm thử responsive dùng Chrome và viewport mô phỏng; không thay thế kiểm thử Safari trên iPhone thật.
