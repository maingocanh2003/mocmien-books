// =========================================================================
// CƠ SỞ DỮ LIỆU HỆ THỐNG NHÀ SÁCH MỘC MIÊN (MỘC MIÊN BOOKS)
// Đề tài: Thiết kế hệ thống tự động hóa bán hàng và thanh toán VietQR trên di động
// =========================================================================
// MỤC LỤC CƠ SỞ DỮ LIỆU (DATABASE SCHEMA):
// 1. SHOP_DEFAULT_CONFIG  : Cấu hình thông tin cửa hàng, VietQR, Google Sheets & OAuth
// 2. VIETQR_BANKS         : Danh mục ngân hàng hỗ trợ chuẩn chuyển khoản Napas 247
// 3. CATEGORIES           : Danh mục thể loại sách & set quà tặng
// 4. PRODUCTS             : Danh mục sản phẩm sách chi tiết (giá, tác giả, tồn kho...)
// 5. BLOG_POSTS           : Bài viết cẩm nang đọc sách & chính sách bán hàng
// 6. CUSTOMER_FEEDBACKS   : Đánh giá và cảm nhận thực tế từ độc giả
// 7. COUPONS              : Danh sách mã giảm giá và ưu đãi vận chuyển
// =========================================================================

// =========================================================================
// 1. CẤU HÌNH THÔNG TIN CỬA HÀNG & TÍCH HỢP TỰ ĐỘNG HÓA
// =========================================================================
const SHOP_DEFAULT_CONFIG = {
    // Thông tin thương hiệu & Liên hệ
    shopName: "Mộc Miên Books",
    legalName: "CÔNG TY TNHH MTV SÁCH & TRI THỨC MỘC MIÊN",
    slogan: "Mộc Miên – Gửi tri thức và yêu thương qua từng trang sách!",
    hotline: "0869571734",
    zalo: "0869571734",
    email: "mocmienbooks@gmail.com",
    address: "175 P. Tây Sơn, Trung Liệt, Đống Đa, Hà Nội",

    // Đường dẫn mạng xã hội chính thức
    facebookUrl: "https://www.facebook.com/p/M%E1%BB%99c-Mi%C3%AAn-Books-61588543816965/",
    messengerUrl: "https://m.me/61588543816965",
    zaloUrl: "https://zalo.me/0869571734",
    tiktokUrl: "https://www.tiktok.com/@mocmien.books",
    instagramUrl: "https://ig.me/m/mocmien.books",

    // Cấu hình thanh toán VietQR Napas 247 mặc định
    bankId: "MB",
    bankName: "MBBank - Ngân hàng TMCP Quân Đội",
    accountNo: "0869571734",
    accountName: "TIEM SACH MOC MIEN",
    qrTemplate: "compact2",

    // Cấu hình tự động đồng bộ đơn hàng về Google Sheets (Google Apps Script Web App)
    googleSheetWebAppUrl: "https://script.google.com/macros/s/AKfycbwwnmNJvhW77HaXTrzTjiOmWjtzbJNPxrVJkiuMXppd96TgJ-tGpSGB5HsC39ESOsJs/exec",

    // Cấu hình Google OAuth Client ID (Google Identity Services)
    googleClientId: "748763547608-bh20tk4e6uf4fu5m6ukiemtlj7rfckda.apps.googleusercontent.com",

    // Cấu hình Facebook App ID (Dành cho Facebook SDK)
    facebookAppId: "",

    // Tùy chọn mở rộng (Make.com Webhook / Google Form)
    makeWebhookUrl: "",
    googleFormActionUrl: "",
    googleFormEntryOrderId: "entry.111111",
    googleFormEntryCustomer: "entry.222222",
    googleFormEntryPhone: "entry.333333",
    googleFormEntryItems: "entry.444444",
    googleFormEntryTotal: "entry.555555",
    googleFormEntryPayment: "entry.666666",
    autoVerifySeconds: 5
};

