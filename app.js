// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
let cart = {};
let products = [];
let deliveryCost = 200;

// Элементы DOM
const productsList = document.getElementById('productsList');
const cartButton = document.getElementById('cartButton');
const cartPopup = document.getElementById('cartPopup');
const cartItems = document.getElementById('cartItems');
const totalPriceElement = document.getElementById('totalPrice');
const orderButton = document.getElementById('orderButton');
const closeCart = document.getElementById('closeCart');
const orderPopup = document.getElementById('orderPopup');
const deliveryTypeSelect = document.getElementById('deliveryType');
const addressField = document.getElementById('addressField');
const finalPriceElement = document.getElementById('finalPrice');
const confirmOrderButton = document.getElementById('confirmOrderButton');

// Данные товаров
const productsData = [
    {
        id: 1,
        name: "Классические",
        description: "С нежной сметаной",
        price: 250,
        image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/1.jpg",
        backupImage: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/1.jpg"
    },
    {
        id: 2,
        name: "С шоколадом", 
        description: "С кусочками шоколада",
        price: 280,
        image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/3.jpg",
        backupImage: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/3.jpg"
    },
    {
        id: 3,
        name: "С изюмом",
        description: "Сочные с изюмом",
        price: 270,
        image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/2.jpg",
        backupImage: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/2.jpg"
    },
    {
        id: 4,
        name: "Веганские",
        description: "На кокосовых сливках",
        price: 300,
        image: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/4.jpg",
        backupImage: "https://github.com/Aisfwfwfwf/Aisfwfwfwf.github.io/blob/main/4.jpg"
    }
];

// Функция для проверки загрузки изображения
function checkImage(url, callback) {
    const img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
}

// Функция для получения working изображения
function getWorkingImage(product) {
    return new Promise((resolve) => {
        checkImage(product.image, (success) => {
            if (success) {
                resolve(product.image);
            } else {
                resolve(product.backupImage);
            }
        });
    });
}

// Инициализация приложения
async function initApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    
    products = productsData;
    await loadProducts();
    updateCart();
    setupEventListeners();
}

// Загрузка товаров
async function loadProducts() {
    productsList.innerHTML = '';
    
    for (const product of products) {
        const workingImage = await getWorkingImage(product);
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${workingImage}" alt="${product.name}" class="product-image">
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
    }
}

// Изменение количества товара
window.changeQuantity = function(productId, delta) {
    if (!cart[productId]) cart[productId] = 0;
    cart[productId] += delta;
    
    if (cart[productId] < 0) cart[productId] = 0;
    
    updateCart();
    renderProducts();
}

// Обновление корзины
function updateCart() {
    let total = 0;
    let totalCount = 0;
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            const product = products.find(p => p.id == productId);
            if (product) {
                total += product.price * cart[productId];
                totalCount += cart[productId];
            }
        }
    }
    
    cartButton.textContent = `Корзина (${totalCount}) | ${total} руб.`;
    renderCartItems();
    totalPriceElement.textContent = total;
    finalPriceElement.textContent = total;
}

// Отрисовка товаров в корзине
function renderCartItems() {
    cartItems.innerHTML = '';
    let isEmpty = true;
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            isEmpty = false;
            const product = products.find(p => p.id == productId);
            if (product) {
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
    
    if (isEmpty) {
        cartItems.innerHTML = '<div class="cart-empty">Корзина пуста</div>';
        orderButton.style.display = 'none';
    } else {
        orderButton.style.display = 'block';
    }
}

// Перерисовка товаров (обновление количеств)
function renderProducts() {
    const productCards = productsList.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const buttons = card.querySelectorAll('.quantity-btn');
        if (buttons.length > 0) {
            const onclickString = buttons[0].getAttribute('onclick');
            const match = onclickString.match(/changeQuantity\((\d+),/);
            if (match) {
                const productId = match[1];
                const quantityElement = card.querySelector('.quantity');
                if (quantityElement) {
                    quantityElement.textContent = cart[productId] || 0;
                }
            }
        }
    });
}

// Открытие формы заказа
function openOrderPopup() {
    calculateFinalTotal();
    orderPopup.style.display = 'flex';
    cartPopup.style.display = 'none';
}

// Закрытие формы заказа
window.closeOrderPopup = function() {
    orderPopup.style.display = 'none';
    cartPopup.style.display = 'flex';
}

// Расчет итоговой суммы
function calculateFinalTotal() {
    let productsTotal = parseInt(totalPriceElement.textContent) || 0;
    let delivery = deliveryTypeSelect.value === 'delivery' ? deliveryCost : 0;
    let finalTotal = productsTotal + delivery;
    
    finalPriceElement.textContent = finalTotal;
    return finalTotal;
}

// Функция форматирования данных заказа
function formatOrderData(orderData) {
    return {
        products: orderData.products,
        total: orderData.total,
        deliveryType: orderData.deliveryType,
        deliveryCost: orderData.deliveryCost,
        customer: {
            name: orderData.customer.name,
            phone: orderData.customer.phone,
            address: orderData.customer.address,
            comment: orderData.customer.comment
        },
        user: orderData.user,
        timestamp: new Date().toISOString()
    };
}

// Отправка данных через Telegram WebApp Data
function sendDataToBot() {
    // Проверка обязательных полей
    if (!document.getElementById('userName').value) {
        alert('Пожалуйста, укажите ваше имя');
        return;
    }
    
    if (!document.getElementById('userPhone').value) {
        alert('Пожалуйста, укажите ваш телефон');
        return;
    }
    
    if (!deliveryTypeSelect.value) {
        alert('Пожалуйста, выберите способ получения');
        return;
    }
    
    if (deliveryTypeSelect.value === 'delivery' && !document.getElementById('userAddress').value) {
        alert('Пожалуйста, укажите адрес доставки');
        return;
    }

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
        user: tg.initDataUnsafe.user
    };
    
    for (const productId in cart) {
        if (cart[productId] > 0) {
            const product = products.find(p => p.id == productId);
            if (product) {
                orderData.products.push({
                    id: product.id,
                    name: product.name,
                    quantity: cart[productId],
                    price: product.price
                });
            }
        }
    }
    
    // Форматируем и отправляем данные через Telegram WebApp
    const formattedData = formatOrderData(orderData);
    
    // Основной способ отправки
    tg.sendData(JSON.stringify(formattedData));
    
    // Показываем подтверждение
    tg.showPopup({ 
        title: "✅ Заказ оформлен!", 
        message: "Спасибо за заказ! Мы свяжемся с вами в ближайшее время для подтверждения." 
    }, function() {
        // Закрываем приложение через 2 секунды
        setTimeout(() => {
            tg.close();
        }, 2000);
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    cartButton.addEventListener('click', () => {
        cartPopup.style.display = 'flex';
    });

    closeCart.addEventListener('click', () => {
        cartPopup.style.display = 'none';
    });

    orderButton.addEventListener('click', openOrderPopup);

    confirmOrderButton.addEventListener('click', sendDataToBot);

    deliveryTypeSelect.addEventListener('change', function() {
        addressField.style.display = this.value === 'delivery' ? 'block' : 'none';
        calculateFinalTotal();
    });

    [cartPopup, orderPopup].forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.style.display = 'none';
            }
        });
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

if (window.Telegram && window.Telegram.WebApp) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}


