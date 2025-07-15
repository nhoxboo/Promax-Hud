

---

# ProMax - HUD

web để cấu hình và tùy biến các thiết bị Heads-Up Display (HUD) ProMax. Giao diện cho phép người dùng kết nối trực tiếp với thiết bị qua Bluetooth Low Energy (BLE) để thay đổi cài đặt một cách dễ dàng.

## Tính năng chính

- **Giao diện hiện đại:** Giao diện được thiết kế lại, trực quan và dễ sử dụng trên cả máy tính và điện thoại.
- **Tùy biến hiển thị:** Thay đổi các thông số của màn hình như xoay màn hình, giao diện, độ sáng và các dòng chữ hiển thị.
- **Cấu hình cảnh báo:** Điều chỉnh màu sắc, độ sáng của LED cảnh báo và các tùy chọn âm thanh.
- **Tải ảnh khởi động:** Upload ảnh JPG (240x240) để làm màn hình khởi động cho thiết bị.
- **Kết nối OBD:** Hỗ trợ kết nối với đầu đọc OBD-II để lấy dữ liệu từ xe hơi.
- **Tải cấu hình hiện tại:** Dễ dàng đọc và hiển thị các cài đặt đang có trên thiết bị để kiểm tra hoặc chỉnh sửa.
- **Thông báo cập nhật:** Tự động kiểm tra và thông báo cho người dùng khi có phiên bản firmware mới.

## Hướng dẫn sử dụng

1.  **Mở trang cấu hình:**
    * Để cấu hình thiết bị **ProMax**, hãy mở tệp `index.html`.

2.  **Kết nối thiết bị:**
    * Nhấn vào nút **"Kết nối"** và chọn thiết bị của bạn từ danh sách Bluetooth hiện ra. Trình duyệt được khuyến nghị là Google Chrome trên máy tính hoặc điện thoại Android.

3.  **Thay đổi cài đặt:**
    * Sau khi kết nối thành công, các cài đặt hiện tại của thiết bị sẽ được tự động tải lên và hiển thị trên trang.
    * Bạn có thể thay đổi các giá trị trong các ô hoặc kéo thanh trượt.

4.  **Lưu thay đổi:**
    * Nhấn nút **"Gửi thay đổi"** để lưu các cài đặt mới vào thiết bị. Một thông báo thành công sẽ hiện ra.

## Cập nhật Firmware

Để cập nhật firmware cho thiết bị, hãy sử dụng trang `flash.html`.

1.  Mở tệp `flash.html` bằng trình duyệt Chrome.
2.  Cắm thiết bị vào máy tính qua cáp USB có khả năng truyền dữ liệu.
3.  Làm theo các hướng dẫn trên trang để chọn loại HUD và tiến hành nạp.
4.  Nếu máy tính không nhận diện thiết bị, bạn có thể cần cài đặt driver từ các liên kết được cung cấp trên trang.

## Cấu trúc dự án

-   `index.html`: Trang cấu hình cho ProMax.
-   `baodiem.html`: Trang cấu hình cho BaoDiem.
-   `flash.html`: Trang dùng để nạp firmware cho thiết bị.
-   `style.css`: Tệp CSS định dạng giao diện chung cho tất cả các trang.
-   `promax.js`: Tệp JavaScript chứa logic xử lý cho trang ProMax.
-   `baodiem.js`: Tệp JavaScript chứa logic xử lý cho trang BaoDiem.
-   `manifest_has_bl.json` / `manifest_no_bl.json`: Các tệp khai báo phiên bản firmware.
