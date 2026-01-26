<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface LightboxImage {
  gradient: string;
  label: string;
  caption?: string;
}

interface Props {
  images: LightboxImage[];
  initialIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0,
});

const emit = defineEmits<{
  close: [];
}>();

const isOpen = ref(false);
const currentIndex = ref(props.initialIndex);
const transitionName = ref("slide-next");

const currentImage = computed(() => props.images[currentIndex.value]);
const hasPrevious = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < props.images.length - 1);

const open = (index = 0) => {
  currentIndex.value = index;
  isOpen.value = true;
  document.body.style.overflow = "hidden";
};

const close = () => {
  isOpen.value = false;
  document.body.style.overflow = "";
  emit("close");
};

const previous = () => {
  if (hasPrevious.value) {
    transitionName.value = "slide-prev";
    currentIndex.value--;
  }
};

const next = () => {
  if (hasNext.value) {
    transitionName.value = "slide-next";
    currentIndex.value++;
  }
};

const handleBackdropClick = () => {
  close();
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return;

  switch (e.key) {
    case "Escape":
      close();
      break;
    case "ArrowLeft":
      previous();
      break;
    case "ArrowRight":
      next();
      break;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});

defineExpose({ open, close });
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="isOpen" class="lightbox" @click="handleBackdropClick">
        <!-- Close Button -->
        <button class="lightbox__close" @click="close" aria-label="關閉">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <!-- Navigation -->
        <button
          v-if="hasPrevious"
          class="lightbox__nav lightbox__nav--prev"
          @click.stop="previous"
          aria-label="上一張"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <button
          v-if="hasNext"
          class="lightbox__nav lightbox__nav--next"
          @click.stop="next"
          aria-label="下一張"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Image Container -->
        <div class="lightbox__content" @click.stop>
          <Transition :name="transitionName" mode="out-in">
            <div :key="currentIndex" class="lightbox__image-wrapper">
              <div
                class="lightbox__image"
                :style="{ background: currentImage?.gradient }"
              >
                <div class="lightbox__label">{{ currentImage?.label }}</div>
              </div>
            </div>
          </Transition>

          <!-- Caption -->
          <div v-if="currentImage?.caption" class="lightbox__caption">
            {{ currentImage.caption }}
          </div>

          <!-- Counter -->
          <div class="lightbox__counter">
            {{ currentIndex + 1 }} / {{ images.length }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox__close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 10;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s var(--ease-out-expo);
}

.lightbox__close:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s var(--ease-out-expo);
  opacity: 0.6;
}

.lightbox__nav:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.lightbox__nav--prev {
  left: 2rem;
}

.lightbox__nav--next {
  right: 2rem;
}

.lightbox__content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.lightbox__image-wrapper {
  position: relative;
  width: 100%;
  max-width: 1200px;
}

.lightbox__image {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox__label {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 4rem);
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
}

.lightbox__caption {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  text-align: center;
  max-width: 600px;
}

.lightbox__counter {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

/* Transitions */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.3s var(--ease-out-expo);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.4s var(--ease-out-expo);
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

/* Responsive Design */

/* 平板 (768px - 1024px) */
@media (max-width: 1024px) {
  .lightbox {
    padding: 1.5rem;
  }

  .lightbox__content {
    max-width: 85vw;
    max-height: 85vh;
  }

  .lightbox__close {
    top: 1.5rem;
    right: 1.5rem;
    width: 44px;
    height: 44px;
  }

  .lightbox__nav {
    width: 56px;
    height: 56px;
  }

  .lightbox__nav--prev {
    left: 1.5rem;
  }

  .lightbox__nav--next {
    right: 1.5rem;
  }

  .lightbox__counter {
    bottom: 1.5rem;
  }
}

/* 手機橫向 / 小平板 (640px - 768px) */
@media (max-width: 768px) {
  .lightbox {
    padding: 1rem;
  }

  .lightbox__content {
    max-width: 90vw;
    max-height: 90vh;
    gap: 1.25rem;
  }

  .lightbox__close {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }

  .lightbox__close svg {
    width: 28px;
    height: 28px;
  }

  .lightbox__nav {
    width: 48px;
    height: 48px;
  }

  .lightbox__nav svg {
    width: 40px;
    height: 40px;
  }

  .lightbox__nav--prev {
    left: 1rem;
  }

  .lightbox__nav--next {
    right: 1rem;
  }

  .lightbox__image {
    border-radius: 8px;
  }

  .lightbox__caption {
    font-size: 0.9375rem;
    max-width: 100%;
    padding: 0 1rem;
  }

  .lightbox__counter {
    bottom: 1rem;
    font-size: 0.8125rem;
  }
}

/* 手機直向 (< 640px) */
@media (max-width: 640px) {
  .lightbox {
    padding: 0.75rem;
  }

  .lightbox__content {
    max-width: 95vw;
    max-height: 95vh;
    gap: 1rem;
  }

  .lightbox__close {
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
  }

  .lightbox__close svg {
    width: 24px;
    height: 24px;
  }

  .lightbox__nav {
    width: 44px;
    height: 44px;
  }

  .lightbox__nav svg {
    width: 36px;
    height: 36px;
  }

  .lightbox__nav--prev {
    left: 0.5rem;
  }

  .lightbox__nav--next {
    right: 0.5rem;
  }

  .lightbox__image {
    border-radius: 6px;
  }

  .lightbox__caption {
    font-size: 0.875rem;
    line-height: 1.5;
    padding: 0 0.75rem;
  }

  .lightbox__counter {
    bottom: 0.75rem;
    font-size: 0.75rem;
  }
}

/* 小手機 (< 480px) */
@media (max-width: 480px) {
  .lightbox {
    padding: 0.5rem;
  }

  .lightbox__content {
    gap: 0.75rem;
  }

  .lightbox__close {
    top: 0.5rem;
    right: 0.5rem;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.5);
  }

  .lightbox__close svg {
    width: 20px;
    height: 20px;
  }

  .lightbox__nav {
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
  }

  .lightbox__nav svg {
    width: 32px;
    height: 32px;
  }

  .lightbox__nav--prev {
    left: 0.25rem;
  }

  .lightbox__nav--next {
    right: 0.25rem;
  }

  .lightbox__caption {
    font-size: 0.8125rem;
    padding: 0 0.5rem;
  }

  .lightbox__counter {
    bottom: 0.5rem;
  }

  /* 滑動距離減少 */
  .slide-next-enter-from,
  .slide-next-leave-to,
  .slide-prev-enter-from,
  .slide-prev-leave-to {
    transform: translateX(50px);
  }
}
</style>
