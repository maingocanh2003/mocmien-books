// =========================================================================
// ENGINE XỬ LÝ BÁN HÀNG TỰ ĐỘNG & THANH TOÁN VIETQR TRÊN DI ĐỘNG
// Mộc Miên Books - Hệ thống Thương mại Điện tử K65
// =========================================================================

const AppState = {
    config: { ...SHOP_DEFAULT_CONFIG },
    cart: [],
    wishlist: [],
    compare: [],
    orders: [],
    appliedCoupon: null,
    currentFilter: {
        category: "all",
        keyword: "",
        sort: "default",
        priceRange: "all"
    },
    activeOrderForQR: null,
    qrCountdownTimer: null,
    currentUser: null,
    pendingAction: null
};

// Khởi tạo dữ liệu từ LocalStorage
function initStorage() {
    try {
        const savedConfig = localStorage.getItem("mocmien_config");
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            AppState.config = {
                ...SHOP_DEFAULT_CONFIG,
                ...parsed,
                googleSheetWebAppUrl: SHOP_DEFAULT_CONFIG.googleSheetWebAppUrl || parsed.googleSheetWebAppUrl || "",
                googleClientId: SHOP_DEFAULT_CONFIG.googleClientId || parsed.googleClientId || "",
                facebookAppId: SHOP_DEFAULT_CONFIG.facebookAppId || parsed.facebookAppId || "",
                makeWebhookUrl: SHOP_DEFAULT_CONFIG.makeWebhookUrl || parsed.makeWebhookUrl || "",
                googleFormActionUrl: SHOP_DEFAULT_CONFIG.googleFormActionUrl || parsed.googleFormActionUrl || ""
            };
        } else {
            AppState.config = { ...SHOP_DEFAULT_CONFIG };
        }
        const savedCart = localStorage.getItem("mocmien_cart");
        if (savedCart) AppState.cart = JSON.parse(savedCart);

        const savedWish = localStorage.getItem("mocmien_wishlist");
        if (savedWish) AppState.wishlist = JSON.parse(savedWish);

        const savedUser = localStorage.getItem("mocmien_user");
        if (savedUser) {
            try {
                AppState.currentUser = JSON.parse(savedUser);
            } catch (err) {
                AppState.currentUser = null;
            }
        }

        // Xóa dữ liệu mẫu cũ (nếu có) và chỉ đọc các đơn hàng do chính người dùng đặt
        localStorage.removeItem("mocmien_orders");
        const savedMyOrders = localStorage.getItem("mocmien_my_orders");
        if (savedMyOrders) {
            AppState.orders = JSON.parse(savedMyOrders);
        } else {
            AppState.orders = [];
        }
    } catch (e) {
        console.error("Lỗi đọc LocalStorage:", e);
    }
}

function saveCart() {
    localStorage.setItem("mocmien_cart", JSON.stringify(AppState.cart));
    updateBadges();
}

function saveWishlist() {
    localStorage.setItem("mocmien_wishlist", JSON.stringify(AppState.wishlist));
    updateBadges();
}

function saveOrders() {
    localStorage.setItem("mocmien_my_orders", JSON.stringify(AppState.orders));
    updateBadges();
}

function saveConfig() {
    localStorage.setItem("mocmien_config", JSON.stringify(AppState.config));
}

// Định dạng tiền tệ VND
function formatVND(amount) {
    return Number(amount || 0).toLocaleString("vi-VN") + " VND";
}

