class CheesecakeApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.cart = {};
        this.products = [];
        this.deliveryCost = 200;
        this.isInitialized = false;
        this.botUsername = 'your_cheesecake_bot'; // ЗАМЕНИТЕ на username вашего бота

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
            this.sendDataToBot();
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

    sendDataToBot() {
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
            timestamp: new Date().toISOString()
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

        // СПОСОБ 1: Через Telegram WebApp (если доступно)
        if (this.tg && this.tg.sendData) {
            try {
                this.tg.sendData(JSON.stringify(orderData));
                this.showSuccessMessage();
            } catch (error) {
                console.error('WebApp send error:', error);
                this.sendViaBot(orderData);
            }
        } 
        // СПОСОБ 2: Через direct message боту
        else {
            this.sendViaBot(orderData);
        }
    }

    sendViaBot(orderData) {
        const orderText = this.formatOrderForBot(orderData);
        
        // Показываем пользователю инструкцию
        this.showBotInstructions(orderText);
    }

    formatOrderForBot(orderData) {
        let message = '🍰 НОВЫЙ ЗАКАЗ СЫРНИКОВ\n\n';
        message += `👤 Имя: ${orderData.customer.name}\n`;
        message += `📞 Телефон: ${orderData.customer.phone}\n`;
        message += `📍 Способ: ${orderData.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}\n`;
        
        if (orderData.deliveryType === 'delivery') {
            message += `🏠 Адрес: ${orderData.customer.address}\n`;
        }
        
        message += `\n🛒 Заказ:\n`;
        orderData.products.forEach(product => {
            message += `• ${product.name} - ${product.quantity} шт. x ${product.price} руб.\n`;
        });
        
        message += `\n💵 Итого: ${orderData.total} руб.\n`;
        message += `📝 Комментарий: ${orderData.customer.comment || 'нет'}\n`;
        message += `🕒 Время: ${new Date(orderData.timestamp).toLocaleString('ru-RU')}`;
        
        return message;
    }

    showSuccessMessage() {
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({ 
                title: "✅ Заказ оформлен!", 
                message: "Спасибо за заказ! Мы свяжемся с вами в ближайшее время." 
            });
        } else {
            alert('✅ Заказ оформлен! Мы свяжемся с вами в ближайшее время.');
        }
        
        // Очищаем корзину после успешного заказа
        this.cart = {};
        this.updateCart();
        this.closeOrderPopup();
    }

    showBotInstructions(orderText) {
        const message = `
✅ Заказ сформирован!

Для завершения оформления:

1. Перейдите в чат с нашим ботом: @${this.botUsername}
2. Отправьте ему следующее сообщение:

${orderText}

Мы обработаем ваш заказ в течение 15 минут!
        `.trim();

        alert(message);
        
        // Очищаем корзину
        this.cart = {};
        this.updateCart();
        this.closeOrderPopup();

        // Пытаемся открыть чат с ботом
        try {
            window.open(`https://t.me/${this.botUsername}`, '_blank');
        } catch (error) {
            console.log('Не удалось открыть чат с ботом');
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    const app = new CheesecakeApp();
    app.init();
    
    // Для отладки
    window.app = app;
    console.log('Сырниковый Рай инициализирован!');
});
