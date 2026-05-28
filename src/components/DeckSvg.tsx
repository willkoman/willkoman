import type { ReactNode } from 'react';

/**
 * Stylised top-down Steam Deck layout used by the editor.
 *
 * Not photo-real — the goal is clear hit regions for a thumb on a 1280×800
 * Deck. Each region maps to a VDF input-source identifier (button_diamond,
 * left_trackpad, joystick, …). The parent supplies a `binding` map from
 * source-id to a short label (e.g. "Touch Menu") and an optional `groupId`
 * for the click handler. Selection (the accent ring) is driven by
 * `selectedSource`, not by groupId, because one input source can host
 * several groups (active / inactive / modeshift) all wired to it.
 *
 * The SVG scales responsively. Touch targets are sized to be >= 44px on
 * the Deck viewport.
 */

export interface DeckRegion {
  /** Input-source id as written in `preset.group_source_bindings` values. */
  id: string;
  /** Human label shown on hover or in fallback. */
  label: string;
  /** SVG shape descriptor. */
  shape:
    | { kind: 'circle'; cx: number; cy: number; r: number }
    | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number };
  /** Whether this region is a group-bearing source (trackpads, sticks, dpad,
   *  ABXY, triggers, gyro). Switch bindings (bumpers, back paddles, menu
   *  buttons) are informational at the canvas level. */
  isGroupSource: boolean;
}

export const DECK_REGIONS: DeckRegion[] = [
  // Back paddles (rendered as small chiclets above the shoulders for visibility)
  {
    id: 'button_back_left',
    label: 'L4',
    shape: { kind: 'rect', x: 90, y: 30, w: 70, h: 26, r: 6 },
    isGroupSource: false,
  },
  {
    id: 'button_back_left2',
    label: 'L5',
    shape: { kind: 'rect', x: 170, y: 30, w: 70, h: 26, r: 6 },
    isGroupSource: false,
  },
  {
    id: 'button_back_right2',
    label: 'R5',
    shape: { kind: 'rect', x: 760, y: 30, w: 70, h: 26, r: 6 },
    isGroupSource: false,
  },
  {
    id: 'button_back_right',
    label: 'R4',
    shape: { kind: 'rect', x: 840, y: 30, w: 70, h: 26, r: 6 },
    isGroupSource: false,
  },

  // Shoulders + triggers
  {
    id: 'left_bumper',
    label: 'L1',
    shape: { kind: 'rect', x: 110, y: 70, w: 100, h: 24, r: 6 },
    isGroupSource: false,
  },
  {
    id: 'left_trigger',
    label: 'L2',
    shape: { kind: 'rect', x: 110, y: 100, w: 100, h: 36, r: 6 },
    isGroupSource: true,
  },
  {
    id: 'right_bumper',
    label: 'R1',
    shape: { kind: 'rect', x: 790, y: 70, w: 100, h: 24, r: 6 },
    isGroupSource: false,
  },
  {
    id: 'right_trigger',
    label: 'R2',
    shape: { kind: 'rect', x: 790, y: 100, w: 100, h: 36, r: 6 },
    isGroupSource: true,
  },

  // Sticks
  {
    id: 'joystick',
    label: 'Left stick',
    shape: { kind: 'circle', cx: 260, cy: 220, r: 56 },
    isGroupSource: true,
  },
  {
    id: 'right_joystick',
    label: 'Right stick',
    shape: { kind: 'circle', cx: 740, cy: 320, r: 56 },
    isGroupSource: true,
  },

  // D-pad + face buttons
  {
    id: 'dpad',
    label: 'D-Pad',
    shape: { kind: 'circle', cx: 260, cy: 360, r: 50 },
    isGroupSource: true,
  },
  {
    id: 'button_diamond',
    label: 'ABXY',
    shape: { kind: 'circle', cx: 740, cy: 220, r: 56 },
    isGroupSource: true,
  },

  // Trackpads (the headliners)
  {
    id: 'left_trackpad',
    label: 'Left trackpad',
    shape: { kind: 'rect', x: 100, y: 430, w: 180, h: 80, r: 14 },
    isGroupSource: true,
  },
  {
    id: 'right_trackpad',
    label: 'Right trackpad',
    shape: { kind: 'rect', x: 720, y: 430, w: 180, h: 80, r: 14 },
    isGroupSource: true,
  },

  // Gyro (no physical button — represented as a marker in the centre top)
  {
    id: 'gyro',
    label: 'Gyro',
    shape: { kind: 'rect', x: 460, y: 200, w: 80, h: 30, r: 6 },
    isGroupSource: true,
  },

  // Centre buttons
  {
    id: 'button_escape',
    label: '⋯',
    shape: { kind: 'circle', cx: 410, cy: 470, r: 14 },
    isGroupSource: false,
  },
  {
    id: 'button_menu',
    label: '≡',
    shape: { kind: 'circle', cx: 460, cy: 470, r: 14 },
    isGroupSource: false,
  },
  {
    id: 'button_steam',
    label: '⏻',
    shape: { kind: 'circle', cx: 540, cy: 470, r: 14 },
    isGroupSource: false,
  },
  {
    id: 'button_quick_access',
    label: '⋮',
    shape: { kind: 'circle', cx: 590, cy: 470, r: 14 },
    isGroupSource: false,
  },
];

