const swipeThreshold = 86;

export function bindSwipeCard(card, onDecision) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const confirmLabel = card.querySelector("[data-swipe-label='confirm']");
  const skipLabel = card.querySelector("[data-swipe-label='skip']");

  card.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    currentX = 0;
    card.classList.remove("is-animating");
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    currentX = event.clientX - startX;
    const rotate = currentX / 22;
    card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
    updateLabels(currentX, confirmLabel, skipLabel);
  });

  card.addEventListener("pointerup", () => finishDrag());
  card.addEventListener("pointercancel", () => resetCard(card, confirmLabel, skipLabel));

  function finishDrag() {
    if (!dragging) {
      return;
    }

    dragging = false;

    if (Math.abs(currentX) < swipeThreshold) {
      resetCard(card, confirmLabel, skipLabel);
      return;
    }

    const decision = currentX > 0 ? "confirmed" : "skipped";
    const exitX = currentX > 0 ? window.innerWidth : -window.innerWidth;
    card.classList.add("is-animating");
    card.style.transform = `translateX(${exitX}px) rotate(${currentX > 0 ? 18 : -18}deg)`;
    card.style.opacity = "0";

    window.setTimeout(() => onDecision(decision), 170);
  }
}

function updateLabels(distance, confirmLabel, skipLabel) {
  const opacity = Math.min(Math.abs(distance) / swipeThreshold, 1);
  confirmLabel.style.opacity = distance > 0 ? opacity : 0;
  skipLabel.style.opacity = distance < 0 ? opacity : 0;
}

function resetCard(card, confirmLabel, skipLabel) {
  card.classList.add("is-animating");
  card.style.transform = "";
  card.style.opacity = "";
  confirmLabel.style.opacity = 0;
  skipLabel.style.opacity = 0;
}
