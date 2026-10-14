/**
 * The Enchanted Brew Shop
 * Interactive Potion Builder
 */

// Constants
const BREWING_FEE = 3;
const SIZE_MULTIPLIERS = {
    vial: 1,
    flask: 1.35,
    bottle: 2.5
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
    bottle: 'Bottle (2.5x)'
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
    updateOrderSummary();
});

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
    const value = event.target.value;
    orderState.quantity = parseInt(value) || 1;
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
    if (newValue < 1) newValue = 1;
    if (newValue > 99) newValue = 99;
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
        featuredTotal = 36;
    }

    // Calculate subtotal
    let subtotal = (potionSubtotal * orderState.quantity) + orderState.ingredientsTotal + featuredTotal;

    // Update subtotal display
    const summarySubtotal = document.getElementById('summary-subtotal');
    summarySubtotal.querySelector('.item-price').textContent = subtotal.toFixed(2) + ' gold';

    // Calculate total with brewing fee (note: delivery not included)
    let total = subtotal + BREWING_FEE;

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