// =========================================================================
// 2. DANH MỤC NGÂN HÀNG HỖ TRỢ VIETQR (NAPAS 247)
// =========================================================================
const VIETQR_BANKS = [
    { id: "MB", name: "MBBank - Ngân hàng TMCP Quân Đội", shortName: "MBBank", bin: "970422" },
    { id: "VCB", name: "Vietcombank - Ngân hàng TMCP Ngoại Thương VN", shortName: "Vietcombank", bin: "970436" },
    { id: "TCB", name: "Techcombank - Ngân hàng TMCP Kỹ Thương VN", shortName: "Techcombank", bin: "970407" },
    { id: "BIDV", name: "BIDV - Ngân hàng TMCP Đầu tư & Phát triển VN", shortName: "BIDV", bin: "970418" },
    { id: "ICB", name: "VietinBank - Ngân hàng TMCP Công Thương VN", shortName: "VietinBank", bin: "970415" },
    { id: "ACB", name: "ACB - Ngân hàng TMCP Á Châu", shortName: "ACB", bin: "970416" },
    { id: "VPB", name: "VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng", shortName: "VPBank", bin: "970432" },
    { id: "TPB", name: "TPBank - Ngân hàng TMCP Tiên Phong", shortName: "TPBank", bin: "970423" },
    { id: "VIB", name: "VIB - Ngân hàng TMCP Quốc Tế", shortName: "VIB", bin: "970441" },
    { id: "STB", name: "Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín", shortName: "Sacombank", bin: "970403" },
    { id: "MSB", name: "MSB - Ngân hàng TMCP Hàng Hải Việt Nam", shortName: "MSB", bin: "970426" },
    { id: "SHB", name: "SHB - Ngân hàng TMCP Sài Gòn - Hà Nội", shortName: "SHB", bin: "970443" }
];

// =========================================================================
// 3. DANH MỤC THỂ LOẠI SÁCH & SET QUÀ TẶNG
// =========================================================================
const CATEGORIES = [
    {
        id: "van-hoc",
        name: "Văn Học & Tiểu Thuyết",
        slug: "van-hoc",
        count: 6,
        icon: "fa-feather-pointed",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80",
        desc: "Những tác phẩm văn học kinh điển và tiểu thuyết chạm đến trái tim độc giả"
    },
    {
        id: "kinh-te",
        name: "Kinh Tế & Khởi Nghiệp",
        slug: "kinh-te",
        count: 5,
        icon: "fa-chart-line",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=500&q=80",
        desc: "Tư duy quản trị, tài chính cá nhân, thương mại điện tử và kinh doanh số"
    },
    {
        id: "tam-ly",
        name: "Tâm Lý & Chữa Lành",
        slug: "tam-ly",
        count: 5,
        icon: "fa-heart-pulse",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80",
        desc: "Sách vỗ về tâm hồn, thấu hiểu bản thân và tìm lại sự bình yên giữa bộn bề"
    },
    {
        id: "ky-nang",
        name: "Kỹ Năng & Tự Học",
        slug: "ky-nang",
        count: 4,
        icon: "fa-lightbulb",
        image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=500&q=80",
        desc: "Rèn luyện thói quen nguyên tử, giao tiếp tinh tế và làm chủ thời gian"
    },
    {
        id: "thieu-nhi",
        name: "Sách Thiếu Nhi",
        slug: "thieu-nhi",
        count: 4,
        icon: "fa-child-reaching",
        image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80",
        desc: "Nuôi dưỡng trí tưởng tượng và tâm hồn trong sáng cho bé yêu mỗi ngày"
    },
    {
        id: "set-qua-tang",
        name: "Set Quà Tặng Sách",
        slug: "set-qua-tang",
        count: 6,
        icon: "fa-gift",
        image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=500&q=80",
        desc: "Combo sách kèm nến thơm, bookmark gỗ, hoa khô & thiệp viết tay nghệ thuật"
    }
];

