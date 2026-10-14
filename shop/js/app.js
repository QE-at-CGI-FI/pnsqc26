/**
 * The Enchanted Brew Shop
 * Interactive Potion Builder
 */

// Constants
const BREWING_FEE = 3;
const FEATURED_PRICE = 34;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;
const SIZE_MULTIPLIERS = {
    vial: 1,
    flask: 1.5,
    bottle: 2
};

const POTION_NAMES = {
    healing: 'Healing Draught',
    strength: 'Elixir of Strength',
    wisdom: 'Potion of Wisdom',
    invisibility: 'Invisibility Brew'
};

const SIZE_NAMES = {
    vial: 'Vial (1x)',
    flask: 'Flask (1.5x)',
    bottle: 'Bottle (2x)'
};

const DELIVERY_NAMES = {
    owl: 'Owl Post',
    dragon: 'Dragon Express'
};

const POTENCY_NAMES = {
    standard: 'Standard',
    enhanced: 'Enhanced (+25%)',
    maximum: 'Maximum (+75%)'
};

// State
let orderState = {
    basePotion: null,
    basePotionPrice: 0,
    size: 'vial',
    sizeMultiplier: 1,
    potency: 'standard',
    potencyMultiplier: 1,
    ingredients: [],
    ingredientsTotal: 0,
    quantity: 1,
    deliveryMethod: 'owl',
    deliveryPrice: 5,
    featuredAdded: false
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    initThemeToggle();
    syncStateFromDom();
});

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    updateThemeToggle(toggle);
    toggle.addEventListener('click', function() {
        const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            // Storage unavailable; theme still applies for this page view
        }
        updateThemeToggle(toggle);
    });
}

function updateThemeToggle(toggle) {
    const isLight = document.documentElement.dataset.theme === 'light';
    toggle.textContent = isLight ? '🌙 Dark' : '☀️ Light';
    toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
}

// Browsers may restore checked inputs on reload/back navigation without firing change events
window.addEventListener('pageshow', syncStateFromDom);

function syncStateFromDom() {
    const potion = document.querySelector('input[name="base-potion"]:checked');
    orderState.basePotion = potion ? potion.value : null;
    orderState.basePotionPrice = potion ? parseInt(potion.dataset.price) : 0;

    const size = document.querySelector('input[name="size"]:checked');
    orderState.size = size.value;
    orderState.sizeMultiplier = SIZE_MULTIPLIERS[size.value];

    const potency = document.querySelector('input[name="potency"]:checked');
    orderState.potency = potency.value;
    orderState.potencyMultiplier = parseFloat(potency.dataset.multiplier);

    const delivery = document.querySelector('input[name="delivery"]:checked');
    orderState.deliveryMethod = delivery.value;
    orderState.deliveryPrice = parseInt(delivery.dataset.price);

    const quantity = parseInt(document.getElementById('quantity').value);
    orderState.quantity = isNaN(quantity) ? MIN_QUANTITY : Math.min(Math.max(quantity, MIN_QUANTITY), MAX_QUANTITY);

    handleIngredientChange();
}

function initEventListeners() {
    // Base potion selection
    const potionRadios = document.querySelectorAll('input[name="base-potion"]');
    potionRadios.forEach(radio => {
        radio.addEventListener('change', handlePotionChange);
    });

    // Size selection
    const sizeRadios = document.querySelectorAll('input[name="size"]');
    sizeRadios.forEach(radio => {
        radio.addEventListener('change', handleSizeChange);
    });

    // Ingredients
    const ingredientCheckboxes = document.querySelectorAll('input[name="ingredient"]');
    ingredientCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleIngredientChange);
    });

    // Potency
    const potencyRadios = document.querySelectorAll('input[name="potency"]');
    potencyRadios.forEach(radio => {
        radio.addEventListener('change', handlePotencyChange);
    });

    // Quantity input
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('change', handleQuantityChange);
    quantityInput.addEventListener('input', handleQuantityChange);
    // Whole positive numbers only: block minus, plus, decimal point and exponent
    quantityInput.addEventListener('keydown', function(event) {
        if (['-', '+', '.', ',', 'e', 'E'].includes(event.key)) {
            event.preventDefault();
        }
    });
    quantityInput.addEventListener('paste', function(event) {
        const text = (event.clipboardData || window.clipboardData).getData('text');
        if (!/^\d+$/.test(text.trim())) {
            event.preventDefault();
        }
    });

    // Delivery method
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', handleDeliveryChange);
    });

    // Form submission
    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', handleFormSubmit);
}

function handlePotionChange(event) {
    const radio = event.target;
    orderState.basePotion = radio.value;
    orderState.basePotionPrice = parseInt(radio.dataset.price);
    updateOrderSummary();
}

function handleSizeChange(event) {
    const radio = event.target;
    orderState.size = radio.value;
    orderState.sizeMultiplier = SIZE_MULTIPLIERS[radio.value];
    updateOrderSummary();
}

function handleIngredientChange() {
    const checkedIngredients = document.querySelectorAll('input[name="ingredient"]:checked');
    orderState.ingredients = [];
    orderState.ingredientsTotal = 0;

    checkedIngredients.forEach(checkbox => {
        orderState.ingredients.push(checkbox.value);
        orderState.ingredientsTotal += parseInt(checkbox.dataset.price);
    });

    updateOrderSummary();
}

