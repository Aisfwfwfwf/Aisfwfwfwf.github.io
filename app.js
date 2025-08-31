let tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

let cart = {};
let products = [];
let deliveryCost = 200;

const productsList = document.getElementById('productsList');
const cartButton = document.getElementById('cartButton');
const cartPopup = document.getElementById('cartPopup');
const cartItems = document.getElementById('cartItems');
const totalPriceElement = document.getElementById('totalPrice');
const orderButton = document.getElementById('orderButton');
const closeCart = document.getElementById('closeCart');

// НОВЫЕ ЭЛЕМЕНТЫ ДЛЯ ФОРМЫ
const orderPopup = document.getElementById('orderPopup');
const deliveryTypeSelect = document.getElementById('deliveryType');
const addressField = document.getElementById('addressField');
const finalPriceElement = document.getElementById('finalPrice');
const confirmOrderButton = document.getElementById('confirmOrderButton');

function loadProducts() {
    products = [
        { id: 1, name: "Классические", description: "С нежной сметаной", price: 250, image: "https://via.placeholder.com/150?text=Классические" },
        { id: 2, name: "С шоколадом", description: "С кусочками шоколада", price: 280, image: "https://via.placeholder.com/150?text=С+шоколадом" },
        { id: 3, name: "С изюмом", description: "Сочные с изюмом", price: 270, image: "https://via.placeholder.com/150?text=С+изюмом" },
        { id: 4, name: "Веганские", description: "На кокосовых сливках", price: 300, image: "https://via.placeholder.com/150?text=Веганские" }
    ];
    renderProducts();
}

function renderProducts() {
    productsList.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-title">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-price">${product.price} руб.</div>
            <div class="product-controls">
                <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)">-</button>
                <span class="quantity">${cart[product.id] || 0}</span>
                <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)">+</button>
            </div>
        `;
        productsList.appendChild(productCard);
    });
}

window.changeQuantity = function(productId, delta) {
    if (!cart[productId]) cart[productId] = 0;
    cart[productId] += delta;
    if (cart[productId] < 0) cart[productId] = 0;
    updateCart();
    renderProducts();
}

function updateCart() {
    let total = 0;
    let totalCount = 0;
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            const product = products.find(p => p.id == productId);
            total += product.price * cart[productId];
            totalCount += cart[productId];
        }
    }
    
    cartButton.textContent = `Корзина (${totalCount}) | ${total} руб.`;
    renderCartItems();
    totalPriceElement.textContent = total;
    finalPriceElement.textContent = total; // Обновляем и итог в форме
}

function renderCartItems() {
    cartItems.innerHTML = '';
    let isEmpty = true;
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            isEmpty = false;
            const product = products.find(p => p.id == productId);
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <div>${product.name}</div>
                    <div>${product.price} руб. x ${cart[productId]}</div>
                </div>
                <div>${product.price * cart[productId]} руб.</div>
            `;
            cartItems.appendChild(cartItem);
        }
    }
    
    if (isEmpty) {
        cartItems.innerHTML = '<div class="cart-empty">Корзина пуста</div>';
    }
}

// НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ ФОРМЫ

// Открытие формы заказа
function openOrderPopup() {
    // Считаем итог с учетом доставки
    calculateFinalTotal();
    // Показываем форму
    orderPopup.style.display = 'flex';
    // Скрываем корзину
    cartPopup.style.display = 'none';
}

// Закрытие формы заказа
window.closeOrderPopup = function() {
    orderPopup.style.display = 'none';
    cartPopup.style.display = 'flex';
}

// Расчет итоговой суммы (с доставкой)
function calculateFinalTotal() {
    let productsTotal = parseInt(totalPriceElement.textContent);
    let delivery = deliveryTypeSelect.value === 'delivery' ? deliveryCost : 0;
    let finalTotal = productsTotal + delivery;
    
    finalPriceElement.textContent = finalTotal;
    return finalTotal;
}

// Отправка данных в Telegram бота
function sendDataToBot() {
    const orderData = {
        products: [],
        total: calculateFinalTotal(),
        deliveryType: deliveryTypeSelect.value,
        deliveryCost: deliveryTypeSelect.value === 'delivery' ? deliveryCost : 0,
        customer: {
            name: document.getElementById('userName').value,
            phone: document.getElementById('userPhone').value,
            address: document.getElementById('userAddress').value || 'Самовывоз',
            comment: document.getElementById('userComment').value
        },
        user: tg.initDataUnsafe.user // Данные пользователя из Telegram
    };
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            const product = products.find(p => p.id == productId);
            orderData.products.push({
                id: product.id,
                name: product.name,
                quantity: cart[productId],
                price: product.price
            });
        }
    }
    
    // ВАЖНО: Отправляем данные обратно в бота
    tg.sendData(JSON.stringify(orderData));
    tg.showPopup({ title: "Успешно!", message: "Ваш заказ оформлен! С вами свяжутся в ближайшее время." }, function() {
        tg.close(); // Закрываем приложение после успешного заказа
    });
}

// ОБРАБОТЧИКИ СОБЫТИЙ
cartButton.addEventListener('click', () => {
    cartPopup.style.display = 'flex';
});

closeCart.addEventListener('click', () => {
    cartPopup.style.display = 'none';
});

// При нажатии на "Оформить заказ" в корзине - открываем форму
orderButton.addEventListener('click', openOrderPopup);

// При нажатии на "Подтвердить заказ" в форме - отправляем данные
confirmOrderButton.addEventListener('click', function() {
    // Простая проверка формы
    if (!document.getElementById('userName').value || !document.getElementById('userPhone').value || !deliveryTypeSelect.value) {
        alert('Пожалуйста, заполните все обязательные поля (имя, телефон и способ получения).');
        return;
    }
    
    // Если выбрана доставка, но адрес не указан
    if (deliveryTypeSelect.value === 'delivery' && !document.getElementById('userAddress').value) {
        alert('Пожалуйста, укажите адрес доставки.');
        return;
    }
    
    sendDataToBot();
});

// Показываем поле адреса только при выборе доставки
deliveryTypeSelect.addEventListener('change', function() {
    addressField.style.display = this.value === 'delivery' ? 'block' : 'none';
    calculateFinalTotal(); // Пересчитываем итог
});

// Закрытие попапов по клику вне области
[cartPopup, orderPopup].forEach(popup => {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });
});

// Запускаем приложение
loadProducts();
updateCart();