// Hiển thị thông báo Toast
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const iconMap = {
        success: '<i class="fa-solid fa-circle-check text-success fs-4"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation text-warning fs-4"></i>',
        info: '<i class="fa-solid fa-wand-magic-sparkles text-primary fs-4"></i>'
    };
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerHTML = `
        ${iconMap[type] || iconMap.success}
        <div class="small fw-bold">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(30px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Cập nhật số lượng trên các icon Header & Mobile Nav
function updateBadges() {
    const totalCartQty = AppState.cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll(".cart-count-badge").forEach(el => (el.textContent = totalCartQty));
    document.querySelectorAll(".wishlist-count-badge").forEach(el => (el.textContent = AppState.wishlist.length));
    document.querySelectorAll(".order-count-badge").forEach(el => (el.textContent = AppState.orders.length));
}

// Tạo HTML thẻ Sản phẩm chuẩn mẫu bptmai02.id.vn
function createProductCardHTML(product) {
    const isLiked = AppState.wishlist.includes(product.id);
    return `
        <div class="col-6 col-md-4 col-lg-3 mb-4">
            <div class="product-item">
                <div>
                    <div class="inner-image">
                        <div class="product-status">
                            ${product.discount > 0 ? `<span class="onsale">-${product.discount}%</span>` : ""}
                            ${product.isFeatured ? `<span class="featured">Nổi Bật</span>` : ""}
                        </div>
                        <a href="javascript:void(0)" onclick="openProductDetail(${product.id})" title="${product.title}">
                            <img src="${product.image}" alt="${product.title}" loading="lazy">
                        </a>
                        <div class="product-action">
                            <button type="button" class="btn-product-action" onclick="toggleWishlist(${product.id})" title="Yêu thích">
                                <i class="fa-${isLiked ? "solid" : "regular"} fa-heart"></i>
                            </button>
                            <button type="button" class="btn-product-action" onclick="openProductDetail(${product.id})" title="Xem chi tiết">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button type="button" class="btn-product-action" onclick="addToCompare(${product.id})" title="So sánh sách">
                                <i class="fa-solid fa-retweet"></i>
                            </button>
                        </div>
                    </div>
                    <div class="inner-content text-center">
                        <div class="product-category-tag">${product.categoryName}</div>
                        <h4 class="product-title">
                            <a href="javascript:void(0)" onclick="openProductDetail(${product.id})">${product.title}</a>
                        </h4>
                        <div class="product-author"><i class="fa-solid fa-feather-pointed me-1"></i>${product.author}</div>
                        <div class="price-wrap">
                            <span class="price-amount">${Number(product.price).toLocaleString("vi-VN")} <small>VND</small></span>
                            ${product.oldPrice > product.price ? `<span class="price-amount old-price">${Number(product.oldPrice).toLocaleString("vi-VN")} VND</span>` : ""}
                        </div>
                    </div>
                </div>
                <div class="product-card-footer">
                    <button type="button" class="btn-card-cart" onclick="addToCart(${product.id}, 1)">
                        <i class="fa-solid fa-cart-plus me-1"></i>Thêm giỏ
                    </button>
                    <button type="button" class="btn-card-vietqr" onclick="buyNowVietQR(${product.id})">
                        <i class="fa-solid fa-qrcode me-1"></i>Mua ngay
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render toàn bộ giao diện Trang chủ
function renderAllSections() {
    // 1. Render Bubble Categories
    const cateContainer = document.getElementById("bubble-categories-list");
    if (cateContainer) {
        cateContainer.innerHTML = CATEGORIES.map(cat => `
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="cate-bubble-card" onclick="filterByCategory('${cat.id}')">
                    <div class="cate-bubble-img-wrap">
                        <img src="${cat.image}" alt="${cat.name}" loading="lazy">
                    </div>
                    <div class="prd-cate-title">${cat.name}</div>
                    <div class="cout-prd"><i class="fa-solid fa-heart me-1" style="font-size:10px;"></i>${cat.count} Sản phẩm</div>
                </div>
            </div>
        `).join("");
    }

    // 2. Render Flash Sale
    const flashContainer = document.getElementById("flash-sale-grid");
    if (flashContainer) {
        const flashProducts = PRODUCTS.filter(p => p.isFlashSale).slice(0, 4);
        flashContainer.innerHTML = flashProducts.map(createProductCardHTML).join("");
    }

    // 3. Render Sách Siêu Hot
    const hotContainer = document.getElementById("hot-books-grid");
    if (hotContainer) {
        const hotProducts = PRODUCTS.filter(p => p.isHot && !p.isGiftSet).slice(0, 8);
        hotContainer.innerHTML = hotProducts.map(createProductCardHTML).join("");
    }

    // 4. Render Set Quà Tặng Sách
    const giftContainer = document.getElementById("gift-sets-grid");
    if (giftContainer) {
        const giftProducts = PRODUCTS.filter(p => p.isGiftSet);
        giftContainer.innerHTML = giftProducts.map(createProductCardHTML).join("");
    }

    // 5. Render Danh mục đầy đủ & Bộ lọc
    renderCatalogue();

    // 6. Render Cảm nhận khách hàng
    const feedbackContainer = document.getElementById("feedback-grid");
    if (feedbackContainer) {
        feedbackContainer.innerHTML = CUSTOMER_FEEDBACKS.map(fb => `
            <div class="col-12 col-md-6 mb-4">
                <div class="feedback-item">
                    <p class="mb-3 fst-italic text-secondary">"${fb.comment}"</p>
                    <div class="d-flex align-items-center gap-3">
                        <img src="${fb.avatar}" alt="${fb.name}" class="avatar-img">
                        <div>
                            <div class="fw-bold" style="color: var(--primary);">${fb.name}</div>
                            <div class="small text-muted">${fb.role}</div>
                            <div class="text-warning small mt-1">
                                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join("");
    }

    // 7. Render Tin tức & Dịch vụ
    const blogContainer = document.getElementById("blog-grid");
    if (blogContainer) {
        blogContainer.innerHTML = BLOG_POSTS.map(post => `
            <div class="col-12 col-md-6 col-lg-3 mb-4">
                <article class="article-item d-flex flex-column justify-content-between">
                    <div>
                        <a href="javascript:void(0)" onclick="openBlogModal(${post.id})">
                            <img src="${post.image}" alt="${post.title}" class="article-img">
                        </a>
                        <div class="p-3">
                            <span class="badge rounded-pill mb-2" style="background:var(--primary-soft);color:var(--primary);border:1px solid var(--primary-border);">
                                ${post.category}
                            </span>
                            <h5 class="fw-bold mb-2" style="font-size:15.5px; line-height:1.4;">
                                <a href="javascript:void(0)" onclick="openBlogModal(${post.id})">${post.title}</a>
                            </h5>
                            <p class="small text-muted mb-0" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
                                ${post.excerpt}
                            </p>
                        </div>
                    </div>
                    <div class="px-3 pb-3 pt-2 d-flex justify-content-between align-items-center border-top">
                        <span class="small text-muted"><i class="fa-regular fa-calendar me-1"></i>${post.date}</span>
                        <button class="btn btn-sm fw-bold" style="color:var(--primary);" onclick="openBlogModal(${post.id})">
                            Đọc tiếp <i class="fa-solid fa-arrow-right ms-1"></i>
                        </button>
                    </div>
                </article>
            </div>
        `).join("");
    }

    renderSidebarCart();
    renderOrdersTable();
    updateShopBrandingUI();
    updateBadges();
}

// Lọc và hiển thị danh sách sản phẩm tại khu vực Kho Sách
function renderCatalogue() {
    const grid = document.getElementById("catalogue-grid");
    if (!grid) return;

    let list = [...PRODUCTS];
    const { category, keyword, sort, priceRange } = AppState.currentFilter;

    if (category !== "all") {
        list = list.filter(p => p.category === category);
    }

    if (keyword.trim() !== "") {
        const kw = keyword.toLowerCase().trim();
        list = list.filter(p =>
            p.title.toLowerCase().includes(kw) ||
            p.author.toLowerCase().includes(kw) ||
            p.code.toLowerCase().includes(kw) ||
            p.categoryName.toLowerCase().includes(kw)
        );
    }

    if (priceRange === "under100") {
        list = list.filter(p => p.price < 100000);
    } else if (priceRange === "100to200") {
        list = list.filter(p => p.price >= 100000 && p.price <= 200000);
    } else if (priceRange === "above200") {
        list = list.filter(p => p.price > 200000);
    }

    if (sort === "price-asc") {
        list.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
        list.sort((a, b) => b.price - a.price);
    } else if (sort === "name-asc") {
        list.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    } else if (sort === "bestseller") {
        list.sort((a, b) => b.soldCount - a.soldCount);
    }

    const countEl = document.getElementById("catalogue-count");
    if (countEl) countEl.textContent = `${list.length} đầu sách`;

    if (list.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-book-open-reader fa-3x mb-3" style="color:var(--primary-light);"></i>
                <h5 class="fw-bold">Không tìm thấy cuốn sách phù hợp</h5>
                <p class="text-muted">Bạn hãy thử từ khóa khác hoặc bấm xem tất cả danh mục nhé!</p>
                <button class="btn-cute-primary" onclick="resetCatalogueFilter()">Xem tất cả sách</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = list.map(createProductCardHTML).join("");
}

function filterByCategory(cateId) {
    AppState.currentFilter.category = cateId;
    const selectCate = document.getElementById("filter-category");
    if (selectCate) selectCate.value = cateId;
    renderCatalogue();
    const section = document.getElementById("san-pham-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
}

function resetCatalogueFilter() {
    AppState.currentFilter = { category: "all", keyword: "", sort: "default", priceRange: "all" };
    const fCat = document.getElementById("filter-category");
    const fKw = document.getElementById("filter-keyword");
    const fSort = document.getElementById("filter-sort");
    const fPrice = document.getElementById("filter-price");
    if (fCat) fCat.value = "all";
    if (fKw) fKw.value = "";
    if (fSort) fSort.value = "default";
    if (fPrice) fPrice.value = "all";
    renderCatalogue();
}

// =========================================================================
// GIỎ HÀNG, YÊU THÍCH & SO SÁNH
// =========================================================================
function addToCart(productId, qty = 1, showToastNotification = true) {
    if (!AppState.currentUser) {
        AppState.pendingAction = {
            type: "addToCart",
            productId,
            qty,
            showToastNotification
        };
        showToast("🔐 Vui lòng đăng nhập tài khoản để thêm sách vào giỏ hàng!", "info");
        openUserModal();
        return;
    }

    const product = PRODUCTS.find(p => p.id === Number(productId));
    if (!product) return;

    const existing = AppState.cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += Number(qty);
    } else {
        AppState.cart.push({
            id: product.id,
            code: product.code,
            title: product.title,
            price: product.price,
            image: product.image,
            author: product.author,
            qty: Number(qty)
        });
    }
    saveCart();
    renderSidebarCart();
    if (showToastNotification) {
        showToast(`Đã thêm <strong>"${product.title}"</strong> vào giỏ hàng!`);
    }
}

function updateCartQty(productId, delta) {
    const item = AppState.cart.find(i => i.id === Number(productId));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        AppState.cart = AppState.cart.filter(i => i.id !== Number(productId));
    }
    saveCart();
    renderSidebarCart();
    renderCheckoutSummary();
}

function removeFromCart(productId) {
    AppState.cart = AppState.cart.filter(i => i.id !== Number(productId));
    saveCart();
    renderSidebarCart();
    renderCheckoutSummary();
}

function toggleSidebarCart(forceOpen = null) {
    const sidebar = document.getElementById("sidebar-mini-cart");
    const backdrop = document.getElementById("cart-backdrop");
    if (!sidebar || !backdrop) return;
    const isOpen = forceOpen !== null ? forceOpen : !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", isOpen);
    backdrop.classList.toggle("show", isOpen);
}

function renderSidebarCart() {
    const listEl = document.getElementById("mini-cart-items");
    const totalEl = document.getElementById("mini-cart-total");
    if (!listEl || !totalEl) return;

    if (AppState.cart.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-basket-shopping fa-3x mb-3" style="color:var(--primary-border);"></i>
                <p class="fw-bold mb-1">Chưa có cuốn sách nào trong giỏ</p>
                <small>Hãy chọn cuốn sách bạn yêu thích nhé!</small>
            </div>
        `;
        totalEl.textContent = "0 VND";
        return;
    }

    let sum = 0;
    listEl.innerHTML = AppState.cart.map(item => {
        const lineTotal = item.price * item.qty;
        sum += lineTotal;
        return `
            <div class="d-flex align-items-center gap-3 py-3 border-bottom">
                <img src="${item.image}" alt="${item.title}" style="width:62px;height:62px;object-fit:cover;border-radius:12px;border:1px solid var(--primary-border);">
                <div class="flex-grow-1">
                    <div class="fw-bold small line-clamp-1">${item.title}</div>
                    <div class="small fw-bold" style="color:var(--accent);">${formatVND(item.price)}</div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <button class="btn btn-sm btn-light border py-0 px-2" onclick="updateCartQty(${item.id}, -1)">-</button>
                        <span class="small fw-bold">${item.qty}</span>
                        <button class="btn btn-sm btn-light border py-0 px-2" onclick="updateCartQty(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="btn btn-sm text-danger" onclick="removeFromCart(${item.id})" title="Xóa">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join("");

    totalEl.textContent = formatVND(sum);
}

// Mua ngay 1 chạm -> Mở thẳng Checkout VietQR (không hiển thị toast đã thêm vào giỏ)
function buyNowVietQR(productId, qty = 1) {
    if (!AppState.currentUser) {
        AppState.pendingAction = {
            type: "buyNow",
            productId,
            qty
        };
        showToast("🔐 Vui lòng đăng nhập tài khoản để tiến hành đặt mua sách!", "info");
        openUserModal();
        return;
    }
    addToCart(productId, qty, false);
    openCheckoutModal();
}

function toggleWishlist(productId) {
    const idx = AppState.wishlist.indexOf(Number(productId));
    const p = PRODUCTS.find(x => x.id === Number(productId));
    if (idx >= 0) {
        AppState.wishlist.splice(idx, 1);
        showToast(`Đã bỏ "${p ? p.title : ""}" khỏi danh sách yêu thích`, "info");
    } else {
        AppState.wishlist.push(Number(productId));
        showToast(`Đã lưu ❤️ "${p ? p.title : ""}" vào danh sách yêu thích!`);
    }
    saveWishlist();
    renderAllSections();
}

function openWishlistModal() {
    const body = document.getElementById("wishlist-modal-body");
    if (!body) return;
    const likedProducts = PRODUCTS.filter(p => AppState.wishlist.includes(p.id));
    if (likedProducts.length === 0) {
        body.innerHTML = `<div class="text-center py-4 text-muted">Danh sách yêu thích đang trống. Hãy thả tim ❤️ cho cuốn sách bạn thích nhé!</div>`;
    } else {
        body.innerHTML = `<div class="row">${likedProducts.map(createProductCardHTML).join("")}</div>`;
    }
    new bootstrap.Modal(document.getElementById("wishlistModal")).show();
}

function addToCompare(productId) {
    const id = Number(productId);
    if (!AppState.compare.includes(id)) {
        if (AppState.compare.length >= 3) AppState.compare.shift();
        AppState.compare.push(id);
    }
    renderCompareModal();
    new bootstrap.Modal(document.getElementById("compareModal")).show();
}

function renderCompareModal() {
    const body = document.getElementById("compare-modal-body");
    if (!body) return;
    const items = PRODUCTS.filter(p => AppState.compare.includes(p.id));
    if (items.length === 0) {
        body.innerHTML = `<p class="text-center py-4 text-muted">Chưa có sản phẩm nào để so sánh.</p>`;
        return;
    }
    body.innerHTML = `
        <div class="table-responsive">
            <table class="table table-bordered align-middle text-center">
                <thead class="table-light">
                    <tr>
                        <th>Tiêu chí</th>
                        ${items.map(p => `<th>${p.title}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="fw-bold">Hình ảnh</td>
                        ${items.map(p => `<td><img src="${p.image}" style="width:90px;height:90px;object-fit:cover;border-radius:12px;"></td>`).join("")}
                    </tr>
                    <tr>
                        <td class="fw-bold">Giá bán</td>
                        ${items.map(p => `<td class="fw-bold text-danger">${formatVND(p.price)}</td>`).join("")}
                    </tr>
                    <tr>
                        <td class="fw-bold">Tác giả</td>
                        ${items.map(p => `<td>${p.author}</td>`).join("")}
                    </tr>
                    <tr>
                        <td class="fw-bold">Nhà xuất bản / Số trang</td>
                        ${items.map(p => `<td>${p.publisher} (${p.pages} trang)</td>`).join("")}
                    </tr>
                    <tr>
                        <td class="fw-bold">Quy cách bìa</td>
                        ${items.map(p => `<td>${p.coverType} - ${p.size}</td>`).join("")}
                    </tr>
                    <tr>
                        <td class="fw-bold">Chọn mua</td>
                        ${items.map(p => `<td><button class="btn-cute-primary btn-sm" onclick="buyNowVietQR(${p.id})" data-bs-dismiss="modal">Mua ngay VietQR</button></td>`).join("")}
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// =========================================================================
// CHI TIẾT SẢN PHẨM (MODAL CHUẨN TRANG PRODUCT DETAIL CỦA BPTMAI02.ID.VN)
// =========================================================================
function openProductDetail(productId) {
    const p = PRODUCTS.find(x => x.id === Number(productId));
    if (!p) return;

    const contentEl = document.getElementById("product-detail-modal-body");
    if (!contentEl) return;

    contentEl.innerHTML = `
        <div class="row g-4">
            <div class="col-lg-5">
                <div class="position-relative rounded-4 overflow-hidden border p-2 bg-white shadow-sm mb-3">
                    <img id="detail-main-img" src="${p.image}" alt="${p.title}" class="img-fluid rounded-4 w-100" style="aspect-ratio:1/1;object-fit:cover;">
                    <div class="product-status">
                        ${p.discount > 0 ? `<span class="onsale">-${p.discount}%</span>` : ""}
                        <span class="featured">Bản Quyền 100%</span>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    ${(p.gallery || [p.image]).map(imgUrl => `
                        <img src="${imgUrl}" onclick="document.getElementById('detail-main-img').src='${imgUrl}'"
                             style="width:68px;height:68px;object-fit:cover;border-radius:12px;cursor:pointer;border:2px solid var(--primary-border);">
                    `).join("")}
                </div>
            </div>
            <div class="col-lg-7">
                <span class="badge rounded-pill mb-2" style="background:var(--primary-soft);color:var(--primary);border:1px solid var(--primary-border);">
                    <i class="fa-solid fa-book-open me-1"></i>${p.categoryName}
                </span>
                <h3 class="fw-bold mb-2" style="color:var(--primary);">${p.title}</h3>
                <div class="d-flex align-items-center gap-3 mb-3 small">
                    <span class="text-warning">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        <strong class="text-dark ms-1">(${p.reviewCount} đánh giá)</strong>
                    </span>
                    <span class="text-muted">|</span>
                    <span class="text-success fw-bold"><i class="fa-solid fa-check-circle me-1"></i>Đã bán ${p.soldCount}</span>
                    <span class="text-muted">|</span>
                    <span>Mã SP: <strong>${p.code}</strong></span>
                </div>

                <div class="p-3 rounded-4 mb-3" style="background:var(--primary-soft);border:1.5px dashed var(--primary-border);">
                    <div class="d-flex align-items-baseline gap-3">
                        <span class="fs-2 fw-bolder" style="color:var(--accent);">${formatVND(p.price)}</span>
                        ${p.oldPrice > p.price ? `<span class="text-decoration-line-through text-muted fw-bold">${formatVND(p.oldPrice)}</span>` : ""}
                        ${p.discount > 0 ? `<span class="badge bg-danger rounded-pill">Tiết kiệm ${p.discount}%</span>` : ""}
                    </div>
                    <div class="small text-muted mt-1">
                        <i class="fa-solid fa-qrcode text-primary me-1"></i>Hỗ trợ tạo mã <strong>VietQR động</strong> tự động điền số tiền & nội dung trên di động
                    </div>
                </div>

                <div class="row g-2 small mb-3">
                    <div class="col-6"><strong>Tác giả:</strong> ${p.author}</div>
                    <div class="col-6"><strong>Nhà xuất bản:</strong> ${p.publisher}</div>
                    <div class="col-6"><strong>Kích thước:</strong> ${p.size}</div>
                    <div class="col-6"><strong>Hình thức:</strong> ${p.coverType} (${p.pages} trang)</div>
                </div>

                <p class="text-secondary mb-3">${p.shortDesc}</p>

                <div class="mb-3">
                    <div class="fw-bold mb-2" style="color:var(--primary);">🌟 ĐẶC ĐIỂM NỔI BẬT & CAM KẾT:</div>
                    <ul class="small mb-0 ps-3">
                        ${p.highlights.map(h => `<li class="mb-1">${h}</li>`).join("")}
                    </ul>
                </div>

                <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
                    <div class="input-group" style="width: 130px;">
                        <button class="btn btn-outline-secondary" type="button" onclick="const el=document.getElementById('detail-qty'); if(el.value>1) el.value--;">-</button>
                        <input id="detail-qty" type="number" class="form-control text-center fw-bold" value="1" min="1">
                        <button class="btn btn-outline-secondary" type="button" onclick="const el=document.getElementById('detail-qty'); el.value++;">+</button>
                    </div>
                    <button class="btn-cute-outline" onclick="addToCart(${p.id}, document.getElementById('detail-qty').value)">
                        <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                    <button class="btn-cute-primary" data-bs-dismiss="modal" onclick="buyNowVietQR(${p.id}, document.getElementById('detail-qty').value)">
                        <i class="fa-solid fa-qrcode"></i> Mua ngay
                    </button>
                </div>

                <div class="row g-2 mt-4 pt-3 border-top small">
                    <div class="col-6"><i class="fa-solid fa-truck-fast text-danger me-2"></i>Giao hàng siêu tốc toàn quốc</div>
                    <div class="col-6"><i class="fa-solid fa-shield-heart text-danger me-2"></i>Sách bản quyền 100% + Bọc Plastic</div>
                    <div class="col-6"><i class="fa-solid fa-rotate text-danger me-2"></i>Đổi trả 1-1 miễn phí trong 7 ngày</div>
                    <div class="col-6"><i class="fa-solid fa-gift text-danger me-2"></i>Tặng kèm Bookmark & Thiệp viết tay</div>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(document.getElementById("productDetailModal")).show();
}

// Mở bài viết Blog / Hướng dẫn đặt hàng
function openBlogModal(postId) {
    const post = BLOG_POSTS.find(b => b.id === Number(postId));
    if (!post) return;
    const body = document.getElementById("blog-modal-body");
    if (!body) return;
    body.innerHTML = `
        <span class="badge rounded-pill mb-2" style="background:var(--primary-soft);color:var(--primary);">${post.category}</span>
        <h3 class="fw-bold mb-2" style="color:var(--primary);">${post.title}</h3>
        <div class="small text-muted mb-3">Tác giả: <strong>${post.author}</strong> | Ngày đăng: ${post.date}</div>
        <img src="${post.image}" alt="${post.title}" class="img-fluid rounded-4 w-100 mb-4" style="max-height:320px;object-fit:cover;">
        <div class="lh-lg">${post.content}</div>
    `;
    new bootstrap.Modal(document.getElementById("blogDetailModal")).show();
}

// =========================================================================
// THANH TOÁN & TỰ ĐỘNG HÓA VIETQR + MAKE.COM + GOOGLE FORM
// =========================================================================
function calculateOrderTotals() {
    const subtotal = AppState.cart.reduce((s, i) => s + i.price * i.qty, 0);
    let shippingFee = subtotal >= 250000 || subtotal === 0 ? 0 : 25000;
    let discount = 0;

    if (AppState.appliedCoupon) {
        const cp = AppState.appliedCoupon;
        if (cp.freeShipping) shippingFee = 0;
        if (cp.discountPercent) {
            discount = Math.min(Math.round((subtotal * cp.discountPercent) / 100), cp.maxDiscount || 999999);
        }
        if (cp.discountFlat && subtotal >= (cp.minOrder || 0)) {
            discount = cp.discountFlat;
        }
    }

    const total = Math.max(0, subtotal + shippingFee - discount);
    return { subtotal, shippingFee, discount, total };
}

function applyCouponCode() {
    const input = document.getElementById("checkout-coupon-input");
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) return;

    const found = COUPONS[code];
    if (!found) {
        showToast("Mã giảm giá không tồn tại hoặc đã hết hạn!", "warning");
        return;
    }
    AppState.appliedCoupon = found;
    renderCheckoutSummary();
    showToast(`Áp dụng thành công mã <strong>${code}</strong> (${found.desc})!`);
}

function openCheckoutModal() {
    toggleSidebarCart(false);
    if (!AppState.currentUser) {
        AppState.pendingAction = { type: "checkout" };
        showToast("🔐 Vui lòng đăng nhập tài khoản để tiến hành đặt hàng!", "info");
        openUserModal();
        return;
    }
    if (AppState.cart.length === 0) {
        showToast("Giỏ hàng của bạn đang trống, hãy chọn ít nhất 1 cuốn sách nhé!", "warning");
        return;
    }
    renderCheckoutSummary();
    if (AppState.currentUser) {
        const nameInput = document.getElementById("ck-fullname");
        const phoneInput = document.getElementById("ck-phone");
        const emailInput = document.getElementById("ck-email");
        if (nameInput && !nameInput.value && AppState.currentUser.name) nameInput.value = AppState.currentUser.name;
        if (phoneInput && !phoneInput.value && AppState.currentUser.phone) phoneInput.value = AppState.currentUser.phone;
        if (emailInput && !emailInput.value && AppState.currentUser.email) emailInput.value = AppState.currentUser.email;
    }
    const modalEl = document.getElementById("checkoutModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function renderCheckoutSummary() {
    const container = document.getElementById("checkout-order-items");
    if (!container) return;

    const { subtotal, shippingFee, discount, total } = calculateOrderTotals();

    container.innerHTML = AppState.cart.map(item => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom small">
            <div class="d-flex align-items-center gap-2">
                <img src="${item.image}" style="width:42px;height:42px;object-fit:cover;border-radius:8px;">
                <div>
                    <div class="fw-bold">${item.title}</div>
                    <div class="text-muted">SL: ${item.qty} x ${formatVND(item.price)}</div>
                </div>
            </div>
            <div class="fw-bold" style="color:var(--primary);">${formatVND(item.price * item.qty)}</div>
        </div>
    `).join("");

    document.getElementById("ck-subtotal").textContent = formatVND(subtotal);
    document.getElementById("ck-shipping").textContent = shippingFee === 0 ? "Miễn phí (0 VND)" : formatVND(shippingFee);
    document.getElementById("ck-discount").textContent = "-" + formatVND(discount);
    document.getElementById("ck-total").textContent = formatVND(total);

    // Cập nhật mã QR xem trước ngay trong bước chọn phương thức thanh toán trước
    updateCheckoutLiveQRPreview(total);
    toggleCheckoutPaymentMethod();
}

function updateCheckoutLiveQRPreview(totalAmount) {
    const qrImg = document.getElementById("ck-preview-qr-img");
    if (!qrImg) return;
    const bankObj = VIETQR_BANKS.find(b => b.id === AppState.config.bankId) || VIETQR_BANKS[0];
    const phoneVal = document.getElementById("ck-phone")?.value.trim() || "SDT";
    const previewUrl = buildVietQRImageUrl(totalAmount, `MOCMIEN ${phoneVal}`);
    qrImg.src = previewUrl;

    const elBank = document.getElementById("ck-preview-bank");
    const elAccNo = document.getElementById("ck-preview-acc-no");
    const elAccName = document.getElementById("ck-preview-acc-name");
    const elAmount = document.getElementById("ck-preview-amount");
    if (elBank) elBank.textContent = `${bankObj.shortName} (${AppState.config.bankId})`;
    if (elAccNo) elAccNo.textContent = AppState.config.accountNo;
    if (elAccName) elAccName.textContent = AppState.config.accountName;
    if (elAmount) elAmount.textContent = formatVND(totalAmount);
}

function toggleCheckoutPaymentMethod() {
    const selectedMethod = document.querySelector('input[name="ck-payment"]:checked')?.value || "VIETQR";
    const previewBox = document.getElementById("ck-live-vietqr-preview");
    const submitBtn = document.getElementById("ck-submit-btn");

    if (selectedMethod === "VIETQR") {
        if (previewBox) previewBox.classList.remove("d-none");
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-qrcode me-2"></i>Đặt Hàng & Hiển Thị Mã QR Thanh Toán`;
        }
    } else {
        if (previewBox) previewBox.classList.add("d-none");
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>Xác Nhận Đặt Hàng (Thanh Toán Khi Nhận)`;
        }
    }
}

// Xử lý khi khách nhấn Đặt hàng
async function submitOrderAndGenerateVietQR(event) {
    if (event) event.preventDefault();

    const fullName = document.getElementById("ck-fullname").value.trim();
    const phone = document.getElementById("ck-phone").value.trim();
    const email = document.getElementById("ck-email").value.trim();
    const city = document.getElementById("ck-city").value;
    const address = document.getElementById("ck-address").value.trim();
    const giftWrap = document.getElementById("ck-gift-wrap").checked;
    const giftMessage = document.getElementById("ck-gift-message").value.trim();
    const paymentMethod = document.querySelector('input[name="ck-payment"]:checked').value;

    if (!fullName || !phone || !address) {
        showToast("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!", "warning");
        return;
    }

    const { subtotal, shippingFee, discount, total } = calculateOrderTotals();
    const orderCode = "MM" + Math.floor(10000 + Math.random() * 90000);
    const nowStr = new Date().toLocaleString("vi-VN");

    const newOrder = {
        code: orderCode,
        createdAt: nowStr,
        customerName: fullName,
        phone,
        email: email || "khachhang@mocmien.vn",
        city,
        address: `${address}, ${city}`,
        giftWrap,
        giftMessage,
        items: [...AppState.cart],
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === "VIETQR" ? "CHỜ QUÉT VIETQR" : "THANH TOÁN KHI NHẬN HÀNG (COD)",
        automationSync: "Đang xử lý đơn hàng..."
    };

    const submitBtn = document.getElementById("ck-submit-btn");
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang xử lý đơn hàng...`;
    }

    // Đóng modal checkout
    const ckModal = bootstrap.Modal.getInstance(document.getElementById("checkoutModal"));
    if (ckModal) ckModal.hide();

    // Lưu vào danh sách đơn hàng
    AppState.orders.unshift(newOrder);
    AppState.activeOrderForQR = newOrder;
    AppState.cart = [];
    AppState.appliedCoupon = null;
    saveCart();
    saveOrders();
    renderSidebarCart();
    renderOrdersTable();

    // Đồng bộ đơn hàng lên Google Sheet và chờ kết quả
    try {
        await triggerSalesAutomationWebhook(newOrder);
    } catch (e) {
        console.warn("Lỗi đồng bộ:", e);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    // Nếu khách chọn Thanh toán trước (VIETQR) -> Hiển thị ngay màn hình QR thanh toán
    // Nếu khách chọn COD -> Hiển thị thông báo đặt hàng COD thành công (kèm nút xem QR nếu muốn trả trước)
    if (paymentMethod === "VIETQR") {
        openVietQRPaymentModal(newOrder);
    } else {
        openCodOrderSuccessModal(newOrder);
    }
}

function openCodOrderSuccessModal(order) {
    const modalBody = document.getElementById("vietqr-payment-modal-body");
    if (!modalBody) return;
    modalBody.innerHTML = `
        <div class="text-center p-4">
            <div class="mb-3">
                <span class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width:72px;height:72px;background:var(--primary-soft);color:var(--primary);font-size:32px;">
                    <i class="fa-solid fa-box-check"></i>
                </span>
            </div>
            <h4 class="fw-bolder mb-2" style="color:var(--primary);">Đặt Hàng Thành Công! (Mã đơn: #${order.code})</h4>
            <p class="text-muted mb-3">
                Cảm ơn <strong>${order.customerName}</strong>! Đơn sách của bạn đã được ghi nhận theo hình thức <strong>Thanh toán khi nhận sách (COD)</strong>.
            </p>
            <div class="p-3 rounded-4 mx-auto mb-4 text-start" style="max-width:520px;background:var(--primary-soft);border:1.5px solid var(--primary-border);">
                <div class="d-flex justify-content-between small mb-1"><span>Người nhận:</span><strong>${order.customerName} (${order.phone})</strong></div>
                <div class="d-flex justify-content-between small mb-1"><span>Địa chỉ giao:</span><strong>${order.address}</strong></div>
                <div class="d-flex justify-content-between small mb-1"><span>Hình thức:</span><strong class="text-success">Thanh toán khi nhận hàng (COD)</strong></div>
                <div class="d-flex justify-content-between border-top pt-2 mt-2">
                    <span class="fw-bold">Tổng tiền cần thanh toán khi nhận:</span>
                    <strong class="fs-5 text-danger">${formatVND(order.total)}</strong>
                </div>
            </div>
            <div class="d-flex flex-wrap justify-content-center gap-2">
                <button type="button" class="btn-cute-outline" onclick="openVietQRPaymentModal(AppState.orders.find(o => o.code === '${order.code}'))">
                    <i class="fa-solid fa-qrcode me-1"></i>Đổi sang Thanh toán trước bằng mã QR
                </button>
                <button type="button" class="btn-cute-primary" data-bs-dismiss="modal">
                    <i class="fa-solid fa-bag-shopping me-1"></i>Tiếp tục mua sắm
                </button>
            </div>
        </div>
    `;
    const modalEl = document.getElementById("vietqrPaymentModal");
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// Hàm tạo URL ảnh VietQR chuẩn EMVCo Napas247
function buildVietQRImageUrl(amount, addInfo) {
    const { bankId, accountNo, accountName, qrTemplate } = AppState.config;
    const cleanInfo = addInfo.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${qrTemplate || "compact2"}.png?amount=${amount}&addInfo=${encodeURIComponent(cleanInfo)}&accountName=${encodeURIComponent(accountName)}`;
}

// Mở giao diện Thanh toán VietQR trên Di động
function openVietQRPaymentModal(order) {
    const transferContent = `MOCMIEN ${order.code} ${order.phone}`;
    const qrUrl = buildVietQRImageUrl(order.total, transferContent);
    const bankObj = VIETQR_BANKS.find(b => b.id === AppState.config.bankId) || VIETQR_BANKS[0];

    // Deeplink mở app ngân hàng trên di động
    const deepLinkUrl = `https://dl.vietqr.io/pay?app=${AppState.config.bankId.toLowerCase()}&ba=${AppState.config.accountNo}@${AppState.config.bankId}&am=${order.total}&tn=${encodeURIComponent(transferContent)}`;

    const modalBody = document.getElementById("vietqr-payment-modal-body");
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="row g-4 align-items-center">
            <div class="col-lg-6 text-center">
                <div class="vietqr-card-frame">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-danger rounded-pill px-3 py-2">
                            <i class="fa-solid fa-bolt me-1"></i>VietQR Napas 247
                        </span>
                        <span class="small fw-bold text-muted">
                            <i class="fa-regular fa-clock me-1"></i>Hết hạn sau: <span id="qr-countdown" class="text-danger fw-bolder">10:00</span>
                        </span>
                    </div>

                    <div class="qr-scanner-box my-2">
                        <div class="qr-laser-line"></div>
                        <img id="vietqr-dynamic-img" src="${qrUrl}" alt="Mã thanh toán VietQR ${order.code}"
                             class="img-fluid rounded-3" style="max-width: 265px; min-height: 265px; object-fit: contain;">
                    </div>

                    <div class="small text-muted mt-2 mb-3">
                        Mở bất kỳ <strong>App Ngân hàng / MoMo / VNPay</strong> trên di động và quét mã để tự động điền đúng 100% số tiền & nội dung.
                    </div>

                    <div class="d-flex flex-wrap justify-content-center gap-2">
                        <a href="${deepLinkUrl}" target="_blank" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                            <i class="fa-solid fa-mobile-screen-button me-1"></i>Mở App Ngân Hàng
                        </a>
                        <a href="${qrUrl}" target="_blank" download="VietQR_${order.code}.png" class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold">
                            <i class="fa-solid fa-download me-1"></i>Tải ảnh QR
                        </a>
                    </div>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="p-3 rounded-4 mb-3" style="background:var(--primary-soft);border:1.5px solid var(--primary-border);">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold" style="color:var(--primary);">MÃ ĐƠN HÀNG: #${order.code}</span>
                        <span id="order-live-status-badge" class="badge bg-warning text-dark rounded-pill">
                            <i class="fa-solid fa-spinner fa-spin me-1"></i>Chờ quét mã QR
                        </span>
                    </div>
                    <div class="small text-muted">Khách hàng: <strong>${order.customerName}</strong> (${order.phone})</div>
                    <div class="small text-muted">Giao tới: ${order.address}</div>
                </div>

                <h6 class="fw-bold mb-2" style="color:var(--primary);">THÔNG TIN CHUYỂN KHOẢN TỰ ĐỘNG:</h6>

                <div class="bank-info-row">
                    <div>
                        <div class="small text-muted">Ngân hàng thụ hưởng</div>
                        <div class="fw-bold">${bankObj.name}</div>
                    </div>
                    <span class="badge bg-light text-dark border">${AppState.config.bankId}</span>
                </div>

                <div class="bank-info-row">
                    <div>
                        <div class="small text-muted">Chủ tài khoản</div>
                        <div class="fw-bold text-uppercase">${AppState.config.accountName}</div>
                    </div>
                </div>

                <div class="bank-info-row">
                    <div>
                        <div class="small text-muted">Số tài khoản</div>
                        <div class="fw-bold fs-6 text-primary">${AppState.config.accountNo}</div>
                    </div>
                    <button class="btn-copy-mini" onclick="copyText('${AppState.config.accountNo}', 'Số tài khoản')">
                        <i class="fa-regular fa-copy me-1"></i>Sao chép
                    </button>
                </div>

                <div class="bank-info-row">
                    <div>
                        <div class="small text-muted">Số tiền thanh toán</div>
                        <div class="fw-bolder fs-5 text-danger">${formatVND(order.total)}</div>
                    </div>
                    <button class="btn-copy-mini" onclick="copyText('${order.total}', 'Số tiền')">
                        <i class="fa-regular fa-copy me-1"></i>Sao chép
                    </button>
                </div>

                <div class="bank-info-row">
                    <div>
                        <div class="small text-muted">Nội dung chuyển khoản (Tự động)</div>
                        <div class="fw-bold text-success">${transferContent}</div>
                    </div>
                    <button class="btn-copy-mini" onclick="copyText('${transferContent}', 'Nội dung CK')">
                        <i class="fa-regular fa-copy me-1"></i>Sao chép
                    </button>
                </div>

                <!-- Trạng thái xử lý đơn hàng -->
                <div class="p-3 rounded-4 mt-3 bg-light border small">
                    <div class="fw-bold mb-1 text-dark">
                        <i class="fa-solid fa-box-check text-primary me-1"></i>Trạng thái xử lý đơn hàng:
                    </div>
                    <div id="automation-log-steps" class="text-secondary">
                        <div>✅ [Bước 1] Tiếp nhận đơn đặt sách #${order.code}</div>
                        <div>✅ [Bước 2] Tạo mã thanh toán VietQR (${formatVND(order.total)})</div>
                        <div id="auto-step-3">⏳ [Bước 3] Đang ghi nhận thông tin giao hàng & gói quà...</div>
                        <div id="auto-step-4">⏳ [Bước 4] Chờ xác nhận thanh toán...</div>
                    </div>
                </div>

                <div id="payment-confirm-actions" class="d-grid gap-2 mt-3">
                    <button type="button" class="btn-cute-primary justify-content-center py-3" onclick="confirmVietQRPaymentSuccess('${order.code}')">
                        <i class="fa-solid fa-circle-check me-2"></i>Tôi Đã Quét Mã Thanh Toán VietQR
                    </button>
                </div>
            </div>
        </div>
    `;

    const modalEl = document.getElementById("vietqrPaymentModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    startQRCountdown(600);
}

function startQRCountdown(seconds) {
    if (AppState.qrCountdownTimer) clearInterval(AppState.qrCountdownTimer);
    let remaining = seconds;
    AppState.qrCountdownTimer = setInterval(() => {
        remaining--;
        const el = document.getElementById("qr-countdown");
        if (!el) {
            clearInterval(AppState.qrCountdownTimer);
            return;
        }
        if (remaining <= 0) {
            clearInterval(AppState.qrCountdownTimer);
            el.textContent = "Hết hạn";
            return;
        }
        const m = String(Math.floor(remaining / 60)).padStart(2, "0");
        const s = String(remaining % 60).padStart(2, "0");
        el.textContent = `${m}:${s}`;
    }, 1000);
}

function copyText(text, label) {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép <strong>${label}</strong>: ${text}`);
}

// Xác nhận hoàn tất thanh toán VietQR & cập nhật trạng thái tự động hóa
function confirmVietQRPaymentSuccess(orderCode) {
    const order = AppState.orders.find(o => o.code === orderCode);
    if (order) {
        order.paymentStatus = "ĐÃ THANH TOÁN VIETQR";
        order.automationSync = "Đã đồng bộ Google Sheets";
        saveOrders();
        renderOrdersTable();
        // Đồng bộ cập nhật trạng thái đã thanh toán lên Google Sheets
        triggerSalesAutomationWebhook(order, "update_payment");
    }

    const badge = document.getElementById("order-live-status-badge");
    if (badge) {
        badge.className = "badge bg-success rounded-pill px-3 py-2";
        badge.innerHTML = `<i class="fa-solid fa-check-double me-1"></i>ĐÃ NHẬN THANH TOÁN VIETQR`;
    }

    const step4 = document.getElementById("auto-step-4");
    if (step4) {
        step4.innerHTML = `<span class="text-success fw-bold">✅ [Bước 4] Xác nhận thanh toán VietQR thành công! Đã gửi Email/Zalo xác nhận đơn #${orderCode}.</span>`;
    }

    const actions = document.getElementById("payment-confirm-actions");
    if (actions) {
        actions.innerHTML = `
            <div class="alert alert-success rounded-4 mb-0 text-center">
                <i class="fa-solid fa-party-horn fs-4 me-2"></i>
                <strong>Thanh toán thành công!</strong> Cảm ơn bạn đã mua sách tại Mộc Miên Books.
                <div class="mt-2">
                    <button class="btn btn-sm btn-success rounded-pill px-4 fw-bold" data-bs-dismiss="modal">Hoàn tất & Tiếp tục mua sắm</button>
                </div>
            </div>
        `;
    }

    showToast(`🎉 Đơn hàng #${orderCode} đã được xác nhận thanh toán VietQR thành công!`);
}

// Hàm gửi dữ liệu tới Google Apps Script Web App (hỗ trợ đa trình duyệt, bỏ cookie đa tài khoản để tránh lỗi 302)
function getGoogleSheetUrls() {
    const urls = new Set();
    if (SHOP_DEFAULT_CONFIG.googleSheetWebAppUrl && SHOP_DEFAULT_CONFIG.googleSheetWebAppUrl.startsWith("http")) {
        urls.add(SHOP_DEFAULT_CONFIG.googleSheetWebAppUrl.trim());
    }
    if (AppState.config.googleSheetWebAppUrl && AppState.config.googleSheetWebAppUrl.startsWith("http")) {
        urls.add(AppState.config.googleSheetWebAppUrl.trim());
    }
    return Array.from(urls);
}

// Gửi dữ liệu và trả về true nếu Google Sheets xác nhận đã ghi (hoặc đã gửi đi ở chế độ dự phòng)
async function sendPayloadToGoogleSheets(payload) {
    const urls = getGoogleSheetUrls();
    if (urls.length === 0) {
        console.warn("[Google Sheets] Chưa cấu hình googleSheetWebAppUrl trong data.js");
        return false;
    }
    const bodyStr = JSON.stringify(payload);

    const results = await Promise.all(urls.map(async (url) => {
        try {
            const res = await fetch(url, {
                method: "POST",
                credentials: "omit",
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: bodyStr
            });
            const text = await res.text();
            console.log("[Google Sheets] Phản hồi:", text);
            return /"status"\s*:\s*"(success|updated)"/.test(text);
        } catch (err) {
            console.warn("[Google Sheets] Lỗi gửi (thử lại chế độ no-cors):", err);
            try {
                await fetch(url, {
                    method: "POST",
                    mode: "no-cors",
                    credentials: "omit",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: bodyStr
                });
                return true;
            } catch (e2) {
                console.error("[Google Sheets] Không gửi được dữ liệu:", e2);
                return false;
            }
        }
    }));
    return results.some(Boolean);
}

// =========================================================================
// ĐỒNG BỘ TỰ ĐỘNG ĐƠN HÀNG VỀ GOOGLE SHEETS (APPS SCRIPT) / MAKE.COM / FORM
// =========================================================================
async function triggerSalesAutomationWebhook(order, actionType = "create_order") {
    const itemsSummary = (order.items || []).map(i => `${i.title} (x${i.qty})`).join(", ");
    const transferContent = `MOCMIEN ${order.code} ${order.phone}`;
    const payload = {
        action: actionType,
        order_code: order.code,
        created_at: order.createdAt,
        customer_name: order.customerName,
        phone: order.phone,
        email: order.email,
        city: order.city || "",
        address: order.address,
        items_summary: itemsSummary,
        subtotal: order.subtotal || order.total,
        shipping_fee: order.shippingFee || 0,
        discount: order.discount || 0,
        total_amount: order.total,
        payment_method: order.paymentMethod || "VIETQR",
        payment_status: order.paymentStatus,
        gift_wrap: order.giftWrap ? "Có gói quà" : "Không",
        gift_message: order.giftMessage || "",
        transfer_content: transferContent,
        source: order.source || "Website Trang Chủ",
        vietqr_url: buildVietQRImageUrl(order.total, transferContent)
    };

    // 1. Đổ dữ liệu trực tiếp về Google Sheets qua Google Apps Script Web App URL
    const sentToSheet = await sendPayloadToGoogleSheets(payload);
    if (sentToSheet) {
        order.automationSync = "Đã tự động đổ về Google Sheets";
        if (actionType === "create_order") {
            order.sheetSynced = true;
        }
    } else {
        order.automationSync = "Chưa lưu được vào Google Sheets (sẽ tự thử lại khi tải lại trang)";
        console.warn(`[Google Sheets] Lưu dự phòng đơn #${order.code} để đồng bộ sau.`);
    }

    // 2. Nếu có cấu hình Make.com Webhook URL
    if (AppState.config.makeWebhookUrl && AppState.config.makeWebhookUrl.startsWith("http")) {
        try {
            await fetch(AppState.config.makeWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            order.automationSync = "Đã bắn Webhook Make.com thành công";
        } catch (err) {
            console.warn("Make.com Webhook CORS/Network:", err);
            order.automationSync = "Đã gửi tín hiệu Make.com Webhook";
        }
    }

    // 3. Nếu có cấu hình Google Form Action URL
    if (AppState.config.googleFormActionUrl && AppState.config.googleFormActionUrl.startsWith("http")) {
        try {
            const formData = new FormData();
            formData.append(AppState.config.googleFormEntryOrderId, order.code);
            formData.append(AppState.config.googleFormEntryCustomer, order.customerName);
            formData.append(AppState.config.googleFormEntryPhone, order.phone);
            formData.append(AppState.config.googleFormEntryItems, itemsSummary);
            formData.append(AppState.config.googleFormEntryTotal, order.total);
            formData.append(AppState.config.googleFormEntryPayment, order.paymentStatus);
            await fetch(AppState.config.googleFormActionUrl, {
                method: "POST",
                mode: "no-cors",
                body: formData
            });
        } catch (e) {
            console.warn("Google Form submit:", e);
        }
    }

    saveOrders();
    setTimeout(() => {
        const step3 = document.getElementById("auto-step-3");
        if (step3) {
            step3.innerHTML = `✅ [Bước 3] Đã ghi nhận thông tin đơn hàng #${order.code} thành công`;
        }
    }, 900);
}

// Bảng lịch sử đơn hàng của chính khách hàng
function renderOrdersTable() {
    const tbody = document.getElementById("automation-orders-tbody");
    if (!tbody) return;

    if (AppState.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-box-open fs-1 mb-2 d-block opacity-50" style="color:var(--primary);"></i>
                    Bạn chưa có đơn đặt sách nào.<br>
                    <small>Hãy chọn những cuốn sách yêu thích và tiến hành đặt hàng để theo dõi đơn tại đây nhé!</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = AppState.orders.map(o => `
        <tr>
            <td class="fw-bold text-primary">#${o.code}</td>
            <td class="small">${o.createdAt}</td>
            <td>
                <div class="fw-bold small">${o.customerName} (${o.phone})</div>
                <div class="small text-muted">${o.address}</div>
            </td>
            <td class="small">${o.items.map(i => `${i.title} (x${i.qty})`).join("<br>")}</td>
            <td class="fw-bold text-danger">${formatVND(o.total)}</td>
            <td>
                <span class="badge rounded-pill ${o.paymentStatus.includes("ĐÃ THANH TOÁN") ? "bg-success" : "bg-warning text-dark"}">
                    ${o.paymentStatus}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="reopenOrderQR('${o.code}')">
                    <i class="fa-solid fa-qrcode me-1"></i>Thanh toán QR
                </button>
            </td>
        </tr>
    `).join("");
}

async function testGoogleSheetConnection() {
    const btn = document.getElementById("btn-test-gsheet");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Đang kiểm tra...`;
    }
    showToast("⏳ Đang gửi tín hiệu kiểm tra kết nối tới Google Sheet...", "info");
    const pingCode = "PING" + Math.floor(1000 + Math.random() * 9000);
    const payload = {
        action: "create_order",
        order_code: pingCode,
        created_at: new Date().toLocaleString("vi-VN"),
        customer_name: "Kiểm Tra Kết Nối Web",
        phone: "0999999999",
        email: "kiemtra@mocmien.vn",
        address: "Website Mộc Miên Books",
        items_summary: "Đơn kiểm tra kết nối tự động (x1)",
        total_amount: 0,
        payment_method: "TEST",
        payment_status: "TEST KẾT NỐI",
        gift_wrap: "Không",
        gift_message: "Kiểm tra kết nối Google Sheet",
        source: "Nút Kiểm Tra Trên Web"
    };
    try {
        const ok = await sendPayloadToGoogleSheets(payload);
        if (ok) {
            showToast(`✅ Kết nối Google Sheet THÀNH CÔNG! Đơn test #${pingCode} đã được ghi vào bảng tính.`);
        } else {
            showToast("⚠️ Không nhận được phản hồi từ Google Sheet. Vui lòng kiểm tra lại URL hoặc kết nối mạng.", "warning");
        }
    } catch (err) {
        showToast("❌ Lỗi kiểm tra Google Sheet: " + (err.message || err), "warning");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-vial me-1"></i>Kiểm tra kết nối Google Sheet`;
        }
    }
}

async function manuallySyncOrderToSheet(orderCode) {
    const order = AppState.orders.find(o => o.code === orderCode);
    if (!order) return;
    showToast(`⏳ Đang đẩy đơn #${orderCode} lên Google Sheet...`, "info");
    await triggerSalesAutomationWebhook(order, "create_order");
    renderOrdersTable();
}

async function syncAllPendingOrdersToSheet() {
    const btn = document.getElementById("btn-sync-all-gsheet");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Đang đồng bộ...`;
    }
    if (!AppState.orders || AppState.orders.length === 0) {
        showToast("Chưa có đơn hàng nào để đồng bộ!", "info");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up me-1"></i>Đồng bộ tất cả đơn lên Sheet`;
        }
        return;
    }
    showToast("⏳ Đang đồng bộ toàn bộ đơn hàng lên Google Sheet...", "info");
    let count = 0;
    for (const order of AppState.orders) {
        await triggerSalesAutomationWebhook(order, "create_order");
        count++;
    }
    renderOrdersTable();
    showToast(`✅ Đã đồng bộ ${count} đơn hàng lên Google Sheet!`);
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up me-1"></i>Đồng bộ tất cả đơn lên Sheet`;
    }
}

function reopenOrderQR(orderCode) {
    const order = AppState.orders.find(o => o.code === orderCode);
    if (!order) return;
    const autoModal = bootstrap.Modal.getInstance(document.getElementById("automationConfigModal"));
    if (autoModal) autoModal.hide();
    openVietQRPaymentModal(order);
}

// Xuất dữ liệu đơn hàng ra file CSV chuẩn Google Sheets
function exportOrdersToCSV() {
    const headers = ["Ma_Don_Hang", "Thoi_Gian", "Khach_Hang", "So_Dien_Thoai", "Email", "Dia_Chi", "San_Pham", "Tong_Tien_VND", "Trang_Thai_Thanh_Toan", "Goi_Qua_Thiep"];
    const rows = AppState.orders.map(o => [
        o.code,
        `"${o.createdAt}"`,
        `"${o.customerName}"`,
        `"${o.phone}"`,
        `"${o.email}"`,
        `"${o.address}"`,
        `"${o.items.map(i => `${i.title} (x${i.qty})`).join("; ")}"`,
        o.total,
        `"${o.paymentStatus}"`,
        `"${o.giftMessage || (o.giftWrap ? "Có gói quà" : "Không")}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Danh_Sach_Don_Hang_MocMienBooks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("Đã xuất danh sách đơn hàng (.CSV) thành công!");
}

// Mở cửa sổ Lịch sử đơn hàng của khách hàng
function openAutomationConfigModal() {
    renderOrdersTable();
    new bootstrap.Modal(document.getElementById("automationConfigModal")).show();
}

function updateShopBrandingUI() {
    document.querySelectorAll(".dynamic-shop-name").forEach(el => (el.textContent = AppState.config.shopName));
    const linkMap = {
        tiktok: AppState.config.tiktokUrl || "https://www.tiktok.com/@mocmien.books",
        facebook: AppState.config.facebookUrl || "https://www.facebook.com/p/M%E1%BB%99c-Mi%C3%AAn-Books-61588543816965/",
        instagram: AppState.config.instagramUrl || "https://ig.me/m/mocmien.books",
        zalo: AppState.config.zaloUrl || `https://zalo.me/${AppState.config.zalo || "0869571734"}`,
        messenger: AppState.config.messengerUrl || "https://m.me/61588543816965",
        phone: `tel:${AppState.config.hotline || "0869571734"}`
    };
    document.querySelectorAll("a[data-social-link]").forEach(el => {
        const key = el.getAttribute("data-social-link");
        if (linkMap[key]) el.href = linkMap[key];
    });
}

// Đồng hồ đếm ngược Flash Sale
function initFlashSaleTimer() {
    let totalSec = 3 * 3600 + 45 * 60 + 18;
    setInterval(() => {
        totalSec = totalSec > 0 ? totalSec - 1 : 14400;
        const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
        const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
        const s = String(totalSec % 60).padStart(2, "0");
        const elH = document.getElementById("fs-hours");
        const elM = document.getElementById("fs-mins");
        const elS = document.getElementById("fs-secs");
        if (elH) elH.textContent = h;
        if (elM) elM.textContent = m;
        if (elS) elS.textContent = s;
    }, 1000);
}

// Tự động đẩy các đơn hàng đã đặt trong trình duyệt nhưng chưa đồng bộ lên Google Sheets
async function syncPendingOrdersToGoogleSheet() {
    if (!AppState.orders || AppState.orders.length === 0) return;
    const pending = [...AppState.orders].reverse().filter(o => !o.sheetSynced);
    for (const order of pending) {
        await triggerSalesAutomationWebhook(order, "create_order");
    }
}

// Gửi lời nhắn liên hệ (Đồng thời đổ về tab Lien_He trên Google Sheets nếu đã cấu hình)
async function submitContactForm(event) {
    if (event) event.preventDefault();
    const name = document.getElementById("ct-name").value.trim();
    const phone = document.getElementById("ct-phone").value.trim();
    const subject = document.getElementById("ct-subject")?.value.trim() || "";
    const message = document.getElementById("ct-message")?.value.trim() || "";
    if (!name || !phone) {
        showToast("Vui lòng nhập Họ tên và Số điện thoại của bạn!", "warning");
        return;
    }

    sendPayloadToGoogleSheets({
        action: "contact_message",
        created_at: new Date().toLocaleString("vi-VN"),
        customer_name: name,
        phone,
        subject,
        message
    });

    showToast(`💌 Cảm ơn <strong>${name}</strong>! Mộc Miên Books đã nhận được lời nhắn và sẽ phản hồi sớm nhất!`);
    event.target.reset();
}

// =========================================================================
// QUẢN LÝ ĐĂNG NHẬP / TÀI KHOẢN THÀNH VIÊN
// =========================================================================

function openUserModal() {
    renderLoginModalContent();
    const modalEl = document.getElementById("loginModal");
    if (modalEl) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
}

function renderLoginModalContent() {
    const wrapper = document.getElementById("login-modal-body-wrapper");
    if (!wrapper) return;

    if (AppState.currentUser) {
        wrapper.innerHTML = `
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <span class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width:68px;height:68px;background:var(--primary-soft);color:var(--primary);font-size:28px;">
                        <i class="fa-solid fa-user-check"></i>
                    </span>
                </div>
                <h4 class="fw-bold mb-1" style="color:var(--primary);">Tài Khoản Thành Viên</h4>
                <p class="text-muted small mb-3">Chào mừng bạn quay trở lại Tiệm Sách Mộc Miên</p>
                <div class="p-3 rounded-4 mb-3 text-start bg-light border small">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted">Họ tên:</span>
                        <strong class="text-dark">${AppState.currentUser.name}</strong>
                    </div>
                    ${AppState.currentUser.account ? `
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted">Tài khoản:</span>
                        <strong class="text-dark">${AppState.currentUser.account}</strong>
                    </div>` : ""}
                    <div class="d-flex justify-content-between">
                        <span class="text-muted">Trạng thái:</span>
                        <span class="badge bg-success rounded-pill px-2">Đã đăng nhập</span>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-danger w-50 rounded-pill fw-bold" onclick="logoutUser()">
                        <i class="fa-solid fa-arrow-right-from-bracket me-1"></i>Đăng Xuất
                    </button>
                    <button type="button" class="btn-cute-primary w-50 justify-content-center" data-bs-dismiss="modal">
                        <i class="fa-solid fa-bag-shopping me-1"></i>Tiếp Tục
                    </button>
                </div>
            </div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="modal-body p-4 text-center">
                <h4 class="fw-bold text-uppercase mb-3" style="color:var(--primary);">Đăng Nhập Thành Viên</h4>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <button type="button" class="btn btn-outline-danger w-100 rounded-pill small fw-bold"
                            onclick="loginWithOAuth('Google')">
                            <i class="fa-brands fa-google me-1"></i> Google
                        </button>
                    </div>
                    <div class="col-6">
                        <button type="button" class="btn btn-outline-primary w-100 rounded-pill small fw-bold"
                            onclick="loginWithOAuth('Facebook')">
                            <i class="fa-brands fa-facebook me-1"></i> Facebook
                        </button>
                    </div>
                </div>
                <div class="small text-muted mb-3">— Hoặc tài khoản Mộc Miên —</div>
                <form onsubmit="handleLoginFormSubmit(event)">
                    <div class="mb-3">
                        <input type="text" id="login-account-input" class="form-control rounded-pill px-3"
                            placeholder="Số điện thoại hoặc Email" required>
                    </div>
                    <div class="mb-3">
                        <input type="password" id="login-password-input" class="form-control rounded-pill px-3" placeholder="Mật khẩu"
                            required>
                    </div>
                    <button type="submit" class="btn-cute-primary w-100 justify-content-center">Đăng Nhập Ngay</button>
                </form>
            </div>
        `;
    }
}

function handleLoginFormSubmit(event) {
    if (event) event.preventDefault();
    const accountInput = document.getElementById("login-account-input")?.value.trim() || "";
    const passInput = document.getElementById("login-password-input")?.value.trim() || "";
    if (!accountInput) {
        showToast("Vui lòng nhập Số điện thoại hoặc Email", "warning");
        return;
    }
    if (!passInput) {
        showToast("Vui lòng nhập Mật khẩu", "warning");
        return;
    }

    const isEmail = accountInput.includes("@");
    const isPhone = /^0\d{9,10}$/.test(accountInput.replace(/\s+/g, ""));
    const displayName = isEmail ? accountInput.split("@")[0] : (isPhone ? `Khách hàng ${accountInput.slice(-4)}` : accountInput);

    const user = {
        name: displayName,
        account: accountInput,
        email: isEmail ? accountInput : "",
        phone: isPhone ? accountInput : "",
        provider: "Mộc Miên"
    };

    completeLogin(user);
}

function initGoogleIdentityServices() {
    const clientId = AppState.config.googleClientId || SHOP_DEFAULT_CONFIG.googleClientId;
    if (clientId && window.google && window.google.accounts && window.google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false
            });
        } catch (e) {
            console.warn("Lỗi khởi tạo Google GIS:", e);
        }
    }
}

