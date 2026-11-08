package si.thebharat.ogtv

import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Color
import android.media.AudioManager
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
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

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
        // Debug builds only: the page can be inspected from a laptop (chrome://inspect over adb)
        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) WebView.setWebContentsDebuggingEnabled(true)

        web = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            isFocusable = true
            isFocusableInTouchMode = true
            with(settings) {
                javaScriptEnabled = true
                domStorageEnabled = true // volume and subtitles are remembered in localStorage
                mediaPlaybackRequiresUserGesture = false // sound from the start, no "press to start"
                userAgentString = tvUserAgent(userAgentString)
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
        // YouTube shows its touch-screen overlay (title, centre pause, More videos) to a TV's browser, which reports no
        // hover, and that overlay waits for a tap a remote never gives: a style inside YouTube's frame keeps it hidden
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT))
            WebViewCompat.addDocumentStartJavaScript(web, YT_STYLE, setOf("https://www.youtube.com", "https://www.youtube-nocookie.com"))
        web.requestFocus()
        web.loadUrl(START_URL)
        warnOldWebView()
    }

    // ---------- The remote ----------

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // The TV's own volume-up key brings OGTV's sound back too, so turning the TV up is never met with silence
        if (event.keyCode == KeyEvent.KEYCODE_VOLUME_UP && event.action == KeyEvent.ACTION_DOWN) js("window.ogtv&&ogtv.remote('unmute')")
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
        if (name == "volup" || name == "voldown") volume(name == "volup")
        else js("window.ogtv&&ogtv.remote('$name')")
        return true
    }

    // Up and down on the D-pad set the volume. Where the TV lets apps move its own volume (most smart TVs), that
    // volume moves, with the TV's own volume bar, and turning it up also brings OGTV's sound back if it was off.
    // Where the volume is fixed (a stick whose TV or soundbar sets the level over HDMI), OGTV's own volume moves.
    private fun volume(up: Boolean) {
        val audio = getSystemService(AUDIO_SERVICE) as AudioManager
        if (audio.isVolumeFixed) return js("window.ogtv&&ogtv.remote('${if (up) "volup" else "voldown"}')")
        audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, if (up) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI)
        if (up) js("window.ogtv&&ogtv.remote('unmute')")
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

    // A desktop browser's user agent (with this WebView's Chrome version and the OGTV-AndroidTV tag the page looks
    // for). With Android's own user agent YouTube serves its touch-screen player, whose pause and skip buttons wait
    // for a tap that never comes on a TV; the desktop player with controls off shows a clean picture.
    private fun tvUserAgent(webViewAgent: String): String {
        val chrome = Regex("Chrome/([\\d.]+)").find(webViewAgent)?.groupValues?.get(1) ?: "120.0.0.0"
        return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/$chrome Safari/537.36 OGTV-AndroidTV/${version()}"
    }

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
        const val SITE_HOST = "ogtv.co.in"
        const val START_URL = "https://$SITE_HOST/?app=tv"
        const val RETRY_FIRST = 3_000L
        const val RETRY_MAX = 60_000L
        const val MIN_CHROME = 80

        // Runs at the start of every YouTube frame: hides the player's own overlay (OGTV drives the player itself)
        const val YT_STYLE = """(function(){var css="ytm-watch-player-controls,.player-controls-content,.player-controls-background,""" +
            """player-top-controls,player-middle-controls,player-bottom-controls,.ytp-pause-overlay,.ytp-chrome-top,.ytp-gradient-top""" +
            """{display:none!important}";function add(){var s=document.createElement("style");s.textContent=css;""" +
            """(document.head||document.documentElement).appendChild(s)}if(document.documentElement)add();""" +
            """else document.addEventListener("readystatechange",add,{once:true})})();"""

        // Remote keys and what the page calls them, laid out like a TV remote: left/right change channel and
        // up/down set the volume (handled here, see volume()). Fire TV remotes have the D-pad, OK, Back, Menu and
        // the media keys; Android TV remotes add numbers, channel keys, Info, Guide and the colour keys.
        val KEYS: Map<Int, String> = buildMap {
            put(KeyEvent.KEYCODE_DPAD_UP, "volup"); put(KeyEvent.KEYCODE_DPAD_DOWN, "voldown")
            put(KeyEvent.KEYCODE_DPAD_LEFT, "left"); put(KeyEvent.KEYCODE_DPAD_RIGHT, "right")
            for (k in listOf(KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER, KeyEvent.KEYCODE_BUTTON_A)) put(k, "ok")
            for (k in listOf(KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE, KeyEvent.KEYCODE_BUTTON_B)) put(k, "back")
            for (d in 0..9) {
                put(KeyEvent.KEYCODE_0 + d, "$d")
                put(KeyEvent.KEYCODE_NUMPAD_0 + d, "$d")
            }
            put(KeyEvent.KEYCODE_CHANNEL_UP, "chup"); put(KeyEvent.KEYCODE_PAGE_UP, "chup")
            put(KeyEvent.KEYCODE_CHANNEL_DOWN, "chdown"); put(KeyEvent.KEYCODE_PAGE_DOWN, "chdown")
            put(KeyEvent.KEYCODE_LAST_CHANNEL, "last")
            put(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, "playpause"); put(KeyEvent.KEYCODE_MEDIA_PLAY, "play")
            put(KeyEvent.KEYCODE_MEDIA_PAUSE, "pause"); put(KeyEvent.KEYCODE_MEDIA_STOP, "pause")
            put(KeyEvent.KEYCODE_MUTE, "mute") // the TV's own mute key (VOLUME_MUTE) stays with the TV
            put(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, "ff"); put(KeyEvent.KEYCODE_MEDIA_NEXT, "ff")
            put(KeyEvent.KEYCODE_MEDIA_REWIND, "rew"); put(KeyEvent.KEYCODE_MEDIA_PREVIOUS, "rew")
            put(KeyEvent.KEYCODE_INFO, "info"); put(KeyEvent.KEYCODE_GUIDE, "list")
            put(KeyEvent.KEYCODE_MENU, "menu"); put(KeyEvent.KEYCODE_PROG_RED, "red")
            put(KeyEvent.KEYCODE_PROG_GREEN, "green"); put(KeyEvent.KEYCODE_CAPTIONS, "cc")
            put(KeyEvent.KEYCODE_PROG_YELLOW, "list"); put(KeyEvent.KEYCODE_PROG_BLUE, "info")
        }
        val REPEATS = setOf("volup", "voldown", "left", "right", "chup", "chdown", "ff", "rew")
    }
}
