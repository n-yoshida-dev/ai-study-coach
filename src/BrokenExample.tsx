import { useState } from 'react';

export function BrokenExample({ show }: { show: boolean }) {
  const [count] = useState(0); // フックは常に先頭で呼ぶ（毎レンダー同じ順序）
  if (!show) return null;      // 分岐は return で行う
  return <div>{count}</div>;
}