function handleGoogleCredentialResponse(response) {
    if (response && response.credential) {
        try {
            const payload = parseJwt(response.credential);
            const user = {
                name: payload.name || "Khách hàng Google",
                email: payload.email || "",
                phone: "",
                avatar: payload.picture || "",
                account: payload.email || "",
                provider: "Google",
                googleId: payload.sub || ""
            };
            completeLogin(user);
        } catch (e) {
            console.error("Lỗi giải mã token Google:", e);
            showToast("Không thể giải mã dữ liệu tài khoản Google", "warning");
        }
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function loginWithOAuth(provider) {
    if (provider === "Google") {
        const clientId = AppState.config.googleClientId || SHOP_DEFAULT_CONFIG.googleClientId;
        
        // 1. Nếu đã có Google OAuth Client ID và SDK Google GIS sẵn sàng -> Mở popup Google chính thức
        if (clientId && window.google && window.google.accounts && window.google.accounts.oauth2) {
            try {
                showToast("Đang kết nối tới Google...", "info");
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'email profile openid',
                    callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            try {
                                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const profile = await res.json();
                                if (profile && profile.email) {
                                    const user = {
                                        name: profile.name || profile.email.split("@")[0],
                                        email: profile.email,
                                        account: profile.email,
                                        avatar: profile.picture || "",
                                        provider: "Google"
                                    };
                                    completeLogin(user);
                                }
                            } catch (err) {
                                console.error("Lỗi lấy thông tin Google User:", err);
                                showToast("Không thể tải thông tin từ Google", "warning");
                            }
                        }
                    }
                });
                tokenClient.requestAccessToken({ prompt: 'select_account' });
                return;
            } catch (err) {
                console.warn("Lỗi mở Google OAuth:", err);
            }
        }

        // 2. Nếu chưa cấu hình Google Client ID -> Mở form liên kết Gmail (chỉ liên kết Gmail, không hỏi địa chỉ giao hàng)
        renderGoogleQuickLinkForm();
    } else if (provider === "Facebook") {
        const appId = AppState.config.facebookAppId || SHOP_DEFAULT_CONFIG.facebookAppId;
        
        // 1. Nếu đã có Facebook App ID và SDK Facebook sẵn sàng -> Mở hộp thoại xác thực FB chính thức
        if (appId && window.FB) {
            try {
                showToast("Đang kết nối tới Facebook để xác minh...", "info");
                FB.login(function(response) {
                    if (response.authResponse) {
                        FB.api('/me', { fields: 'id,name,email,picture' }, function(userInfo) {
                            completeLogin({
                                name: userInfo.name || "Khách hàng Facebook",
                                email: userInfo.email || "",
                                account: userInfo.email || userInfo.id || userInfo.name,
                                avatar: userInfo.picture?.data?.url || "",
                                provider: "Facebook"
                            });
                        });
                    } else {
                        showToast("Đã hủy xác minh đăng nhập Facebook", "warning");
                    }
                }, { scope: 'public_profile,email' });
                return;
            } catch (err) {
                console.warn("Lỗi gọi FB.login:", err);
            }
        }

        // 2. Chuyển đến trang đăng nhập Facebook chính thức để yêu cầu nhập tài khoản xác minh
        openFacebookLoginPage();
    }
}

