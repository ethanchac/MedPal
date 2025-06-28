import { useState, useRef } from 'react';

export const useAutoSubmit = (onSubmit) => {
  const [countdown, setCountdown] = useState(0);
  
  const autoSubmitTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const clearAutoSubmitTimers = () => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
  };

  const startAutoSubmitCountdown = () => {
    clearAutoSubmitTimers();
    
    setCountdown(3);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    autoSubmitTimerRef.current = setTimeout(() => {
      if (onSubmit) {
        onSubmit();
      }
      clearAutoSubmitTimers();
    }, 3000);
  };

  return {
    countdown,
    startAutoSubmitCountdown,
    clearAutoSubmitTimers
  };
};