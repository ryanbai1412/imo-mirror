/**
 * Shared chart drawing helpers.
 * Used by inline <script> tags across pages.
 */

/** Init a canvas for HiDPI. Returns { ctx, dpr, W, H }.
 *  If W is 0/falsy, measure the parent container width. */
function initCanvas(id, W, H) {
  var canvas = document.getElementById(id);
  if (!canvas) return null;
  if (!W) {
    var parent = canvas.parentElement;
    W = parent ? parent.clientWidth : 700;
  }
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  return { canvas: canvas, ctx: ctx, dpr: dpr, W: W };
}

/**
 * High-level chart setup: init canvas, compute
 * dimensions, fill background.
 * Returns { ctx, canvas, pad, cw, ch, W, H } or null.
 */
function chartSetup(id, CC, W, H, pad) {
  H = H || 320;
  pad = pad || { top: 30, right: 16, bottom: 36, left: 40 };
  var c = initCanvas(id, W, H);
  if (!c) return null;
  W = c.W;
  var cw = W - pad.left - pad.right;
  var ch = H - pad.top - pad.bottom;
  fillBg(c.ctx, CC, W, H);
  return { ctx: c.ctx, canvas: c.canvas, pad: pad, cw: cw, ch: ch, W: W, H: H };
}

/** Format a rank or rank range. */
function rankLabel(min, max) {
  if (min == null) return '';
  if (max == null || min === max) return 'Rank: ' + min;
  return 'Rank: ' + min + '\u2013' + max;
}

/** Sum all medal + none counts for a data point. */
function medalTotal(d) {
  return (d.gold || 0) + (d.silver || 0) + (d.bronze || 0) + (d.hm || 0) + (d.none || 0);
}

/**
 * Draw a stacked-bar score distribution chart.
 * Used by year_individual_r, year_statistics.
 */
function drawDistChart(id, data, colors, CC, title) {
  var c = chartSetup(id, CC);
  if (!c) return;
  var ctx = c.ctx, canvas = c.canvas, pad = c.pad;
  var cw = c.cw, ch = c.ch, W = c.W, H = c.H;
  var maxTotal = data.reduce(function(m, d) { return Math.max(m, medalTotal(d)); }, 0);
  var yMax = Math.ceil(maxTotal / 5) * 5 || 5;
  var barW = cw / data.length;
  var gap = Math.max(1, barW * 0.15);
  drawYGrid(ctx, CC, pad, W, ch, yMax);
  var totals = drawStackedBars(ctx, data, colors, pad, ch, barW, gap, yMax);
  ctx.fillStyle = CC.label;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (var i = 0; i < data.length; i++) {
    if (i % 5 === 0 || i === data.length - 1) {
      var x = pad.left + i * barW + gap / 2 + (barW - gap) / 2;
      ctx.fillText(String(data[i].score), x, pad.top + ch + 16);
    }
  }
  if (title) drawTitle(ctx, CC, title, W, pad);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = CC.label;
  ctx.fillText('Total Score', W / 2, H - 4);
  setupTooltip(canvas, data, W, H, pad, ch, {
    getIdx: barGetIdx(pad, barW),
    isHidden: function(my, idx) { return my < pad.top + ch - (totals[idx] / yMax) * ch; },
    getHtml: function(d) {
      var total = medalTotal(d);
      var html = '<b>Score ' + d.score + '</b> (' + total + (total === 1 ? ' contestant' : ' contestants') + ')<br>';
      var rl = rankLabel(d.rankMin, d.rankMax);
      if (rl) html += rl + '<br>';
      if (d.gold) html += tooltipRow(CC.gold, 'Gold', d.gold);
      if (d.silver) html += tooltipRow(CC.silver, 'Silver', d.silver);
      if (d.bronze) html += tooltipRow(CC.bronze, 'Bronze', d.bronze);
      if (d.hm) html += tooltipRow(CC.hm, 'HM', d.hm);
      if (d.none) html += tooltipRow(CC.none, 'None', d.none);
      return html;
    }
  });
}

