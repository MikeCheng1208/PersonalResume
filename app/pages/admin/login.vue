<script setup lang="ts">
import { reactive, ref } from "vue";
import { useAdminAuth } from "~/composables/admin/useAdminAuth";
import { useErrorHandler } from "~/composables/admin/useErrorHandler";

definePageMeta({
  layout: false,
  middleware: "admin-guest",
});

// 設定瀏覽器標題
useHead({
  title: "後台登入",
});

const { login, isLoading } = useAdminAuth();
const { handleError } = useErrorHandler();
const router = useRouter();
const toast = useToast();

// 表單狀態
const formState = reactive({
  username: "",
  password: "",
});

const errorMessage = ref("");
const showPassword = ref(false);

/**
 * 驗證帳號格式
 */
const validateUsername = (username: string): string | null => {
  if (!username.trim()) {
    return "請輸入帳號";
  }
  if (username.length < 3 || username.length > 50) {
    return "帳號長度需在 3-50 字元之間";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "帳號只能包含英文字母、數字和底線";
  }
  return null;
};

/**
 * 驗證密碼格式
 */
const validatePassword = (password: string): string | null => {
  if (!password) {
    return "請輸入密碼";
  }
  if (password.length < 6) {
    return "密碼長度至少需要 6 個字元";
  }
  if (password.length > 100) {
    return "密碼長度不能超過 100 個字元";
  }
  return null;
};

/**
 * 處理登入
 */
const handleLogin = async () => {
  errorMessage.value = "";

  // 前端驗證
  const usernameError = validateUsername(formState.username);
  if (usernameError) {
    errorMessage.value = usernameError;
    return;
  }

  const passwordError = validatePassword(formState.password);
  if (passwordError) {
    errorMessage.value = passwordError;
    return;
  }

  try {
    const response = await login({
      username: formState.username.trim(),
      password: formState.password,
    });

    // 登入成功
    toast.add({
      title: "登入成功",
      description: `歡迎回來，${response.user.displayName}`,
      color: "success",
      icon: "i-heroicons-check-circle",
    });

    // 導向儀表板
    await router.push("/admin/dashboard");
  } catch (error: any) {
    const { message } = handleError(error, {
      showToast: false,
      redirectOnAuth: false,
    });
    errorMessage.value = message;
  }
};
</script>

<template>
  <div class="login-page">
    <!-- Login Container -->
    <div class="login-container">
      <!-- Brand -->
      <div class="login-brand">
        <div class="brand-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1 class="brand-title">作品集管理後台</h1>
        <p class="brand-subtitle">Portfolio Admin</p>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="card-header">
          <h2>歡迎回來</h2>
          <p>請輸入您的帳號密碼登入</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Username Field -->
          <div class="form-field">
            <label for="username" class="field-label"> 帳號 </label>
            <div class="input-wrapper">
              <span class="input-icon">
                <UIcon name="i-heroicons-user" />
              </span>
              <input
                id="username"
                v-model="formState.username"
                type="text"
                class="field-input"
                placeholder="請輸入帳號"
                :disabled="isLoading"
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-field">
            <label for="password" class="field-label"> 密碼 </label>
            <div class="input-wrapper">
              <span class="input-icon">
                <UIcon name="i-heroicons-lock-closed" />
              </span>
              <input
                id="password"
                v-model="formState.password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                placeholder="請輸入密碼"
                :disabled="isLoading"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
                :disabled="isLoading"
              >
                <UIcon
                  :name="
                    showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'
                  "
                />
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            <UIcon name="i-heroicons-exclamation-circle" class="error-icon" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading || !formState.username || !formState.password"
          >
            <UIcon
              v-if="isLoading"
              name="i-heroicons-arrow-path"
              class="animate-spin"
            />
            <UIcon v-else name="i-heroicons-arrow-right-on-rectangle" />
            <span>{{ isLoading ? "登入中..." : "登入" }}</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="card-footer">
          <NuxtLink to="/" class="back-link">
            <UIcon name="i-heroicons-arrow-left" />
            <span>返回網站首頁</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Copyright -->
      <p class="copyright">© 2026 Portfolio Admin. All rights reserved.</p>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
}

.login-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 0 0 40px 40px;
}

/* Login Container */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Brand Section */
.login-brand {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin-bottom: 1.25rem;
  background: white;
  border-radius: 20px;
  box-shadow:
    0 10px 40px -10px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5);
}

.brand-icon svg {
  width: 36px;
  height: 36px;
  color: #3b82f6;
}

.brand-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.375rem 0;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 500;
}

/* Login Card */
.login-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.02);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.card-header p {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.2s;
}

.input-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.field-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9375rem;
  color: #0f172a;
  transition: all 0.2s;
}

.field-input:hover {
  border-color: #cbd5e1;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: #3b82f6;
}

.field-input::placeholder {
  color: #94a3b8;
}

.field-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

/* Password Toggle */
.password-toggle {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.password-toggle:hover {
  color: #64748b;
  background: #f1f5f9;
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-toggle :deep(svg) {
  width: 20px;
  height: 20px;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.875rem;
  animation: shake 0.4s ease-in-out;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

/* Submit Button */
.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.4);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.5);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-button :deep(svg) {
  width: 20px;
  height: 20px;
}

/* Card Footer */
.card-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.back-link:hover {
  color: #3b82f6;
}

.back-link :deep(svg) {
  width: 18px;
  height: 18px;
  transition: transform 0.2s;
}

.back-link:hover :deep(svg) {
  transform: translateX(-3px);
}

/* Copyright */
.copyright {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.8125rem;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 640px) {
  .login-page {
    padding: 1.5rem;
  }

  .login-page::before {
    height: 45%;
    border-radius: 0 0 30px 30px;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .brand-icon {
    width: 64px;
    height: 64px;
  }

  .brand-icon svg {
    width: 32px;
    height: 32px;
  }

  .brand-title {
    font-size: 1.5rem;
  }

  .card-header h2 {
    font-size: 1.375rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
  }

  .login-page::before {
    height: 40%;
    border-radius: 0 0 24px 24px;
  }

  .login-brand {
    margin-bottom: 1.5rem;
  }

  .brand-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
  }

  .brand-icon svg {
    width: 28px;
    height: 28px;
  }

  .brand-title {
    font-size: 1.375rem;
  }

  .brand-subtitle {
    font-size: 0.875rem;
  }

  .login-card {
    padding: 1.75rem 1.25rem;
    border-radius: 20px;
  }

  .card-header {
    margin-bottom: 1.5rem;
  }

  .card-header h2 {
    font-size: 1.25rem;
  }

  .login-form {
    gap: 1.25rem;
  }

  .field-input {
    padding: 0.75rem 0.875rem 0.75rem 2.75rem;
    font-size: 1rem;
  }

  .input-icon {
    left: 0.875rem;
  }

  .input-icon :deep(svg) {
    width: 18px;
    height: 18px;
  }

  .submit-button {
    padding: 0.75rem 1.25rem;
  }

  .copyright {
    margin-top: 1.5rem;
    font-size: 0.75rem;
  }
}
</style>
