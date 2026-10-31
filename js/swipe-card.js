const swipeThreshold = 86;

export function bindSwipeCard(card, onDecision) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;
  let decided = false;

  const confirmLabel = card.querySelector("[data-swipe-label='confirm']");
  const skipLabel = card.querySelector("[data-swipe-label='skip']");

  card.addEventListener("pointerdown", (event) => {
    if (decided) {
      return;
    }

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
  card.addEventListener("pointercancel", () => {
    dragging = false;
    resetCard(card, confirmLabel, skipLabel);
  });

  function finishDrag() {
    if (!dragging) {
      return;
    }

    dragging = false;

    if (Math.abs(currentX) < swipeThreshold) {
      resetCard(card, confirmLabel, skipLabel);
      return;
    }

    dismiss(currentX > 0 ? "confirmed" : "skipped");
  }

  function dismiss(decision) {
    if (decided) {
      return;
    }

    decided = true;
    const direction = decision === "confirmed" ? 1 : -1;
    card.classList.add("is-animating");
    card.style.transform = `translateX(${direction * window.innerWidth}px) rotate(${direction * 18}deg)`;
    card.style.opacity = "0";

    window.setTimeout(() => onDecision(decision), 170);
  }

  return { dismiss };
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
