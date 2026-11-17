import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const STAR_PATH =
  "M12 2.8l2.85 5.9 6.45.85-4.75 4.45 1.2 6.4L12 17.3l-5.75 3.1 1.2-6.4L2.7 9.55l6.45-.85z";

function stroked({ size = 24, strokeWidth = 2, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

export function CrossIcon(props: IconProps) {
  return (
    <svg {...stroked({ strokeWidth: 2.2, ...props })}>
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
    </svg>
  );
}

export function StarIcon({
  size = 24,
  fill = "#F5A623",
  stroke,
  ...rest
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
      <path
        d={STAR_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 1.5 : undefined}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...stroked(props)}>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...stroked(props)}>
      <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...stroked({ strokeWidth: 2.5, ...props })}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...stroked(props)}>
      <path d="M12 3l1.8 4.6L18.5 9.5l-4.7 1.9L12 16l-1.8-4.6L5.5 9.5l4.7-1.9z" />
      <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...stroked(props)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...stroked(props)}>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 3v5h5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 21v-5h-5" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg {...stroked(props)}>
      <path d="M12 8v5" />
      <path d="M12 16.5v.5" />
      <path d="M10.3 3.9L2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}
