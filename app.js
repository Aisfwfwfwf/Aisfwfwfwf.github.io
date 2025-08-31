class CheesecakeApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.cart = {};
        this.products = [];
        this.deliveryCost = 200;
        this.isInitialized = false;
        this.botUsername = 'Syrniki_S_bot'; // ЗАМЕНИТЕ на username вашего бота БЕЗ @

        this.initializeElements();
        this.loadProductsData();
    }

    initializeElements() {
        this.elements = {
            productsList: document.getElementById('productsList'),
            cartButton: document.getElementById('cartButton'),
            cartPopup: document.getElementById('cartPopup'),
            cartItems: document.getElementById('cartItems'),
            totalPrice: document.getElementById('totalPrice'),
            orderButton: document.getElementById('orderButton'),
            closeCart: document.getElementById('closeCart'),
            orderPopup: document.getElementById('orderPopup'),
            deliveryType: document.getElementById('deliveryType'),
            addressField: document.getElementById('addressField'),
            finalPrice: document.getElementById('finalPrice'),
            confirmOrderButton: document.getElementById('confirmOrderButton'),
            backToCartButton: document.getElementById('backToCartButton'),
            userName: document.getElementById('userName'),
            userPhone: document.getElementById('userPhone'),
            userAddress: document.getElementById('userAddress'),
            userComment: document.getElementById('userComment')
        };
    }

    loadProductsData() {
        this.products = [
            {
                id: 1,
                name: "Классические сырники",
                description: "С нежной сметаной и ванилью",
                price: 250,
                image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/raw/main/1.jpg",
                backupImage: "https://img.freepik.com/free-photo/syrniki-with-sour-cream_2829-11139.jpg"
            },
            {
                id: 2,
                name: "Сырники с шоколадом", 
                description: "С кусочками черного шоколада",
                price: 280,
                image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/raw/main/2.jpg",
                backupImage: "https://img.freepik.com/free-photo/chocolate-cheesecakes_144627-566.jpg"
            },
            {
                id: 3,
                name: "Сырники с изюмом",
                description: "Сочные с виноградным изюмом",
                price: 270,
                image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/raw/main/3.jpg",
                backupImage: "https://img.freepik.com/free-photo/raisin-cheesecakes_144627-565.jpg"
            },
            {
                id: 4,
                name: "Веганские сырники",
                description: "На кокосовых сливках без яиц",
                price: 300,
                image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/raw/main/4.jpg",
                backupImage: "https://img.freepik.com/free-photo/vegan-cheesecakes_144627-567.jpg"
            }
        ];
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (this.tg) {
            this.tg.expand();
        }

        this.renderProducts();
        this.setupEventListeners();
        this.updateCart();
    }

    renderProducts() {
        this.elements.productsList.innerHTML = '';
        
        for (const product of this.products) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='${product.backupImage}'">
                <div class="product-title">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">${product.price} руб.</div>
                <div class="product-controls">
                    <button class="quantity-btn" onclick="app.changeQuantity(${product.id}, -1)">-</button>
                    <span class="quantity" id="quantity-${product.id}">0</span>
                    <button class="quantity-btn" onclick="app.changeQuantity(${product.id}, 1)">+</button>
                </div>
            `;
            this.elements.productsList.appendChild(productCard);
        }
    }

    setupEventListeners() {
        // Корзина
        this.elements.cartButton.addEventListener('click', () => {
            this.elements.cartPopup.style.display = 'flex';
        });

        this.elements.closeCart.addEventListener('click', () => {
            this.elements.cartPopup.style.display = 'none';
        });

        this.elements.orderButton.addEventListener('click', () => {
            this.openOrderPopup();
        });

        this.elements.backToCartButton.addEventListener('click', () => {
            this.closeOrderPopup();
        });

        this.elements.confirmOrderButton.addEventListener('click', () => {
            this.processOrder();
        });

        this.elements.deliveryType.addEventListener('change', () => {
            this.toggleAddressField();
            this.calculateFinalTotal();
        });
    }

    changeQuantity(productId, delta) {
        if (!this.cart[productId]) this.cart[productId] = 0;
        this.cart[productId] += delta;
        
        if (this.cart[productId] < 0) this.cart[productId] = 0;
        
        this.updateProductQuantity(productId);
        this.updateCart();
    }

    updateProductQuantity(productId) {
        const quantityElement = document.getElementById(`quantity-${productId}`);
        if (quantityElement) {
            quantityElement.textContent = this.cart[productId] || 0;
        }
    }

    updateCart() {
        let total = 0;
        let totalCount = 0;
        
        for (const productId in this.cart) {
            if (this.cart[productId] > 0) {
                const product = this.products.find(p => p.id == productId);
                if (product) {
                    total += product.price * this.cart[productId];
                    totalCount += this.cart[productId];
                }
            }
        }
        
        this.elements.cartButton.textContent = `Корзина (${totalCount}) | ${total} руб.`;
        this.renderCartItems();
        this.elements.totalPrice.textContent = total;
        this.elements.finalPrice.textContent = total;
    }

    renderCartItems() {
        this.elements.cartItems.innerHTML = '';
        let isEmpty = true;
        
        for (const productId in this.cart) {
            if (this.cart[productId] > 0) {
                isEmpty = false;
                const product = this.products.find(p => p.id == productId);
                if (product) {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.innerHTML = `
                        <div>
                            <div>${product.name}</div>
                            <div>${product.price} руб. x ${this.cart[productId]}</div>
                        </div>
                        <div>${product.price * this.cart[productId]} руб.</div>
                    `;
                    this.elements.cartItems.appendChild(cartItem);
                }
            }
        }
        
        if (isEmpty) {
            this.elements.cartItems.innerHTML = '<div class="cart-empty">Корзина пуста</div>';
            this.elements.orderButton.style.display = 'none';
        } else {
            this.elements.orderButton.style.display = 'block';
        }
    }

    openOrderPopup() {
        this.calculateFinalTotal();
        this.elements.orderPopup.style.display = 'flex';
        this.elements.cartPopup.style.display = 'none';
    }

    closeOrderPopup() {
        this.elements.orderPopup.style.display = 'none';
        this.elements.cartPopup.style.display = 'flex';
    }

    toggleAddressField() {
        this.elements.addressField.style.display = 
            this.elements.deliveryType.value === 'delivery' ? 'block' : 'none';
    }

    calculateFinalTotal() {
        let productsTotal = parseInt(this.elements.totalPrice.textContent) || 0;
        let delivery = this.elements.deliveryType.value === 'delivery' ? this.deliveryCost : 0;
        let finalTotal = productsTotal + delivery;
        
        this.elements.finalPrice.textContent = finalTotal;
        return finalTotal;
    }

    validateForm() {
        if (!this.elements.userName.value.trim()) {
            alert('Пожалуйста, укажите ваше имя');
            return false;
        }
        
        if (!this.elements.userPhone.value.trim()) {
            alert('Пожалуйста, укажите ваш телефон');
            return false;
        }
        
        if (!this.elements.deliveryType.value) {
            alert('Пожалуйста, выберите способ получения');
            return false;
        }
        
        if (this.elements.deliveryType.value === 'delivery' && !this.elements.userAddress.value.trim()) {
            alert('Пожалуйста, укажите адрес доставки');
            return false;
        }

        return true;
    }

    processOrder() {
        if (!this.validateForm()) return;

        const orderData = {
            products: [],
            total: this.calculateFinalTotal(),
            deliveryType: this.elements.deliveryType.value,
            deliveryCost: this.elements.deliveryType.value === 'delivery' ? this.deliveryCost : 0,
            customer: {
                name: this.elements.userName.value.trim(),
                phone: this.elements.userPhone.value.trim(),
                address: this.elements.userAddress.value.trim() || 'Самовывоз',
                comment: this.elements.userComment.value.trim()
            },
            timestamp: new Date().toLocaleString('ru-RU'),
            orderId: 'CH' + Date.now().toString().slice(-6)
        };
        
        for (const productId in this.cart) {
            if (this.cart[productId] > 0) {
                const product = this.products.find(p => p.id == productId);
                if (product) {
                    orderData.products.push({
                        id: product.id,
                        name: product.name,
                        quantity: this.cart[productId],
                        price: product.price
                    });
                }
            }
        }

        // Показываем чек для копирования
        this.showCheck(orderData);
    }

    showCheck(orderData) {
        const checkText = this.formatCheckText(orderData);
        
        // Создаем модальное окно с чеком
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 20px;
                border-radius: 15px;
                max-width: 90%;
                max-height: 80vh;
                overflow: auto;
            ">
                <h3 style="color: #27ae60; text-align: center; margin-bottom: 15px;">
                    ✅ Заказ оформлен!
                </h3>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    font-family: monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                ">
                    ${checkText}
                </div>
                
                <p style="text-align: center; color: #666; margin: 15px 0;">
                    📋 Чек скопирован в буфер обмена!<br>
                    Отправьте его нашему боту для подтверждения заказа
                </p>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="app.copyCheck()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        📋 Скопировать чек
                    </button>
                    
                    <button onclick="app.openBot()" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        💬 Открыть бота
                    </button>
                </div>
                
                <button onclick="app.closeCheck()" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 15px;
                    width: 100%;
                ">
                    Закрыть
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Сохраняем текст чека
        this.currentCheck = checkText;
        
        // Копируем автоматически
        this.copyCheck();
    }

    formatCheckText(orderData) {
        const productsList = orderData.products.map(p => 
            `• ${p.name} × ${p.quantity} = ${p.quantity * p.price} руб.`
        ).join('\n');

        return `
🍰 ЧЕК ЗАКАЗА #${orderData.orderId}
━━━━━━━━━━━━━━━━━━━━
👤 КЛИЕНТ: ${orderData.customer.name}
📞 ТЕЛЕФОН: ${orderData.customer.phone}
📍 ${orderData.deliveryType === 'delivery' ? 'ДОСТАВКА' : 'САМОВЫВОЗ'}

${orderData.deliveryType === 'delivery' ? `🏠 АДРЕС: ${orderData.customer.address}\n` : ''}
🛒 ЗАКАЗ:
${productsList}
━━━━━━━━━━━━━━━━━━━━
💵 СУММА: ${orderData.total - orderData.deliveryCost} руб.
🚗 ДОСТАВКА: ${orderData.deliveryCost} руб.
💰 ИТОГО: ${orderData.total} руб.

📝 КОММЕНТАРИЙ: ${orderData.customer.comment || 'нет'}
🕒 ВРЕМЯ: ${orderData.timestamp}
━━━━━━━━━━━━━━━━━━━━
        `.trim();
    }

    copyCheck() {
        if (!this.currentCheck) return;
        
        try {
            const textarea = document.createElement('textarea');
            textarea.value = this.currentCheck;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            alert('✅ Чек скопирован в буфер обмена!');
        } catch (error) {
            alert('❌ Не удалось скопировать автоматически. Выделите текст и скопируйте вручную.');
        }
    }

    openBot() {
        window.open(`https://t.me/${this.botUsername}`, '_blank');
    }

    closeCheck() {
        const modal = document.querySelector('div[style*="position: fixed; top: 0;"]');
        if (modal) {
            modal.remove();
        }
        this.clearCart();
    }

    clearCart() {
        this.cart = {};
        this.updateCart();
        this.closeOrderPopup();
        
        // Очищаем форму
        this.elements.userName.value = '';
        this.elements.userPhone.value = '';
        this.elements.userAddress.value = '';
        this.elements.userComment.value = '';
        this.elements.deliveryType.selectedIndex = 0;
        this.toggleAddressField();
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    window.app = new CheesecakeApp();
    window.app.init();
});
