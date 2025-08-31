class CheesecakeApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.cart = {};
        this.products = [];
        this.deliveryCost = 200;
        this.isInitialized = false;
        this.botUsername = 'your_cheesecake_bot'; // ЗАМЕНИТЕ на username вашего бота
        this.lastOrder = null;

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
            userComment: document.getElementById('userComment'),
            userNameError: document.getElementById('userNameError'),
            userPhoneError: document.getElementById('userPhoneError'),
            deliveryTypeError: document.getElementById('deliveryTypeError'),
            userAddressError: document.getElementById('userAddressError')
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
            
            // Показываем кнопку "Открыть бота" если есть доступ к Telegram
            this.showBotButton();
        }

        await this.renderProducts();
        this.setupEventListeners();
        this.updateCart();
    }

    showBotButton() {
        if (document.querySelector('.bot-button')) return;
        
        const botButton = document.createElement('button');
        botButton.className = 'bot-button';
        botButton.innerHTML = '💬 Написать боту';
        botButton.onclick = () => {
            window.open(`https://t.me/${this.botUsername}`, '_blank');
        };
        
        document.querySelector('.header').appendChild(botButton);
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
            this.sendOrderToBot();
        });

        this.elements.deliveryType.addEventListener('change', () => {
            this.toggleAddressField();
            this.calculateFinalTotal();
        });

        // Валидация в реальном времени
        this.elements.userPhone.addEventListener('input', (e) => {
            this.validatePhoneNumber(e.target.value);
        });

        this.elements.userName.addEventListener('input', (e) => {
            this.hideError(this.elements.userNameError);
            e.target.classList.remove('error');
        });

        this.elements.deliveryType.addEventListener('change', () => {
            this.hideError(this.elements.deliveryTypeError);
            this.elements.deliveryType.classList.remove('error');
        });

        this.elements.userAddress.addEventListener('input', (e) => {
            this.hideError(this.elements.userAddressError);
            e.target.classList.remove('error');
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

    validatePhoneNumber(phone) {
        const cleanedPhone = phone.replace(/\D/g, '');
        
        if (cleanedPhone.length >= 1) {
            if (cleanedPhone.length < 11 || !cleanedPhone.startsWith('7') && !cleanedPhone.startsWith('8')) {
                this.showError(this.elements.userPhoneError, 'Номер должен начинаться с 7 или 8 и содержать 11 цифр');
                this.elements.userPhone.classList.add('error');
            } else {
                this.hideError(this.elements.userPhoneError);
                this.elements.userPhone.classList.remove('error');
            }
        } else {
            this.hideError(this.elements.userPhoneError);
            this.elements.userPhone.classList.remove('error');
        }

        // Автоформатирование номера
        if (cleanedPhone.length > 0) {
            let formattedPhone = '+7';
            
            if (cleanedPhone.length > 1) {
                formattedPhone += ' (' + cleanedPhone.substring(1, 4);
            }
            if (cleanedPhone.length > 4) {
                formattedPhone += ') ' + cleanedPhone.substring(4, 7);
            }
            if (cleanedPhone.length > 7) {
                formattedPhone += '-' + cleanedPhone.substring(7, 9);
            }
            if (cleanedPhone.length > 9) {
                formattedPhone += '-' + cleanedPhone.substring(9, 11);
            }

            if (this.elements.userPhone === document.activeElement) {
                const cursorPosition = this.elements.userPhone.selectionStart;
                this.elements.userPhone.value = formattedPhone;
                
                setTimeout(() => {
                    this.elements.userPhone.setSelectionRange(cursorPosition, cursorPosition);
                }, 0);
            }
        }
    }

    isValidPhoneNumber(phone) {
        const cleanedPhone = phone.replace(/\D/g, '');
        return cleanedPhone.length === 11 && (cleanedPhone.startsWith('7') || cleanedPhone.startsWith('8'));
    }

    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
    }

    hideError(element) {
        element.classList.remove('show');
    }

    validateForm() {
        let isValid = true;

        // Валидация имени
        if (!this.elements.userName.value.trim()) {
            this.showError(this.elements.userNameError, 'Пожалуйста, укажите ваше имя');
            this.elements.userName.classList.add('error');
            isValid = false;
        } else {
            this.hideError(this.elements.userNameError);
            this.elements.userName.classList.remove('error');
        }

        // Валидация телефона
        const phone = this.elements.userPhone.value;
        if (!phone.trim()) {
            this.showError(this.elements.userPhoneError, 'Пожалуйста, укажите ваш телефон');
            this.elements.userPhone.classList.add('error');
            isValid = false;
        } else if (!this.isValidPhoneNumber(phone)) {
            this.showError(this.elements.userPhoneError, 'Введите корректный номер телефона (11 цифр, начинается с 7 или 8)');
            this.elements.userPhone.classList.add('error');
            isValid = false;
        } else {
            this.hideError(this.elements.userPhoneError);
            this.elements.userPhone.classList.remove('error');
        }

        // Валидация способа доставки
        if (!this.elements.deliveryType.value) {
            this.showError(this.elements.deliveryTypeError, 'Пожалуйста, выберите способ получения');
            this.elements.deliveryType.classList.add('error');
            isValid = false;
        } else {
            this.hideError(this.elements.deliveryTypeError);
            this.elements.deliveryType.classList.remove('error');
        }

        // Валидация адреса для доставки
        if (this.elements.deliveryType.value === 'delivery' && !this.elements.userAddress.value.trim()) {
            this.showError(this.elements.userAddressError, 'Пожалуйста, укажите адрес доставки');
            this.elements.userAddress.classList.add('error');
            isValid = false;
        } else {
            this.hideError(this.elements.userAddressError);
            this.elements.userAddress.classList.remove('error');
        }

        return isValid;
    }

    sendOrderToBot() {
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
            timestamp: new Date().toISOString(),
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

        // Сохраняем заказ
        this.saveOrderToLocalStorage(orderData);
        this.lastOrder = orderData;

        // Очищаем корзину сразу
        this.clearCart();

        // Пытаемся отправить через WebApp
        if (this.tg && this.tg.sendData) {
            try {
                this.tg.sendData(JSON.stringify(orderData));
                this.showSuccessMessage(orderData);
                
                // Закрываем приложение с задержкой
                setTimeout(() => {
                    if (this.tg && this.tg.close) {
                        this.tg.close();
                    }
                }, 3000);
                
            } catch (error) {
                console.error('WebApp send error:', error);
                this.showBotInstructions(orderData);
            }
        } else {
            this.showBotInstructions(orderData);
        }
    }

    generateOrderId() {
        return 'CH' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    saveOrderToLocalStorage(orderData) {
        try {
            const orders = JSON.parse(localStorage.getItem('cheesecake_orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('cheesecake_orders', JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    showSuccessMessage(orderData) {
        // Показываем уведомление
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({ 
                title: "✅ Заказ оформлен!", 
                message: "Чек отправляется в чат...\nПриложение закроется через 3 секунды." 
            });
        } else {
            alert('✅ Заказ оформлен! Чек отправляется в чат с ботом...');
        }

        // Копируем чек в буфер обмена
        const checkText = this.formatOrderForBot(orderData);
        this.copyToClipboard(checkText);

        // Показываем кнопку для ручной отправки
        this.showManualSendButton(checkText);
    }

    showBotInstructions(orderData) {
        const checkText = this.formatOrderForBot(orderData);
        this.copyToClipboard(checkText);
        this.showManualSendButton(checkText);
    }

    formatOrderForBot(orderData) {
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
🕒 ВРЕМЯ: ${new Date(orderData.timestamp).toLocaleString('ru-RU')}
━━━━━━━━━━━━━━━━━━━━
Отправьте это сообщение боту @${this.botUsername}
        `.trim();
    }

    copyToClipboard(text) {
        try {
            // Создаем временный textarea для копирования
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                console.log('Чек скопирован в буфер обмена');
            }
        } catch (error) {
            console.error('Ошибка копирования:', error);
        }
    }

    showManualSendButton(checkText) {
        // Удаляем старую кнопку если есть
        const oldButton = document.querySelector('.manual-send-button');
        if (oldButton) oldButton.remove();

        const sendButton = document.createElement('div');
        sendButton.className = 'manual-send-button';
        sendButton.innerHTML = `
            <div class="send-button-content">
                <p>📋 Чек скопирован! Отправьте его боту:</p>
                <button onclick="window.open('https://t.me/${this.botUsername}', '_blank')">
                    💬 Открыть бота
                </button>
                <button onclick="this.closest('.manual-send-button').remove()">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(sendButton);

        // Автоматически скрываем через 15 секунд
        setTimeout(() => {
            if (sendButton.parentNode) {
                sendButton.remove();
            }
        }, 15000);
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
    
    // Для отладки
    window.app = app;
    console.log('🍰 Сырниковый Рай инициализирован!');
});

// Обработчик для кнопки закрытия
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('manual-send-button') || 
        e.target.closest('.manual-send-button')) {
        return;
    }
    
    const manualButton = document.querySelector('.manual-send-button');
    if (manualButton && !e.target.closest('.send-button-content')) {
        manualButton.remove();
    }
});
