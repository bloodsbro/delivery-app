import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@prisma/nuxt',
    '@pinia/nuxt',
  ],

  experimental: {
    componentIslands: true,
  },

  css: [
    // 'vue-good-table-next/dist/vue-good-table-next.css',
    '~/assets/css/main.css',
  ],

  vite: {
    plugins: [
      tailwindcss(),
    ],
    server: {
      allowedHosts: ['mag.ximelie.dev'],
    },
  },
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret',
    databaseUrl: process.env.DATABASE_URL || '',
    databaseUrlLocal: process.env.DATABASE_URL_LOCAL || '',
    databaseUrlFallback: process.env.DATABASE_URL_FALLBACK || '',
    testDatabaseUrl: process.env.TEST_DATABASE_URL || '',
    prismaPostgresApiKey: process.env.PRISMA_POSTGRES_API_KEY || '',
    socketPort: process.env.SOCKET_PORT || '4000',
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '6LcxDC8sAAAAABTkmxa88iCKz52MmUywdrHKk9zM',
    isProduction: process.env.NODE_ENV === 'production',
    public: {
      socketUrl: process.env.SOCKET_URL || 'http://localhost:4000',
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || '6LcxDC8sAAAAAD4F17RqxrmEBpCjC5UWdiyoja4h'
    }
  }
})
