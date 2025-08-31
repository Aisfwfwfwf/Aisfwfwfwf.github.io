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
        image: "https://fikiwiki.com/uploads/posts/2022-02/1645019206_1-fikiwiki-com-p-kartinki-sirniki-1.jpg=Классические"
    },
    {
        id: 2,
        name: "С шоколадом", 
        description: "С кусочками шоколада",
        price: 280,
        image: "https://fikiwiki.com/uploads/posts/2022-02/1645019233_28-fikiwiki-com-p-kartinki-sirniki-30.jpg"
    },
    {
        id: 3,
        name: "С изюмом",
        description: "Сочные с изюмом",
        price: 270,
        image: "https://static.1000.menu/img/content-v2/a7/ec/39379/syrniki-iz-tvoroga-s-mukoi-na-skovorode_1613887382_11_max.jpg=С+изюмом"
    },
    {
        id: 4,
        name: "Веганские",
        description: "На кокосовых сливках",
        price: 300,
        image: "https://prostokvashino.ru/upload/iblock/d28/d28e1b22ab38bfcce66f54a1a80e7526.jpg"
    }
];

// Инициализация приложения
function initApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    
    products = productsData;
    loadProducts();
    updateCart();
    setupEventListeners();
}

// Загрузка товаров
function loadProducts() {
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/150/CCCCCC/666666?text=Нет+фото'">
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
        const productId = card.querySelector('.quantity-btn').onclick.toString().match(/changeQuantity\((\d+),/)[1];
        const quantityElement = card.querySelector('.quantity');
        quantityElement.textContent = cart[productId] || 0;
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

// Отправка данных в бота
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
    
    tg.sendData(JSON.stringify(orderData));
    tg.showPopup({ 
        title: "Успешно!", 
        message: "Ваш заказ оформлен! С вами свяжутся в ближайшее время." 
    }, function() {
        tg.close();
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

// Запуск приложения при полной загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Альтернативный запуск для Telegram
if (window.Telegram && window.Telegram.WebApp) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

