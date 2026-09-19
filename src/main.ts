import { checkForUpdate } from './update';
import { sayWord } from './audio/commentator';
import { menuScreen } from './screens/menu';
import { packsScreen } from './screens/packs';
import { squadScreen } from './screens/squad';
import { matchScreen } from './screens/match';

const app = document.getElementById('app')!;
let current: HTMLElement | null = null;

function go(screen: string) {
  (current as any)?._cleanup?.();
  current?.remove();
  switch (screen) {
    case 'packs': current = packsScreen(go); break;
    case 'squad': current = squadScreen(go); break;
    case 'collection': current = squadScreen(go, true); break;
    case 'match': current = matchScreen(go); break;
    default: current = menuScreen(go);
  }
  app.appendChild(current);
}

// Tap any English word to hear it. One listener for the whole app, so every
// bilingual label is tappable without wiring each one up.
document.addEventListener('click', e => {
  const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-say]');
  if (t?.dataset.say) sayWord(t.dataset.say);
});

go('menu');

checkForUpdate();
