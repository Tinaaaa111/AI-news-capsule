chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "schedule") {
      await chrome.alarms.clear("capsule:refresh");
      if (msg.enabled) chrome.alarms.create("capsule:refresh", { periodInMinutes: msg.minutes });
      sendResponse({ ok: true });
    }
  })();
  return true;
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "capsule:refresh") {
    // popup fetches on open; you could push a chrome.notifications.create here if desired
  }
});