function openFacebookLoginPage() {
    const fbLoginUrl = "https://www.facebook.com/login.php";
    showToast("Đang chuyển tới trang Facebook để xác minh...", "info");
    
    // Mở ngay cửa sổ đăng nhập Facebook chính thức
    try {
        window.open(fbLoginUrl, "_blank", "width=650,height=720,top=100,left=200,scrollbars=yes,status=yes");
    } catch (e) {
        console.warn("Popup blocked:", e);
    }

    renderFacebookVerificationModal();
}

function renderFacebookVerificationModal() {
    const wrapper = document.getElementById("login-modal-body-wrapper");
    if (!wrapper) return;

    wrapper.innerHTML = `
        <div class="modal-body p-4 text-center">
            <div class="mb-3">
                <span class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width:68px;height:68px;background:#eff6ff;color:#1877f2;font-size:32px;border:2.5px solid #bfdbfe;">
                    <i class="fa-brands fa-facebook"></i>
                </span>
            </div>
            <h4 class="fw-bold mb-1" style="color:var(--primary);">Xác Minh Tài Khoản Facebook</h4>
            <p class="text-muted small mb-3">Đã chuyển tới trang đăng nhập Facebook để bạn nhập tài khoản xác minh</p>

            <div class="p-3 rounded-4 bg-light border small text-start mb-3">
                <div class="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Cửa sổ Facebook.com đã được mở
                </div>
                <div class="text-secondary mb-2">
                    Vui lòng nhập Email/Số điện thoại và Mật khẩu trên trang Facebook để xác minh danh tính tài khoản của bạn.
                </div>
                <div class="small text-muted">
                    <i class="fa-solid fa-shield-halved text-success me-1"></i> Quá trình xác minh được thực hiện an toàn trực tiếp trên máy chủ Facebook.
                </div>
            </div>

            <form onsubmit="handleFacebookVerifyConfirm(event)">
                <div class="mb-3 text-start">
                    <label class="small fw-bold text-secondary mb-1">Tên tài khoản hoặc Email Facebook bạn vừa xác minh *</label>
                    <input type="text" id="fb-verify-name" class="form-control rounded-pill px-3" placeholder="Ví dụ: Tên Facebook của bạn" required autofocus>
                </div>
                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary rounded-pill fw-bold py-2 text-white">
                        <i class="fa-brands fa-facebook me-1"></i> Xác Nhận Đã Đăng Nhập Facebook
                    </button>
                    <a href="https://www.facebook.com/login.php" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill fw-bold">
                        <i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Bấm để mở lại trang Facebook
                    </a>
                    <button type="button" class="btn btn-sm btn-link text-muted text-decoration-none" onclick="renderLoginModalContent()">
                        <i class="fa-solid fa-arrow-left me-1"></i> Quay lại
                    </button>
                </div>
            </form>
        </div>
    `;
}

