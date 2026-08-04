import { useState } from 'react';

export function BrokenExample({ show }: { show: boolean }) {
  if (show) {
    const [count] = useState(0); // フックを if の中で呼んでいる＝rules-of-hooks 違反
    return <div>{count}</div>;
  }
  return null;
}
