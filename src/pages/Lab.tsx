import {useParams} from 'react-router-dom';
import {videoBySlug} from '../data/videos';
import {TASKS} from '../tasks/registry';
import {TaskRunner} from '../tasks/engine';

/** Dev page: /lab/<stage video>/<task-id> renders one task alone (used for screenshots). */
export default function Lab() {
  const {slug = 'drobi', task} = useParams();
  const v = videoBySlug(slug);
  if (!v) return <p>нет этапа</p>;
  const all = TASKS[slug] ?? [];
  const list = task ? all.filter((t) => t.id === task) : all;
  return (
    <div style={{padding: '40px 0', minHeight: '100vh'}}>
      <div className="wrap">
        <TaskRunner key={task ?? 'all'} unit={{key: slug, chapters: v.chapters}} tasks={list} onReplay={() => {}} />
      </div>
    </div>
  );
}
