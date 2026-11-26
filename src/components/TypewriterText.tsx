import { useEffect, useState } from "react";

type Props = {
  text: string;
  speed?: number; // ms por carácter
  onComplete?: () => void;
};

export function TypewriterText({ text, speed = 25, onComplete }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index >= text.length) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed((prev) => prev + text[index]);
      setIndex((i) => i + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [index, text, speed, onComplete]);

  return <>{displayed}</>;
}