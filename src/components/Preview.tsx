interface PreviewProps {
  children: string;
}

export function Preview({ children }: PreviewProps) {
  return (
    <div
      style={{
        display: 'none',
        fontSize: '1px',
        color: '#fefefe',
        lineHeight: '1px',
        maxHeight: '0px',
        maxWidth: '0px',
        opacity: '0',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
