// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем приложение на весь экран
tg.enableClosingConfirmation(); // Включаем подтверждение закрытия, чтобы не потерять данные корзины

// Переменные
let cart = {};
let products = [];

// Элементы DOM
const productsList = document.getElementById('productsList');
const cartButton = document.getElementById('cartButton');
const cartPopup = document.getElementById('cartPopup');
const cartItems = document.getElementById('cartItems');
const totalPriceElement = document.getElementById('totalPrice');
const orderButton = document.getElementById('orderButton');
const closeCart = document.getElementById('closeCart');

// Загружаем товары (в реальности это может быть запрос к вашему серверу)
function loadProducts() {
    // Это пример данных. Замените на свои!
    products = [
        {
            id: 1,
            name: "Классические",
            description: "С нежной сметаной",
            price: 250,
            image: "https://via.placeholder.com/150?text=Классические"
        },
        {
            id: 2,
            name: "С шоколадом",
            description: "С кусочками шоколада",
            price: 280,
            image: "https://via.placeholder.com/150?text=С+шоколадом"
        },
        {
            id: 3,
            name: "С изюмом",
            description: "Сочные с изюмом",
            price: 270,
            image: "https://via.placeholder.com/150?text=С+изюмом"
        },
        {
            id: 4,
            name: "Веганские",
            description: "На кокосовых сливках",
            price: 300,
            image: "https://via.placeholder.com/150?text=Веганские"
        }
    ];
    renderProducts();
}

// Отображаем товары на странице
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

// Изменение количества товара
window.changeQuantity = function(productId, delta) {
    if (!cart[productId]) cart[productId] = 0;
    cart[productId] += delta;
    
    if (cart[productId] < 0) cart[productId] = 0;
    
    updateCart();
    renderProducts(); // Обновляем цифры на кнопках
}

// Обновление данных в корзине
function updateCart() {
    // Считаем общую сумму
    let total = 0;
    let totalCount = 0;
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            const product = products.find(p => p.id == productId);
            total += product.price * cart[productId];
            totalCount += cart[productId];
        }
    }
    
    // Обновляем кнопку корзины
    cartButton.textContent = `Корзина (${totalCount}) | ${total} руб.`;
    
    // Обновляем попап корзины
    renderCartItems();
    totalPriceElement.textContent = total;
}

// Отрисовка товаров в попапе корзины
function renderCartItems() {
    cartItems.innerHTML = '';
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
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
}

// Отправка данных в бота
function sendDataToBot() {
    const orderData = {
        products: [],
        total: 0,
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
            orderData.total += product.price * cart[productId];
        }
    }
    
    // Отправляем данные обратно в бота
    tg.sendData(JSON.stringify(orderData));
    // tg.close(); // Можно закрыть приложение после отправки
}

// Обработчики событий
cartButton.addEventListener('click', () => {
    cartPopup.style.display = 'flex';
});

closeCart.addEventListener('click', () => {
    cartPopup.style.display = 'none';
});

orderButton.addEventListener('click', sendDataToBot);

// Закрытие попапа по клику вне его области
cartPopup.addEventListener('click', (e) => {
    if (e.target === cartPopup) {
        cartPopup.style.display = 'none';
    }
});

// Запускаем приложение
loadProducts();
updateCart();