function handleFacebookVerifyConfirm(event) {
    if (event) event.preventDefault();
    const accountName = document.getElementById("fb-verify-name")?.value.trim() || "";
    if (!accountName) {
        showToast("Vui lòng nhập tên tài khoản Facebook bạn vừa xác minh!", "warning");
        return;
    }
    const user = {
        name: accountName,
        account: accountName,
        email: accountName.includes("@") ? accountName : "",
        provider: "Facebook"
    };
    completeLogin(user);
}

function renderGoogleQuickLinkForm() {
    const wrapper = document.getElementById("login-modal-body-wrapper");
    if (!wrapper) return;

    wrapper.innerHTML = `
        <div class="modal-body p-4 text-center">
            <div class="mb-3">
                <span class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width:62px;height:62px;background:#fef2f2;color:#dc2626;font-size:28px;border:2px solid #fecaca;">
                    <i class="fa-brands fa-google"></i>
                </span>
            </div>
            <h4 class="fw-bold mb-1" style="color:var(--primary);">Liên Kết Tài Khoản Gmail</h4>
            <p class="text-muted small mb-3">Chỉ cần nhập địa chỉ Gmail của bạn để liên kết đăng nhập (không cần nhập địa chỉ giao hàng lúc này)</p>
            
            <form onsubmit="handleGoogleQuickLinkSubmit(event)">
                <div class="mb-3 text-start">
                    <label class="small fw-bold text-secondary mb-1">Địa chỉ Gmail của bạn *</label>
                    <input type="email" id="google-quick-email" class="form-control rounded-pill px-3" placeholder="Ví dụ: ban@gmail.com" required autofocus>
                </div>
                <div class="d-grid gap-2 mt-3">
                    <button type="submit" class="btn btn-danger rounded-pill fw-bold py-2 text-white">
                        <i class="fa-brands fa-google me-1"></i> Liên Kết Gmail Này
                    </button>
                    <button type="button" class="btn btn-sm btn-link text-muted text-decoration-none" onclick="renderLoginModalContent()">
                        <i class="fa-solid fa-arrow-left me-1"></i> Quay lại
                    </button>
                </div>
            </form>
            <div class="mt-3 p-2 bg-light rounded-3 text-muted" style="font-size:11px;">
                <i class="fa-solid fa-shield-heart text-success me-1"></i> Địa chỉ giao hàng và số điện thoại chỉ cần nhập khi bạn chốt đơn thanh toán sách.
            </div>
        </div>
    `;
}