function handlePotencyChange(event) {
    const radio = event.target;
    orderState.potency = radio.value;
    orderState.potencyMultiplier = parseFloat(radio.dataset.multiplier);
    updateOrderSummary();
}

function handleQuantityChange(event) {
    const input = event.target;
    let quantity = parseInt(input.value);

    if (isNaN(quantity)) {
        // Let the field stay empty while typing; restore it once editing is done
        quantity = MIN_QUANTITY;
        if (event.type === 'change') input.value = quantity;
    } else {
        quantity = Math.min(Math.max(quantity, MIN_QUANTITY), MAX_QUANTITY);
        if (String(quantity) !== input.value) input.value = quantity;
    }

    orderState.quantity = quantity;
    updateOrderSummary();
}

function handleDeliveryChange(event) {
    const radio = event.target;
    orderState.deliveryMethod = radio.value;
    orderState.deliveryPrice = parseInt(radio.dataset.price);
    updateOrderSummary();
}

function changeQuantity(delta) {
    const input = document.getElementById('quantity');
    let newValue = parseInt(input.value) + delta;
    if (isNaN(newValue)) newValue = MIN_QUANTITY;
    if (newValue < MIN_QUANTITY) newValue = MIN_QUANTITY;
    if (newValue > MAX_QUANTITY) newValue = MAX_QUANTITY;
    input.value = newValue;
    orderState.quantity = newValue;
    updateOrderSummary();
}

function updateOrderSummary() {
    // Update potion display
    const summaryPotion = document.getElementById('summary-potion');
    if (orderState.basePotion) {
        summaryPotion.querySelector('.item-name').textContent = POTION_NAMES[orderState.basePotion];
        summaryPotion.querySelector('.item-price').textContent = orderState.basePotionPrice + ' gold';
    } else {
        summaryPotion.querySelector('.item-name').textContent = 'No potion selected';
        summaryPotion.querySelector('.item-price').textContent = '-';
    }

    // Update size display
    const summarySize = document.getElementById('summary-size');
    summarySize.querySelector('.item-name').textContent = 'Size: ' + SIZE_NAMES[orderState.size];

    // Update potency display
    const summaryPotency = document.getElementById('summary-potency');
    summaryPotency.querySelector('.item-name').textContent = 'Potency: ' + POTENCY_NAMES[orderState.potency];

    // Update ingredients display
    const summaryIngredients = document.getElementById('summary-ingredients');
    summaryIngredients.querySelector('.item-price').textContent = orderState.ingredientsTotal + ' gold';

    // Update quantity display
    const summaryQuantity = document.getElementById('summary-quantity');
    summaryQuantity.querySelector('.item-name').textContent = 'Quantity: ' + orderState.quantity;

    // Calculate totals
    let potionSubtotal = 0;
    if (orderState.basePotion) {
        potionSubtotal = orderState.basePotionPrice * orderState.sizeMultiplier * orderState.potencyMultiplier;
    }

    // Add featured potion if added
    let featuredTotal = 0;
    if (orderState.featuredAdded) {
        featuredTotal = FEATURED_PRICE;
    }

    // Calculate subtotal
    let subtotal = (potionSubtotal * orderState.quantity) + orderState.ingredientsTotal + featuredTotal;

    // Update subtotal display
    const summarySubtotal = document.getElementById('summary-subtotal');
    summarySubtotal.querySelector('.item-price').textContent = subtotal.toFixed(2) + ' gold';

    // Update delivery display
    const summaryDelivery = document.getElementById('summary-delivery');
    summaryDelivery.querySelector('.item-name').textContent = 'Delivery: ' + DELIVERY_NAMES[orderState.deliveryMethod];
    summaryDelivery.querySelector('.item-price').textContent = orderState.deliveryPrice + ' gold';

    // Calculate total with brewing fee and delivery
    let total = subtotal + BREWING_FEE + orderState.deliveryPrice;

    // Update total display
    const summaryTotal = document.getElementById('summary-total');
    summaryTotal.querySelector('.total-price').textContent = total.toFixed(2) + ' gold';
}

function addFeaturedToOrder() {
    orderState.featuredAdded = true;
    updateOrderSummary();

    // Show feedback
    const btn = document.querySelector('.btn-featured');
    btn.textContent = '✓ Added!';
    btn.disabled = true;

    setTimeout(() => {
        btn.textContent = 'Add to Order';
        btn.disabled = false;
    }, 2000);
}

function handleFormSubmit(event) {
    event.preventDefault();

    // Generate order number
    const orderNumber = 'EB-' + Math.floor(Math.random() * 90000 + 10000);

    // Calculate delivery estimate
    let deliveryDays = orderState.deliveryMethod === 'owl' ? '3-5 days' : 'Tomorrow';

    // Show confirmation modal
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('order-number').textContent = orderNumber;
    document.getElementById('delivery-estimate').textContent = deliveryDays;
    modal.classList.add('active');

    // Reset form
    document.getElementById('order-form').reset();
    syncStateFromDom();
}

function closeModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('active');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('confirmation-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});
