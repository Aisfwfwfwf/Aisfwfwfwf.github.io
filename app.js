class CheesecakeApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.cart = {};
        this.products = [];
        this.deliveryCost = 200;
        this.isInitialized = false;
        this.botUsername = '@Syrniki_S_bot'; // ЗАМЕНИТЕ на username вашего бота

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
            this.tg.enableClosingConfirmation();
        }

        await this.renderProducts();
        this.setupEventListeners();
        this.updateCart();
    }

    async renderProducts() {
        this.elements.productsList.innerHTML = '';
        
        for (const product of this.products) {
            const workingImage = await this.getWorkingImage(product);
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${workingImage}" alt="${product.name}" class="product-image" 
                     onerror="this.src='${product.backupImage}'">
                <div class="product-title">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">${product.price} руб.</div>
                <div class="product-controls">
                    <button class="quantity-btn" data-action="decrease" data-id="${product.id}">-</button>
                    <span class="quantity">${this.cart[product.id] || 0}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${product.id}">+</button>
                </div>
            `;
            this.elements.productsList.appendChild(productCard);
        }
    }

    async getWorkingImage(product) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(product.image);
            img.onerror = () => resolve(product.backupImage);
            img.src = product.image;
        });
    }

    setupEventListeners() {
        this.elements.productsList.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                const productId = parseInt(button.dataset.id);
                const action = button.dataset.action;
                this.changeQuantity(productId, action === 'increase' ? 1 : -1);
            }
        });

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

        [this.elements.cartPopup, this.elements.orderPopup].forEach(popup => {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.style.display = 'none';
                }
            });
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
        const button = this.elements.productsList.querySelector(`[data-id="${productId}"][data-action]`);
        if (button) {
            const productCard = button.closest('.product-card');
            const quantityElement = productCard.querySelector('.quantity');
            if (quantityElement) {
                quantityElement.textContent = this.cart[productId] || 0;
            }
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
        
        this.elements.userAddress.required = this.elements.deliveryType.value === 'delivery';
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
        
        // Простая валидация телефона
        const phoneDigits = this.elements.userPhone.value.replace(/\D/g, '');
        if (phoneDigits.length < 11) {
            alert('Пожалуйста, укажите корректный номер телефона');
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
            orderId: this.generateOrderId()
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

        // Показываем чек и инструкции
        this.showOrderCheck(orderData);
        
        // Очищаем корзину
        this.clearCart();
    }

    generateOrderId() {
        return 'CH' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    showOrderCheck(orderData) {
        const checkText = this.formatCheckText(orderData);
        
        // Создаем модальное окно с чеком
        const modal = document.createElement('div');
        modal.className = 'check-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
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
                max-width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                text-align: center;
            ">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">✅ Заказ оформлен!</h3>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    text-align: left;
                    line-height: 1.4;
                ">
                    <pre style="margin: 0; white-space: pre-wrap;">${checkText}</pre>
                </div>
                
                <p style="color: #666; margin: 15px 0; font-size: 14px;">
                    📋 Чек скопирован в буфер обмена!<br>
                    Отправьте его нашему боту для подтверждения заказа
                </p>
                
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.open('https://t.me/${this.botUsername}', '_blank')" 
                            style="
                                background: #40a7e3;
                                color: white;
                                border: none;
                                padding: 12px 20px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                        💬 Открыть бота
                    </button>
                    
                    <button onclick="this.closest('.check-modal').remove()" 
                            style="
                                background: #95a5a6;
                                color: white;
                                border: none;
                                padding: 12px 20px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                        Закрыть
                    </button>
                </div>
                
                <p style="color: #888; margin-top: 15px; font-size: 12px;">
                    После отправки чека боту мы свяжемся с вами в течение 15 минут
                </p>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Копируем чек в буфер обмена
        this.copyToClipboard(checkText);
        
        // Закрываем приложение через 5 секунд если в Telegram
        if (this.tg) {
            setTimeout(() => {
                if (this.tg.close) {
                    this.tg.close();
                }
            }, 5000);
        }
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

    copyToClipboard(text) {
        try {
            // Создаем временный элемент для копирования
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            // Пытаемся скопировать
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                console.log('Чек скопирован в буфер обмена');
            }
        } catch (error) {
            console.error('Ошибка копирования:', error);
            // Показываем сообщение об ошибке
            alert('Не удалось скопировать чек. Пожалуйста, скопируйте текст вручную.');
        }
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
    const app = new CheesecakeApp();
    app.init();
});

// Добавьте этот CSS в ваш style.css
const additionalCSS = `
.check-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 20px;
}

.bot-button {
    background: var(--tg-theme-button-color, #40a7e3);
    color: var(--tg-theme-button-text-color, #ffffff);
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    margin: 10px auto;
    cursor: pointer;
    display: block;
    font-size: 14px;
}
`;

// Добавляем дополнительные стили
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
