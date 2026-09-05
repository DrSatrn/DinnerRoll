import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const appElement = document.getElementById('app');

if (!appElement) {
  throw new Error('Failed to find root #app element');
}

const app = mount(App, {
  target: appElement,
});

export default app;
