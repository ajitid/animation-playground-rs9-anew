// inspiration: https://twitter.com/GK3/status/1545071311029805057
// replicated:
// - https://twitter.com/ralex1993/status/1545192456920059904
// - https://twitter.com/aashudubey_ad/status/1571250425772544000 | permalink: https://github.com/Aashu-Dubey/react-native-animation-samples/blob/7ed8c6f76526317b029feb7d848070321368d0e3/src/samples/rope_physics/RopeViewSvg.tsx#L93
import { forwardRef, useRef, useEffect } from "react";
import { FC, WC } from "@/shared/types";
import { distance } from "@/uff/distance";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import useMeasure from "react-use-measure";
import { a, config, SpringConfig } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import cn from "clsx";

import { DefaultLayout } from "@/default-layout";
import { useSpring } from "@react-spring/web";
import { Point2D } from "@/uff/types";
import { clamp2D } from "@/uff/clamp2d";

const SOCKET_WIDTH = 32;
const socketDimensionClassName = `w-[32px] h-[32px]`;

const ALLOWED_BOUND = 15;

const debug = false;

const ropeSpringConfig = {
  frequency: 0.4,
  damping: 0.4,
};

const leftSockets = ["all audio", "this app", "calls"];
const rightSockets = ["iPhone speaker", "george's AirPods", "kitchen", "other devices"];

