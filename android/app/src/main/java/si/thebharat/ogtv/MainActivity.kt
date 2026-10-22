package si.thebharat.ogtv

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView
import android.widget.Toast

/**
 * OGTV on the TV: the live site in one full-screen WebView. The page keeps the schedule, the player and the
 * look; this activity only passes the remote's keys to it (window.ogtv.remote), pauses it in the background,
 * and shows a "no internet" screen that keeps retrying.
 */
class MainActivity : Activity() {
    private lateinit var web: WebView
    private lateinit var offline: TextView
    private val main = Handler(Looper.getMainLooper())
    private var failed = false
    private var retryMs = RETRY_FIRST
    private var lastBack = 0L
    private var paused = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) // never dim mid-programme

        web = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            isFocusable = true
            isFocusableInTouchMode = true
            with(settings) {
                javaScriptEnabled = true
                domStorageEnabled = true // volume and subtitles are remembered in localStorage
                mediaPlaybackRequiresUserGesture = false // sound from the start, no "press to start"
                userAgentString = "$userAgentString OGTV-AndroidTV/${version()}"
            }
            webViewClient = Client()
            webChromeClient = object : WebChromeClient() {
                // Without this the WebView draws a grey play button over the video until it starts
                override fun getDefaultVideoPoster(): Bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
            }
        }
        offline = TextView(this).apply {
            setBackgroundColor(Color.rgb(0x14, 0x11, 0x1c))
            setTextColor(Color.rgb(0xf6, 0xef, 0xe3))
            textSize = 22f
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.3f)
            text = getString(R.string.offline)
            visibility = View.GONE
        }
        setContentView(FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            addView(web)
            addView(offline)
        })
        web.requestFocus()
        web.loadUrl(START_URL)
        warnOldWebView()
    }

    // ---------- The remote ----------

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val name = KEYS[event.keyCode] ?: return super.dispatchKeyEvent(event) // volume, home etc. stay with the system
        if (event.action != KeyEvent.ACTION_DOWN) return true
        if (name == "back") {
            if (event.repeatCount == 0) back()
            return true
        }
        if (failed) { // the "no internet" screen: OK tries again now
            if (name == "ok") retry()
            return true
        }
        if (event.repeatCount > 0 && name !in REPEATS) return true // holding a key surfs, but doesn't toggle
        js("window.ogtv&&ogtv.remote('$name')")
        return true
    }

    // The page closes what is open (the channel strip); with nothing open, Back twice leaves the app
    private fun back() {
        if (failed) return exitOnSecondBack()
        web.evaluateJavascript("window.ogtv?ogtv.remote('back'):false") { handled ->
            if (handled != "true") exitOnSecondBack()
        }
    }

    private fun exitOnSecondBack() {
        val now = SystemClock.uptimeMillis()
        if (now - lastBack < 2500) finish()
        else {
            lastBack = now
            Toast.makeText(this, R.string.back_again, Toast.LENGTH_SHORT).show()
        }
    }

    // ---------- Background and foreground ----------

    override fun onPause() {
        super.onPause()
        paused = true
        js("window.ogtv&&ogtv.pause()")
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        if (paused) js("window.ogtv&&ogtv.resume()") // rejoin the programme where it is now, as on TV
        paused = false
    }

    override fun onDestroy() {
        main.removeCallbacksAndMessages(null)
        web.destroy()
        super.onDestroy()
    }

    // ---------- Loading, and no internet ----------

    private inner class Client : WebViewClient() {
        // The site stays in the app; any other page (a link out to YouTube, say) is not opened, as a TV has no browser
        @Deprecated("Fire OS 5 (API 22) calls this one")
        override fun shouldOverrideUrlLoading(view: WebView, url: String) = !allowed(Uri.parse(url))

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) =
            request.isForMainFrame && !allowed(request.url)

        override fun onPageFinished(view: WebView, url: String) {
            if (!failed) {
                offline.visibility = View.GONE
                retryMs = RETRY_FIRST
            }
        }

        @Deprecated("Fire OS 5 (API 22) calls this one")
        override fun onReceivedError(view: WebView, errorCode: Int, description: String?, failingUrl: String?) {
            if (Build.VERSION.SDK_INT < 23) offlineNow()
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (request.isForMainFrame) offlineNow()
        }

        // The page's renderer crashed or was killed for memory: start again rather than close
        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            recreate()
            return true
        }
    }

    private fun allowed(u: Uri) = u.host == SITE_HOST || u.scheme == "about"

    private fun offlineNow() {
        failed = true
        offline.visibility = View.VISIBLE
        offline.requestFocus()
        main.removeCallbacksAndMessages(null)
        main.postDelayed(::retry, retryMs)
        retryMs = (retryMs * 2).coerceAtMost(RETRY_MAX)
    }

    private fun retry() {
        main.removeCallbacksAndMessages(null)
        failed = false
        web.requestFocus()
        web.loadUrl(START_URL)
    }

    // ---------- Helpers ----------

    private fun js(code: String) = web.evaluateJavascript(code, null)

    private fun version() = try {
        packageManager.getPackageInfo(packageName, 0).versionName ?: "1"
    } catch (e: Exception) {
        "1"
    }

    // YouTube's player needs a recent WebView. Old boxes that never updated it get a one-line hint.
    private fun warnOldWebView() {
        val chrome = Regex("Chrome/(\\d+)").find(web.settings.userAgentString)?.groupValues?.get(1)?.toIntOrNull() ?: return
        if (chrome < MIN_CHROME) Toast.makeText(this, R.string.old_webview, Toast.LENGTH_LONG).show()
    }

    companion object {
        const val SITE_HOST = "ogtv.thebharat.si"
        const val START_URL = "https://$SITE_HOST/?app=tv"
        const val RETRY_FIRST = 3_000L
        const val RETRY_MAX = 60_000L
        const val MIN_CHROME = 80

        // Remote keys and what the page calls them. Fire TV remotes have the D-pad, OK, Back, Menu and
        // the media keys; Android TV remotes add numbers, channel keys and the colour keys.
        val KEYS: Map<Int, String> = buildMap {
            put(KeyEvent.KEYCODE_DPAD_UP, "up"); put(KeyEvent.KEYCODE_DPAD_DOWN, "down")
            put(KeyEvent.KEYCODE_DPAD_LEFT, "left"); put(KeyEvent.KEYCODE_DPAD_RIGHT, "right")
            for (k in listOf(KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER, KeyEvent.KEYCODE_BUTTON_A)) put(k, "ok")
            for (k in listOf(KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE, KeyEvent.KEYCODE_BUTTON_B)) put(k, "back")
            for (d in 0..9) {
                put(KeyEvent.KEYCODE_0 + d, "$d")
                put(KeyEvent.KEYCODE_NUMPAD_0 + d, "$d")
            }
            put(KeyEvent.KEYCODE_CHANNEL_UP, "chup"); put(KeyEvent.KEYCODE_PAGE_UP, "chup")
            put(KeyEvent.KEYCODE_CHANNEL_DOWN, "chdown"); put(KeyEvent.KEYCODE_PAGE_DOWN, "chdown")
            for (k in listOf(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE, KeyEvent.KEYCODE_MUTE)) put(k, "playpause")
            put(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, "ff"); put(KeyEvent.KEYCODE_MEDIA_NEXT, "ff")
            put(KeyEvent.KEYCODE_MEDIA_REWIND, "rew"); put(KeyEvent.KEYCODE_MEDIA_PREVIOUS, "rew")
            put(KeyEvent.KEYCODE_MENU, "menu"); put(KeyEvent.KEYCODE_PROG_RED, "red")
            put(KeyEvent.KEYCODE_PROG_GREEN, "green"); put(KeyEvent.KEYCODE_CAPTIONS, "cc")
        }
        val REPEATS = setOf("up", "down", "left", "right", "chup", "chdown", "ff", "rew")
    }
}
