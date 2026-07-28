import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

export const echo = new Echo({
  broadcaster: 'reverb',
  key: 'rc7n4lowtj8tna8o0eug',
  wsHost: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  wsPort: 8080,
  wssPort: 8080,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
});