// =========================================================================
// 4. CƠ SỞ DỮ LIỆU SẢN PHẨM SÁCH & SET QUÀ TẶNG CHI TIẾT
// =========================================================================
const PRODUCTS = [
    // --- VĂN HỌC & TIỂU THUYẾT ---
    {
        id: 101,
        code: "MM-VH001",
        title: "Cây Cam Ngọt Của Tôi – Phiên Bản Đặc Biệt Kèm Bookmark",
        slug: "cay-cam-ngot-cua-toi",
        category: "van-hoc",
        categoryName: "Văn Học & Tiểu Thuyết",
        author: "José Mauro de Vasconcelos",
        publisher: "NXB Hội Nhà Văn",
        pages: 244,
        size: "14 x 20.5 cm",
        coverType: "Bìa mềm tay gấp",
        price: 86000,
        oldPrice: 108000,
        discount: 20,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        stock: 65,
        rating: 5.0,
        reviewCount: 48,
        soldCount: 520,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Câu chuyện chạm đến trái tim hàng triệu độc giả về cậu bé Zezé 5 tuổi nhạy cảm, thông minh và ước mơ về sự dịu dàng trong cuộc sống.",
        highlights: [
            "Bản dịch chuẩn mực, giàu cảm xúc, giấy chống lóa bảo vệ mắt",
            "Tặng kèm 01 Bookmark thiết kế riêng của Mộc Miên Books",
            "Bọc màng co cẩn thận, hỗ trợ bọc plastic miễn phí theo yêu cầu",
            "Phù hợp làm quà tặng ý nghĩa cho bạn bè và người thương"
        ]
    },
    {
        id: 102,
        code: "MM-VH002",
        title: "Nhà Giả Kim (Ấn Bản Kỷ Niệm Bìa Nhũ Vàng)",
        slug: "nha-gia-kim",
        category: "van-hoc",
        categoryName: "Văn Học & Tiểu Thuyết",
        author: "Paulo Coelho",
        publisher: "NXB Hội Nhà Văn",
        pages: 228,
        size: "13 x 20.5 cm",
        coverType: "Bìa mềm dập nổi",
        price: 69000,
        oldPrice: 95000,
        discount: 27,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        stock: 80,
        rating: 4.9,
        reviewCount: 64,
        soldCount: 890,
        image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Khi bạn thực sự khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được điều đó. Cuốn sách gối đầu giường của mọi thế hệ trẻ.",
        highlights: [
            "Tác phẩm bán chạy chỉ sau Kinh Thánh với hơn 65 triệu bản toàn cầu",
            "Truyền cảm hứng sống hết mình với ước mơ và vận mệnh cá nhân",
            "Giấy xốp nhẹ cao cấp, mùi thơm giấy mới dễ chịu"
        ]
    },
    {
        id: 103,
        code: "MM-VH003",
        title: "Điều Kỳ Diệu Của Tiệm Tạp Hóa Namiya",
        slug: "dieu-ky-dieu-cua-tiem-tap-hoa-namiya",
        category: "van-hoc",
        categoryName: "Văn Học & Tiểu Thuyết",
        author: "Higashino Keigo",
        publisher: "NXB Hội Nhà Văn",
        pages: 358,
        size: "14.5 x 20.5 cm",
        coverType: "Bìa mềm",
        price: 105000,
        oldPrice: 135000,
        discount: 22,
        isFlashSale: false,
        isFeatured: true,
        isHot: true,
        stock: 42,
        rating: 5.0,
        reviewCount: 39,
        soldCount: 410,
        image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Kiệt tác ấm áp nhất của ông hoàng trinh thám Higashino Keigo về những bức thư xuyên thời gian giải đáp nỗi niềm con người.",
        highlights: [
            "Cốt truyện đan cài thông minh, kết nối quá khứ và hiện tại đầy nhân văn",
            "Món quà tinh thần xoa dịu những trái tim đang đứng trước ngã rẽ cuộc đời"
        ]
    },
    {
        id: 104,
        code: "MM-VH004",
        title: "Nếu Biết Trăm Năm Là Hữu Hạn (Ấn Bản Mới)",
        slug: "neu-biet-tram-nam-la-huu-han",
        category: "van-hoc",
        categoryName: "Văn Học & Tiểu Thuyết",
        author: "Phạm Lữ Ân",
        publisher: "NXB Thế Giới",
        pages: 272,
        size: "14 x 20.5 cm",
        coverType: "Bìa mềm",
        price: 112000,
        oldPrice: 139000,
        discount: 19,
        isFlashSale: false,
        isFeatured: true,
        isHot: false,
        stock: 55,
        rating: 4.9,
        reviewCount: 27,
        soldCount: 315,
        image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Những tản văn sâu lắng như lời thủ thỉ của một người bạn tri kỷ về tuổi trẻ, tình yêu, gia đình và những ước mơ không bao giờ cũ.",
        highlights: [
            "Tặng kèm 02 Postcard minh họa màu nước thơ mộng",
            "Văn phong giàu chất thơ, chạm sâu vào miền ký ức"
        ]
    },

    // --- TÂM LÝ & CHỮA LÀNH ---
    {
        id: 105,
        code: "MM-TL001",
        title: "Hiểu Về Trái Tim – Nghệ Thuật Chữa Lành Nội Tâm",
        slug: "hieu-ve-trai-tim",
        category: "tam-ly",
        categoryName: "Tâm Lý & Chữa Lành",
        author: "Minh Niệm",
        publisher: "NXB Tổng Hợp TP.HCM",
        pages: 480,
        size: "13 x 20.5 cm",
        coverType: "Bìa mềm tay gấp",
        price: 118000,
        oldPrice: 158000,
        discount: 25,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        stock: 90,
        rating: 5.0,
        reviewCount: 92,
        soldCount: 1120,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "50 chương sách như 50 tấm gương soi chiếu mọi cung bậc cảm xúc: khổ đau, hạnh phúc, giận hờn, tha thứ, bình yên...",
        highlights: [
            "Cuốn sách tâm lý - thiền ứng dụng được yêu thích nhất tại Việt Nam",
            "Ngôn từ giản dị, gần gũi, dễ đọc mỗi tối trước khi ngủ"
        ]
    },
    {
        id: 106,
        code: "MM-TL002",
        title: "Những Điều Bạn Chỉ Thấy Khi Chậm Lại",
        slug: "nhung-dieu-ban-chi-thay-khi-cham-lai",
        category: "tam-ly",
        categoryName: "Tâm Lý & Chữa Lành",
        author: "Haemin Sunim",
        publisher: "NXB Thế Giới",
        pages: 280,
        size: "14 x 19 cm",
        coverType: "Bìa mềm in màu toàn bộ",
        price: 99000,
        oldPrice: 135000,
        discount: 27,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        stock: 48,
        rating: 4.9,
        reviewCount: 35,
        soldCount: 460,
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Thế giới có vội vã đến đâu cũng không sao nếu tâm trí bạn bình yên. Ấn bản in màu tuyệt đẹp với tranh minh họa dịu dàng.",
        highlights: [
            "In 4 màu trên giấy Couche Matt cao cấp",
            "Tranh minh họa nghệ thuật mang lại cảm giác thư thái tức thì"
        ]
    },
    {
        id: 107,
        code: "MM-TL003",
        title: "Yêu Những Điều Không Hoàn Hảo",
        slug: "yeu-nhung-dieu-khong-hoan-hao",
        category: "tam-ly",
        categoryName: "Tâm Lý & Chữa Lành",
        author: "Haemin Sunim",
        publisher: "NXB Thế Giới",
        pages: 296,
        size: "14 x 20.5 cm",
        coverType: "Bìa mềm",
        price: 108000,
        oldPrice: 139000,
        discount: 22,
        isFlashSale: false,
        isFeatured: false,
        isHot: true,
        stock: 37,
        rating: 4.8,
        reviewCount: 22,
        soldCount: 280,
        image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Học cách bao dung với chính mình và những vết xước trong tâm hồn để sống trọn vẹn từng khoảnh khắc.",
        highlights: [
            "Lời khuyên ấm áp dành cho người hay tự trách bản thân",
            "Tặng kèm bộ sticker ghi chú trang sách dễ thương"
        ]
    },

    // --- KINH TẾ & KHỞI NGHIỆP ---
    {
        id: 108,
        code: "MM-KT001",
        title: "Tâm Lý Học Về Tiền (The Psychology of Money)",
        slug: "tam-ly-hoc-ve-tien",
        category: "kinh-te",
        categoryName: "Kinh Tế & Khởi Nghiệp",
        author: "Morgan Housel",
        publisher: "NXB Dân Trí",
        pages: 384,
        size: "15.5 x 24 cm",
        coverType: "Bìa mềm",
        price: 145000,
        oldPrice: 189000,
        discount: 23,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        stock: 72,
        rating: 5.0,
        reviewCount: 54,
        soldCount: 680,
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "19 câu chuyện ngắn khám phá những cách kỳ lạ mà con người suy nghĩ về tiền bạc và dạy bạn cách quản lý tài chính thông minh.",
        highlights: [
            "Top 1 sách Tài chính Cá nhân bán chạy nhất trên Amazon & New York Times",
            "Dễ hiểu, thực tế, áp dụng ngay cho sinh viên và người đi làm"
        ]
    },
    {
        id: 109,
        code: "MM-KT002",
        title: "Khởi Nghiệp Tinh Gọn (The Lean Startup)",
        slug: "khoi-nghiep-tinh-gon",
        category: "kinh-te",
        categoryName: "Kinh Tế & Khởi Nghiệp",
        author: "Eric Ries",
        publisher: "NXB Trẻ",
        pages: 368,
        size: "15.5 x 23.5 cm",
        coverType: "Bìa mềm tay gấp",
        price: 159000,
        oldPrice: 210000,
        discount: 24,
        isFlashSale: false,
        isFeatured: true,
        isHot: true,
        stock: 45,
        rating: 5.0,
        reviewCount: 31,
        soldCount: 340,
        image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Phương pháp quản trị hiện đại giúp các nhà sáng lập xây dựng sản phẩm, đo lường phản hồi khách hàng và phát triển doanh nghiệp bền vững.",
        highlights: [
            "Cuốn sách gối đầu giường của các nhà khởi nghiệp và quản lý sản phẩm toàn cầu",
            "Phương pháp Xây dựng - Đo lường - Học hỏi thực tiễn, dễ áp dụng"
        ]
    },

    // --- KỸ NĂNG & TỰ HỌC ---
    {
        id: 110,
        code: "MM-KN001",
        title: "Thói Quen Nguyên Tử (Atomic Habits)",
        slug: "thoi-quen-nguyen-tu",
        category: "ky-nang",
        categoryName: "Kỹ Năng & Tự Học",
        author: "James Clear",
        publisher: "NXB Thế Giới",
        pages: 392,
        size: "14 x 20.5 cm",
        coverType: "Bìa mềm",
        price: 129000,
        oldPrice: 175000,
        discount: 26,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        stock: 85,
        rating: 5.0,
        reviewCount: 77,
        soldCount: 950,
        image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Thay đổi tí hon – Hiệu quả bất ngờ. Phương pháp khoa học giúp bạn tốt hơn 1% mỗi ngày và đạt thành tựu bền vững.",
        highlights: [
            "Hệ thống 4 quy luật thay đổi hành vi cực kỳ dễ thực hành",
            "Tặng kèm Bảng theo dõi thói quen 30 ngày (Habit Tracker)"
        ]
    },
    {
        id: 111,
        code: "MM-KN002",
        title: "Khéo Ăn Nói Sẽ Có Được Thiên Hạ (Bản Mới Nhất)",
        slug: "kheo-an-noi-se-co-duoc-thien-ha",
        category: "ky-nang",
        categoryName: "Kỹ Năng & Tự Học",
        author: "Trác Nhã",
        publisher: "NXB Văn Học",
        pages: 408,
        size: "14.5 x 20.5 cm",
        coverType: "Bìa mềm",
        price: 95000,
        oldPrice: 130000,
        discount: 27,
        isFlashSale: false,
        isFeatured: false,
        isHot: true,
        stock: 60,
        rating: 4.8,
        reviewCount: 19,
        soldCount: 410,
        image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Nghệ thuật giao tiếp tinh tế, thuyết phục và xử lý tình huống khéo léo trong học tập, công việc và cuộc sống.",
        highlights: [
            "Hàng trăm tình huống hội thoại thực tế, đọc xong áp dụng ngay"
        ]
    },

    // --- SÁCH THIẾU NHI ---
    {
        id: 112,
        code: "MM-TN001",
        title: "Hoàng Tử Bé (Ấn Bản Minh Họa Màu Nước Đặc Biệt)",
        slug: "hoang-tu-be-minh-hoa-mau",
        category: "thieu-nhi",
        categoryName: "Sách Thiếu Nhi",
        author: "Antoine de Saint-Exupéry",
        publisher: "NXB Kim Đồng",
        pages: 136,
        size: "16 x 22 cm",
        coverType: "Bìa cứng gáy vải",
        price: 75000,
        oldPrice: 99000,
        discount: 24,
        isFlashSale: false,
        isFeatured: true,
        isHot: true,
        stock: 50,
        rating: 5.0,
        reviewCount: 44,
        soldCount: 620,
        image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Người ta chỉ nhìn thấy rõ bằng trái tim. Điều cốt lõi vô hình trong mắt trần. Tác phẩm kinh điển dành cho trẻ em và những người từng là trẻ em.",
        highlights: [
            "Bìa cứng sang trọng, tranh màu nước nguyên bản của tác giả",
            "Thích hợp làm quà sinh nhật cho bé và người thân yêu"
        ]
    },
    {
        id: 113,
        code: "MM-TN002",
        title: "Chuyện Con Mèo Dạy Hải Âu Bay",
        slug: "chuyen-con-meo-day-hai-au-bay",
        category: "thieu-nhi",
        categoryName: "Sách Thiếu Nhi",
        author: "Luis Sepúlveda",
        publisher: "NXB Hội Nhà Văn",
        pages: 148,
        size: "14 x 20.5 cm",
        coverType: "Bìa mềm",
        price: 49000,
        oldPrice: 65000,
        discount: 25,
        isFlashSale: false,
        isFeatured: true,
        isHot: false,
        stock: 80,
        rating: 4.9,
        reviewCount: 28,
        soldCount: 510,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Thật dễ dàng để yêu thương một kẻ giống mình, nhưng để yêu thương một ai đó khác mình thực sự rất cần lòng dũng cảm.",
        highlights: [
            "Câu chuyện đồng thoại hài hước, cảm động về chữ tín và tình yêu thương"
        ]
    },

    // --- SET QUÀ TẶNG SÁCH (TƯƠNG ĐƯƠNG SET QUÀ TẶNG CỦA MẪU BABIBO) ---
    {
        id: 201,
        code: "MM-SET01",
        title: "Set Quà Sách 'Bình Yên' (Hiểu Về Trái Tim + Nến Thơm + Hoa Khô + Thiệp Tay)",
        slug: "set-qua-sach-binh-yen",
        category: "set-qua-tang",
        categoryName: "Set Quà Tặng Sách",
        author: "Mộc Miên Curated Box",
        publisher: "Mộc Miên Gift Studio",
        pages: 480,
        size: "Hộp quà 25 x 20 x 8 cm",
        coverType: "Box Quà Cao Cấp Nơ Lụa",
        price: 259000,
        oldPrice: 350000,
        discount: 26,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        isGiftSet: true,
        stock: 35,
        rating: 5.0,
        reviewCount: 52,
        soldCount: 390,
        image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Hộp quà sách thiết kế thủ công gồm: 01 sách Hiểu Về Trái Tim, 01 hũ nến thơm tinh dầu oải hương, 01 bó hoa baby khô, 01 bookmark gỗ khắc tên & thiệp viết tay.",
        highlights: [
            "Gói quà nghệ thuật bằng giấy Kraft/Hồng Pastel kèm ruy băng lụa",
            "Miễn phí viết thiệp tay theo nội dung lời nhắn của người tặng",
            "Đóng hộp chống sốc 2 lớp, đảm bảo vuông vức khi giao đến tay người nhận"
        ]
    },
    {
        id: 202,
        code: "MM-SET02",
        title: "Set Quà Sách 'Mở Lộc Tri Thức' (Nhà Giả Kim + Ly Giữ Nhiệt Pastel + Bookmark)",
        slug: "set-qua-sach-mo-loc-tri-thuc",
        category: "set-qua-tang",
        categoryName: "Set Quà Tặng Sách",
        author: "Mộc Miên Curated Box",
        publisher: "Mộc Miên Gift Studio",
        pages: 228,
        size: "Hộp quà 28 x 22 x 10 cm",
        coverType: "Box Quà Cứng Nắp Nam Châm",
        price: 299000,
        oldPrice: 420000,
        discount: 29,
        isFlashSale: true,
        isFeatured: true,
        isHot: true,
        isGiftSet: true,
        stock: 28,
        rating: 5.0,
        reviewCount: 41,
        soldCount: 310,
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Món quà hoàn hảo dịp sinh nhật, tốt nghiệp hoặc đầu năm mới: Sách Nhà Giả Kim + Bình giữ nhiệt 500ml tone hồng phấn + Đèn kẹp đọc sách ban đêm.",
        highlights: [
            "Tiết kiệm 29% so với mua lẻ từng món",
            "Tặng kèm túi giấy quai lụa sang trọng và thiệp chúc mừng viết tay"
        ]
    },
    {
        id: 203,
        code: "MM-SET03",
        title: "Set Quà 'Góc Đọc Sách Nhỏ Xinh' (Cây Cam Ngọt + Gấu Bông Mini Đọc Sách + Hoa Sáp)",
        slug: "set-qua-goc-doc-sach-nho-xinh",
        category: "set-qua-tang",
        categoryName: "Set Quà Tặng Sách",
        author: "Mộc Miên Curated Box",
        publisher: "Mộc Miên Gift Studio",
        pages: 244,
        size: "Hộp quà 25 x 25 x 12 cm",
        coverType: "Hộp Quà Cửa Sổ Meka",
        price: 239000,
        oldPrice: 320000,
        discount: 25,
        isFlashSale: false,
        isFeatured: true,
        isHot: true,
        isGiftSet: true,
        stock: 40,
        rating: 4.9,
        reviewCount: 33,
        soldCount: 275,
        image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Sự kết hợp ngọt ngào giữa cuốn sách Cây Cam Ngọt Của Tôi, chú gấu bông mini đeo kính đọc sách và bó hoa sáp thơm dịu.",
        highlights: [
            "Vừa có sách hay để đọc, vừa có gấu xinh & hoa thơm trang trí bàn học",
            "Miễn phí gói quà và in ảnh Polaroid kỷ niệm theo yêu cầu"
        ]
    },
    {
        id: 204,
        code: "MM-SET04",
        title: "Combo Bứt Phá Bản Thân (Thói Quen Nguyên Tử + Tâm Lý Học Về Tiền + Sổ Tay)",
        slug: "combo-but-pha-ban-than",
        category: "set-qua-tang",
        categoryName: "Set Quà Tặng Sách",
        author: "James Clear & Morgan Housel",
        publisher: "Mộc Miên Bookset",
        pages: 776,
        size: "Combo 2 Sách + 1 Sổ",
        coverType: "Hộp Quà Tri Thức",
        price: 249000,
        oldPrice: 345000,
        discount: 28,
        isFlashSale: false,
        isFeatured: true,
        isHot: false,
        isGiftSet: true,
        stock: 50,
        rating: 5.0,
        reviewCount: 29,
        soldCount: 420,
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=700&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=700&q=80"
        ],
        shortDesc: "Bộ đôi Best-seller giúp bạn làm chủ thói quen và tài chính cá nhân, tặng kèm Sổ tay kế hoạch Reading Journal 200 trang.",
        highlights: [
            "Combo tiết kiệm nhất dành cho sinh viên và người mới đi làm",
            "Tặng kèm bộ bút highlight pastel 5 màu"
        ]
    }
];

