const cars = [
  {
    id: "island-hopper",
    name: "The Everyday",
    category: "family",
    subtitle: "Easygoing comfort for everyday plans.",
    price: 2400,
    seats: 5,
    bags: 3,
    transmission: "Automatic",
    badge: "Easy does it",
    image: "assets/family-suv.jpg",
    alt: "A white family SUV ready for a scenic drive",
  },
  {
    id: "barkada-bus",
    name: "The Family Getaway",
    category: "family",
    subtitle: "Room for the family and all the bags.",
    price: 3800,
    seats: 5,
    bags: 4,
    transmission: "Automatic",
    badge: "Family favorite",
    image: "assets/adventure-suv.jpg",
    alt: "A full-size SUV parked in a desert landscape",
  },
  {
    id: "little-roamer",
    name: "The Weekend Explorer",
    category: "adventure",
    subtitle: "A little more capability for the open road.",
    price: 2800,
    seats: 5,
    bags: 3,
    transmission: "Manual",
    badge: "Good things inside",
    image: "assets/adventure-4x4.jpg",
    alt: "A rugged four-wheel-drive SUV ready for an adventure",
  },
];

const carGrid = document.querySelector("#van-grid");
const dialog = document.querySelector("#booking-dialog");
const bookingForm = document.querySelector("#booking-form");
const dateInput = document.querySelector("#start-date");
const daysInput = document.querySelector("#rental-days");
const toast = document.querySelector("#toast");
let selectedVan = null;
let toastTimeout;

const formatPeso = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);

function renderCars(filter = "all") {
  const visibleCars = cars.filter((car) => filter === "all" || car.category === filter);
  carGrid.innerHTML = visibleCars
    .map(
      (car) => `
        <article class="van-card">
          <div class="van-photo-wrap">
            <img class="van-photo" src="${car.image}" alt="${car.alt}" loading="lazy" />
            <span class="van-badge">${car.badge}</span>
          </div>
          <div class="van-detail">
            <div class="van-topline">
              <h3>${car.name}</h3>
              <span class="van-price">${formatPeso(car.price)} <small>/ day</small></span>
            </div>
            <p class="van-subtitle">${car.subtitle}</p>
            <div class="van-specs">
              <span>${car.seats} seats</span><span>${car.bags} bags</span><span>${car.transmission}</span>
            </div>
            <div class="van-card-footer">
              <span class="availability">Ready when you are</span>
              <button class="book-button" type="button" data-book="${car.id}">Book this car ↗</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

document.querySelector("#hero-art").innerHTML =
  '<img src="assets/adventure-suv.jpg" alt="A family SUV on a scenic desert road" />';

function updateEstimate() {
  if (!selectedVan) return;
  const days = Number(daysInput.value);
  document.querySelector("#booking-total").textContent =
    Number.isInteger(days) && days >= 1 && days <= 30
      ? formatPeso(selectedVan.price * days)
      : "—";
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.toggle("toast-error", isError);
  toast.classList.add("is-visible");
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 5000);
}

carGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book]");
  if (!button) return;

  selectedVan = cars.find((car) => car.id === button.dataset.book);
  if (!selectedVan) return;
  document.querySelector("#booking-van-id").value = selectedVan.id;
  document.querySelector("#booking-van-name").textContent =
    `${selectedVan.name} · ${formatPeso(selectedVan.price)} per day`;
  bookingForm.reset();
  document.querySelector("#booking-van-id").value = selectedVan.id;
  daysInput.value = "2";
  dateInput.min = getLocalDateValue();
  dateInput.value = dateInput.min;
  updateEstimate();
  dialog.showModal();
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-button").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    renderCars(button.dataset.filter);
  });
});

daysInput.addEventListener("input", updateEstimate);
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity() || !selectedVan) return;

  const formData = new FormData(bookingForm);
  const days = Number(formData.get("days"));
  const startDate = String(formData.get("startDate"));
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    daysInput.setCustomValidity("Choose a rental length between 1 and 30 days.");
    daysInput.reportValidity();
    daysInput.setCustomValidity("");
    return;
  }

  const booking = {
    id: window.crypto.randomUUID(),
    vanId: selectedVan.id,
    vanName: selectedVan.name,
    name: String(formData.get("name")).trim(),
    email: String(formData.get("email")).trim(),
    startDate,
    days,
    estimatedTotal: selectedVan.price * days,
    requestedAt: new Date().toISOString(),
  };

  try {
    const savedBookings = JSON.parse(localStorage.getItem("sakayTaBookings") || "[]");
    if (!Array.isArray(savedBookings)) {
      throw new Error("Saved booking data is not a list.");
    }
    savedBookings.push(booking);
    localStorage.setItem("sakayTaBookings", JSON.stringify(savedBookings));
  } catch (error) {
    console.error("Unable to save the booking request.", error);
    showToast("We couldn't save your request on this device. Please try again.", true);
    return;
  }

  dialog.close();
  bookingForm.reset();
  selectedVan = null;
  showToast(`Request saved! ${booking.vanName} for ${booking.days} day${booking.days === 1 ? "" : "s"}. We'll be in touch.`);
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const siteHeader = document.querySelector(".site-header");
const navLinks = [...mainNav.querySelectorAll("a")];
const navSections = navLinks
  .map((link) => document.querySelector(link.hash))
  .filter((section) => section);

function setCurrentNavLink(sectionId) {
  navLinks.forEach((link) => {
    if (link.hash === `#${sectionId}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

let scrollFrame = 0;
function updateHeaderOnScroll() {
  const documentHeight = document.documentElement.scrollHeight;
  const scrollableHeight = documentHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  siteHeader.style.setProperty("--scroll-progress", `${progress}%`);
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  const isAtPageEnd = window.scrollY + window.innerHeight >= documentHeight - 2;
  const visibleSections = navSections.filter(
    (section) => section.getBoundingClientRect().top <= window.innerHeight * 0.35,
  );
  const currentSection = isAtPageEnd
    ? navSections[navSections.length - 1]
    : visibleSections[visibleSections.length - 1];
  if (currentSection) setCurrentNavLink(currentSection.id);
  scrollFrame = 0;
}

window.addEventListener(
  "scroll",
  () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateHeaderOnScroll);
  },
  { passive: true   },
);
updateHeaderOnScroll();

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

renderCars();
