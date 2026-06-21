package com.nexify.connect

import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.nexify.connect.ui.theme.NexifyConnectTheme

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable WebView debugging via Chrome DevTools (chrome://inspect)
        WebView.setWebContentsDebuggingEnabled(true)
        
        // Enable third-party cookies for Firebase OAuth cross-origin redirects
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(this@MainActivity, true)
        
        setContent {
            NexifyConnectTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    AndroidView(
                        factory = { context ->
                            WebView(context).apply {
                                this@MainActivity.webView = this
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                settings.apply {
                                    javaScriptEnabled = true
                                    domStorageEnabled = true
                                    databaseEnabled = true
                                    useWideViewPort = true
                                    loadWithOverviewMode = true
                                    setSupportZoom(false)
                                    allowFileAccess = true
                                    allowContentAccess = true
                                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                                    
                                    // Bypass Google OAuth disallowed_useragent block inside WebViews
                                    val defaultUserAgent = userAgentString
                                    if (defaultUserAgent != null) {
                                        userAgentString = defaultUserAgent
                                            .replace("; wv", "")
                                            .replace(Regex("Version/\\d+\\.\\d+\\s?"), "") + " NexifyApp/1.0"
                                    }
                                }
                                webViewClient = object : WebViewClient() {
                                    override fun shouldOverrideUrlLoading(
                                        view: WebView?,
                                        url: String?
                                    ): Boolean {
                                        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                                            // Let WebView load standard HTTP/HTTPS links natively
                                            return false
                                        }
                                        // Handle custom intent or other app protocol schemes securely
                                        try {
                                            url?.let {
                                                val intent = Intent.parseUri(it, Intent.URI_INTENT_SCHEME)
                                                context.startActivity(intent)
                                            }
                                        } catch (e: Exception) {
                                            // Ignore unsupported protocols
                                        }
                                        return true
                                    }
                                }
                                setBackgroundColor(android.graphics.Color.parseColor("#0A0A0F"))
                                loadUrl("https://appdeloper.github.io/nexifytest2/")
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }

    override fun onBackPressed() {
        val wv = webView
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
