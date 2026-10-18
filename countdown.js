(function (root) {
  'use strict';
  // Explicit Beijing offsets keep every display on the same event schedule.
  const start = Date.parse('2026-10-18T13:00:00+08:00');
  const end = Date.parse('2026-10-18T18:00:00+08:00');
  function at(now = Date.now()) {
    const phase = now < start ? 'upcoming' : now < end ? 'live' : 'ended';
    const remaining = Math.max(0, Math.ceil(((phase === 'upcoming' ? start : end) - now) / 1000));
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor(remaining % 3600 / 60);
    const seconds = remaining % 60;
    return {
      phase, remaining,
      label: phase === 'upcoming' ? '距离开场' : phase === 'live' ? '距离结束' : '活动已结束',
      display: [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':'),
      urgent: phase === 'live' && remaining <= 600
    };
  }
  const countdown = Object.freeze({ start, end, at });
  if (typeof module === 'object' && module.exports) module.exports = countdown;
  else root.EECountdown = countdown;
})(globalThis);
