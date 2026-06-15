import type { CSSProperties } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
}

export function Image({ src, alt, width, height, align = 'center' }: ImageProps) {
  const wrapperStyle: CSSProperties = {
    textAlign: align,
    padding: '0 32px 16px',
  };
  const imgStyle: CSSProperties = {
    display: 'inline-block',
    maxWidth: '100%',
    border: 'none',
    outline: 'none',
    ...(width ? { width: `${width}px` } : {}),
    ...(height ? { height: `${height}px` } : {}),
  };
  return (
    <div style={wrapperStyle}>
      <img src={src} alt={alt} style={imgStyle} />
    </div>
  );
}