export const WireAndSockets = () => {
  const leftSocketRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightSocketRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [topLeftSocketMeasureRefFn, topLeftSocketMeasure] = useMeasure();
  const [bottomRightSocketMeasureRefFn, bottomRightSocketMeasure] = useMeasure();
  const slackLength = distance(
    { x: topLeftSocketMeasure.left, y: topLeftSocketMeasure.top },
    { x: bottomRightSocketMeasure.left, y: bottomRightSocketMeasure.top }
  );

  const lastValidCoord = useRef<Point2D>({ x: 0, y: 0 });

  const handlePosRef = useRef([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const leftHandleRef = useRef<HTMLDivElement>(null);
  useDrag(
    ({ offset: [x, y], last, first }) => {
      if (first) {
        lastValidCoord.current = { x: handlePosRef.current[0].x, y: handlePosRef.current[0].y };
      }

      updatePos(0, [x, y]);

      if (last) {
        let foundNewValidCoords = false;

        for (const el of leftSocketRefs.current) {
          if (!el) continue;

          const { left, top } = el?.getBoundingClientRect();
          if (
            x > left - ALLOWED_BOUND &&
            x < left + ALLOWED_BOUND &&
            y > top - ALLOWED_BOUND &&
            y < top + ALLOWED_BOUND
          ) {
            updatePos(0, [left, top]);
            foundNewValidCoords = true;
            break;
          }
        }

        if (!foundNewValidCoords) {
          updatePos(0, [lastValidCoord.current.x, lastValidCoord.current.y]);
        }
      }
    },
    {
      target: leftHandleRef,
      from: () => [handlePosRef.current[0].x, handlePosRef.current[0].y],
    }
  );
  const rightHandleRef = useRef<HTMLDivElement>(null);
  useDrag(
    ({ offset: [x, y], first, last }) => {
      if (first) {
        lastValidCoord.current = { x: handlePosRef.current[1].x, y: handlePosRef.current[1].y };
      }

      updatePos(1, [x, y]);

      if (last) {
        let foundNewValidCoords = false;

        for (const el of rightSocketRefs.current) {
          if (!el) continue;

          const { left, top } = el?.getBoundingClientRect();
          if (
            x > left - ALLOWED_BOUND &&
            x < left + ALLOWED_BOUND &&
            y > top - ALLOWED_BOUND &&
            y < top + ALLOWED_BOUND
          ) {
            updatePos(1, [left, top]);
            break;
          }

          if (!foundNewValidCoords) {
            updatePos(1, [lastValidCoord.current.x, lastValidCoord.current.y]);
          }
        }
      }
    },
    {
      target: rightHandleRef,
      from: () => [handlePosRef.current[1].x, handlePosRef.current[1].y],
    }
  );

  const ropeRef = useRef<SVGPathElement>(null);
  const [, anim] = useSpring(() => ({
    x: 0,
    y: 0,
    onChange(v) {
      const ropeEl = ropeRef.current;
      if (!ropeEl) return;

      ropeRef.current.setAttribute(
        "d",
        `M ${handlePosRef.current[0].x + SOCKET_WIDTH / 2} ${
          handlePosRef.current[0].y + SOCKET_WIDTH / 2
        } Q ${v.value.x} ${v.value.y} ${handlePosRef.current[1].x + SOCKET_WIDTH / 2} ${
          handlePosRef.current[1].y + SOCKET_WIDTH / 2
        }`
      );
    },
    config: ropeSpringConfig,
  }));

  // for debugging: control point (the point determines what curve would be drawn) TODO remove
  const cirleRef = useRef<SVGCircleElement>(null);

  function calculateDecline(immediate = false) {
    const decline = slackDecline(
      {
        x: handlePosRef.current[0].x + SOCKET_WIDTH / 2,
        y: handlePosRef.current[0].y + SOCKET_WIDTH / 2,
      },
      {
        x: handlePosRef.current[1].x + SOCKET_WIDTH / 2,
        y: handlePosRef.current[1].y + SOCKET_WIDTH / 2,
      },
      slackLength
    );

    const midpointX =
      (handlePosRef.current[0].x + handlePosRef.current[1].x) / 2 + SOCKET_WIDTH / 2;
    const midpointY =
      (handlePosRef.current[0].y + handlePosRef.current[1].y) / 2 + decline + SOCKET_WIDTH / 2;
    anim.start({
      x: midpointX,
      y: midpointY,
      immediate: immediate,
      // TODO if decline is 0 make a stiff anim, ref. https://codesandbox.io/s/framer-motion-imperative-animation-controls-44mgz?file=/src/index.tsx:532-707
      // you would need a functon in `config` for stiff because you'd only need
      // stiff anim along y-axis as it has the decline, not x
      // config: decline === 0 ? stiffSpringConfig : ropeSpringConfig,
    });

    if (debug && cirleRef.current) {
      cirleRef.current.setAttribute("cx", midpointX + "");
      cirleRef.current.setAttribute("cy", midpointY + "");
    }
  }

  function updatePos(
    idx: 0 | 1 /* left or right socket */,
    [x, y]: [number, number],
    immediateWithoutChecks = false
  ) {
    const pos = handlePosRef.current[idx];
    let handleEl = idx === 0 ? leftHandleRef.current : rightHandleRef.current;
    if (!handleEl) return;

    let newPos = immediateWithoutChecks
      ? { x, y }
      : clamp2D(
          slackLength,
          { x, y },
          idx === 0
            ? { x: handlePosRef.current[1].x, y: handlePosRef.current[1].y }
            : { x: handlePosRef.current[0].x, y: handlePosRef.current[0].y }
        );
    pos.x = newPos.x;
    pos.y = newPos.y;
    // Both translate3d and translate with Z-axis invoke GPU anim, ref: https://discord.com/channels/341919693348536320/716908973713784904/1049619845471273011
    handleEl.style.setProperty("transform", `translate3d(${pos.x}px, ${pos.y}px, 0px)`);

    calculateDecline(immediateWithoutChecks);
  }

  useEffect(() => {
    const leftHandleEl = leftHandleRef.current;
    const rightHandleEl = rightHandleRef.current;
    if (!(leftHandleEl && rightHandleEl)) return;
    if (slackLength === 0) return;

    updatePos(0, [topLeftSocketMeasure.left, topLeftSocketMeasure.top], true);
    updatePos(1, [bottomRightSocketMeasure.left, bottomRightSocketMeasure.top], true);
  }, [slackLength]);

  return (
    <DefaultLayout className="cursor-touch">
      <div
        className={cn(
          "min-h-screen grid place-items-center pb-32 bg-slate-800",
          // TODO not working
          slackLength === 0 && "invisible"
        )}
      >
        <div className="w-[540px] grid grid-cols-2 rounded bg-slate-400 gap-28">
          <ul>
            {leftSockets.map((socket, i) => (
              <Item key={i}>
                <span className="mr-3 flex-1">{socket}</span>
                <Socket
                  ref={(el) => {
                    leftSocketRefs.current[i] = el;
                    if (i === 0) topLeftSocketMeasureRefFn(el);
                  }}
                />
              </Item>
            ))}
          </ul>
          <ul>
            {rightSockets.map((socket, i) => (
              <Item key={i}>
                <span className="mr-3 flex-1">{socket}</span>
                <Socket
                  ref={(el) => {
                    rightSocketRefs.current[i] = el;
                    if (i === rightSockets.length - 1) bottomRightSocketMeasureRefFn(el);
                  }}
                />
              </Item>
            ))}
          </ul>
        </div>
      </div>
      <div
        data-id="handle-left"
        ref={leftHandleRef}
        className={`${socketDimensionClassName} bg-pink-300 rounded-full fixed z-20 top-0 left-0 touch-none`}
      ></div>
      <div
        data-id="handle-right"
        ref={rightHandleRef}
        className={`${socketDimensionClassName} bg-violet-300 rounded-full fixed z-20 top-0 left-0 touch-none`}
      ></div>
      <svg className="fixed top-0 left-0 z-10 w-full h-full">
        <path
          ref={ropeRef}
          d={`M 
          ${handlePosRef.current[0].x + SOCKET_WIDTH / 2} 
          ${handlePosRef.current[0].y + SOCKET_WIDTH / 2} 
          Q 
          ${(handlePosRef.current[0].x + handlePosRef.current[1].x) / 2 + SOCKET_WIDTH / 2} 
          ${
            (handlePosRef.current[0].y + handlePosRef.current[1].y) / 2 + SOCKET_WIDTH / 2
            /*  no need to add decline here as this would be overwritten anyway */
          }
          ${handlePosRef.current[1].x + SOCKET_WIDTH / 2}
          ${handlePosRef.current[1].y + SOCKET_WIDTH / 2}`}
          stroke="red"
          strokeWidth={5}
          fill="none"
        />
        {/* control point  TODO remove */}
        <circle
          className={cn(!debug && "hidden")}
          ref={cirleRef}
          cx="50"
          cy="50"
          r="5"
          fill="magenta"
        />
      </svg>
    </DefaultLayout>
  );
};

const Item = forwardRef<HTMLLIElement, WC>((props, ref) => {
  return (
    <li ref={ref} className="px-4 py-2 flex items-center">
      {props.children}
    </li>
  );
});

const Socket = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div className="shrink-0 p-1 bg-slate-500 grid place-items-center rounded-full">
      <div
        ref={ref}
        className={`${socketDimensionClassName} rounded-full shadow-lg bg-slate-100`}
      />
    </div>
  );
});

const slackDecline = (point1: Point2D, point2: Point2D, slackLength: number) => {
  const d = slackLength - distance(point1, point2);
  return Math.max(Math.min(slackLength, d), 0);
};