/** Draw horizontal grid lines + Y-axis labels. */
function drawYGrid(ctx, CC, pad, W, ch, yMax, ticks) {
  ticks = ticks || 5;
  ctx.strokeStyle = CC.grid;
  ctx.lineWidth = 0.5;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = CC.label;
  ctx.textAlign = 'right';
  for (var i = 0; i <= ticks; i++) {
    var v = Math.round(yMax * i / ticks);
    var y = pad.top + ch - (v / yMax) * ch;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillText(String(v), pad.left - 6, y + 4);
  }
}

/** Draw right-side Y-axis labels (no grid lines). */
function drawYGridRight(ctx, CC, pad, W, ch, yMax, ticks) {
  ticks = ticks || 5;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = CC.label;
  ctx.textAlign = 'left';
  for (var i = 0; i <= ticks; i++) {
    var v = Math.round(yMax * i / ticks);
    var y = pad.top + ch - (v / yMax) * ch;
    ctx.fillText(String(v), W - pad.right + 6, y + 4);
  }
}

/** Draw X-axis year labels (abbreviated like '99). */
function drawXLabels(ctx, CC, data, pad, ch, barW, xKey, maxLabels) {
  xKey = xKey || 'year';
  maxLabels = maxLabels || 15;
  ctx.fillStyle = CC.label;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  var step = Math.max(1, Math.ceil(data.length / maxLabels));
  for (var i = 0; i < data.length; i++) {
    if (i % step === 0 || i === data.length - 1) {
      var x = pad.left + i * barW + barW / 2;
      ctx.fillText(
        "'" + String(data[i][xKey]).slice(-2),
        x, pad.top + ch + 16
      );
    }
  }
}

/** Draw X-axis labels for line charts (evenly spaced). */
function drawXLabelsLine(ctx, CC, data, pad, cw, ch, xKey, maxLabels) {
  xKey = xKey || 'year';
  maxLabels = maxLabels || 15;
  ctx.fillStyle = CC.label;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  var step = Math.max(1, Math.ceil(data.length / maxLabels));
  for (var i = 0; i < data.length; i++) {
    if (i % step === 0 || i === data.length - 1) {
      var x = pad.left + (i / Math.max(1, data.length - 1)) * cw;
      ctx.fillText(
        "'" + String(data[i][xKey]).slice(-2),
        x, pad.top + ch + 16
      );
    }
  }
}

/** Draw stacked bars. Returns array of bar totals for tooltip use. */
function drawStackedBars(ctx, data, layers, pad, ch, barW, gap, yMax) {
  var totals = [];
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    var x = pad.left + i * barW + gap / 2;
    var bw = barW - gap;
    var y = pad.top + ch;
    var total = 0;
    for (var j = 0; j < layers.length; j++) {
      var val = d[layers[j].key] || 0;
      total += val;
      if (!val) continue;
      var h = (val / yMax) * ch;
      y -= h;
      ctx.fillStyle = layers[j].color;
      ctx.fillRect(x, y, bw, h);
    }
    totals.push(total);
  }
  return totals;
}

/** Draw a chart title above the chart area. */
function drawTitle(ctx, CC, title, W, pad) {
  ctx.fillStyle = CC.title;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  var cx = pad.left + (W - pad.left - pad.right) / 2;
  ctx.fillText(title, cx, pad.top - 10);
}