export interface DeckSvgProps {
  /** input-source id → display string (input-style label, etc.) */
  labels?: Partial<Record<string, string>>;
  /** Currently selected input-source id (drives the accent ring). */
  selectedSource?: string;
  /** Click handler; receives the region id. */
  onSelect?: (sourceId: string) => void;
  /** Optional decoration above the canvas. */
  header?: ReactNode;
}

export default function DeckSvg({ labels = {}, selectedSource, onSelect, header }: DeckSvgProps) {
  return (
    <div className="space-y-2">
      {header}
      <svg
        viewBox="0 0 1000 540"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label="Steam Deck input map"
      >
        {/* Body silhouette: two grip slabs + a thin centre console */}
        <path
          d="M 60 380 Q 60 280, 130 260 L 130 80 Q 130 30, 200 30 L 350 30 Q 420 30, 440 90 L 560 90 Q 580 30, 650 30 L 800 30 Q 870 30, 870 80 L 870 260 Q 940 280, 940 380 L 940 460 Q 940 530, 870 530 L 130 530 Q 60 530, 60 460 Z"
          fill="var(--color-panel)"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
        {/* Centre screen plate */}
        <rect
          x="360"
          y="180"
          width="280"
          height="220"
          rx="14"
          fill="var(--color-bg)"
          stroke="var(--color-border)"
          strokeWidth="1"
        />

        {DECK_REGIONS.map((region) => {
          const label = labels[region.id];
          const bound = label !== undefined;
          const selected = selectedSource === region.id;
          const interactive = region.isGroupSource;

          const fill = bound ? 'var(--color-panel-2)' : 'var(--color-panel)';
          const stroke = selected
            ? 'var(--color-accent)'
            : bound
              ? 'var(--color-accent-dim)'
              : 'var(--color-border-strong)';
          const strokeWidth = selected ? 2.5 : bound ? 1.5 : 1;

          const onClick = interactive && onSelect ? () => onSelect(region.id) : undefined;
          const cursor = interactive ? 'pointer' : 'default';
          const opacity = interactive ? 1 : 0.6;

          return (
            <g
              key={region.id}
              style={{ cursor }}
              opacity={opacity}
              onClick={onClick}
              tabIndex={interactive ? 0 : -1}
              onKeyDown={(e) => {
                if (interactive && onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(region.id);
                }
              }}
              aria-label={`${region.label}${label ? ': ' + label : ''}`}
            >
              {region.shape.kind === 'circle' ? (
                <circle
                  cx={region.shape.cx}
                  cy={region.shape.cy}
                  r={region.shape.r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              ) : (
                <rect
                  x={region.shape.x}
                  y={region.shape.y}
                  width={region.shape.w}
                  height={region.shape.h}
                  rx={region.shape.r ?? 4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              )}
              <text
                x={textX(region)}
                y={textY(region)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill="var(--color-text-dim)"
                pointerEvents="none"
              >
                {region.label}
              </text>
              {label && (
                <text
                  x={textX(region)}
                  y={textY(region) + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="var(--color-text)"
                  pointerEvents="none"
                >
                  {label.length > 18 ? label.slice(0, 16) + '…' : label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function textX(region: DeckRegion): number {
  return region.shape.kind === 'circle' ? region.shape.cx : region.shape.x + region.shape.w / 2;
}
function textY(region: DeckRegion): number {
  return region.shape.kind === 'circle'
    ? region.shape.cy - 4
    : region.shape.y + region.shape.h / 2 - 4;
}
