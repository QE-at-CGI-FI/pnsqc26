/**
 * The Enchanted Brew Shop
 * Interactive Potion Builder
 */

// Constants
const BREWING_FEE = 3;
const FEATURED_PRICE = 34;
const FEATURED_LIMIT = 7;
const ORDER_CHOICES =
    'input[name="base-potion"], input[name="size"], input[name="potency"], ' +
    'input[name="ingredient"], input[name="delivery"]';
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

// Delivery detail rules: each returns an error message, or '' when the value is valid
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
const PLACE_PATTERN = /^[\p{L}\p{M}\d][\p{L}\p{M}\d' .,&()-]*$/u;
const ROOM_PATTERN = /^[\p{L}\p{M}\d][\p{L}\p{M}\d .,#\/-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DELIVERY_FIELD_RULES = {
    'customer-name': function(value) {
        if (!value) return 'Please enter your full name.';
        if (value.length < 2) return 'Name must be at least 2 characters.';
        if (!NAME_PATTERN.test(value)) return 'Name can only contain letters, spaces, apostrophes, hyphens and periods.';
        return '';
    },
    'contact-crystal': function(value) {
        if (!value) return '';
        if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email, e.g. gandalf@middle.earth.';
        return '';
    },
    'castle-name': function(value) {
        if (!value) return 'Please enter your castle or tower name.';
        if (value.length < 2) return 'Castle/Tower name must be at least 2 characters.';
        if (!PLACE_PATTERN.test(value)) return 'Castle/Tower name contains characters we cannot deliver to.';
        return '';
    },
    'tower-number': function(value) {
        if (!value) return '';
        if (!ROOM_PATTERN.test(value)) return 'Tower/Room can only contain letters, numbers, spaces and , . # / -';
        return '';
    },
    'kingdom': function(value) {
        if (!value) return 'Please enter your kingdom or realm.';
        if (value.length < 2) return 'Kingdom/Realm must be at least 2 characters.';
        if (!PLACE_PATTERN.test(value)) return 'Kingdom/Realm contains characters we cannot deliver to.';
        return '';
    },
    'special-instructions': function(value) {
        if (value.length > 500) return 'Special instructions can be at most 500 characters.';
        return '';
    }
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
    featuredCount: 0
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

    const featuredCount = parseInt(document.getElementById('featured-quantity').value);
    orderState.featuredCount = isNaN(featuredCount) ? 0 : Math.min(Math.max(featuredCount, 0), FEATURED_LIMIT);
    document.getElementById('featured-quantity').value = orderState.featuredCount;
    updateFeaturedControls();

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
    quantityInput.addEventListener('keydown', blockNonDigitKeys);
    quantityInput.addEventListener('paste', blockNonDigitPaste);

    // Potion of the Week quantity
    const featuredInput = document.getElementById('featured-quantity');
    featuredInput.addEventListener('change', handleFeaturedQuantityChange);
    featuredInput.addEventListener('input', handleFeaturedQuantityChange);
    featuredInput.addEventListener('keydown', blockNonDigitKeys);
    featuredInput.addEventListener('paste', blockNonDigitPaste);
    document.getElementById('featured-decrease').addEventListener('click', () => {
        setFeaturedCount(orderState.featuredCount - 1);
    });
    document.getElementById('featured-increase').addEventListener('click', () => {
        setFeaturedCount(orderState.featuredCount + 1);
    });

    // Delivery method
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', handleDeliveryChange);
    });

    // Form submission
    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', handleFormSubmit);

    // Clear order
    document.getElementById('clear-order').addEventListener('click', clearOrder);

    // Delivery details: check a field when leaving it, and re-check while fixing an error
    Object.keys(DELIVERY_FIELD_RULES).forEach(id => {
        const field = document.getElementById(id);
        field.addEventListener('blur', () => validateDeliveryField(field));
        field.addEventListener('input', () => {
            if (field.getAttribute('aria-invalid') === 'true') validateDeliveryField(field);
        });
    });
}

function validateDeliveryField(field) {
    const message = DELIVERY_FIELD_RULES[field.id](field.value.trim());
    document.getElementById(field.id + '-error').textContent = message;
    if (message) {
        field.setAttribute('aria-invalid', 'true');
    } else {
        field.removeAttribute('aria-invalid');
    }
    return !message;
}