// =========================================================================
// 5. BÀI VIẾT CẨM NANG & CHÍNH SÁCH MUA HÀNG
// =========================================================================
const BLOG_POSTS = [
    {
        id: 1,
        slug: "huong-dan-dat-sach-va-thanh-toan-vietqr-tu-dong-trong-3-phut",
        title: "Hướng dẫn đặt sách tại Mộc Miên Books nhanh chóng, đơn giản trong 3 phút",
        category: "Hướng dẫn mua hàng",
        date: "27/12/2025",
        author: "Ban Quản Trị Mộc Miên",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
        excerpt: "Bạn muốn rinh ngay cuốn sách yêu thích hoặc gửi tặng một Set quà sách thật ý nghĩa cho bạn bè? Xem ngay hướng dẫn đặt sách cực kỳ đơn giản chỉ trong 3 phút tại Mộc Miên Books!",
        content: `
            <p>Chào mừng bạn đến với <strong>Mộc Miên Books – Không gian Sách & Quà tặng Tri thức</strong>! Nhằm mang đến trải nghiệm mua sắm thuận tiện nhất cho bạn đọc, Mộc Miên đã tối ưu quy trình đặt sách chỉ với 4 bước ngắn gọn:</p>
            <h5>Bước 1: Chọn sách hoặc Set quà tặng yêu thích</h5>
            <p>Duyệt qua các danh mục sách trên điện thoại hoặc máy tính, bấm <strong>"Thêm vào giỏ"</strong> hoặc bấm nút <strong>"Mua ngay"</strong> để chuyển thẳng tới màn hình đặt hàng nhanh.</p>
            <h5>Bước 2: Điền thông tin nhận sách & Lời chúc thiệp tay</h5>
            <p>Nhập Họ tên, Số điện thoại, Địa chỉ nhận hàng. Bạn có thể chọn miễn phí <em>Dịch vụ bọc sách Plastic</em> hoặc <em>Viết thiệp tay gửi tặng người thương</em>.</p>
            <h5>Bước 3: Quét mã VietQR tiện lợi hoặc chọn COD</h5>
            <p>Khi chọn thanh toán chuyển khoản, mã <strong>VietQR</strong> sẽ hiển thị sẵn đúng số tiền và mã đơn hàng của bạn. Bạn chỉ cần mở ứng dụng Ngân hàng và quét mã mà không cần gõ tay bất kỳ thông tin nào!</p>
            <h5>Bước 4: Đóng gói chống sốc & Giao hàng tận tay</h5>
            <p>Ngay sau khi ghi nhận đơn hàng, đội ngũ Mộc Miên sẽ bọc sách cẩn thận, gói quà chỉn chu và gửi tới địa chỉ của bạn trong thời gian sớm nhất!</p>
        `
    },
    {
        id: 2,
        slug: "dich-vu-goi-qua-sach-va-viet-thiep-tay-trao-gui-tam-y",
        title: "Dịch Vụ Gói Quà Sách & Viết Thiệp Tay: Trao Gửi Tâm Ý, Gói Ghém Chân Thành",
        category: "Dịch vụ",
        date: "26/12/2025",
        author: "Mộc Miên Studio",
        image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80",
        excerpt: "Một cuốn sách hay được gói ghém chỉn chu bằng giấy thơm, hoa khô và tấm thiệp viết tay nắn nót sẽ trở thành món quà chạm đến trái tim người nhận.",
        content: `
            <p>Một món quà ý nghĩa không chỉ nằm ở giá trị vật chất bên trong, mà bắt đầu từ chính sự chỉn chu ngay từ ánh nhìn đầu tiên. Tại <strong>Mộc Miên Books</strong>, mỗi cuốn sách gửi đi đều được nâng niu như một tác phẩm nghệ thuật.</p>
            <ul>
                <li><strong>Gói quà nghệ thuật miễn phí:</strong> Sử dụng giấy gói vintage hoặc giấy lụa hồng pastel kèm dây thừng gai và nhành hoa khô thơm dịu.</li>
                <li><strong>Viết thiệp tay nắn nót:</strong> Đội ngũ calligraphy của Mộc Miên sẽ thay bạn viết tay những lời nhắn gửi chân thành nhất lên tấm thiệp giấy mỹ thuật định lượng cao.</li>
                <li><strong>Bọc sách Plastic chuẩn form:</strong> Giúp cuốn sách luôn mới tinh tươm qua năm tháng.</li>
            </ul>
        `
    },
    {
        id: 3,
        slug: "moc-mien-noi-nhung-nhip-tim-cham-lai-va-nhung-trang-sach-mo-ra",
        title: "Mộc Miên – Nơi Những Nhịp Tim Chậm Lại Và Những Trang Sách Mở Ra",
        category: "Góc chia sẻ",
        date: "24/12/2025",
        author: "Phương Anh",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80",
        excerpt: "Giữa dòng chảy hối hả của cuộc sống hiện đại, có bao giờ bạn chợt thấy lòng mình cần một khoảng lặng bên tách trà ấm và một trang sách thơm mùi giấy mới?",
        content: `
            <p>Giữa dòng chảy hối hả của cuộc sống hiện đại, có bao giờ bạn chợt thấy lòng mình cần một khoảng lặng? Một khoảng lặng không tiếng ồn, không lo toan, chỉ có tiếng lật giở từng trang giấy thơm dịu và những câu chuyện sưởi ấm tâm hồn.</p>
            <p>Đó chính là lý do <strong>Mộc Miên Books</strong> ra đời – không chỉ là một tiệm sách trực tuyến, mà là trạm dừng chân dịu dàng cho những tâm hồn yêu chữ nghĩa.</p>
        `
    },
    {
        id: 4,
        slug: "chinh-sach-doi-tra-va-bao-hanh-sach-an-tam-tuyet-doi",
        title: "Chính Sách Đổi Trả 1-1 & Cam Kết Sách Bản Quyền 100% Tại Mộc Miên",
        category: "Chính sách",
        date: "20/12/2025",
        author: "CSKH Mộc Miên",
        image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80",
        excerpt: "Cam kết 100% sách thật bản quyền từ các Nhà xuất bản uy tín. Đổi mới 1-1 trong 7 ngày nếu sách bị lỗi in ấn hoặc móp góc do vận chuyển.",
        content: `
            <p>Mộc Miên Books cam kết bảo vệ quyền lợi độc giả tuyệt đối:</p>
            <ul>
                <li><strong>100% Sách bản quyền chính hãng:</strong> Hoàn tiền gấp 200% nếu phát hiện sách giả, sách lậu.</li>
                <li><strong>Đổi mới 1-1 miễn phí trong 7 ngày:</strong> Áp dụng cho mọi trường hợp lỗi in ấn (thiếu trang, mờ chữ, ngược trang) hoặc hư hại do quá trình vận chuyển.</li>
                <li><strong>Mở hộp kiểm tra trước khi nhận:</strong> Độc giả luôn được đồng kiểm ngoại quan gói hàng cùng bưu tá.</li>
            </ul>
        `
    }
];

