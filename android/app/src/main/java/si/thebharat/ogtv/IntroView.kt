package si.thebharat.ogtv

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.SurfaceTexture
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Surface
import android.view.TextureView
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import kotlin.math.hypot

/**
 * The opening, played natively over the page while it loads: res/raw/ogtv_intro.mp4 (the website's intro, rendered by
 * scripts/render-tv-intro.mjs) on the TV's own video decoder, so it is smooth whatever the page and YouTube are doing.
 * The clip holds at the play mark until the page's picture is up (pictureReady), then plays the press flash and pulse,
 * and the iris opens onto the channel with the chime (res/raw/ogtv_chime.ogg). onDone runs when the iris is open.
 */
@SuppressLint("ViewConstructor")
class IntroView(context: Context, private val onDone: () -> Unit) : FrameLayout(context), TextureView.SurfaceTextureListener {
    private val video = TextureView(context)
    private val tick = Handler(Looper.getMainLooper())
    private var player: MediaPlayer? = null
    private var ready = false
    private var heldAt = 0L
    private var irisStarted = false
    private var finished = false
    private var hole = 0f       // the iris's radius in pixels (0: closed)
    private var edge = 0f       // the glowing edge of the iris, 0..1
    private val path = Path()
    private val ring = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }

    init {
        setWillNotDraw(false)
        video.surfaceTextureListener = this
        addView(video, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    override fun onSurfaceTextureAvailable(st: SurfaceTexture, w: Int, h: Int) {
        val p = MediaPlayer.create(context, R.raw.ogtv_intro) ?: return finish()
        player = p
        p.setSurface(Surface(st))
        p.setOnCompletionListener { if (!irisStarted) startIris() } // the clip's last frame stays up under the iris
        p.setOnErrorListener { _, _, _ -> finish(); true }
        p.start()
        tick.post(watch)
    }

    // Follows the clip: holds at the play mark until the picture is up (at most HOLD_MAX_MS), opens the iris on time
    private val watch = object : Runnable {
        override fun run() {
            val p = player ?: return
            val pos = try { p.currentPosition } catch (e: IllegalStateException) { return }
            if (!ready && heldAt == 0L && pos >= HOLD_MS && p.isPlaying) { p.pause(); heldAt = SystemClock.uptimeMillis() }
            if (heldAt != 0L && SystemClock.uptimeMillis() - heldAt > HOLD_MAX_MS) pictureReady()
            if (!irisStarted && pos >= IRIS_MS) startIris()
            if (!finished) tick.postDelayed(this, 16)
        }
    }

    /** The page's picture is playing: the press and the iris go ahead. */
    fun pictureReady() {
        if (ready) return
        ready = true
        if (heldAt != 0L) { heldAt = 0L; player?.start() }
    }

    /** Ends the intro at once (the app went to the background, or the page failed to load). */
    fun skip() = finish()

    private fun startIris() {
        irisStarted = true
        MediaPlayer.create(context, R.raw.ogtv_chime)?.apply { setOnCompletionListener { release() }; start() }
        if (Build.VERSION.SDK_INT < 26) { // no clipOutPath: a plain fade onto the channel
            animate().alpha(0f).setDuration(900).withEndAction { finish() }
            return
        }
        val far = hypot(width.toFloat(), height.toFloat()) * 0.62f
        ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 1500
            interpolator = PathInterpolator(.6f, 0f, .2f, 1f) // the website's iris-open curve
            addUpdateListener {
                val f = it.animatedFraction
                hole = (it.animatedValue as Float) * far
                edge = when { f < .12f -> f / .12f; f < .7f -> 1f - (f - .12f) / .58f * .2f; else -> .8f * (1f - (f - .7f) / .3f) }
                invalidate()
            }
            addListener(object : AnimatorListenerAdapter() { override fun onAnimationEnd(a: Animator) = finish() })
            start()
        }
        // OGTV moves towards the viewer as the iris opens, as on the website
        video.animate().scaleX(1.12f).scaleY(1.12f).setDuration(1300).setInterpolator(PathInterpolator(.5f, 0f, .3f, 1f))
    }

    override fun dispatchDraw(canvas: Canvas) {
        if (hole <= 0f) return super.dispatchDraw(canvas)
        val cx = width / 2f; val cy = height * .46f // the iris's centre on the website
        canvas.save()
        path.reset(); path.addCircle(cx, cy, hole, Path.Direction.CW)
        canvas.clipOutPath(path)
        super.dispatchDraw(canvas)
        canvas.restore()
        // the iris's glowing edge: a warm halo and a bright line
        val d = resources.displayMetrics.density
        ring.color = Color.argb((edge * 70).toInt(), 242, 160, 61); ring.strokeWidth = 26 * d; canvas.drawCircle(cx, cy, hole + 6 * d, ring)
        ring.color = Color.argb((edge * 90).toInt(), 120, 210, 255); ring.strokeWidth = 12 * d; canvas.drawCircle(cx, cy, hole - 4 * d, ring)
        ring.color = Color.argb((edge * 230).toInt(), 255, 236, 210); ring.strokeWidth = 2 * d; canvas.drawCircle(cx, cy, hole, ring)
    }

    private fun finish() {
        if (finished) return
        finished = true
        tick.removeCallbacksAndMessages(null)
        player?.release(); player = null
        onDone()
    }

    override fun onSurfaceTextureSizeChanged(st: SurfaceTexture, w: Int, h: Int) {}
    override fun onSurfaceTextureDestroyed(st: SurfaceTexture) = true
    override fun onSurfaceTextureUpdated(st: SurfaceTexture) {}

    companion object {
        // From scripts/render-tv-intro.mjs: the play mark has settled (hold here), and the iris opens 350 ms after the press
        const val HOLD_MS = 3360
        const val IRIS_MS = 3710
        const val HOLD_MAX_MS = 20_000L
    }
}