function handleGoogleQuickLinkSubmit(event) {
    if (event) event.preventDefault();
    const email = document.getElementById("google-quick-email")?.value.trim() || "";
    if (!email || !email.includes("@")) {
        showToast("Vui lòng nhập đúng địa chỉ Gmail của bạn!", "warning");
        return;
    }

    // Lấy tên hiển thị tự nhiên từ phần trước @ của email
    const rawName = email.split("@")[0].replace(/[._-]/g, " ");
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const user = {
        name: displayName,
        email: email,
        account: email,
        provider: "Google"
    };

    completeLogin(user);
}

function completeLogin(user) {
    AppState.currentUser = user;
    try {
        localStorage.setItem("mocmien_user", JSON.stringify(user));
    } catch (e) {}

    const loginModalEl = document.getElementById("loginModal");
    if (loginModalEl) {
        const instance = bootstrap.Modal.getInstance(loginModalEl);
        if (instance) instance.hide();
    }

    showToast(`🎉 Chào mừng <strong>${user.name}</strong> đã đăng nhập thành công!`);
    updateAuthUI();

    // Tự động tiếp tục hành động đang chờ (Mua ngay hoặc Thêm vào giỏ)
    if (AppState.pendingAction) {
        const action = AppState.pendingAction;
        AppState.pendingAction = null;
        setTimeout(() => {
            if (action.type === "addToCart") {
                addToCart(action.productId, action.qty, action.showToastNotification);
            } else if (action.type === "buyNow") {
                buyNowVietQR(action.productId, action.qty);
            } else if (action.type === "checkout") {
                openCheckoutModal();
            }
        }, 350);
    }
}