// =========================================================================
// 6. ĐÁNH GIÁ & CẢM NHẬN TỪ ĐỘC GIẢ
// =========================================================================
const CUSTOMER_FEEDBACKS = [
    {
        name: "Kiều Bảo Ngọc",
        role: "Sinh viên ĐH Thương Mại",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        comment: "Mộc Miên cung cấp nhiều tính năng hữu ích như chọn sách yêu thích, đặt hàng trên điện thoại và tự động tạo mã VietQR đúng số tiền giúp việc mua sách trở nên cực kỳ tiện lợi!"
    },
    {
        name: "Vũ Hồng Hạnh",
        role: "Độc giả thân thiết",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        comment: "Các set quà sách của Mộc Miên có giá cả rất hợp lý, gói quà siêu xinh kèm hoa khô và thiệp viết tay nắn nót. Mình đặt tặng sinh nhật bạn mà bạn khen mãi!"
    },
    {
        name: "Vũ Bá Hoàng",
        role: "Chuyên viên Marketing",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        comment: "Ấn tượng nhất là khâu thanh toán VietQR trên di động: bấm đặt hàng xong là hiện ngay mã QR có sẵn số tiền và mã đơn hàng, quét trên app MBBank chỉ mất đúng 5 giây!"
    },
    {
        name: "Trần Minh Thư",
        role: "Booktuber",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        comment: "Sách chuẩn bản quyền 100%, đóng gói chống sốc 2 lớp nên nhận hàng vuông vức không vết móp góc. Bọc plastic miễn phí cực kỳ phẳng đẹp!"
    }
];

// =========================================================================
// 7. DANH SÁCH MÃ GIẢM GIÁ & ƯU ĐÃI VẬN CHUYỂN
// =========================================================================
const COUPONS = {
    "MOCMIEN20": { code: "MOCMIEN20", discountPercent: 10, maxDiscount: 50000, desc: "Giảm 10% tối đa 50.000đ cho mọi đơn sách" },
    "SACHMOI30": { code: "SACHMOI30", discountFlat: 30000, minOrder: 150000, desc: "Giảm ngay 30.000đ cho đơn từ 150.000đ" },
    "FREESHIP": { code: "FREESHIP", freeShipping: true, desc: "Miễn phí vận chuyển toàn quốc" },
    "BANMOI15": { code: "BANMOI15", discountPercent: 15, maxDiscount: 100000, desc: "Ưu đãi giảm 15% dành cho bạn đọc mới" }
};

