import { el } from '../ui';
import { bi } from '../i18n';
import { sayWord } from '../audio/commentator';
import { save, persist } from '../state';
import { COINS_PER_CORRECT, recordAnswer, learnedCount, WORDS, type Question } from '../learn';

// Post-match word game.
//
// Deliberately short — three questions — and never punishing: a wrong answer
// costs nothing, it just earns no coin and shows the right answer. The aim is
// that the child always wants to play it, not that they are tested.

export function quizOverlay(questions: Question[], onDone: (earned: number) => void): HTMLElement {
  const root = el('div', 'overlay quiz');
  let i = 0;
  let earned = 0;

  const show = () => {
    root.innerHTML = '';
    if (i >= questions.length) return summary();

    const q = questions[i];
    root.appendChild(el('div', 'quiz-progress', `${i + 1} / ${questions.length}`));

    if (q.kind === 'word') {
      root.appendChild(el('div', 'quiz-ask', bi('What does this word mean?', 'Что значит это слово?')));
      const word = el('button', 'quiz-word');
      word.textContent = `🔊 ${q.word.en}`;
      word.onclick = () => sayWord(q.word.en);
      root.appendChild(word);
      sayWord(q.word.en);   // it is a listening exercise first
    } else {
      root.appendChild(el('div', 'quiz-ask', bi(q.en, q.ru)));
      sayWord(q.en);
    }

    const opts = el('div', 'quiz-options');
    const labels = q.kind === 'word' ? q.options : q.options.map(String);
    labels.forEach((label, idx) => {
      const b = el('button', 'quiz-option');
      b.textContent = label;   // plain gloss or number; no markup wanted here
      b.onclick = () => {
        if (root.classList.contains('answered')) return;
        root.classList.add('answered');
        const right = idx === q.answer;
        if (right) {
          b.classList.add('right');
          earned += COINS_PER_CORRECT;
          save.coins += COINS_PER_CORRECT;
          persist();
        } else {
          b.classList.add('wrong');
          [...opts.children][q.answer]?.classList.add('right');
        }
        if (q.kind === 'word') recordAnswer(q.word.en, right);
        const note = el('div', 'quiz-note', right
          ? bi(`Correct! +${COINS_PER_CORRECT} coins`, `Правильно! +${COINS_PER_CORRECT} монет`)
          : bi('Not this time', 'В этот раз мимо'));
        root.appendChild(note);
        const next = el('button', 'primary big', i === questions.length - 1
          ? bi('Finish', 'Закончить') : bi('Next', 'Дальше'));
        next.onclick = () => { i++; root.classList.remove('answered'); show(); };
        root.appendChild(next);
      };
      opts.appendChild(b);
    });
    root.appendChild(opts);
  };

  const summary = () => {
    root.innerHTML = '';
    root.appendChild(el('h2', '', bi('Word game', 'Игра со словами')));
    root.appendChild(el('div', 'score', `+${earned} 🪙`));
    root.appendChild(el('div', 'stat', bi(
      `Words learned: ${learnedCount()} of ${WORDS.length}`,
      `Выучено слов: ${learnedCount()} из ${WORDS.length}`)));
    const done = el('button', 'primary big', bi('Continue', 'Продолжить'));
    done.onclick = () => onDone(earned);
    root.appendChild(done);
  };

  show();
  return root;
}