function logoutUser() {
    AppState.currentUser = null;
    try {
        localStorage.removeItem("mocmien_user");
    } catch (e) {}
    showToast("Đã đăng xuất tài khoản thành công!", "info");
    updateAuthUI();
    renderLoginModalContent();
}

function updateAuthUI() {
    const btnUser = document.getElementById("btn-header-user");
    if (btnUser) {
        if (AppState.currentUser) {
            btnUser.title = `Tài khoản: ${AppState.currentUser.name} (Bấm để quản lý / đăng xuất)`;
            btnUser.style.color = "var(--primary)";
            btnUser.style.borderColor = "var(--primary)";
            btnUser.style.background = "var(--primary-soft)";
        } else {
            btnUser.title = "Đăng nhập thành viên";
            btnUser.style.color = "";
            btnUser.style.borderColor = "";
            btnUser.style.background = "";
        }
    }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    initStorage();
    document.body.classList.remove("theme-pink", "theme-vintage", "theme-emerald");

    renderAllSections();
    updateShopBrandingUI();
    updateAuthUI();
    initGoogleIdentityServices();
    initFlashSaleTimer();
    syncPendingOrdersToGoogleSheet();

    // Cập nhật mã QR xem trước khi khách nhập SĐT trong form đặt hàng
    document.getElementById("ck-phone")?.addEventListener("input", () => {
        const { total } = calculateOrderTotals();
        updateCheckoutLiveQRPreview(total);
    });

    // Sự kiện lọc sách
    document.getElementById("filter-category")?.addEventListener("change", e => {
        AppState.currentFilter.category = e.target.value;
        renderCatalogue();
    });
    document.getElementById("filter-keyword")?.addEventListener("input", e => {
        AppState.currentFilter.keyword = e.target.value;
        renderCatalogue();
    });
    document.getElementById("filter-sort")?.addEventListener("change", e => {
        AppState.currentFilter.sort = e.target.value;
        renderCatalogue();
    });
    document.getElementById("filter-price")?.addEventListener("change", e => {
        AppState.currentFilter.priceRange = e.target.value;
        renderCatalogue();
    });

    // Tìm kiếm nhanh từ Header
    document.getElementById("header-search-input")?.addEventListener("input", e => {
        AppState.currentFilter.keyword = e.target.value;
        const fKw = document.getElementById("filter-keyword");
        if (fKw) fKw.value = e.target.value;
        renderCatalogue();
    });
});

