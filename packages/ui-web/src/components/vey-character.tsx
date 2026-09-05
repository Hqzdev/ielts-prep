"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type {
  PreppyExpression,
  PreppyPosition,
} from "@veylo/backend/domain/preppy";
import type { PreppyState } from "@veylo/backend/domain/voice-conversation";
import { veyGeometry } from "@veylo/ui-web/domain/vey-geometry";
import { veyFaceFor, veyFaceGeometry } from "@veylo/ui-web/domain/vey-face";
import { veyMotionFor, type VeyMotion } from "@veylo/ui-web/domain/vey-motion";
import { VeyMotionController } from "@veylo/ui-web/client/vey-motion-controller";
import { useReducedMotion } from "@veylo/ui-web/client/use-reduced-motion";

interface VeyCharacterProps {
  state?: PreppyState;
  expression?: PreppyExpression;
  motion?: VeyMotion;
  position?: PreppyPosition;
  size?: number;
  intensity?: number;
  roundness?: number;
  gaze?: boolean;
  still?: boolean;
  subdued?: boolean;
  live?: boolean;
  className?: string;
}

export function VeyCharacter({
  state = "idle",
  expression,
  motion,
  position = "default",
  size = 96,
  intensity = 0,
  roundness = 0,
  gaze = false,
  still = false,
  subdued = false,
  live = false,
  className = "",
}: VeyCharacterProps) {
  const root = useRef<HTMLSpanElement>(null);
  const animator = useRef<VeyMotionController | null>(null);
  const reduced = useReducedMotion();
  const id = useId().replaceAll(":", "");
  const geometry = veyGeometry();
  const [initialFace] = useState(() => veyFaceFor(expression));
  const face = veyFaceGeometry(initialFace);
  const current = motion ?? veyMotionFor(state, expression);
  const initial = useRef({
    motion: current,
    expression,
    subdued,
    intensity,
    roundness,
    gaze,
    reduced,
    still,
    compact: size <= 40,
    position,
  });
  useEffect(() => {
    if (!root.current) return;
    animator.current = new VeyMotionController(root.current, initial.current);
    return () => {
      animator.current?.destroy();
      animator.current = null;
    };
  }, []);
  useEffect(() => {
    animator.current?.update({
      motion: current,
      expression,
      subdued,
      intensity,
      roundness,
      gaze,
      reduced,
      still,
      compact: size <= 40,
      position,
    });
  }, [
    current,
    expression,
    subdued,
    intensity,
    roundness,
    gaze,
    reduced,
    still,
    size,
    position,
  ]);
  return (
    <span
      ref={root}
      className={`vey-character ${className}`}
      data-state={state}
      data-motion={current}
      data-expression={expression ?? "neutral"}
      data-subdued={subdued}
      data-still={still || reduced}
      data-live={live}
      data-compact={size <= 40}
      role="img"
      aria-label={`Vey, ${expression ?? state}`}
      style={{ "--vey-size": `${size}px` } as CSSProperties}
    >
      <svg
        viewBox="0 0 240 270"
        width={size}
        height={(size * 270) / 240}
        aria-hidden="true"
      >
        <defs>
          <path id={`${id}-shape`} data-vey-outline d={geometry.body} />
          <radialGradient id={`${id}-body`} cx="32%" cy="27%" r="83%">
            <stop offset="0" stopColor="#e5d3ff" />
            <stop offset=".43" stopColor="#bea4f6" />
            <stop offset=".76" stopColor="#a38ade" />
            <stop offset="1" stopColor="#7258ac" />
          </radialGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f8efff" stopOpacity=".8" />
            <stop offset=".45" stopColor="#d9c3ff" stopOpacity="0" />
            <stop offset="1" stopColor="#6b4b9a" stopOpacity=".45" />
          </linearGradient>
          <linearGradient id={`${id}-inner`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#f6e9ff" />
            <stop offset=".65" stopColor="#e2ceff" />
            <stop offset="1" stopColor="#bca1ec" />
          </linearGradient>
          <radialGradient id={`${id}-eyes`} cx="32%" cy="22%" r="80%">
            <stop stopColor="#6f539c" />
            <stop offset=".35" stopColor="#3c275f" />
            <stop offset="1" stopColor="#25163e" />
          </radialGradient>
          <filter
            id={`${id}-soft`}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <use href={`#${id}-shape`} />
          </clipPath>
          <clipPath id={`${id}-left-eye`}>
            <path data-vey-left-lid d={face.leftLid} />
          </clipPath>
          <clipPath id={`${id}-right-eye`}>
            <path data-vey-right-lid d={face.rightLid} />
          </clipPath>
        </defs>
        <g data-vey-body>
          <use
            href={`#${id}-shape`}
            fill={`url(#${id}-body)`}
            stroke={`url(#${id}-rim)`}
            strokeWidth="1.5"
          />
          <g clipPath={`url(#${id}-clip)`}>
            <path
              data-vey-highlight
              d={geometry.highlight}
              fill="none"
              stroke="#fff6ff"
              strokeWidth="9"
              strokeLinecap="round"
              opacity=".68"
              filter={size > 40 ? `url(#${id}-soft)` : undefined}
            />
            <path
              data-vey-left
              d={geometry.left}
              fill={`url(#${id}-inner)`}
              stroke="#b89ae8"
              strokeWidth=".7"
            />
            <path
              data-vey-right
              d={geometry.right}
              fill={`url(#${id}-inner)`}
              stroke="#b89ae8"
              strokeWidth=".7"
            />
            <g data-vey-face>
              <g data-vey-eyes>
                <g
                  data-vey-pupils
                  fill={`url(#${id}-eyes)`}
                  opacity={1 - initialFace.joy}
                >
                  <g clipPath={`url(#${id}-left-eye)`}>
                    <ellipse cx="93" cy="178" rx="7.2" ry="12" />
                    <ellipse
                      cx="95"
                      cy="173"
                      rx="2.5"
                      ry="3.6"
                      fill="#fffaff"
                    />
                  </g>
                  <g clipPath={`url(#${id}-right-eye)`}>
                    <ellipse cx="137" cy="177" rx="7.2" ry="12" />
                    <ellipse
                      cx="139"
                      cy="172"
                      rx="2.5"
                      ry="3.6"
                      fill="#fffaff"
                    />
                  </g>
                </g>
                <g
                  data-vey-happy-eyes
                  opacity={initialFace.joy}
                  fill="none"
                  stroke="#342051"
                  strokeWidth="4.7"
                  strokeLinecap="round"
                >
                  <path d="M 86 180 Q 93 167 100 180" />
                  <path d="M 130 179 Q 137 166 144 179" />
                </g>
              </g>
              <g
                data-vey-brows
                fill="none"
                stroke={`url(#${id}-eyes)`}
                strokeWidth="4"
                strokeLinecap="round"
                opacity={initialFace.brows}
              >
                <path data-vey-left-brow d={face.leftBrow} />
                <path data-vey-right-brow d={face.rightBrow} />
              </g>
              <path
                data-vey-smile
                d={face.smile}
                fill="none"
                stroke={`url(#${id}-eyes)`}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <ellipse
                data-vey-mouth
                cx="118"
                cy="204"
                rx="10"
                ry="1.5"
                fill={`url(#${id}-eyes)`}
                opacity="0"
              />
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
