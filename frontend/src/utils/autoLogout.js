let timeout;

const resetTimer = (logoutCallback) => {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    logoutCallback();
  }, 15 * 60 * 1000); // 15 minutes
};

export const setupAutoLogout = (logoutCallback) => {
  const events = ["mousemove", "keydown", "click", "scroll"];

  events.forEach((event) => {
    window.addEventListener(event, () => resetTimer(logoutCallback));
  });

  resetTimer(logoutCallback);
};