/** Fill background. */
function fillBg(ctx, CC, W, H) {
  ctx.fillStyle = CC.bg;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Setup tooltip with mousemove/mouseleave.
 * getIdx(mx, my) => index or -1
 * getHtml(d, idx) => tooltip HTML string
 * isHidden(my, idx) => true if tooltip should hide
 */
function setupTooltip(canvas, data, W, H, pad, ch, opts) {
  // Remove previously attached tooltip listeners to prevent accumulation
  if (canvas._ttMove) canvas.removeEventListener('mousemove', canvas._ttMove);
  if (canvas._ttLeave) canvas.removeEventListener('mouseleave', canvas._ttLeave);
  if (canvas._tip) canvas._tip.remove();
  var tip = document.createElement('div');
  tip.className = 'chart-tooltip';
  document.body.appendChild(tip);
  canvas._tip = tip;
  var lastIdx = -1;

  canvas._ttMove = function(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (W / rect.width);
    var my = (e.clientY - rect.top) * (H / rect.height);

    if (my > pad.top + ch || my < pad.top) {
      tip.classList.remove('visible');
      lastIdx = -1;
      return;
    }

    var idx = opts.getIdx(mx, my);
    if (idx < 0 || idx >= data.length) {
      tip.classList.remove('visible');
      lastIdx = -1;
      return;
    }

    if (opts.isHidden && opts.isHidden(my, idx)) {
      tip.classList.remove('visible');
      lastIdx = -1;
      return;
    }

    var tipW = tip.offsetWidth || 160;
    var tipH = tip.offsetHeight || 40;
    var vpW = window.innerWidth;
    var vpH = window.innerHeight;
    var scrollX = window.pageXOffset;
    var scrollY = window.pageYOffset;
    var tx = (e.clientX + tipW + 12 > vpW)
      ? e.pageX - tipW - 12 : e.pageX + 12;
    var ty = e.pageY - 10;
    if (e.clientY - 10 + tipH > vpH) ty = scrollY + vpH - tipH - 4;
    if (e.clientY - 10 < 0) ty = scrollY + 4;

    if (idx === lastIdx) {
      tip.style.left = tx + 'px';
      tip.style.top = ty + 'px';
      return;
    }
    lastIdx = idx;

    tip.innerHTML = opts.getHtml(data[idx], idx);
    tip.classList.add('visible');
    tip.style.left = tx + 'px';
    tip.style.top = ty + 'px';
  };

  canvas._ttLeave = function() {
    tip.classList.remove('visible');
    lastIdx = -1;
  };

  canvas.addEventListener('mousemove', canvas._ttMove);
  canvas.addEventListener('mouseleave', canvas._ttLeave);
}

/** Helper: build a tooltip swatch row. */
function tooltipRow(color, label, value) {
  return '<div class="chart-tooltip-row">'
    + '<span class="chart-tooltip-swatch" style="background:'
    + color + '"></span>'
    + label + ': ' + value + '</div>';
}

/**
 * Draw a stacked-bar medal count chart (no "none" layer).
 * Used by country_team_r, results_year.
 */
function drawMedalStackedChart(id, data, CC, layers, opts) {
  opts = opts || {};
  var pad = opts.pad || { top: 20, right: 16, bottom: 36, left: 40 };
  var c = chartSetup(id, CC, 0, 320, pad);
  if (!c || !data.length) return;
  var ctx = c.ctx, canvas = c.canvas;
  var cw = c.cw, ch = c.ch, W = c.W, H = c.H;
  var sumFn = opts.sumFn || function(d) {
    var s = 0; for (var i = 0; i < layers.length; i++) s += (d[layers[i].key] || 0);
    return s;
  };
  var maxTotal = data.reduce(function(m, d) { return Math.max(m, sumFn(d)); }, 0);
  var yStep = opts.yStep || (maxTotal > 200 ? 50 : maxTotal > 20 ? 10 : 2);
  var yMax = Math.ceil(maxTotal / yStep) * yStep || yStep;
  var barW = cw / data.length;
  var gap = Math.max(opts.minGap || 0.5, barW * (opts.gapRatio || 0.1));
  var ticks = opts.ticks || 5;
  drawYGrid(ctx, CC, pad, W, ch, yMax, Math.min(ticks, yMax));
  var totals = drawStackedBars(ctx, data, layers, pad, ch, barW, gap, yMax);
  drawXLabels(ctx, CC, data, pad, ch, barW);
  setupTooltip(canvas, data, W, H, pad, ch, {
    getIdx: barGetIdx(pad, barW),
    isHidden: function(my, idx) { return my < pad.top + ch - (totals[idx] / yMax) * ch; },
    getHtml: opts.getHtml || function(d) {
      var html = '<b>IMO ' + d.year + '</b><br>';
      for (var i = 0; i < layers.length; i++) {
        if (d[layers[i].key]) html += tooltipRow(layers[i].color, layers[i].key.charAt(0).toUpperCase() + layers[i].key.slice(1), d[layers[i].key]);
      }
      return html;
    }
  });
  return { totals: totals, barW: barW, gap: gap, yMax: yMax, pad: pad, ch: ch, cw: cw, ctx: ctx, canvas: canvas, W: W, H: H };
}

/** Draw a rank overlay line + dots on stacked bars. */
function drawRankOverlay(ctx, CC, data, pad, ch, barW, gap, yMax, rankKey, totalFn) {
  ctx.beginPath();
  ctx.strokeStyle = CC.line;
  ctx.lineWidth = 2;
  var started = false;
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    var rank = d[rankKey];
    if (rank == null) continue;
    var rv = Math.min(rank, totalFn(d));
    var x = pad.left + i * barW + (barW - gap) / 2 + gap / 2;
    var y = pad.top + ch - (rv / yMax) * ch;
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    var rank = d[rankKey];
    if (rank == null) continue;
    var rv = Math.min(rank, totalFn(d));
    var x = pad.left + i * barW + (barW - gap) / 2 + gap / 2;
    var y = pad.top + ch - (rv / yMax) * ch;
    ctx.fillStyle = CC.line;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CC.bg;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw a line chart (area + line + dots). */
function drawLineChart(ctx, data, pad, cw, ch, yMax, key, color) {
  var xScale = function(i) {
    return pad.left + (i / Math.max(1, data.length - 1)) * cw;
  };
  var yScale = function(v) {
    return pad.top + ch - (v / yMax) * ch;
  };

  // area fill
  ctx.beginPath();
  ctx.moveTo(xScale(0), yScale(0));
  for (var i = 0; i < data.length; i++) {
    ctx.lineTo(xScale(i), yScale(data[i][key] || 0));
  }
  ctx.lineTo(xScale(data.length - 1), yScale(0));
  ctx.closePath();
  ctx.fillStyle = color + '18';
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (var i = 0; i < data.length; i++) {
    var x = xScale(i);
    var y = yScale(data[i][key] || 0);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // dots
  for (var i = 0; i < data.length; i++) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xScale(i), yScale(data[i][key] || 0), 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw multi-line chart (lines + dots, no area fill). */
function drawMultiLine(ctx, data, pad, cw, ch, yMax, lines) {
  var xScale = function(i) {
    return pad.left + (i / Math.max(1, data.length - 1)) * cw;
  };
  var yScale = function(v) {
    return pad.top + ch - (v / yMax) * ch;
  };

  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];
    ctx.beginPath();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    var started = false;
    for (var i = 0; i < data.length; i++) {
      var v = data[i][line.key];
      if (v == null) continue;
      var x = xScale(i);
      var y = yScale(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (var i = 0; i < data.length; i++) {
      var v = data[i][line.key];
      if (v == null) continue;
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.arc(xScale(i), yScale(v), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Map an award string to the corresponding chart color.
 * Shared by statistics and year_statistics pages.
 */
function awardColor(award, CC) {
  var a = (award || '').toLowerCase();
  if (a.indexOf('gold') >= 0) return CC.gold;
  if (a.indexOf('silver') >= 0) return CC.silver;
  if (a.indexOf('bronze') >= 0) return CC.bronze;
  if (a.indexOf('honourable') >= 0 || a.indexOf('mention') >= 0) return CC.hm;
  return CC.none;
}

/**
 * Draw a scatter plot with grouped overlapping points,
 * grid lines, axis labels, and tooltip.
 * Used by statistics.aspx (cross-year) and
 * year_statistics.aspx (single-year).
 *
 * opts: { xMin, xMax, yMin, yMax, xTicks, yTicks,
 *   invertX, invertY, dotMin, dotMax,
 *   groupMode, getGroupHtml }
 *
 * groupMode: 'weighted' (default) — merge overlapping
 *   points into one dot sized by count.
 *   'jitter' — offset overlapping dots in a ring.
 */
function drawScatterPlot(id, data, xKey, yKey,
    xLabel, yLabel, title, CC, opts) {
  opts = opts || {};
  var pad = opts.pad || {
    top: 28, right: 20, bottom: 40, left: 48
  };
  var W = opts.W || 0;
  var H = opts.H || 400;
  var c = chartSetup(id, CC, W, H, pad);
  if (c && !opts.H) { H = c.W; c = chartSetup(id, CC, c.W, H, pad); }
  if (!c || !data.length) return;
  W = c.W; H = c.H;
  var ctx = c.ctx, canvas = c.canvas;
  var cw = c.cw, ch = c.ch;

  var xMin = opts.xMin != null ? opts.xMin : 0;
  var xMax = opts.xMax != null ? opts.xMax : 21;
  var yMin = opts.yMin != null ? opts.yMin : 0;
  var yMax = opts.yMax != null ? opts.yMax : 21;
  var invertX = !!opts.invertX;
  var invertY = !!opts.invertY;

  var xScale = function(v) {
    var norm = (v - xMin) / (xMax - xMin);
    return invertX
      ? pad.left + cw - norm * cw
      : pad.left + norm * cw;
  };
  var yScale = function(v) {
    var norm = (v - yMin) / (yMax - yMin);
    return invertY
      ? pad.top + norm * ch
      : pad.top + ch - norm * ch;
  };

  // Grid
  ctx.strokeStyle = CC.grid;
  ctx.lineWidth = 0.5;
  var xTicks = opts.xTicks || 5;
  var yTicks = opts.yTicks || 5;
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = CC.label;
  for (var i = 0; i <= xTicks; i++) {
    var v = xMin + (xMax - xMin) * i / xTicks;
    var x = invertX
      ? pad.left + cw - (i / xTicks) * cw
      : pad.left + (i / xTicks) * cw;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + ch);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(
      Math.round(v).toString(), x, pad.top + ch + 14
    );
  }
  for (var i = 0; i <= yTicks; i++) {
    var v = yMin + (yMax - yMin) * i / yTicks;
    var y = invertY
      ? pad.top + (i / yTicks) * ch
      : pad.top + ch - (i / yTicks) * ch;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(
      Math.round(v).toString(), pad.left - 6, y + 3
    );
  }

  var groupMode = opts.groupMode || 'weighted';
  var dotPositions;

  if (groupMode === 'jitter') {
    // Jitter mode: individual dots with ring offset
    var jitterMap = {};
    var jitterR = opts.jitterR || 3;
    for (var i = 0; i < data.length; i++) {
      var key = data[i][xKey] + ',' + data[i][yKey];
      if (!jitterMap[key]) jitterMap[key] = 0;
      data[i]._jIdx = jitterMap[key]++;
      data[i]._jTotal = 0;
    }
    for (var i = 0; i < data.length; i++) {
      var key = data[i][xKey] + ',' + data[i][yKey];
      data[i]._jTotal = jitterMap[key];
    }

    // Sort so gold is drawn on top
    var order = [
      'none', 'hm', 'bronze', 'silver', 'gold'
    ];
    var awardKey = function(d) {
      var col = awardColor(d.award, CC);
      if (col === CC.gold) return 'gold';
      if (col === CC.silver) return 'silver';
      if (col === CC.bronze) return 'bronze';
      if (col === CC.hm) return 'hm';
      return 'none';
    };
    var sorted = data.slice().sort(function(a, b) {
      return order.indexOf(awardKey(a))
           - order.indexOf(awardKey(b));
    });

    for (var i = 0; i < sorted.length; i++) {
      var d = sorted[i];
      var cx = xScale(d[xKey]);
      var cy = yScale(d[yKey]);
      if (d._jTotal > 1) {
        var angle =
          (d._jIdx / d._jTotal) * Math.PI * 2;
        cx += Math.cos(angle) * jitterR;
        cy += Math.sin(angle) * jitterR;
      }
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = awardColor(d.award, CC);
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    dotPositions = sorted.map(function(d) {
      var cx = xScale(d[xKey]);
      var cy = yScale(d[yKey]);
      if (d._jTotal > 1) {
        var angle =
          (d._jIdx / d._jTotal) * Math.PI * 2;
        cx += Math.cos(angle) * jitterR;
        cy += Math.sin(angle) * jitterR;
      }
      return { x: cx, y: cy, d: d };
    });

    setupTooltip(canvas, dotPositions, W, H, pad, ch, {
      getIdx: function(mx, my) {
        var best = -1, bestDist = 20;
        for (var i = 0; i < dotPositions.length; i++) {
          var dx = mx - dotPositions[i].x;
          var dy = my - dotPositions[i].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist; best = i;
          }
        }
        return best;
      },
      getHtml: opts.getHtml || function(pt) {
        var d = pt.d;
        return '<b>' + d.name + '</b><br>'
          + xLabel + ': ' + d[xKey] + '<br>'
          + yLabel + ': ' + d[yKey] + '<br>'
          + '<span style="color:'
          + awardColor(d.award, CC) + '">\u25CF</span> '
          + (d.award || 'None');
      }
    });
  } else {
    // Weighted mode: merge overlapping into sized dots
    var pointMap = {};
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var pk = d[xKey] + ',' + d[yKey];
      if (!pointMap[pk])
        pointMap[pk] = { x: d[xKey], y: d[yKey], items: [] };
      pointMap[pk].items.push(d);
    }
    var groups = [];
    for (var pk in pointMap) groups.push(pointMap[pk]);
    var maxGroupSize = 1;
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].items.length > maxGroupSize)
        maxGroupSize = groups[i].items.length;
    }
    var dotMin = opts.dotMin != null ? opts.dotMin : 2;
    var dotMax = opts.dotMax != null ? opts.dotMax : 6;
    groups.sort(function(a, b) {
      return a.items.length - b.items.length;
    });
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var r = dotMin
        + Math.sqrt(g.items.length / maxGroupSize) * dotMax;
      var colorCounts = {};
      for (var j = 0; j < g.items.length; j++) {
        var col = awardColor(g.items[j].award, CC);
        colorCounts[col] = (colorCounts[col] || 0) + 1;
      }
      var bestColor = '', bestCount = 0;
      for (var col in colorCounts) {
        if (colorCounts[col] > bestCount) {
          bestCount = colorCounts[col];
          bestColor = col;
        }
      }
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = bestColor;
      ctx.beginPath();
      ctx.arc(xScale(g.x), yScale(g.y), r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    var groupPos = groups.map(function(g) {
      var r = dotMin
        + Math.sqrt(g.items.length / maxGroupSize) * dotMax;
      return {
        x: xScale(g.x), y: yScale(g.y),
        r: r, g: g
      };
    });
    setupTooltip(canvas, groupPos, W, H, pad, ch, {
      getIdx: function(mx, my) {
        var best = -1, bestDist = 999;
        for (var i = 0; i < groupPos.length; i++) {
          var dx = mx - groupPos[i].x;
          var dy = my - groupPos[i].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < groupPos[i].r + 4
              && dist < bestDist) {
            bestDist = dist; best = i;
          }
        }
        return best;
      },
      getHtml: opts.getGroupHtml || function(pt) {
        var g = pt.g;
        return '<b>' + xLabel + ': ' + g.x
          + ', ' + yLabel + ': ' + g.y + '</b><br>'
          + g.items.length + ' contestant'
          + (g.items.length === 1 ? '' : 's');
      }
    });
  }

  // Axis labels
  ctx.fillStyle = CC.label;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(xLabel, pad.left + cw / 2, H - 4);
  ctx.save();
  ctx.translate(12, pad.top + ch / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
  drawTitle(ctx, CC, title, W, pad);
}

/** Bar-chart getIdx: floor index from mouse x. */
function barGetIdx(pad, barW) {
  return function(mx) {
    return Math.floor((mx - pad.left) / barW);
  };
}

/** Line-chart getIdx: closest point within threshold. */
function lineGetIdx(data, pad, cw, threshold) {
  threshold = threshold || 20;
  return function(mx) {
    var xScale = function(i) {
      return pad.left + (i / Math.max(1, data.length - 1)) * cw;
    };
    var best = { dist: Infinity, i: -1 };
    for (var i = 0; i < data.length; i++) {
      var dist = Math.abs(mx - xScale(i));
      if (dist < best.dist) best = { dist: dist, i: i };
    }
    return best.dist <= threshold ? best.i : -1;
  };
}
