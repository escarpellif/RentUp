// ============================================
// API UTILITIES
// Funções helper para requisições de API
// ============================================

/**
 * Executa uma função com retry automático em caso de falha
 * @param {Function} fetchFn - Função que faz a requisição
 * @param {number} maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} delayMs - Delay entre tentativas em ms (padrão: 1000)
 * @returns {Promise} Resultado da requisição
 */
export const fetchWithRetry = async (fetchFn, maxRetries = 3, delayMs = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Tentativa ${attempt}/${maxRetries}`);
            const result = await fetchFn();
            console.log(`✅ Sucesso na tentativa ${attempt}`);
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`❌ Falha na tentativa ${attempt}:`, error.message);

            // Não aguardar na última tentativa
            if (attempt < maxRetries) {
                const delay = delayMs * attempt; // Backoff exponencial
                console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Todas as ${maxRetries} tentativas falharam`);
    throw lastError;
};

/**
 * Adiciona timeout a uma Promise
 * @param {Promise} promise - Promise original
 * @param {number} timeoutMs - Tempo limite em ms (padrão: 10000)
 * @returns {Promise} Promise com timeout
 */
export const withTimeout = (promise, timeoutMs = 10000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
};

/**
 * Wrapper para requisições Supabase com timeout
 * @param {Promise} query - Query do Supabase
 * @param {number} timeoutMs - Tempo limite em ms (padrão: 10000)
 * @returns {Promise} Resultado da query
 */
export const supabaseWithTimeout = (query, timeoutMs = 10000) => {
    return withTimeout(query, timeoutMs);
};

/**
 * Combina retry + timeout
 * @param {Function} fetchFn - Função que faz a requisição
 * @param {Object} options - Opções { maxRetries, delayMs, timeoutMs }
 * @returns {Promise} Resultado da requisição
 */
export const fetchWithRetryAndTimeout = async (
    fetchFn,
    { maxRetries = 3, delayMs = 1000, timeoutMs = 10000 } = {}
) => {
    return fetchWithRetry(
        () => withTimeout(fetchFn(), timeoutMs),
        maxRetries,
        delayMs
    );
};

/**
 * Debounce para evitar múltiplas chamadas rápidas
 * @param {Function} func - Função a ser debounced
 * @param {number} waitMs - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
export const debounce = (func, waitMs = 500) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, waitMs);
    };
};

/**
 * Cache simples em memória
 */
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttlMs = 60000) {
        const expiry = Date.now() + ttlMs;
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

export const apiCache = new SimpleCache();

/**
 * Fetch com cache
 * @param {string} cacheKey - Chave do cache
 * @param {Function} fetchFn - Função que busca os dados
 * @param {number} ttlMs - Tempo de vida do cache em ms
 * @returns {Promise} Dados (do cache ou da API)
 */
export const fetchWithCache = async (cacheKey, fetchFn, ttlMs = 60000) => {
    // Tentar cache primeiro
    const cached = apiCache.get(cacheKey);
    if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    // Buscar da API
    console.log(`🌐 Cache miss: ${cacheKey}, fetching...`);
    const data = await fetchFn();

    // Salvar no cache
    apiCache.set(cacheKey, data, ttlMs);

    return data;
};

