// =========================================================================
// GOOGLE APPS SCRIPT - TỰ ĐỘNG NHẬN ĐƠN HÀNG TỪ WEBSITE MỘC MIÊN BOOKS
// Hướng dẫn:
// 1. Mở file Google Sheet của bạn -> Chọn menu: Tiện ích mở rộng (Extensions) -> Apps Script
// 2. Xóa toàn bộ code mặc định và dán toàn bộ đoạn code này vào -> Bấm Lưu (Ctrl + S)
// 3. Bấm nút "Triển khai" (Deploy) ở góc phải trên -> Chọn "Triển khai mới" (New deployment)
// 4. Chọn loại: "Ứng dụng web" (Web app)
//    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
//    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
// 5. Bấm "Triển khai" (Deploy) -> Cấp quyền truy cập -> Copy đường link "URL ứng dụng web" (có đuôi /exec)
// 6. Dán đường link đó vào biến `googleSheetWebAppUrl` trong file `assets/js/data.js`
// =========================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Xử lý nếu là form Gửi lời nhắn liên hệ
    if (data.action === "contact_message") {
      var contactSheet = ss.getSheetByName("Lien_He");
      if (!contactSheet) {
        contactSheet = ss.insertSheet("Lien_He");
        var contactHeaders = ["Thời Gian", "Họ và Tên", "Số Điện Thoại", "Chủ Đề / Sách Cần Tìm", "Nội Dung Lời Nhắn"];
        contactSheet.appendRow(contactHeaders);
        contactSheet.getRange(1, 1, 1, contactHeaders.length)
          .setFontWeight("bold")
          .setBackground("#1d4ed8")
          .setFontColor("#ffffff");
        contactSheet.setFrozenRows(1);
      }
      contactSheet.appendRow([
        data.created_at || new Date().toLocaleString("vi-VN"),
        data.customer_name || "",
        "'" + (data.phone || ""),
        data.subject || "",
        data.message || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "contact" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Xử lý Đơn hàng (Tạo mới hoặc Cập nhật trạng thái thanh toán)
    var sheet = ss.getSheets()[0]; // Mặc định ghi vào trang tính đầu tiên

    // Tự động tạo dòng tiêu đề nếu trang tính đang trống
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Mã Đơn Hàng",
        "Thời Gian Đặt",
        "Họ và Tên Khách",
        "Số Điện Thoại",
        "Email",
        "Địa Chỉ Giao Hàng",
        "Sản Phẩm Đặt Mua",
        "Tổng Tiền (VND)",
        "Phương Thức TT",
        "Trạng Thái Thanh Toán",
        "Gói Quà / Bọc Sách",
        "Lời Chúc Thiệp Tay",
        "Nội Dung Chuyển Khoản",
        "Nguồn Đặt Hàng",
        "Link Mã VietQR"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#1d4ed8")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    // Nếu khách bấm "Tôi Đã Quét Mã Thanh Toán VietQR" -> Cập nhật trạng thái đơn hàng đã có
    if (data.action === "update_payment" && data.order_code) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < codes.length; i++) {
          if (String(codes[i][0]).trim() === String(data.order_code).trim()) {
            var targetRow = i + 2;
            var statusCell = sheet.getRange(targetRow, 10);
            statusCell.setValue(data.payment_status || "ĐÃ THANH TOÁN VIETQR");
            statusCell.setBackground("#dcfce7").setFontColor("#166534").setFontWeight("bold");
            return ContentService.createTextOutput(JSON.stringify({ status: "updated", order_code: data.order_code }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      // Không tìm thấy mã đơn -> KHÔNG ghi thêm dòng rỗng
      return ContentService.createTextOutput(JSON.stringify({ status: "not_found", order_code: data.order_code }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ghi dòng đơn hàng mới vào cuối bảng (Thêm dấu ' trước SĐT để không bị mất số 0 ở đầu)
    var newRow = [
      data.order_code || "",
      data.created_at || new Date().toLocaleString("vi-VN"),
      data.customer_name || "",
      "'" + (data.phone || ""),
      data.email || "",
      data.address || "",
      data.items_summary || "",
      Number(data.total_amount || 0),
      data.payment_method || "",
      data.payment_status || "",
      data.gift_wrap || "",
      data.gift_message || "",
      data.transfer_content || "",
      data.source || "Website Trang Chủ",
      data.vietqr_url || ""
    ];

    sheet.appendRow(newRow);

    // Định dạng cột Tổng Tiền (cột 8) thành dạng số có dấu phân cách
    var insertedRow = sheet.getLastRow();
    sheet.getRange(insertedRow, 8).setNumberFormat("#,##0");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", order_code: data.order_code }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