function validateDeliveryDetails() {
    let firstInvalid = null;
    Object.keys(DELIVERY_FIELD_RULES).forEach(id => {
        const field = document.getElementById(id);
        if (!validateDeliveryField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
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

// Whole positive numbers only: block minus, plus, decimal point and exponent
function blockNonDigitKeys(event) {
    if (['-', '+', '.', ',', 'e', 'E'].includes(event.key)) {
        event.preventDefault();
    }
}

function blockNonDigitPaste(event) {
    const text = (event.clipboardData || window.clipboardData).getData('text');
    if (!/^\d+$/.test(text.trim())) {
        event.preventDefault();
    }
}

function handleQuantityChange(event) {
    const input = event.target;
    let quantity = parseInt(input.value);

    if (isNaN(quantity)) {
        // Let the field stay empty while typing; restore it once editing is done
        quantity = MIN_QUANTITY;
        if (event.type === 'change') input.value = quantity;
    } else {
        const typing = event.type === 'input' && quantity < MIN_QUANTITY;
        quantity = Math.min(Math.max(quantity, MIN_QUANTITY), MAX_QUANTITY);
        if (!typing && String(quantity) !== input.value) input.value = quantity;
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

    // Featured potion (Potion of the Week) line
    const featuredTotal = FEATURED_PRICE * orderState.featuredCount;
    const summaryFeatured = document.getElementById('summary-featured');
    summaryFeatured.hidden = orderState.featuredCount === 0;
    summaryFeatured.querySelector('.item-name').textContent = 'Elixir of Eternal Focus × ' + orderState.featuredCount;
    summaryFeatured.querySelector('.item-price').textContent = featuredTotal + ' gold';

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

    document.getElementById('clear-order').disabled = !hasOrderChanges();
}

// True when any price-affecting choice differs from the page defaults, i.e. there is something to clear
function hasOrderChanges() {
    const choices = document.querySelectorAll(ORDER_CHOICES);
    const quantityInput = document.getElementById('quantity');
    return orderState.featuredCount > 0 ||
        quantityInput.value !== quantityInput.defaultValue ||
        Array.from(choices).some(input => input.checked !== input.defaultChecked);
}

let featuredFeedbackTimer = null;

// Single place that changes the Potion of the Week count: keeps the quantity box, buttons and summary in step
function setFeaturedCount(count) {
    count = Math.min(Math.max(count, 0), FEATURED_LIMIT);
    document.getElementById('featured-quantity').value = count;
    // Safari fires the box's change event after an Add to Order click; keep its confirmation if nothing changed
    if (count === orderState.featuredCount) return;

    orderState.featuredCount = count;
    updateFeaturedControls();
    updateOrderSummary();
}

function updateFeaturedControls() {
    const btn = document.querySelector('.btn-featured');

    document.getElementById('featured-decrease').disabled = orderState.featuredCount <= 0;
    document.getElementById('featured-increase').disabled = orderState.featuredCount >= FEATURED_LIMIT;

    clearTimeout(featuredFeedbackTimer);
    btn.disabled = orderState.featuredCount === 0;
    btn.textContent = 'Add to Order';
}

function handleFeaturedQuantityChange(event) {
    const input = event.target;
    const count = parseInt(input.value);

    if (isNaN(count)) {
        // Let the field stay empty while typing; settle on 0 once editing is done
        if (event.type === 'change') setFeaturedCount(0);
        return;
    }
    setFeaturedCount(count);
}

// The quantity box sets the count; the button only confirms what is already in the order
function addFeaturedToOrder() {
    if (orderState.featuredCount === 0) return;

    const btn = document.querySelector('.btn-featured');
    clearTimeout(featuredFeedbackTimer);
    btn.textContent = '✓ Added! (' + orderState.featuredCount + '/' + FEATURED_LIMIT + ')';
    featuredFeedbackTimer = setTimeout(() => {
        btn.textContent = 'Add to Order';
    }, 1500);
}

function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateDeliveryDetails()) return;

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

// Reset every price-affecting choice to the page defaults; delivery address fields are kept
function clearOrder() {
    const choices = document.querySelectorAll(ORDER_CHOICES);
    choices.forEach(input => {
        input.checked = input.defaultChecked;
    });

    const quantityInput = document.getElementById('quantity');
    quantityInput.value = quantityInput.defaultValue;

    document.getElementById('featured-quantity').value = 0;

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
