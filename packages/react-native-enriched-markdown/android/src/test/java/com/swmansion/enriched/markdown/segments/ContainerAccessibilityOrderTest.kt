package com.swmansion.enriched.markdown.segments

import android.content.Context
import android.view.View
import android.widget.TextView
import com.swmansion.enriched.markdown.test.MarkdownRenderTestSupport.styleConfig
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Accessibility reads a React replacement where its block sits: each
 * placeholder gives way to its slot view and nested containers are flattened,
 * instead of the slot layer, which spans the host, sorting first.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class ContainerAccessibilityOrderTest {
  private val context = RuntimeEnvironment.getApplication()
  private val style by lazy { styleConfig() }

  private class TestContainer(
    context: Context,
    views: List<View>,
  ) : ContainerNodeView(context) {
    init {
      segmentViews.addAll(views)
      views.forEach { addView(it) }
    }

    fun readOrder(slotViews: Map<String, View>) = ArrayList<View>().also { addSegmentsForAccessibility(slotViews, it) }
  }

  private fun text(label: String) = TextView(context).apply { text = label }

  private fun placeholder(id: String) = BlockSlotSegmentView(context, style, id, BlockSlotKind.IMAGE)

  @Test
  fun slotViewsAreReadWhereTheirBlocksSit() {
    val a = text("a")
    val b = text("b")
    val c = text("c")
    val quote = TestContainer(context, listOf(b, placeholder("s2")))
    val host = TestContainer(context, listOf(a, placeholder("s1"), quote, placeholder("gone"), c))
    val s1 = View(context)
    val s2 = View(context)

    assertEquals(listOf(a, s1, b, s2, c), host.readOrder(mapOf("s1" to s1, "s2" to s2)))
  }

  @Test
  fun hiddenViewsAreSkipped() {
    val a = text("a")
    val hidden = text("hidden").apply { visibility = View.GONE }
    val host = TestContainer(context, listOf(a, hidden))

    assertEquals(listOf(a), host.readOrder(emptyMap()))
  }
}
