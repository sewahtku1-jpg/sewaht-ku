// Sewa HT Ku - Logic Refined

// 1. Sticky Navbar & Mobile Toggle
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = navToggle.querySelector('i');
    const iconName = icon.getAttribute('data-lucide');
    icon.setAttribute('data-lucide', iconName === 'menu' ? 'x' : 'menu');
    lucide.createIcons();
});

// Close mobile menu
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.querySelector('i').setAttribute('data-lucide', 'menu');
        lucide.createIcons();
    });
});

// 2. Reveal Animations on Scroll
const revealElements = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
    revealElements.forEach(el => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;
        const revealPoint = 150;
        
        if (revealTop < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
};
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// 3. Price Calculator Logic
const calcQty = document.getElementById('calc-qty');
const calcDays = document.getElementById('calc-days');
const calcTotal = document.getElementById('calc-total');
const productSelect = document.getElementById('product');

const updateCalculator = () => {
    const qty = parseInt(calcQty.value) || 0;
    const days = parseInt(calcDays.value) || 0;
    
    // Get base price from selected product in form
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const basePrice = parseInt(selectedOption.getAttribute('data-price')) || 25000;
    
    const total = qty * days * basePrice;
    
    // Format to Rupiah
    calcTotal.textContent = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(total);
};

if (calcQty && calcDays) {
    calcQty.addEventListener('input', updateCalculator);
    calcDays.addEventListener('input', updateCalculator);
    productSelect.addEventListener('change', updateCalculator);
}

// 4. Product Selection Sync
const selectProductBtns = document.querySelectorAll('.select-product');
selectProductBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const productName = btn.getAttribute('data-product');
        productSelect.value = productName;
        
        // Sync calculator as well
        const qtyInForm = document.getElementById('quantity').value;
        calcQty.value = qtyInForm;
        updateCalculator();
    });
});

// 5. Booking Form WhatsApp Redirect
const bookingForm = document.getElementById('bookingForm');
bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const date = document.getElementById('date').value;
    const product = document.getElementById('product').value;
    const quantity = document.getElementById('quantity').value;

    const phoneNumber = "628123456789"; 
    const message = `Halo Sewa HT Ku, saya ingin sewa HT:
    
*Nama:* ${name}
*No. WhatsApp:* ${whatsapp}
*Tanggal Sewa:* ${date}
*Produk:* ${product}
*Jumlah:* ${quantity} Unit

Mohon informasi ketersediaan unit. Terima kasih.`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
});

// 6. Smooth Scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});
