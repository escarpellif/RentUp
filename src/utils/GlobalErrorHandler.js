// ============================================
// GLOBAL ERROR HANDLER
// Captura erros não tratados e exceções
// ============================================

import Logger from '../services/LoggerService';

class GlobalErrorHandler {
    static init() {
        // Capturar erros globais não tratados
        if (ErrorUtils) {
            const originalHandler = ErrorUtils.getGlobalHandler();

            ErrorUtils.setGlobalHandler((error, isFatal) => {
                console.error('🔴 Global Error Handler:', error, 'isFatal:', isFatal);

                // Log estruturado
                Logger.error(
                    'Unhandled Global Error',
                    {
                        isFatal,
                        type: 'GlobalError',
                    },
                    error
                );

                // Chamar handler original
                if (originalHandler) {
                    originalHandler(error, isFatal);
                }
            });
        }

        // Capturar promise rejections não tratadas
        const originalPromiseRejectionHandler = global.onunhandledrejection;

        global.onunhandledrejection = (event) => {
            console.error('🔴 Unhandled Promise Rejection:', event);

            Logger.error(
                'Unhandled Promise Rejection',
                {
                    type: 'PromiseRejection',
                    reason: event.reason,
                },
                event.reason instanceof Error ? event.reason : new Error(String(event.reason))
            );

            // Chamar handler original se existir
            if (originalPromiseRejectionHandler) {
                originalPromiseRejectionHandler(event);
            }
        };

        console.log('✅ Global Error Handler inicializado');
    }

    // Wrapper para funções assíncronas
    static wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                Logger.error(
                    'Error in async function',
                    {
                        ...context,
                        functionName: fn.name || 'anonymous',
                    },
                    error
                );
                throw error;
            }
        };
    }

    // Wrapper para callbacks
    static wrapCallback(fn, context = {}) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                Logger.error(
                    'Error in callback',
                    {
                        ...context,
                        functionName: fn.name || 'anonymous',
                    },
                    error
                );
                throw error;
            }
        };
    }
}

export default GlobalErrorHandler;

