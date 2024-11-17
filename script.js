const MOVE_DURATION = 100,
  SHADOW_BACKDROP = 30,
  SHADOW_SCALE = 0.85,
  SHADOW_EXIT_MUL = 0.6,
  TRAILER_ENTER_MUL = 1.2,
  TRAILER_DEFAULT_RADIUS = 20,
  trailer = document.getElementById("trailer"),
  shadow = document.getElementById("shadow"),
  hoverables = document.getElementsByClassName("hoverable"),
  longTiming = {
    duration: 300,
    fill: "forwards"
  },
  medTiming = {
    duration: 200,
    fill: "forwards"
  },
  shortTiming = {
    duration: 100,
    fill: "forwards"
  },
  easeOutCubic = (x) => 1 - Math.pow(1 - x, 3),
  easeInCubic = (x) => x * x * x,
  radToDeg = (r) => r * (180 / Math.PI),
  px = (v) => `${v}px`;

var hovering = false;

/*
 * Movement animation when not hovering anything
 */
function onMouseMoveScreen(e) {
  if (hovering) return;

  const x = Math.floor(e.clientX),
    y = Math.floor(e.clientY);

  trailer.animate([{ left: px(x), top: px(y) }], {
    duration: MOVE_DURATION,
    fill: "forwards"
  });
  shadow.animate([{ left: px(x), top: px(y) }], {
    duration: MOVE_DURATION + SHADOW_BACKDROP,
    fill: "forwards"
  });
}

/*
 * Animation when cursor enters screen
 */
function onMouseEnterScreen(e) {
  hovering = false;

  const x = Math.floor(e.clientX),
    y = Math.floor(e.clientY);
  trailer.style.left = shadow.style.left = px(x);
  trailer.style.top = shadow.style.top = px(y);

  trailer.animate([{ opacity: "1" }], medTiming);
  shadow.animate([{ opacity: "1" }], medTiming);
}

/*
 * Animation when cursor leaves screen
 */
function onMouseLeaveScreen() {
  trailer.animate([{ opacity: "0" }], shortTiming);
  shadow.animate([{ opacity: "0" }], shortTiming);
}

/*
 * Calculate the center of an object
 */
function calcCenter(el) {
  const bounds = el.getBoundingClientRect(),
    l = bounds.x + bounds.width / 2,
    t = bounds.y + bounds.height / 2;
  return {
    left: Math.round(l),
    top: Math.round(t),
    rad: Math.round(bounds.width / 2)
  };
}

/*
 * Animation when entering influence radius
 */
function onMouseEnterHov(e, hov, vars) {
  hovering = true;
  vars.lastDistance = Infinity;

  const width = parseInt(hov.dataset.width),
    height = parseInt(hov.dataset.height);

  trailer.animate(
    [
      {
        width: px(width),
        height: px(height)
      }
    ],
    longTiming
  );
  shadow.animate(
    [
      {
        width: px(width * SHADOW_SCALE),
        height: px(height * SHADOW_SCALE)
      }
    ],
    longTiming
  );
  hov.animate([{ color: "white" }], longTiming);
}

/*
 * Animation when leaving influence radius
 */
function onMouseLeaveHov(e, hov, vars) {
  hovering = false;
  vars.lastDistance = Infinity;
  trailer.animate(
    [{ width: px(TRAILER_DEFAULT_RADIUS), height: px(TRAILER_DEFAULT_RADIUS) }],
    shortTiming
  );
  shadow.animate(
    [{ width: px(TRAILER_DEFAULT_RADIUS), height: px(TRAILER_DEFAULT_RADIUS) }],
    shortTiming
  );
  hov.animate([{ color: "black", transform: "none" }], {
    duration: 300,
    fill: "forwards",
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" // ease-out-back curve (https://easings.net/#easeOutBack)
  });
}

/*
 * Dispatch animations when hovering
 */
function onMouseMoveHov(e, hov, vars) {
  const center = calcCenter(hov),
    x = e.clientX - center.left,
    y = e.clientY - center.top,
    dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
    ang = Math.atan2(y, x),
    hEased = easeInCubic(dist / center.rad) * center.rad * 0.4;

  if (vars.lastDistance > dist)
    onMouseMoveIntoHov(hEased, ang, center, dist, vars);
  else onMouseMoveOutOfHov(hov, hEased, dist, center, ang);
}

/*
 * Animation when moving towards center
 */
function onMouseMoveIntoHov(hEased, ang, center, dist, vars) {
  const tx = hEased * Math.cos(ang) * TRAILER_ENTER_MUL,
    ty = hEased * Math.sin(ang) * TRAILER_ENTER_MUL,
    sx = hEased * Math.cos(ang),
    sy = hEased * Math.sin(ang);

  trailer.animate(
    [{ left: px(center.left + tx), top: px(center.top + ty) }],
    longTiming
  );
  shadow.animate(
    [{ left: px(center.left + sx), top: px(center.top + sy) }],
    longTiming
  );
  vars.lastDistance = dist;
}

/*
 * Animation when moving away from center
 */
function onMouseMoveOutOfHov(hov, hEased, dist, center, ang) {
  const tEased = easeOutCubic(dist / center.rad) * center.rad * 0.4,
    tx = tEased * Math.cos(ang),
    ty = tEased * Math.sin(ang),
    sx = tx * SHADOW_EXIT_MUL,
    sy = ty * SHADOW_EXIT_MUL,
    hx = hEased * Math.cos(ang),
    hy = hEased * Math.sin(ang);

  trailer.animate(
    [
      {
        left: px(Math.round(center.left + tx)),
        top: px(Math.round(center.top + ty))
      }
    ],
    shortTiming
  );
  shadow.animate(
    [
      {
        left: px(Math.round(center.left + sx)),
        top: px(Math.round(center.top + sy))
      }
    ],
    shortTiming
  );
  hov.animate(
    [{ transform: `translateX(${hx}px) translateY(${hy}px)` }],
    shortTiming
  );
}

/*
 * Assign animations to screen
 */
document.addEventListener("mousemove", onMouseMoveScreen);
document.addEventListener("mouseenter", onMouseEnterScreen);
document.addEventListener("mouseleave", onMouseLeaveScreen);

/*
 * Assign animations to hoverables
 */
for (let i = 0; i < hoverables.length; i++) {
  const hov = hoverables[i],
    hovVars = { lastDistance: Infinity };

  hov.addEventListener("mouseenter", (e) => onMouseEnterHov(e, hov, hovVars));
  hov.addEventListener("mouseleave", (e) => onMouseLeaveHov(e, hov, hovVars));
  hov.addEventListener("mousemove", (e) => onMouseMoveHov(e, hov, hovVars));
}