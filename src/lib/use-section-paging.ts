import { useEffect, type RefObject } from "react";

/** Scrollable areas between `target` and the page, innermost first. */
function scrollers(target: Element) {
  const found: Element[] = [];
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (/(auto|scroll)/.test(overflowY) && el.scrollHeight > el.clientHeight + 1)
      found.push(el);
  }
  return found;
}

/** Whether `target` sits inside an area that can still scroll toward `direction`. */
function scrollsInside(target: Element, direction: number) {
  return scrollers(target).some((el) =>
    (direction > 0 ? el.scrollHeight - el.clientHeight - el.scrollTop : el.scrollTop) > 1,
  );
}

export function useSectionPaging(libraryRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let releaseTimer: ReturnType<typeof setTimeout>;
    let wheelLocked = false;
    let wheelDistance = 0;
    // Set once a gesture has scrolled an inner area, so its momentum reaching
    // that area's end does not carry on into a page change.
    let innerGesture = false;
    let touchStart: {
      y: number;
      scrollY: number;
      target: Element;
      offsets: [Element, number][];
    } | null = null;

    function blocked(target: EventTarget | null) {
      return !!document.querySelector('[role="dialog"]') ||
        !(target instanceof Element) ||
        !!target.closest('select, [contenteditable="true"]');
    }

    function go(direction: number, from = window.scrollY) {
      const library = libraryRef.current;
      if (!library) return false;
      const top = library.getBoundingClientRect().top + window.scrollY -
        parseFloat(getComputedStyle(library).scrollMarginTop);
      const target = direction > 0 && from < top - 2
        ? top
        : direction < 0 && from > 0 && from <= top + 2 ? 0 : null;
      if (target === null) return false;
      window.scrollTo({
        top: target,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? "instant" : "smooth",
      });
      return true;
    }

    function releaseAfterGesture() {
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        wheelLocked = false;
        wheelDistance = 0;
        innerGesture = false;
      }, 180);
    }

    function onWheel(event: WheelEvent) {
      if (event.defaultPrevented || event.ctrlKey || blocked(event.target) ||
          Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (wheelLocked) {
        event.preventDefault();
        releaseAfterGesture();
        return;
      }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      releaseAfterGesture();
      // An area that can still scroll this way (a long conversation, a long
      // folder) keeps the wheel; anywhere else the gesture changes screens.
      if (innerGesture || scrollsInside(event.target as Element, delta)) {
        innerGesture = true;
        return;
      }
      if (delta * wheelDistance < 0) wheelDistance = 0;
      wheelDistance += delta;
      if (Math.abs(wheelDistance) < 8 || !go(wheelDistance)) return;
      event.preventDefault();
      wheelLocked = true;
    }

    function onTouchStart(event: TouchEvent) {
      touchStart = event.touches.length === 1 && !blocked(event.target)
        ? {
            y: event.touches[0].clientY,
            scrollY: window.scrollY,
            target: event.target as Element,
            offsets: scrollers(event.target as Element).map(
              (el): [Element, number] => [el, el.scrollTop],
            ),
          }
        : null;
    }

    function onTouchEnd(event: TouchEvent) {
      if (!touchStart || event.changedTouches.length !== 1) return;
      const delta = touchStart.y - event.changedTouches[0].clientY;
      // A swipe that moved an inner area was scrolling it, not changing screens.
      const scrolledInside = touchStart.offsets.some(
        ([el, top]) => Math.abs(el.scrollTop - top) > 1,
      );
      if (Math.abs(delta) >= 40 && !scrolledInside &&
          !scrollsInside(touchStart.target, delta) &&
          go(delta, touchStart.scrollY) && event.cancelable) {
        event.preventDefault();
      }
      touchStart = null;
    }

    function onTouchCancel() { touchStart = null; }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("touchcancel", onTouchCancel);
    return () => {
      clearTimeout(releaseTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [libraryRef, enabled]);
}
