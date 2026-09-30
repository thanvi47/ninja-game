import { NinjaRunner3D } from './game3d.js';
import './styles.css';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container') || document.body;
  new NinjaRunner3D(container);
});
