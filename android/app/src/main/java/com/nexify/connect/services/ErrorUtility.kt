package com.nexify.connect.services

import androidx.compose.runtime.staticCompositionLocalOf
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch

/**
 * CompositionLocal to report exceptions from any screen or repository coroutine context.
 */
val LocalErrorReporter = staticCompositionLocalOf<(Throwable) -> Unit> {
    { _ -> }
}

/**
 * Safe flow extension that catches any subscription exceptions (e.g. Firebase Permission Denied on logout)
 * and returns a safe fallback emission instead of crashing the Jetpack Compose flow collector.
 */
fun <T> Flow<T>.safeCollect(source: String, fallback: T): Flow<T> {
    return this.catch { e ->
        NexifyLog.e(source, "Uncaught flow collector exception, emitting fallback.", e)
        emit(fallback)
    }
}
